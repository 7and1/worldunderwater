import { Pool, QueryResultRow, QueryResult } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL is not set. Database utilities will be disabled.");
}

// P1-1: Enhanced connection pooling with optimized settings
// - Increased max pool size from 10 to 50 for better concurrency
// - Added connectionTimeoutMillis to prevent hanging queries
// - Added statement_timeout for runaway query protection
// - Pool event logging for monitoring connection health
const pool = connectionString
  ? new Pool({
      connectionString,
      // Max connections: allows 50 concurrent queries, suitable for serverless environments
      max: 50,
      // How long a client can remain idle before being closed (30 seconds)
      idleTimeoutMillis: 30000,
      // How long to wait when connecting a new client (5 seconds)
      connectionTimeoutMillis: 5000,
      // Default statement timeout: kill queries running longer than 30 seconds
      statement_timeout: 30000,
    })
  : null;

// P1-1: Pool event logging for monitoring
if (pool) {
  pool.on("connect", () => {
    // Silent on connect - too noisy
  });

  pool.on("error", (err) => {
    console.error("[DB Pool] Unexpected error on idle client", err);
  });

  pool.on("remove", () => {
    // Log when client is removed from pool (useful for debugging leaks)
    console.debug("[DB Pool] Client removed from pool");
  });
}

// P1-1: Query wrapper with optional per-query timeout override
export async function query<T extends QueryResultRow = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
  options: { timeout?: number } = {},
): Promise<QueryResult<T>> {
  if (!pool) {
    throw new Error("Database pool is not initialized");
  }
  const client = await pool.connect();
  try {
    // Allow per-query timeout override
    if (options.timeout) {
      await client.query(`SET statement_timeout = ${options.timeout}`);
    }
    const result = await client.query<T>(text, params);
    return result;
  } finally {
    client.release();
  }
}

// P1-1: Get pool stats for monitoring
export function getPoolStats() {
  if (!pool) {
    return { totalCount: 0, idleCount: 0, waitingCount: 0 };
  }
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

export async function closePool() {
  await pool?.end();
}
