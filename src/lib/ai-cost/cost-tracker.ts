/**
 * AI Cost Tracking and Limits
 *
 * P1-11: OpenAI API Cost Controls
 * - Cost estimation per request
 * - Daily/weekly/monthly spend caps
 * - Fallback to cheaper model when near limit
 * - Cost tracking dashboard data
 * - Alerts on approaching limits
 */

import { query } from "../db";
import type {
  ModelCostConfig,
  CostEstimate,
  SpendRecord,
  SpendSummary,
  SpendLimits,
  CostTrackingOptions,
} from "./types";

const MODEL_COSTS: Record<string, ModelCostConfig> = {
  "gpt-4o": {
    model: "gpt-4o",
    inputCostPer1kTokens: 0.005,
    outputCostPer1kTokens: 0.015,
    maxTokens: 128000,
  },
  "gpt-4o-mini": {
    model: "gpt-4o-mini",
    inputCostPer1kTokens: 0.00015,
    outputCostPer1kTokens: 0.0006,
    maxTokens: 128000,
  },
  "gpt-4-turbo": {
    model: "gpt-4-turbo",
    inputCostPer1kTokens: 0.01,
    outputCostPer1kTokens: 0.03,
    maxTokens: 128000,
  },
  "gpt-3.5-turbo": {
    model: "gpt-3.5-turbo",
    inputCostPer1kTokens: 0.0005,
    outputCostPer1kTokens: 0.0015,
    maxTokens: 16385,
  },
};

const DEFAULT_LIMITS: SpendLimits = {
  dailyLimit: Number(process.env.OPENAI_DAILY_LIMIT || "50"),
  weeklyLimit: Number(process.env.OPENAI_WEEKLY_LIMIT || "200"),
  monthlyLimit: Number(process.env.OPENAI_MONTHLY_LIMIT || "500"),
  alertThreshold: Number(process.env.OPENAI_ALERT_THRESHOLD || "80"),
};

const FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL || "gpt-4o-mini";

const options: CostTrackingOptions = {
  enableTracking: process.env.OPENAI_COST_TRACKING !== "false",
  spendLimits: DEFAULT_LIMITS,
  fallbackModel: FALLBACK_MODEL,
  alertOnThreshold: true,
};

