/**
 * Background Job Queue Configuration
 *
 * Defines job types, priorities, and queue configuration.
 */

export enum JobState {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum JobPriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 8,
  CRITICAL = 10,
}

export enum JobType {
  GENERATE_ARTICLE = "generate_article",
  POST_SOCIAL = "post_social",
  SEND_NEWSLETTER = "send_newsletter",
  REVALIDATE_CACHE = "revalidate_cache",
  INGEST_SOURCE = "ingest_source",
  GENERATE_THUMBNAIL = "generate_thumbnail",
}

export interface JobData<T = unknown> {
  type: JobType;
  payload: T;
  priority?: JobPriority;
  maxRetries?: number;
  retryDelay?: number;
  timeoutMs?: number;
}

export interface QueuedJob {
  id: string;
  type: JobType;
  state: JobState;
  priority: JobPriority;
  payload: unknown;
  attempts: number;
  maxRetries: number;
  result?: unknown;
  error?: string;
  retryDelay: number;
  timeoutMs: number;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  nextRetryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  workerId?: string;
}

export interface JobResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: Error;
  retryable?: boolean;
}

export interface JobHandler<TInput = unknown, TOutput = unknown> {
  type: JobType;
  handler: (payload: TInput) => Promise<JobResult<TOutput>>;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface QueueMetrics {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}
