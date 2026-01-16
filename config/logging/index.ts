/**
 * Structured Logging Configuration
 *
 * Provides centralized logging with:
 * - JSON structured output for parsing
 * - Correlation IDs for request tracing
 * - Log levels (debug, info, warn, error)
 * - Context metadata
 */

import { randomUUID } from "node:crypto";

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export interface LogContext {
  correlationId?: string;
  userId?: string;
  service?: string;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

const SERVICE_NAME = process.env.SERVICE_NAME || "worldunderwater";
const LOG_LEVEL = (
  process.env.LOG_LEVEL || LogLevel.INFO
).toLowerCase() as LogLevel;

// Log level hierarchy for filtering
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

/**
 * Generate or extract correlation ID from headers
 */
export function getCorrelationId(headers?: Headers): string {
  if (headers) {
    const existing =
      headers.get("x-correlation-id") || headers.get("x-request-id");
    if (existing) return existing;
  }
  return randomUUID();
}

/**
 * Create child logger with preset context
 */
export function createLogger(presetContext: LogContext) {
  return {
    debug: (message: string, additionalContext?: LogContext) =>
      log(LogLevel.DEBUG, message, { ...presetContext, ...additionalContext }),
    info: (message: string, additionalContext?: LogContext) =>
      log(LogLevel.INFO, message, { ...presetContext, ...additionalContext }),
    warn: (message: string, additionalContext?: LogContext) =>
      log(LogLevel.WARN, message, { ...presetContext, ...additionalContext }),
    error: (
      message: string,
      error?: Error | unknown,
      additionalContext?: LogContext,
    ) =>
      log(
        LogLevel.ERROR,
        message,
        { ...presetContext, ...additionalContext },
        error as Error,
      ),
  };
}

/**
 * Format error for logging
 */
function formatError(error: Error | unknown): LogEntry["error"] {
  if (!error) return undefined;

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as { code?: string }).code,
    };
  }

  return {
    name: "UnknownError",
    message: String(error),
  };
}

/**
 * Core logging function
 */
function log(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error,
): void {
  // Filter logs by configured level
  if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[LOG_LEVEL]) {
    return;
  }

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: SERVICE_NAME,
    context: {
      ...context,
      correlationId: context?.correlationId || randomUUID(),
    },
  };

  if (error) {
    entry.error = formatError(error);
  }

  // Output structured JSON
  const output = JSON.stringify(entry);

  switch (level) {
    case LogLevel.ERROR:
      console.error(output);
      break;
    case LogLevel.WARN:
      console.warn(output);
      break;
    case LogLevel.DEBUG:
      // Only log debug if enabled
      if (LOG_LEVEL === LogLevel.DEBUG) {
        console.debug(output);
      }
      break;
    default:
      console.log(output);
  }
}

/**
 * Default logger instance
 */
export const logger = {
  debug: (message: string, context?: LogContext) =>
    log(LogLevel.DEBUG, message, context),
  info: (message: string, context?: LogContext) =>
    log(LogLevel.INFO, message, context),
  warn: (message: string, context?: LogContext) =>
    log(LogLevel.WARN, message, context),
  error: (message: string, error?: Error | unknown, context?: LogContext) =>
    log(LogLevel.ERROR, message, context, error as Error),
};

/**
 * Middleware to inject correlation ID into requests
 */
export function loggingMiddleware() {
  return async (request: Request, next: () => Promise<Response>) => {
    const correlationId = getCorrelationId(request.headers);
    const requestLogger = createLogger({ correlationId, path: request.url });

    const start = Date.now();

    requestLogger.info("Incoming request", {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get("user-agent"),
    });

    try {
      const response = await next();

      const duration = Date.now() - start;
      requestLogger.info("Request completed", {
        method: request.method,
        status: response.status,
        duration,
      });

      // Add correlation ID to response headers
      response.headers.set("x-correlation-id", correlationId);

      return response;
    } catch (error) {
      const duration = Date.now() - start;
      requestLogger.error("Request failed", error, {
        method: request.method,
        duration,
      });
      throw error;
    }
  };
}

/**
 * Pino-compatible transport for Next.js/Edge runtime
 * Returns a function that can be used as a custom logger
 */
export function createPinoTransport() {
  return {
    write: (data: string) => {
      const parsed = JSON.parse(data);
      // Reuse our structured logger
      const level =
        parsed.level >= 50
          ? LogLevel.ERROR
          : parsed.level >= 40
            ? LogLevel.WARN
            : LogLevel.INFO;
      log(level, parsed.msg, { ...parsed, service: SERVICE_NAME });
    },
  };
}
