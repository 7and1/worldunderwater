/**
 * Persistent Job Queue with PostgreSQL Backend
 *
 * Provides:
 * - PostgreSQL-backed job storage
 * - Job states: pending, processing, completed, failed
 * - Exponential backoff retry logic
 * - Dead letter queue for permanently failed jobs
 * - Priority-based job selection
 * - Horizontal scaling support via worker claims
 */

import { query } from "../db";
import {
  JobState,
  JobPriority,
  JobType,
  type QueuedJob,
  type JobData,
  type JobResult,
  type QueueMetrics,
} from "./types";

const WORKER_ID =
  process.env.WORKER_ID || "worker-" + process.pid + "-" + Date.now();
const JOB_CLAIM_TIMEOUT_MS = Number(
  process.env.JOB_CLAIM_TIMEOUT_MS || "300000",
);
const DEAD_LETTER_MAX_RETAIN_DAYS = Number(
  process.env.DEAD_LETTER_MAX_RETAIN_DAYS || "30",
);

export async function initQueueTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS job_queue (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'pending',
      priority INTEGER NOT NULL DEFAULT 5,
      payload JSONB NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_retries INTEGER NOT NULL DEFAULT 3,
      result JSONB,
      error TEXT,
      retry_delay INTEGER NOT NULL DEFAULT 1000,
      timeout_ms INTEGER NOT NULL DEFAULT 60000,
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      failed_at TIMESTAMPTZ,
      next_retry_at TIMESTAMPTZ,
      worker_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_job_queue_state_priority 
      ON job_queue (state, priority DESC, created_at);
    
    CREATE INDEX IF NOT EXISTS idx_job_queue_type_state 
      ON job_queue (type, state);
    
    CREATE INDEX IF NOT EXISTS idx_job_queue_worker 
      ON job_queue (worker_id) WHERE worker_id IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_job_queue_next_retry 
      ON job_queue (next_retry_at) WHERE next_retry_at IS NOT NULL;

    CREATE TABLE IF NOT EXISTS dead_letter_queue (
      id TEXT PRIMARY KEY,
      original_job_id TEXT NOT NULL,
      type TEXT NOT NULL,
      payload JSONB NOT NULL,
      error TEXT,
      attempts INTEGER NOT NULL,
      failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_dead_letter_created_at 
      ON dead_letter_queue (created_at);
  `);

  await releaseStaleJobs();
}

export async function releaseStaleJobs(): Promise<void> {
  const staleThreshold = new Date(Date.now() - JOB_CLAIM_TIMEOUT_MS);

  await query(
    `UPDATE job_queue 
     SET state = 'pending', 
         worker_id = NULL, 
         started_at = NULL,
         attempts = attempts + 1,
         updated_at = NOW()
     WHERE state = 'processing' 
       AND started_at < $1
       AND (timeout_ms IS NULL OR started_at + (timeout_ms || 'ms')::interval < NOW())`,
    [staleThreshold.toISOString()],
  );
}

export async function enqueueJob<T>(
  data: JobData<T>,
  options: { id?: string; delayMs?: number } = {},
): Promise<string> {
  const jobId = options.id || generateJobId();
  const nextRetryAt = options.delayMs
    ? new Date(Date.now() + options.delayMs)
    : null;

  await query(
    `INSERT INTO job_queue (
      id, type, state, priority, payload, 
      max_retries, retry_delay, timeout_ms, next_retry_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      jobId,
      data.type,
      nextRetryAt ? JobState.PENDING : JobState.PENDING,
      data.priority ?? JobPriority.NORMAL,
      JSON.stringify(data.payload),
      data.maxRetries ?? 3,
      data.retryDelay ?? 1000,
      data.timeoutMs ?? 60000,
      nextRetryAt?.toISOString() ?? null,
    ],
  );

  return jobId;
}

export async function claimJob(types?: JobType[]): Promise<QueuedJob | null> {
  await releaseStaleJobs();

  const typeFilter = types?.length ? `AND type = ANY($1)` : "";

  const result = await query(
    `UPDATE job_queue 
     SET state = 'processing',
         worker_id = $2,
         started_at = NOW(),
         updated_at = NOW()
     WHERE id = (
       SELECT id FROM job_queue
       WHERE state = 'pending'
         AND (next_retry_at IS NULL OR next_retry_at <= NOW())
         ${typeFilter}
       ORDER BY priority DESC, created_at ASC
       FOR UPDATE SKIP LOCKED
       LIMIT 1
       FOR UPDATE
     )
     RETURNING *`,
    types?.length ? [types] : [WORKER_ID],
  );

  return parseJobRow(result.rows[0] ?? null);
}

