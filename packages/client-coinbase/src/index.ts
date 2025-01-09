import {
    elizaLogger,
    Client,
    IAgentRuntime,
    Memory,
    Content,
    HandlerCallback,
    stringToUuid
} from "@elizaos/core";
import express from "express";
import { WebhookEvent } from "./types";
import { EventEmitter } from "events";

export class CoinbaseClient extends EventEmitter {
    private runtime: IAgentRuntime;
    private server: express.Application;
    private port: number;

    constructor(runtime: IAgentRuntime) {
        super();

        this.runtime = runtime;
        this.server = express();
        this.port = Number(runtime.getSetting("COINBASE_WEBHOOK_PORT")) || 3001;
    }

    async initialize(): Promise<void> {
        elizaLogger.info("Initializing Coinbase client");
        try {
            elizaLogger.info("Coinbase client initialized successfully");
            await this.setupWebhookEndpoint();
        } catch (error) {
            elizaLogger.error("Failed to initialize Coinbase client:", error);
            throw error;
        }
    }

    private setupWebhookEndpoint() {
        this.server.use(express.json());

        // Add webhook validation middleware
        const validateWebhook = (req: express.Request, res: express.Response, next: express.NextFunction) => {
            const event = req.body as WebhookEvent;
            if (!event.event || !event.ticker || !event.timestamp || !event.price) {
                res.status(400).json({ error: "Invalid webhook payload" });
                return;
            }
            if (event.event !== 'buy' && event.event !== 'sell') {
                res.status(400).json({ error: "Invalid event type" });
                return;
            }
            next();
        };

        this.server.post("/webhook", validateWebhook, async (req, res) => {
            try {
                const event = req.body as WebhookEvent;
                await this.handleWebhookEvent(event);
                res.status(200).send("OK");
            } catch (error) {
                elizaLogger.error("Error processing webhook:", error);
                res.status(500).send("Internal Server Error");
            }
        });

        return new Promise<void>((resolve, reject) => {
            try {
                this.server.listen(this.port, () => {
                    elizaLogger.info(`Webhook server listening on port ${this.port}`);
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    private async handleWebhookEvent(event: WebhookEvent) {
        const roomId = stringToUuid("coinbase-trading");
        await this.runtime.ensureRoomExists(roomId);
        await this.runtime.ensureParticipantInRoom(this.runtime.agentId, roomId);

        const memory: Memory = {
            id: stringToUuid(`coinbase-${event.timestamp}`),
            userId: this.runtime.agentId,
            agentId: this.runtime.agentId,
            roomId,
            content: {
                text: `Received ${event.event} signal for ${event.ticker} at price ${event.price}`,
                action: "EXECUTE_ADVANCED_TRADE",
                source: "coinbase",
                metadata: {
                    ticker: event.ticker,
                    side: event.event.toUpperCase(),
                    price: event.price,
                    timestamp: event.timestamp
                }
            },
            createdAt: Date.now()
        };

        await this.runtime.messageManager.createMemory(memory);

        const callback: HandlerCallback = async (content: Content) => {
            elizaLogger.info("Trade execution result:", content);
            return [];
        };

        const state = await this.runtime.composeState(memory);
        await this.runtime.processActions(memory, [memory], state, callback);
    }

    async stop(): Promise<void> {
        try {
            if (this.server?.listen) {
                await new Promise<void>((resolve, reject) => {
                    this.server.listen().close((err: Error | undefined) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
            elizaLogger.info("Coinbase client stopped successfully");
        } catch (error) {
            elizaLogger.error("Error stopping Coinbase client:", error);
            throw error;
        }
    }

    getType(): string {
        return "coinbase";
    }

    getName(): string {
        return "coinbase";
    }

    async start(): Promise<void> {
        await this.initialize();
    }
}

export const CoinbaseClientInterface: Client = {
    start: async (runtime: IAgentRuntime) => {
        elizaLogger.log("Starting Coinbase client with agent ID:", runtime.agentId);
        const client = new CoinbaseClient(runtime);
        await client.start();
        return client;
    },
    stop: async (runtime: IAgentRuntime) => {
        try {
            elizaLogger.log("Stopping Coinbase client");
            await runtime.clients.coinbase.stop();
        } catch (e) {
            elizaLogger.error("Coinbase client stop error:", e);
        }
    },
};

export default CoinbaseClientInterface;