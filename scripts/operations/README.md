# Operational Excellence Documentation

This document describes the operational improvements implemented for the worldunderwater.org project.

## Table of Contents

1. [Enhanced Monitoring](#1-enhanced-monitoring)
2. [Database Backup Strategy](#2-database-backup-strategy)
3. [Graceful Shutdown](#3-graceful-shutdown)
4. [Container Resource Limits](#4-container-resource-limits)
5. [Log Aggregation Setup](#5-log-aggregation-setup)
6. [Deployment Health Check](#6-deployment-health-check)
7. [Alerting Enhancements](#7-alerting-enhancements)

---

## 1. Enhanced Monitoring

### Endpoint: `/api/metrics`

A Prometheus-compatible metrics endpoint for system monitoring.

**File:** `src/app/api/metrics/route.ts`

**Metrics Tracked:**

| Category  | Metric                         | Type    | Description           |
| --------- | ------------------------------ | ------- | --------------------- |
| HTTP      | `http_requests_total`          | counter | Total HTTP requests   |
| Ingestion | `ingestion_requests_total`     | counter | Requests by status    |
| Ingestion | `ingestion_duration_ms`        | gauge   | Average duration      |
| Errors    | `ingestion_errors_total`       | counter | Errors in last hour   |
| Errors    | `ingestion_error_rate_percent` | gauge   | Error rate percentage |
| Queue     | `processing_queue_depth`       | gauge   | Unprocessed events    |
| Queue     | `ingestion_rate_per_hour`      | gauge   | Events per hour       |
| Articles  | `articles_published_total`     | counter | Total articles        |
| Articles  | `articles_published_last_24h`  | gauge   | Last 24h              |
| Business  | `newsletter_subscribers_total` | gauge   | Active subscribers    |
| Business  | `newsletter_signups_last_24h`  | gauge   | New signups           |
| System    | `db_connections_*`             | gauge   | DB pool stats         |
| System    | `nodejs_*`                     | gauge   | Memory metrics        |

**Usage:**

```bash
# Requires auth if METRICS_TOKEN is set
curl http://localhost:3000/api/metrics
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/metrics
```

**Environment Variables:**

| Variable        | Default | Description                              |
| --------------- | ------- | ---------------------------------------- |
| `METRICS_TOKEN` | -       | Optional Bearer token for authentication |

---

## 2. Database Backup Strategy

### Automated Backup Script

**File:** `scripts/maintenance/backup-automated.sh`

**Features:**

- Automated daily backups
- Retention policy (7 daily, 4 weekly, 12 monthly)
- Optional AES-256 encryption
- Backup verification (test restore)
- Failure notifications via webhook

**Usage:**

```bash
# Run backup
./scripts/maintenance/backup-automated.sh

# Test restore latest backup
./scripts/maintenance/backup-automated.sh --verify

# Apply retention policy only
./scripts/maintenance/backup-automated.sh --retention

# Setup cron job
./scripts/maintenance/backup-automated.sh --setup
```

**Environment Variables:**

| Variable                   | Default                        | Description                             |
| -------------------------- | ------------------------------ | --------------------------------------- |
| `DATABASE_URL`             | -                              | PostgreSQL connection string (required) |
| `BACKUP_DIR`               | `/var/backups/worldunderwater` | Backup directory                        |
| `BACKUP_RETENTION_DAILY`   | 7                              | Daily backups to keep                   |
| `BACKUP_RETENTION_WEEKLY`  | 4                              | Weekly backups to keep                  |
| `BACKUP_RETENTION_MONTHLY` | 12                             | Monthly backups to keep                 |
| `BACKUP_PASSWORD`          | -                              | Optional encryption password            |
| `NOTIFY_ON_FAILURE`        | -                              | Webhook URL for notifications           |

**Cron Setup:**

```bash
# Add to crontab -e
0 2 * * * /path/to/backup-automated.sh >/dev/null 2>&1
0 3 * * 0 /path/to/backup-automated.sh --verify >/dev/null 2>&1
```

---

## 3. Graceful Shutdown

**File:** `src/cron/scheduler.ts`

**Features:**

- SIGTERM/SIGINT handler
- Waits for running jobs to complete (30s timeout)
- Closes database connections properly
- Per-task timeout configuration
- Tracks running processes

**Per-Task Timeouts:**

| Task          | Schedule        | Timeout    |
| ------------- | --------------- | ---------- |
| ingest        | _/15 _ \* \* \* | 5 minutes  |
| process-queue | _/2 _ \* \* \*  | 2 minutes  |
| cleanup       | 0 3 \* \* \*    | 10 minutes |
| vacuum        | 0 4 \* \* 0     | 15 minutes |
| monitor       | _/10 _ \* \* \* | 1 minute   |

**Environment Variables:**

| Variable          | Default                     | Description                  |
| ----------------- | --------------------------- | ---------------------------- |
| `PIDFILE_DIR`     | `/tmp/worldunderwater-cron` | Pidfile directory            |
| `CRON_TIMEOUT_MS` | 3600000                     | Default job timeout (1 hour) |

---

## 4. Container Resource Limits

**File:** `docker-compose.yml`

**Resource Limits:**

| Service | CPU Limit | Memory Limit | CPU Reserve | Memory Reserve |
| ------- | --------- | ------------ | ----------- | -------------- |
| db      | 2.0       | 2G           | 0.5         | 512M           |
| web     | 2.0       | 1G           | 0.25        | 256M           |
| cms     | 1.0       | 512M         | 0.25        | 128M           |

**Healthchecks:**

| Service | Check         | Interval | Timeout |
| ------- | ------------- | -------- | ------- |
| db      | `pg_isready`  | 10s      | 5s      |
| web     | `/api/health` | 30s      | 10s     |
| cms     | `/admin`      | 30s      | 10s     |

**Log Rotation:**

- Max size: 10MB per file
- Max files: 3 per container

---

## 5. Log Aggregation Setup

**Directory:** `config/logging/`

**Files:**

- `index.ts` - Structured logging library
- `fluentd.conf` - Fluentd configuration
- `docker-compose.logging.yml` - Log aggregation stack

**Structured Logging Features:**

- JSON output format
- Correlation IDs for request tracing
- Log levels: debug, info, warn, error
- Context metadata support

**Usage in Code:**

```typescript
import { logger, createLogger, getCorrelationId } from "@/config/logging";

// Basic logging
logger.info("User logged in", { userId: "123" });

// With correlation ID
const correlationId = getCorrelationId(request.headers);
const log = createLogger({ correlationId });
log.info("Processing request");

// Middleware
import { loggingMiddleware } from "@/config/logging";
```

**Environment Variables:**

| Variable       | Default           | Description        |
| -------------- | ----------------- | ------------------ |
| `LOG_LEVEL`    | `info`            | Minimum log level  |
| `SERVICE_NAME` | `worldunderwater` | Service identifier |

**Log Aggregation Stack (Optional):**

```bash
# Start log aggregation services
docker-compose -f config/logging/docker-compose.logging.yml up -d

# Access Grafana at http://localhost:3002
# Default credentials: admin/changeme
```

---

## 6. Deployment Health Check

**File:** `scripts/deploy/smoke-test.sh`

**Tests:**

1. Health Check Endpoint
2. Metrics Endpoint
3. Database Connectivity
4. External API - NASA EONET
5. External API - USGS
6. Revalidation Endpoint
7. Static Files
8. Home Page

**Usage:**

```bash
# Basic usage
./scripts/deploy/smoke-test.sh

# Custom URL
./scripts/deploy/smoke-test.sh --url https://worldunderwater.org

# With longer timeout
./scripts/deploy/smoke-test.sh --timeout 60

# Verbose output
./scripts/deploy/smoke-test.sh --verbose
```

**Environment Variables:**

| Variable   | Default                 | Description               |
| ---------- | ----------------------- | ------------------------- |
| `BASE_URL` | `http://localhost:3000` | Target URL                |
| `TIMEOUT`  | 30                      | Request timeout (seconds) |
| `VERBOSE`  | false                   | Enable debug output       |

**Integration with CI/CD:**

```bash
# Run after deployment
npm run deploy
./scripts/deploy/smoke-test.sh || { echo "Smoke tests failed!"; exit 1; }
```

---

## 7. Alerting Enhancements

**File:** `scripts/monitoring/alert-on-failure.ts`

**Severity Levels:**

- **CRITICAL** - Immediate attention required
- **WARNING** - Investigate soon
- **INFO** - Informational

**Alert Rules:**

| Rule             | Default Threshold | Description           |
| ---------------- | ----------------- | --------------------- |
| Ingestion Errors | 3 in 60min        | Failed ingestion jobs |
| Queue Depth      | 100               | Unprocessed events    |
| Response Time    | 5000ms            | Average duration      |
| Error Rate       | 10%               | Failed requests       |

**Notification Channels:**

- Telegram
- Slack
- Webhook (custom)
- Email (future)
- PagerDuty (future)

**Environment Variables:**

| Variable                            | Default | Description           |
| ----------------------------------- | ------- | --------------------- |
| `ALERT_INGEST_ERROR_THRESHOLD`      | 3       | Ingestion error count |
| `ALERT_INGEST_ERROR_WINDOW_MINUTES` | 60      | Time window           |
| `ALERT_QUEUE_DEPTH_THRESHOLD`       | 100     | Queue depth limit     |
| `ALERT_RESPONSE_TIME_THRESHOLD_MS`  | 5000    | Response time limit   |
| `ALERT_ERROR_RATE_THRESHOLD`        | 10      | Error rate percentage |
| `ALERT_COOLDOWN_MINUTES`            | 30      | Alert cooldown        |
| `ALERT_ON_CALL_ENABLED`             | false   | Enable on-call        |
| `TELEGRAM_BOT_TOKEN`                | -       | Telegram bot token    |
| `TELEGRAM_CHAT_ID`                  | -       | Telegram chat ID      |
| `SLACK_WEBHOOK_URL`                 | -       | Slack webhook URL     |
| `ALERT_WEBHOOK_URL`                 | -       | Custom webhook URL    |

**On-Call Schedule (JSON):**

```json
{
  "timezone": "UTC",
  "shifts": [
    {
      "start": "09:00",
      "end": "17:00",
      "days": [1, 2, 3, 4, 5],
      "contact": "on-call@example.com"
    }
  ]
}
```

**Alert Deduplication:**

- Alerts are tracked in memory (use Redis in production)
- Cooldown period prevents spam
- Automatic cleanup of old entries

---

## Quick Reference

### Environment Variable Checklist

```bash
# Monitoring
METRICS_TOKEN=your_secret_token
LOG_LEVEL=info
SERVICE_NAME=worldunderwater

# Database Backup
DATABASE_URL=postgresql://...
BACKUP_DIR=/var/backups/worldunderwater
BACKUP_PASSWORD=encryption_key
NOTIFY_ON_FAILURE=https://hooks.example.com/alert

# Alerting
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
ALERT_WEBHOOK_URL=https://your-webhook.com

# On-Call
ALERT_ON_CALL_ENABLED=true
ALERT_ON_CALL_SCHEDULE='{"timezone":"UTC","shifts":[...]}'
```

### Package.json Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "backup": "./scripts/maintenance/backup-automated.sh",
    "backup:verify": "./scripts/maintenance/backup-automated.sh --verify",
    "smoke-test": "./scripts/deploy/smoke-test.sh",
    "monitor:alert": "tsx scripts/monitoring/alert-on-failure.ts"
  }
}
```

### Monitoring Stack (Optional)

```bash
# Start log aggregation
docker-compose -f config/logging/docker-compose.logging.yml up -d

# Access Grafana
open http://localhost:3002
```
