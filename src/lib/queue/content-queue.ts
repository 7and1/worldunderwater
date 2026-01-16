import { query } from "@/lib/db";

export type ContentQueueStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "skipped";

export interface ContentQueueItem {
  id: number;
  rawEventId: string;
  status: ContentQueueStatus;
  priority: number;
  assignedAt?: string | null;
  workerId?: string | null;
  attempts: number;
  maxAttempts: number;
  articleId?: string | null;
  errorMessage?: string | null;
  createdAt?: string | null;
  processedAt?: string | null;
}

const DEFAULT_PRIORITY = Number(
  process.env.CONTENT_QUEUE_DEFAULT_PRIORITY || "50",
);
const CLAIM_TIMEOUT_MS = Number(
  process.env.CONTENT_QUEUE_CLAIM_TIMEOUT_MS || "900000",
);
const DEFAULT_WORKER_ID =
  process.env.CONTENT_QUEUE_WORKER_ID || `content-${process.pid}-${Date.now()}`;

function mapRow(row: Record<string, unknown> | null): ContentQueueItem | null {
  if (!row) return null;
  return {
    id: Number(row.id),
    rawEventId: String(row.raw_event_id),
    status: row.status as ContentQueueStatus,
    priority: Number(row.priority ?? DEFAULT_PRIORITY),
    assignedAt: (row.assigned_at as string | null) ?? null,
    workerId: (row.worker_id as string | null) ?? null,
    attempts: Number(row.attempts ?? 0),
    maxAttempts: Number(row.max_attempts ?? 3),
    articleId: (row.article_id as string | null) ?? null,
    errorMessage: (row.error_message as string | null) ?? null,
    createdAt: (row.created_at as string | null) ?? null,
    processedAt: (row.processed_at as string | null) ?? null,
  };
}

export async function enqueueContentJob(
  rawEventId: string,
  priority: number = DEFAULT_PRIORITY,
): Promise<void> {
  await query(
    `
    INSERT INTO content_queue (raw_event_id, status, priority)
    VALUES ($1, 'pending', $2)
    ON CONFLICT (raw_event_id) DO UPDATE
      SET status = CASE
          WHEN content_queue.status IN ('failed', 'skipped') THEN 'pending'
          ELSE content_queue.status
        END,
        priority = GREATEST(content_queue.priority, EXCLUDED.priority),
        error_message = CASE
          WHEN content_queue.status IN ('failed', 'skipped') THEN NULL
          ELSE content_queue.error_message
        END,
        processed_at = CASE
          WHEN content_queue.status IN ('failed', 'skipped') THEN NULL
          ELSE content_queue.processed_at
        END
    `,
    [rawEventId, priority],
  );
}

export async function releaseStaleContentJobs(): Promise<void> {
  const threshold = new Date(Date.now() - CLAIM_TIMEOUT_MS).toISOString();
  await query(
    `
    UPDATE content_queue
    SET status = 'pending',
        worker_id = NULL,
        assigned_at = NULL,
        attempts = attempts + 1
    WHERE status = 'processing'
      AND assigned_at IS NOT NULL
      AND assigned_at < $1
    `,
    [threshold],
  );
}

export async function claimContentJobs(
  limit: number,
  workerId: string = DEFAULT_WORKER_ID,
): Promise<ContentQueueItem[]> {
  await releaseStaleContentJobs();
  const result = await query(
    `
    WITH picked AS (
      SELECT id
      FROM content_queue
      WHERE status = 'pending'
        AND attempts < max_attempts
      ORDER BY priority DESC, created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT $1
    )
    UPDATE content_queue
    SET status = 'processing',
        assigned_at = NOW(),
        worker_id = $2,
        attempts = attempts + 1
    WHERE id IN (SELECT id FROM picked)
    RETURNING *
    `,
    [limit, workerId],
  );

  return result.rows.map((row) => mapRow(row)!).filter(Boolean);
}

export async function markContentJobCompleted(
  id: number,
  articleId?: string | null,
): Promise<void> {
  await query(
    `
    UPDATE content_queue
    SET status = 'completed',
        article_id = $2,
        processed_at = NOW(),
        worker_id = NULL
    WHERE id = $1
    `,
    [id, articleId ?? null],
  );
}

export async function markContentJobFailed(
  id: number,
  errorMessage: string,
  retryable: boolean,
): Promise<void> {
  const status = retryable ? "pending" : "failed";
  const processedAt = retryable ? null : new Date().toISOString();

  await query(
    `
    UPDATE content_queue
    SET status = $2,
        error_message = $3,
        processed_at = $4,
        worker_id = NULL,
        assigned_at = NULL
    WHERE id = $1
    `,
    [id, status, errorMessage, processedAt],
  );
}

export async function markContentJobSkipped(
  id: number,
  reason: string,
): Promise<void> {
  await query(
    `
    UPDATE content_queue
    SET status = 'skipped',
        error_message = $2,
        processed_at = NOW(),
        worker_id = NULL,
        assigned_at = NULL
    WHERE id = $1
    `,
    [id, reason],
  );
}
