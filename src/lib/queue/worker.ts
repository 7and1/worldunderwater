/**
 * Queue Worker - Processes jobs from the persistent queue
 *
 * Handles job execution, timeouts, retries, and worker lifecycle.
 */

import {
  initQueueTable,
  claimJob,
  completeJob,
  failJob,
  getQueueMetrics,
} from "./persistent-queue";
import { type QueuedJob, type JobHandler, type JobType } from "./types";

interface WorkerOptions {
  pollIntervalMs?: number;
  maxConcurrentJobs?: number;
  jobTypes?: JobType[];
  shutdownTimeoutMs?: number;
}

interface WorkerContext {
  activeJobs: number;
  processedCount: number;
  failedCount: number;
  startTime: Date;
}

export class QueueWorker {
  private handlers: Map<JobType, JobHandler> = new Map();
  private pollInterval: number;
  private maxConcurrent: number;
  private jobTypes?: JobType[];
  private shutdownTimeout: number;
  private isRunning: boolean = false;
  private pollTimer?: NodeJS.Timeout;
  private activeJobs: Set<string> = new Set();
  private context: WorkerContext;

  constructor(options: WorkerOptions = {}) {
    this.pollInterval = options.pollIntervalMs ?? 1000;
    this.maxConcurrent = options.maxConcurrentJobs ?? 3;
    this.jobTypes = options.jobTypes;
    this.shutdownTimeout = options.shutdownTimeoutMs ?? 30000;
    this.context = {
      activeJobs: 0,
      processedCount: 0,
      failedCount: 0,
      startTime: new Date(),
    };
  }

  registerHandler(handler: JobHandler<unknown, unknown>): void {
    this.handlers.set(handler.type as JobType, handler);
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn("[QueueWorker] Already running");
      return;
    }

    await initQueueTable();
    this.isRunning = true;
    this.context.startTime = new Date();

    console.log("[QueueWorker] Starting worker", {
      pollInterval: this.pollInterval,
      maxConcurrent: this.maxConcurrent,
      jobTypes: this.jobTypes,
      registeredHandlers: Array.from(this.handlers.keys()),
    });

    this.poll();
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log("[QueueWorker] Shutting down...");
    this.isRunning = false;

    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }

    const shutdownStart = Date.now();
    while (
      this.activeJobs.size > 0 &&
      Date.now() - shutdownStart < this.shutdownTimeout
    ) {
      console.log(
        "[QueueWorker] Waiting for " + this.activeJobs.size + " active jobs...",
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (this.activeJobs.size > 0) {
      console.warn(
        "[QueueWorker] " +
          this.activeJobs.size +
          " jobs still active at shutdown timeout",
      );
    }

    const duration = Date.now() - this.context.startTime.getTime();
    console.log("[QueueWorker] Stopped", {
      processed: this.context.processedCount,
      failed: this.context.failedCount,
      duration: duration + "ms",
    });
  }

  private poll(): void {
    if (!this.isRunning) return;

    this.processNext().finally(() => {
      if (this.isRunning) {
        this.pollTimer = setTimeout(() => this.poll(), this.pollInterval);
      }
    });
  }

  private async processNext(): Promise<void> {
    if (this.activeJobs.size >= this.maxConcurrent) {
      return;
    }

    const job = await claimJob(this.jobTypes);
    if (!job) return;

    this.activeJobs.add(job.id);
    this.context.activeJobs = this.activeJobs.size;

    this.processJob(job).finally(() => {
      this.activeJobs.delete(job.id);
      this.context.activeJobs = this.activeJobs.size;
    });
  }

  private async processJob(job: QueuedJob): Promise<void> {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      await failJob(
        job.id,
        new Error("No handler registered for job type: " + job.type),
        false,
      );
      this.context.failedCount++;
      return;
    }

    const timeoutMs = job.timeoutMs || handler.timeoutMs || 60000;
    const startTime = Date.now();

    try {
      const result = await this.withTimeout(
        handler.handler(job.payload),
        timeoutMs,
      );

      if (result.success) {
        await completeJob(job.id, result.data);
        this.context.processedCount++;
        console.log(
          "[QueueWorker] Job " +
            job.id +
            " completed in " +
            (Date.now() - startTime) +
            "ms",
        );
      } else {
        const retryable = result.retryable ?? true;
        await failJob(
          job.id,
          result.error || new Error("Job failed"),
          retryable,
        );
        this.context.failedCount++;
      }
    } catch (error) {
      const isRetryable = this.isRetryableError(error as Error);
      await failJob(job.id, error as Error, isRetryable);
      this.context.failedCount++;
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error("Job timeout after " + timeoutMs + "ms"));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  }

  private isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      /ECONNRESET/,
      /ETIMEDOUT/,
      /ENOTFOUND/,
      /EAI_AGAIN/,
      /rate limit/i,
      /temporary/i,
      /429/,
      /503/,
      /502/,
      /504/,
    ];

    return retryablePatterns.some((pattern) => pattern.test(error.message));
  }

  getContext(): WorkerContext {
    return { ...this.context };
  }
}

let globalWorker: QueueWorker | null = null;

export function getGlobalWorker(): QueueWorker | null {
  return globalWorker;
}

export function setGlobalWorker(worker: QueueWorker): void {
  globalWorker = worker;
}

export async function startWorker(
  options: WorkerOptions = {},
): Promise<QueueWorker> {
  const worker = new QueueWorker(options);
  setGlobalWorker(worker);
  await worker.start();
  return worker;
}

export async function stopWorker(): Promise<void> {
  if (globalWorker) {
    await globalWorker.stop();
    globalWorker = null;
  }
}
