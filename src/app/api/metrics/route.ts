import { NextResponse } from "next/server";
import { query, getPoolStats } from "@/lib/db";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// Prometheus-compatible metrics registry
interface Metric {
  name: string;
  type: "counter" | "gauge" | "histogram";
  help: string;
  value: number;
  labels?: Record<string, string>;
}

function formatPrometheusMetric(metric: Metric): string {
  const labelStr = metric.labels
    ? `{${Object.entries(metric.labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(",")}}`
    : "";
  return `# HELP ${metric.name} ${metric.help}\n# TYPE ${metric.name} ${metric.type}\n${metric.name}${labelStr} ${metric.value}`;
}

async function getRequestMetrics(): Promise<Metric[]> {
  try {
    const result = await query<{
      status: string;
      count: string;
      avg_duration: string;
    }>(`
      SELECT
        status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000) as avg_duration
      FROM ingestion_logs
      WHERE started_at > NOW() - INTERVAL '24 hours'
      GROUP BY status
    `);

    const metrics: Metric[] = [
      {
        name: "http_requests_total",
        type: "counter",
        help: "Total number of HTTP requests",
        value: result.rows.reduce((sum, row) => sum + Number(row.count), 0),
      },
    ];

    for (const row of result.rows) {
      metrics.push(
        {
          name: "ingestion_requests_total",
          type: "counter",
          help: "Total ingestion requests by status",
          value: Number(row.count),
          labels: { status: row.status },
        },
        {
          name: "ingestion_duration_ms",
          type: "gauge",
          help: "Average ingestion duration in milliseconds",
          value: Math.round(Number(row.avg_duration) || 0),
          labels: { status: row.status },
        },
      );
    }

    return metrics;
  } catch (error) {
    console.error("Failed to get request metrics:", error);
    return [];
  }
}

async function getErrorMetrics(): Promise<Metric[]> {
  try {
    const result = await query<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM ingestion_logs
      WHERE status IN ('error', 'partial')
        AND started_at > NOW() - INTERVAL '1 hour'
    `);

    const errorCount = Number(result.rows[0]?.count || 0);

    const totalResult = await query<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM ingestion_logs
      WHERE started_at > NOW() - INTERVAL '1 hour'
    `);

    const totalCount = Number(totalResult.rows[0]?.count || 1);
    const errorRate = totalCount > 0 ? (errorCount / totalCount) * 100 : 0;

    return [
      {
        name: "ingestion_errors_total",
        type: "counter",
        help: "Total ingestion errors in the last hour",
        value: errorCount,
      },
      {
        name: "ingestion_error_rate_percent",
        type: "gauge",
        help: "Ingestion error rate percentage",
        value: Number(errorRate.toFixed(2)),
      },
    ];
  } catch (error) {
    console.error("Failed to get error metrics:", error);
    return [];
  }
}

async function getQueueMetrics(): Promise<Metric[]> {
  try {
    const queueResult = await query<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM raw_events
      WHERE processed = false OR processed IS NULL
    `);

    const queueDepth = Number(queueResult.rows[0]?.count || 0);

    // Ingestion rate (events per hour)
    const ingestResult = await query<{ count: string }>(`
      SELECT SUM(events_new) as count
      FROM ingestion_logs
      WHERE status = 'success'
        AND started_at > NOW() - INTERVAL '1 hour'
    `);

    const ingestionRate = Number(ingestResult.rows[0]?.count || 0);

    return [
      {
        name: "processing_queue_depth",
        type: "gauge",
        help: "Number of unprocessed events in queue",
        value: queueDepth,
      },
      {
        name: "ingestion_rate_per_hour",
        type: "gauge",
        help: "Number of events ingested per hour",
        value: ingestionRate,
      },
    ];
  } catch (error) {
    console.error("Failed to get queue metrics:", error);
    return [];
  }
}

async function getArticleMetrics(): Promise<Metric[]> {
  try {
    const publishedResult = await query<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM "published-articles"
      WHERE status = 'published'
        AND publishedAt > NOW() - INTERVAL '24 hours'
    `);

    const publishedToday = Number(publishedResult.rows[0]?.count || 0);

    const totalResult = await query<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM "published-articles"
      WHERE status = 'published'
    `);

    const totalPublished = Number(totalResult.rows[0]?.count || 0);

    const successResult = await query<{ count: string }>(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'success') as count
      FROM ingestion_logs
      WHERE started_at > NOW() - INTERVAL '24 hours'
    `);

    const totalIngestion = Number(successResult.rows[0]?.count || 0);
    const successRate =
      totalIngestion > 0 ? (publishedToday / totalIngestion) * 100 : 0;

    return [
      {
        name: "articles_published_total",
        type: "counter",
        help: "Total published articles",
        value: totalPublished,
      },
      {
        name: "articles_published_last_24h",
        type: "gauge",
        help: "Articles published in the last 24 hours",
        value: publishedToday,
      },
      {
        name: "article_generation_success_rate_percent",
        type: "gauge",
        help: "Article generation success rate percentage",
        value: Number(successRate.toFixed(2)),
      },
    ];
  } catch (error) {
    console.error("Failed to get article metrics:", error);
    return [];
  }
}

