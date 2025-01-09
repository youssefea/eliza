import { z } from "zod";

// Update the client type validation
export const clientSchema = z.object({
    type: z.enum([
        "discord",
        "direct",
        "twitter",
        "telegram",
        "farcaster",
        "lens",
        "auto",
        "slack",
        "coinbase"  // Add coinbase to the allowed client types
    ]),
    config: z.record(z.any()).optional()
});