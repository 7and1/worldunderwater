#!/usr/bin/env node

import { config as dotenvConfig } from "dotenv";
import { randomUUID } from "crypto";
dotenvConfig();

import { query, closePool } from "../../src/lib/db";

// Alert severity levels
export enum AlertSeverity {
  CRITICAL = "critical",
  WARNING = "warning",
  INFO = "info",
}

export interface NotificationChannel {
  type: "telegram" | "slack" | "email" | "webhook" | "pagerduty";
  enabled: boolean;
  config: Record<string, string>;
}

export interface OnCallSchedule {
  timezone: string;
  shifts: {
    start: string; // HH:MM format
    end: string; // HH:MM format
    days: number[]; // 0-6 (Sunday-Saturday)
    contact: string;
  }[];
}

export interface AlertRule {
  name: string;
  severity: AlertSeverity;
  threshold: number;
  windowMinutes: number;
  query: string;
  escalationDelayMinutes?: number;
  channels: NotificationChannel["type"][];
  cooldownMinutes?: number;
  onCallOnly?: boolean;
}

// Configuration from environment
const config = {
  // Alert thresholds
  ingestErrorThreshold: Number(process.env.ALERT_INGEST_ERROR_THRESHOLD || 3),
  ingestErrorWindowMinutes: Number(
    process.env.ALERT_INGEST_ERROR_WINDOW_MINUTES || 60,
  ),
  queueDepthThreshold: Number(process.env.ALERT_QUEUE_DEPTH_THRESHOLD || 100),
  responseTimeThresholdMs: Number(
    process.env.ALERT_RESPONSE_TIME_THRESHOLD_MS || 5000,
  ),
  errorRateThresholdPercent: Number(
    process.env.ALERT_ERROR_RATE_THRESHOLD || 10,
  ),

  // Escalation delays
  escalationDelayCritical: Number(
    process.env.ALERT_ESCALATION_CRITICAL_MINUTES || 15,
  ),
  escalationDelayWarning: Number(
    process.env.ALERT_ESCALATION_WARNING_MINUTES || 60,
  ),

  // Cooldown periods (prevent alert spam)
  cooldownMinutes: Number(process.env.ALERT_COOLDOWN_MINUTES || 30),

  // On-call configuration
  onCallEnabled: process.env.ALERT_ON_CALL_ENABLED === "true",
  onCallScheduleJson: process.env.ALERT_ON_CALL_SCHEDULE || "",

  // Notification channels
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
  slackWebhook: process.env.SLACK_WEBHOOK_URL || "",
  alertWebhook: process.env.ALERT_WEBHOOK_URL || "",
  emailFrom: process.env.ALERT_EMAIL_FROM || "",
  emailTo: process.env.ALERT_EMAIL_TO || "",

  // Alert deduplication (use Redis in production)
  deduplicateEnabled: true,
};

// In-memory alert tracking (use Redis in production)
const recentAlerts = new Map<string, number>();

// Notification channel implementations
async function sendTelegram(
  message: string,
  severity: AlertSeverity,
): Promise<boolean> {
  if (!config.telegramToken || !config.telegramChatId) return false;

  const emoji =
    severity === AlertSeverity.CRITICAL
      ? ""
      : severity === AlertSeverity.WARNING
        ? ""
        : "";
  const formatted = `${emoji} ${message}`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${config.telegramToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: config.telegramChatId,
          text: formatted,
          parse_mode: "HTML",
        }),
      },
    );
    return response.ok;
  } catch (error) {
    console.error("[Telegram] Failed to send:", error);
    return false;
  }
}