export async function completeJob(
  jobId: string,
  result?: unknown,
): Promise<void> {
  await query(
    `UPDATE job_queue 
     SET state = 'completed',
         completed_at = NOW(),
         result = $2,
         worker_id = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [jobId, result ? JSON.stringify(result) : null],
  );
}

export async function failJob(
  jobId: string,
  error: Error,
  isRetryable: boolean = true,
): Promise<void> {
  const job = await getJob(jobId);
  if (!job) return;

  const shouldRetry = isRetryable && job.attempts < job.maxRetries;

  if (shouldRetry) {
    const retryDelayMs = calculateRetryDelay(job.attempts, job.retryDelay);
    const nextRetryAt = new Date(Date.now() + retryDelayMs);

    await query(
      `UPDATE job_queue 
       SET state = 'pending',
           attempts = attempts + 1,
           error = $2,
           next_retry_at = $3,
           worker_id = NULL,
           started_at = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [jobId, error.message, nextRetryAt.toISOString()],
    );
  } else {
    await query(
      `INSERT INTO dead_letter_queue (
        id, original_job_id, type, payload, error, attempts
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        generateJobId(),
        jobId,
        job.type,
        JSON.stringify(job.payload),
        error.message,
        job.attempts,
      ],
    );

    await query(
      `UPDATE job_queue 
       SET state = 'failed',
           failed_at = NOW(),
           error = $2,
           worker_id = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [jobId, error.message],
    );
  }
}

export async function getJob(jobId: string): Promise<QueuedJob | null> {
  const result = await query(`SELECT * FROM job_queue WHERE id = $1`, [jobId]);
  return parseJobRow(result.rows[0] ?? null);
}

export async function getQueueMetrics(): Promise<QueueMetrics> {
  const result = await query<{ state: string; count: bigint }>(
    `SELECT state, COUNT(*) as count FROM job_queue GROUP BY state`,
  );

  const metrics: QueueMetrics = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0,
  };

  for (const row of result.rows) {
    const count = Number(row.count);
    metrics.total += count;
    switch (row.state) {
      case JobState.PENDING:
        metrics.pending = count;
        break;
      case JobState.PROCESSING:
        metrics.processing = count;
        break;
      case JobState.COMPLETED:
        metrics.completed = count;
        break;
      case JobState.FAILED:
        metrics.failed = count;
        break;
    }
  }

  return metrics;
}

export async function cleanupOldJobs(
  completedDaysToKeep: number = 7,
  deadLetterDaysToKeep: number = DEAD_LETTER_MAX_RETAIN_DAYS,
): Promise<{ completedDeleted: number; deadLetterDeleted: number }> {
  const completedCutoff = new Date(
    Date.now() - completedDaysToKeep * 24 * 60 * 60 * 1000,
  );
  const deadLetterCutoff = new Date(
    Date.now() - deadLetterDaysToKeep * 24 * 60 * 60 * 1000,
  );

  const completedResult = await query(
    `DELETE FROM job_queue 
     WHERE state = 'completed' 
       AND completed_at < $1
     RETURNING count(*)`,
    [completedCutoff.toISOString()],
  );

  const deadLetterResult = await query(
    `DELETE FROM dead_letter_queue 
     WHERE created_at < $1
     RETURNING count(*)`,
    [deadLetterCutoff.toISOString()],
  );

  return {
    completedDeleted: Number(completedResult.rows[0]?.count ?? 0),
    deadLetterDeleted: Number(deadLetterResult.rows[0]?.count ?? 0),
  };
}

function calculateRetryDelay(attempt: number, baseDelay: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const maxDelay = 60 * 60 * 1000;
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.max(baseDelay, Math.round(cappedDelay + jitter));
}

function parseJobRow(row: Record<string, unknown> | null): QueuedJob | null {
  if (!row) return null;

  return {
    id: String(row.id),
    type: String(row.type) as JobType,
    state: String(row.state) as JobState,
    priority: Number(row.priority),
    payload: (row.payload as { payload: unknown }).payload,
    attempts: Number(row.attempts),
    maxRetries: Number(row.max_retries),
    result: row.result ? (row.result as { result: unknown }).result : undefined,
    error: row.error as string | undefined,
    retryDelay: Number(row.retry_delay),
    timeoutMs: Number(row.timeout_ms),
    startedAt: row.started_at ? new Date(String(row.started_at)) : undefined,
    completedAt: row.completed_at
      ? new Date(String(row.completed_at))
      : undefined,
    failedAt: row.failed_at ? new Date(String(row.failed_at)) : undefined,
    nextRetryAt: row.next_retry_at
      ? new Date(String(row.next_retry_at))
      : undefined,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
    workerId: row.worker_id ? String(row.worker_id) : undefined,
  };
}

function generateJobId(): string {
  return "job-" + Date.now() + "-" + Math.random().toString(36).slice(2, 11);
}
