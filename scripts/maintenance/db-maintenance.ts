#!/usr/bin/env node

import { config } from "dotenv";
config();

import { query, closePool } from "../../src/lib/db";

async function main() {
  try {
    await query("VACUUM (ANALYZE) raw_events");
    await query("VACUUM (ANALYZE) published_articles");
    await query("VACUUM (ANALYZE) ingestion_logs");
    console.log("Database maintenance completed.");
  } catch (error) {
    console.error("Database maintenance failed:", error);
  } finally {
    await closePool();
  }
}

main();