async function sendSlack(
  message: string,
  severity: AlertSeverity,
): Promise<boolean> {
  if (!config.slackWebhook) return false;

  const color = {
    [AlertSeverity.CRITICAL]: "danger",
    [AlertSeverity.WARNING]: "warning",
    [AlertSeverity.INFO]: "good",
  }[severity];

  try {
    const response = await fetch(config.slackWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attachments: [
          {
            color,
            title: `World Under Water Alert: ${severity.toUpperCase()}`,
            text: message,
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("[Slack] Failed to send:", error);
    return false;
  }
}

async function sendWebhook(
  message: string,
  severity: AlertSeverity,
  details: Record<string, unknown>,
): Promise<boolean> {
  if (!config.alertWebhook) return false;

  const alertId = randomUUID();

  try {
    const response = await fetch(config.alertWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alert_id: alertId,
        severity,
        message,
        timestamp: new Date().toISOString(),
        service: "worldunderwater",
        details,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("[Webhook] Failed to send:", error);
    return false;
  }
}

async function checkOnCall(): Promise<string | null> {
  if (!config.onCallEnabled) return null;

  try {
    const schedule = JSON.parse(config.onCallScheduleJson);
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay();

    for (const shift of schedule.shifts) {
      if (!shift.days.includes(currentDay)) continue;

      const [startHour, startMin] = shift.start.split(":").map(Number);
      const [endHour, endMin] = shift.end.split(":").map(Number);

      const currentMinutes = currentHour * 60 + currentMinute;
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
        return shift.contact;
      }
    }
  } catch (error) {
    console.error("[On-Call] Failed to check schedule:", error);
  }

  return null;
}

/**
 * Deduplicate alerts using cooldown period
 */
function shouldSendAlert(alertKey: string): boolean {
  const now = Date.now();
  const lastSent = recentAlerts.get(alertKey) || 0;
  const cooldownMs = config.cooldownMinutes * 60 * 1000;

  if (now - lastSent < cooldownMs) {
    console.log(`[Dedup] Alert "${alertKey}" in cooldown, skipping`);
    return false;
  }

  recentAlerts.set(alertKey, now);
  return true;
}

/**
 * Send alert to all configured channels
 */
async function sendAlert(
  message: string,
  severity: AlertSeverity,
  details: Record<string, unknown> = {},
  alertKey?: string,
): Promise<void> {
  // Check deduplication
  if (alertKey && config.deduplicateEnabled) {
    if (!shouldSendAlert(alertKey)) return;
  }

  // Check on-call
  const onCallContact = await checkOnCall();
  if (onCallContact && config.onCallEnabled) {
    message += `\n\nOn-Call: ${onCallContact}`;
  }

  const results = await Promise.allSettled([
    sendTelegram(message, severity),
    sendSlack(message, severity),
    sendWebhook(message, severity, details),
  ]);

  const sent = results.filter(
    (r) => r.status === "fulfilled" && r.value === true,
  ).length;
  console.log(`[Alert] Sent to ${sent}/${results.length} channels`);

  // Clean up old alert tracking
  const staleTime = Date.now() - config.cooldownMinutes * 60 * 1000 * 2;
  for (const [key, timestamp] of recentAlerts.entries()) {
    if (timestamp < staleTime) {
      recentAlerts.delete(key);
    }
  }
}

/**
 * Alert rule: Ingestion errors
 */
async function checkIngestionErrors(): Promise<void> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::text as count
     FROM ingestion_logs
     WHERE status IN ('error', 'partial', 'rate_limited')
       AND started_at > NOW() - INTERVAL '${config.ingestErrorWindowMinutes} minutes'`,
  );

  const count = Number(result.rows[0]?.count || 0);
  const severity =
    count >= config.ingestErrorThreshold * 3
      ? AlertSeverity.CRITICAL
      : AlertSeverity.WARNING;

  if (count >= config.ingestErrorThreshold) {
    await sendAlert(
      `Ingestion Alert: ${count} failures in last ${config.ingestErrorWindowMinutes} minutes`,
      severity,
      { errorCount: count, threshold: config.ingestErrorThreshold },
      `ingestion_errors`,
    );
  }
}

/**
 * Alert rule: Queue depth
 */
async function checkQueueDepth(): Promise<void> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM raw_events
     WHERE processed = false OR processed IS NULL`,
  );

  const depth = Number(result.rows[0]?.count || 0);
  const severity =
    depth >= config.queueDepthThreshold * 2
      ? AlertSeverity.CRITICAL
      : AlertSeverity.WARNING;

  if (depth >= config.queueDepthThreshold) {
    await sendAlert(
      `Queue Depth Alert: ${depth} unprocessed events`,
      severity,
      { queueDepth: depth, threshold: config.queueDepthThreshold },
      `queue_depth`,
    );
  }
}

/**
 * Alert rule: Response time
 */
async function checkResponseTime(): Promise<void> {
  const result = await query<{ avg_ms: string }>(
    `SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000)::text as avg_ms
     FROM ingestion_logs
     WHERE status = 'success'
       AND started_at > NOW() - INTERVAL '15 minutes'`,
  );

  const avgMs = Number(result.rows[0]?.avg_ms || 0);

  if (avgMs > config.responseTimeThresholdMs && avgMs > 0) {
    await sendAlert(
      `Response Time Alert: Average ${Math.round(avgMs)}ms (threshold: ${config.responseTimeThresholdMs}ms)`,
      AlertSeverity.WARNING,
      { avgResponseTimeMs: avgMs, threshold: config.responseTimeThresholdMs },
      `response_time`,
    );
  }
}

/**
 * Alert rule: Error rate
 */
async function checkErrorRate(): Promise<void> {
  const result = await query<{ error_rate: string }>(
    `SELECT
       (COUNT(*) FILTER (WHERE status IN ('error', 'partial'))::float /
        NULLIF(COUNT(*), 0) * 100)::text as error_rate
     FROM ingestion_logs
     WHERE started_at > NOW() - INTERVAL '1 hour'`,
  );

  const errorRate = Number(result.rows[0]?.error_rate || 0);
  const severity =
    errorRate >= config.errorRateThresholdPercent * 2
      ? AlertSeverity.CRITICAL
      : AlertSeverity.WARNING;

  if (errorRate >= config.errorRateThresholdPercent) {
    await sendAlert(
      `Error Rate Alert: ${errorRate.toFixed(1)}% (threshold: ${config.errorRateThresholdPercent}%)`,
      severity,
      { errorRate, threshold: config.errorRateThresholdPercent },
      `error_rate`,
    );
  }
}

/**
 * Run all alert checks
 */
async function main() {
  console.log("[Alert] Running monitoring checks...");

  try {
    await Promise.all([
      checkIngestionErrors(),
      checkQueueDepth(),
      checkResponseTime(),
      checkErrorRate(),
    ]);

    console.log("[Alert] Monitoring checks completed");
  } catch (error) {
    console.error("[Alert] Monitoring failed:", error);
    await sendAlert(
      `Monitoring Failure: ${error instanceof Error ? error.message : String(error)}`,
      AlertSeverity.CRITICAL,
      { error: error instanceof Error ? error.stack : String(error) },
    );
  } finally {
    await closePool();
  }
}

main();
