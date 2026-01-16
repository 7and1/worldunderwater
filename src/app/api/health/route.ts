import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getPayloadClient } from "@/lib/data/payload";

export const revalidate = 0;

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: {
    database: { status: string; latencyMs?: number; error?: string };
    nasaEonet: { status: string; latencyMs?: number; error?: string };
    usgsApi: { status: string; latencyMs?: number; error?: string };
    payload: { status: string; error?: string };
  };
  ingestion: {
    lastSuccessfulRun: string | null;
    queueDepth: number;
  };
}

async function checkDatabase(): Promise<{
  status: string;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await query("SELECT 1");
    return { status: "healthy", latencyMs: Date.now() - start };
  } catch (error) {
    return {
      status: "unhealthy",
      latencyMs: Date.now() - start,
      error: (error as Error).message,
    };
  }
}

async function checkNasaEonet(): Promise<{
  status: string;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=1",
      {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      },
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      return { status: "healthy", latencyMs: Date.now() - start };
    }
    return {
      status: "degraded",
      latencyMs: Date.now() - start,
      error: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      latencyMs: Date.now() - start,
      error: (error as Error).message,
    };
  }
}

async function checkUsgsApi(): Promise<{
  status: string;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=1",
      {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      },
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      return { status: "healthy", latencyMs: Date.now() - start };
    }
    return {
      status: "degraded",
      latencyMs: Date.now() - start,
      error: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      latencyMs: Date.now() - start,
      error: (error as Error).message,
    };
  }
}

async function checkPayload(): Promise<{ status: string; error?: string }> {
  try {
    const payload = await getPayloadClient();
    return payload
      ? { status: "healthy" }
      : { status: "degraded", error: "Payload not initialized" };
  } catch (error) {
    return { status: "unhealthy", error: (error as Error).message };
  }
}

async function getIngestionStatus(): Promise<{
  lastSuccessfulRun: string | null;
  queueDepth: number;
}> {
  try {
    const result = await query<{ completed_at: string | null; status: string }>(
      `SELECT completed_at, status
       FROM ingestion_logs
       WHERE status = 'success'
       ORDER BY completed_at DESC
       LIMIT 1`,
    );

    const lastSuccessfulRun = result.rows[0]?.completed_at ?? null;

    const queueResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM raw_events
       WHERE processed = false OR processed IS NULL`,
    );

    const queueDepth = parseInt(queueResult.rows[0]?.count ?? "0", 10);

    return { lastSuccessfulRun, queueDepth };
  } catch (error) {
    console.error("Failed to get ingestion status:", error);
    return { lastSuccessfulRun: null, queueDepth: -1 };
  }
}

function determineOverallStatus(
  checks: HealthCheckResult["checks"],
): "healthy" | "degraded" | "unhealthy" {
  const values = Object.values(checks);
  const hasUnhealthy = values.some((v) => v.status === "unhealthy");
  const hasDegraded = values.some((v) => v.status === "degraded");

  if (hasUnhealthy) return "unhealthy";
  if (hasDegraded) return "degraded";
  return "healthy";
}

export async function GET() {
  const [dbCheck, eonetCheck, usgsCheck, payloadCheck, ingestionStatus] =
    await Promise.all([
      checkDatabase(),
      checkNasaEonet(),
      checkUsgsApi(),
      checkPayload(),
      getIngestionStatus(),
    ]);

  const checks = {
    database: dbCheck,
    nasaEonet: eonetCheck,
    usgsApi: usgsCheck,
    payload: payloadCheck,
  };

  const overallStatus = determineOverallStatus(checks);

  const result: HealthCheckResult = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    ingestion: ingestionStatus,
  };

  const statusCode =
    overallStatus === "healthy"
      ? 200
      : overallStatus === "degraded"
        ? 200
        : 503;

  return NextResponse.json(result, { status: statusCode });
}
