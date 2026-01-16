/**
 * AI Cost Tracking Types
 */

export interface ModelCostConfig {
  model: string;
  inputCostPer1kTokens: number;
  outputCostPer1kTokens: number;
  maxTokens?: number;
}

export interface CostEstimate {
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  currency: string;
}

export interface SpendRecord {
  id: string;
  date: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  metadata?: Record<string, unknown>;
}

export interface SpendLimits {
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
  alertThreshold: number; // percentage
}

export interface SpendSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
  dailyRemaining: number;
  weeklyRemaining: number;
  monthlyRemaining: number;
  dailyUsagePercent: number;
  weeklyUsagePercent: number;
  monthlyUsagePercent: number;
  nearLimit: boolean;
  exceededLimit: boolean;
}

export interface CostTrackingOptions {
  enableTracking: boolean;
  spendLimits: SpendLimits;
  fallbackModel?: string;
  alertOnThreshold: boolean;
}