async function getBusinessMetrics(): Promise<Metric[]> {
  try {
    // Newsletter signups
    const subscribersResult = await query<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM subscribers
      WHERE status = 'active'
    `);

    const activeSubscribers = Number(subscribersResult.rows[0]?.count || 0);

    const newSubscribersResult = await query<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM subscribers
      WHERE status = 'active'
        AND createdAt > NOW() - INTERVAL '24 hours'
    `);

    const newSubscribers = Number(newSubscribersResult.rows[0]?.count || 0);

    return [
      {
        name: "newsletter_subscribers_total",
        type: "gauge",
        help: "Total active newsletter subscribers",
        value: activeSubscribers,
      },
      {
        name: "newsletter_signups_last_24h",
        type: "gauge",
        help: "New newsletter signups in the last 24 hours",
        value: newSubscribers,
      },
      {
        name: "affiliate_clicks_total",
        type: "counter",
        help: "Total affiliate link clicks",
        value: 0, // TODO: Implement click tracking
      },
    ];
  } catch (error) {
    console.error("Failed to get business metrics:", error);
    return [];
  }
}

function getSystemMetrics(): Metric[] {
  const poolStats = getPoolStats();

  return [
    {
      name: "db_connections_total",
      type: "gauge",
      help: "Total database connections",
      value: poolStats.totalCount,
    },
    {
      name: "db_connections_idle",
      type: "gauge",
      help: "Idle database connections",
      value: poolStats.idleCount,
    },
    {
      name: "db_connections_waiting",
      type: "gauge",
      help: "Waiting database connections",
      value: poolStats.waitingCount,
    },
    {
      name: "nodejs_heap_used_bytes",
      type: "gauge",
      help: "Node.js heap memory usage",
      value: process.memoryUsage().heapUsed,
    },
    {
      name: "nodejs_heap_total_bytes",
      type: "gauge",
      help: "Node.js total heap size",
      value: process.memoryUsage().heapTotal,
    },
    {
      name: "nodejs rss_bytes",
      type: "gauge",
      help: "Node.js RSS memory usage",
      value: process.memoryUsage().rss,
    },
    {
      name: "process_uptime_seconds",
      type: "gauge",
      help: "Process uptime in seconds",
      value: Math.floor(process.uptime()),
    },
  ];
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const metricsToken = process.env.METRICS_TOKEN;

  // Optional authentication for metrics endpoint
  if (metricsToken && authHeader !== `Bearer ${metricsToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    requestMetrics,
    errorMetrics,
    queueMetrics,
    articleMetrics,
    businessMetrics,
  ] = await Promise.all([
    getRequestMetrics(),
    getErrorMetrics(),
    getQueueMetrics(),
    getArticleMetrics(),
    getBusinessMetrics(),
  ]);

  const systemMetrics = getSystemMetrics();

  const allMetrics = [
    ...requestMetrics,
    ...errorMetrics,
    ...queueMetrics,
    ...articleMetrics,
    ...businessMetrics,
    ...systemMetrics,
  ];

  const prometheusOutput = allMetrics
    .map((m) => formatPrometheusMetric(m))
    .join("\n\n");

  return new NextResponse(prometheusOutput + "\n", {
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
    },
  });
}
