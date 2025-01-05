import { API_PREFIX } from '../constants';
import { RESTBase } from './rest-base';
import {
  CommitConvertTradeRequest,
  CommitConvertTradeResponse,
  CreateConvertQuoteRequest,
  CreateConvertQuoteResponse,
  GetConvertTradeRequest,
  GetConvertTradeResponse,
} from './types/converts-types';
import { method } from './types/request-types';

// [POST] Create Convert Quote
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_createconvertquote
export function createConvertQuote(
  this: RESTBase,
  requestParams: CreateConvertQuoteRequest
): Promise<CreateConvertQuoteResponse> {
  try {
    return this.request({
      method: method.POST,
      endpoint: `${API_PREFIX}/convert/quote`,
      bodyParams: requestParams,
      isPublic: false,
    });
  } catch (error) {
    console.error('Error creating convert quote:', error);
    throw error;
  }
}

// [GET] Get Convert Trade
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getconverttrade
export function getConvertTrade(
  this: RESTBase,
  { tradeId, ...requestParams }: GetConvertTradeRequest
): Promise<GetConvertTradeResponse> {
  try {
    return this.request({
      method: method.GET,
      endpoint: `${API_PREFIX}/convert/trade/${tradeId}`,
      queryParams: requestParams,
      isPublic: false,
    });
  } catch (error) {
    console.error('Error fetching convert trade:', error);
    throw error;
  }
}

// [POST] Commit Convert Trade
// https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_commitconverttrade
export function commitConvertTrade(
  this: RESTBase,
  { tradeId, ...requestParams }: CommitConvertTradeRequest
): Promise<CommitConvertTradeResponse> {
  try {
    return this.request({
      method: method.POST,
      endpoint: `${API_PREFIX}/convert/trade/${tradeId}`,
      bodyParams: requestParams,
      isPublic: false,
    });
  } catch (error) {
    console.error('Error committing convert trade:', error);
    throw error;
  }
}