export async function initCostTracking(): Promise<void> {
  if (!options.enableTracking) return;

  await query(`
    CREATE TABLE IF NOT EXISTS ai_spend_tracking (
      id TEXT PRIMARY KEY,
      date DATE NOT NULL,
      model TEXT NOT NULL,
      input_tokens INTEGER NOT NULL,
      output_tokens INTEGER NOT NULL,
      cost NUMERIC(10, 6) NOT NULL,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_ai_spend_date 
      ON ai_spend_tracking (date DESC);
    
    CREATE INDEX IF NOT EXISTS idx_ai_spend_model 
      ON ai_spend_tracking (model);
  `);
}

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): CostEstimate {
  const config = MODEL_COSTS[model] || MODEL_COSTS["gpt-4o"];

  const inputCost = (inputTokens / 1000) * config.inputCostPer1kTokens;
  const outputCost = (outputTokens / 1000) * config.outputCostPer1kTokens;
  const totalCost = inputCost + outputCost;

  return {
    model,
    inputTokens,
    outputTokens,
    estimatedCost: totalCost,
    currency: "USD",
  };
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function recordSpend(
  model: string,
  inputTokens: number,
  outputTokens: number,
  actualCost?: number,
  metadata?: Record<string, unknown>,
): Promise<void> {
  if (!options.enableTracking) return;

  const cost =
    actualCost ?? estimateCost(model, inputTokens, outputTokens).estimatedCost;
  const id =
    "spend-" + Date.now() + "-" + Math.random().toString(36).slice(2, 11);
  const today = new Date().toISOString().split("T")[0];

  await query(
    `INSERT INTO ai_spend_tracking (id, date, model, input_tokens, output_tokens, cost, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      id,
      today,
      model,
      inputTokens,
      outputTokens,
      cost,
      metadata ? JSON.stringify(metadata) : null,
    ],
  );
}

export async function getSpendSummary(): Promise<SpendSummary> {
  if (!options.enableTracking) {
    return getEmptySummary();
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [todayResult, weekResult, monthResult] = await Promise.all([
    query<{ total: string }>(
      `SELECT COALESCE(SUM(cost), 0) as total FROM ai_spend_tracking WHERE date = $1`,
      [today],
    ),
    query<{ total: string }>(
      `SELECT COALESCE(SUM(cost), 0) as total FROM ai_spend_tracking WHERE date >= $1`,
      [weekAgo],
    ),
    query<{ total: string }>(
      `SELECT COALESCE(SUM(cost), 0) as total FROM ai_spend_tracking WHERE date >= $1`,
      [monthAgo],
    ),
  ]);

  const todaySpend = Number(todayResult.rows[0]?.total || 0);
  const weekSpend = Number(weekResult.rows[0]?.total || 0);
  const monthSpend = Number(monthResult.rows[0]?.total || 0);

  const dailyRemaining = Math.max(
    0,
    options.spendLimits.dailyLimit - todaySpend,
  );
  const weeklyRemaining = Math.max(
    0,
    options.spendLimits.weeklyLimit - weekSpend,
  );
  const monthlyRemaining = Math.max(
    0,
    options.spendLimits.monthlyLimit - monthSpend,
  );

  const dailyPercent = (todaySpend / options.spendLimits.dailyLimit) * 100;
  const weeklyPercent = (weekSpend / options.spendLimits.weeklyLimit) * 100;
  const monthlyPercent = (monthSpend / options.spendLimits.monthlyLimit) * 100;

  const nearLimit =
    dailyPercent >= options.spendLimits.alertThreshold ||
    weeklyPercent >= options.spendLimits.alertThreshold ||
    monthlyPercent >= options.spendLimits.alertThreshold;

  const exceededLimit =
    todaySpend >= options.spendLimits.dailyLimit ||
    weekSpend >= options.spendLimits.weeklyLimit ||
    monthSpend >= options.spendLimits.monthlyLimit;

  return {
    today: todaySpend,
    thisWeek: weekSpend,
    thisMonth: monthSpend,
    dailyLimit: options.spendLimits.dailyLimit,
    weeklyLimit: options.spendLimits.weeklyLimit,
    monthlyLimit: options.spendLimits.monthlyLimit,
    dailyRemaining,
    weeklyRemaining,
    monthlyRemaining,
    dailyUsagePercent: Math.min(100, dailyPercent),
    weeklyUsagePercent: Math.min(100, weeklyPercent),
    monthlyUsagePercent: Math.min(100, monthlyPercent),
    nearLimit,
    exceededLimit,
  };
}

export async function getRecommendedModel(
  preferredModel: string,
  estimatedCost: number,
): Promise<{ model: string; reason?: string }> {
  if (!options.enableTracking) {
    return { model: preferredModel };
  }

  const summary = await getSpendSummary();

  if (summary.exceededLimit) {
    return {
      model: options.fallbackModel || "gpt-4o-mini",
      reason: "Spend limit exceeded, using fallback model",
    };
  }

  if (summary.dailyRemaining < estimatedCost && summary.dailyRemaining > 0) {
    return {
      model: options.fallbackModel || "gpt-4o-mini",
      reason:
        "Daily limit nearly reached ($" +
        summary.dailyRemaining +
        " remaining), using fallback model",
    };
  }

  if (summary.nearLimit) {
    const cheaperModel = options.fallbackModel || "gpt-4o-mini";
    const cheaperCost = estimateCost(cheaperModel, 1000, 1000).estimatedCost;
    const preferredCost = estimateCost(
      preferredModel,
      1000,
      1000,
    ).estimatedCost;

    if (cheaperCost < preferredCost * 0.5) {
      return {
        model: cheaperModel,
        reason:
          "Near spend limit (" +
          summary.dailyUsagePercent.toFixed(0) +
          "% daily), using cheaper model",
      };
    }
  }

  return { model: preferredModel };
}

export async function getSpendHistory(
  days: number = 30,
): Promise<Array<{ date: string; cost: number; model: string }>> {
  if (!options.enableTracking) return [];

  const result = await query<{ date: string; cost: string; model: string }>(
    `SELECT date, SUM(cost) as cost, model 
     FROM ai_spend_tracking 
     WHERE date >= NOW() - INTERVAL '` +
      days +
      ` days'
     GROUP BY date, model 
     ORDER BY date DESC`,
  );

  return result.rows.map((row) => ({
    date: row.date,
    cost: Number(row.cost),
    model: row.model,
  }));
}

export async function canMakeRequest(
  estimatedCost: number,
): Promise<{ allowed: boolean; reason?: string }> {
  if (!options.enableTracking) {
    return { allowed: true };
  }

  const summary = await getSpendSummary();

  if (summary.exceededLimit) {
    return {
      allowed: false,
      reason:
        "Spend limit exceeded. Please wait for the next billing period or adjust limits.",
    };
  }

  if (summary.dailyRemaining < estimatedCost) {
    return {
      allowed: false,
      reason:
        "Insufficient daily budget. Request costs $" +
        estimatedCost.toFixed(4) +
        ", only $" +
        summary.dailyRemaining.toFixed(2) +
        " remaining.",
    };
  }

  return { allowed: true };
}

function getEmptySummary(): SpendSummary {
  return {
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    dailyLimit: options.spendLimits.dailyLimit,
    weeklyLimit: options.spendLimits.weeklyLimit,
    monthlyLimit: options.spendLimits.monthlyLimit,
    dailyRemaining: options.spendLimits.dailyLimit,
    weeklyRemaining: options.spendLimits.weeklyLimit,
    monthlyRemaining: options.spendLimits.monthlyLimit,
    dailyUsagePercent: 0,
    weeklyUsagePercent: 0,
    monthlyUsagePercent: 0,
    nearLimit: false,
    exceededLimit: false,
  };
}

export { MODEL_COSTS, options as costOptions };
