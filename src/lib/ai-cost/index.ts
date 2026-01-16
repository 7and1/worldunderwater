/**
 * AI Cost Tracking Module
 *
 * P1-11: OpenAI API Cost Controls
 */

export {
  initCostTracking,
  estimateCost,
  estimateTokens,
  recordSpend,
  getSpendSummary,
  getRecommendedModel,
  getSpendHistory,
  canMakeRequest,
  MODEL_COSTS,
  costOptions,
} from "./cost-tracker";

export type {
  ModelCostConfig,
  CostEstimate,
  SpendRecord,
  SpendLimits,
  SpendSummary,
  CostTrackingOptions,
} from "./types";
