#!/usr/bin/env node

import { config } from "dotenv";
config();

import { query, closePool } from "../../src/lib/db";

const retentionDays = Number(process.env.DATA_RETENTION_DAYS || 30);
const dryRun =
  process.env.DRY_RUN === "true" || process.argv.includes("--dry-run");

async function main() {
  const cutoff = `${retentionDays} days`;

  if (dryRun) {
    console.log(`Dry run: would delete records older than ${cutoff}.`);
    return;
  }

  try {
    await query(
      `DELETE FROM ingestion_logs
       WHERE started_at < NOW() - INTERVAL '${retentionDays} days'`,
    );
    await query(
      `DELETE FROM raw_events
       WHERE ingested_at < NOW() - INTERVAL '${retentionDays} days'
       AND status IN ('processed', 'archived')
       AND article_generated = true`,
    );
    console.log(`Cleanup completed for records older than ${cutoff}.`);
  } catch (error) {
    console.error("Cleanup failed:", error);
  } finally {
    await closePool();
  }
}

main();
