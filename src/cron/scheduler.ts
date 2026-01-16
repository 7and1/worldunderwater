import cron from "node-cron";
import { spawn, ChildProcess } from "child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pid } from "node:process";
import { closePool } from "@/lib/db";

const isEnabled = process.env.CRON_ENABLED !== "false";

const PID_DIR = process.env.PIDFILE_DIR || "/tmp/worldunderwater-cron";
const CRON_TIMEOUT_MS = Number(process.env.CRON_TIMEOUT_MS || "3600000"); // 1 hour default
const SHUTDOWN_TIMEOUT_MS = 30000; // 30 seconds grace period for shutdown

interface ScheduledTask {
  schedule: string;
  name: string;
  timeout: number;
}

// Track running child processes for graceful shutdown
const runningProcesses = new Set<ChildProcess>();
let isShuttingDown = false;

interface PidFileData {
  pid: number;
  startTime: number;
  script: string;
  nodeVersion?: string;
}

async function ensurePidDir(): Promise<void> {
  if (!existsSync(PID_DIR)) {
    await mkdir(PID_DIR, { recursive: true });
  }
}

function getPidPath(script: string): string {
  const safeName = script.replace(/[^a-z0-9]/gi, "_");
  return join(PID_DIR, `${safeName}.pid`);
}

async function isProcessAlive(checkPid: number): Promise<boolean> {
  try {
    process.kill(checkPid, 0);
    return true;
  } catch {
    return false;
  }
}

async function acquireLock(script: string): Promise<boolean> {
  await ensurePidDir();
  const pidPath = getPidPath(script);

  if (existsSync(pidPath)) {
    try {
      const content = await readFile(pidPath, "utf-8");
      const data = JSON.parse(content) as PidFileData;
      const alive = await isProcessAlive(data.pid);

      const now = Date.now();
      const elapsed = now - data.startTime;

      if (alive) {
        if (elapsed > CRON_TIMEOUT_MS) {
          console.warn(
            `[cron] Previous ${script} run (PID ${data.pid}) exceeded timeout of ${CRON_TIMEOUT_MS}ms - proceeding anyway`,
          );
        } else {
          console.warn(
            `[cron] Previous ${script} run still active (PID ${data.pid}, running for ${Math.round(elapsed / 1000)}s) - skipping`,
          );
          return false;
        }
      } else {
        if (elapsed > CRON_TIMEOUT_MS) {
          console.warn(
            `[cron] Previous ${script} run (PID ${data.pid}) appears dead (timeout exceeded) - cleaning up stale lock`,
          );
        } else {
          console.warn(
            `[cron] Previous ${script} run (PID ${data.pid}) not found but lockfile is recent (${Math.round(elapsed / 1000)}s old) - possible crash, cleaning up`,
          );
        }
      }
    } catch (error) {
      console.warn(`[cron] Error reading pidfile ${pidPath}:`, error);
    }
  }

  const lockData: PidFileData = {
    pid,
    startTime: Date.now(),
    script,
    nodeVersion: process.version,
  };

  try {
    await writeFile(pidPath, JSON.stringify(lockData, null, 2));
    return true;
  } catch (error) {
    console.error(`[cron] Failed to write pidfile ${pidPath}:`, error);
    return false;
  }
}

async function releaseLock(script: string): Promise<void> {
  const pidPath = getPidPath(script);
  try {
    if (existsSync(pidPath)) {
      await readFile(pidPath, "utf-8")
        .then(async (content) => {
          const data = JSON.parse(content) as PidFileData;
          if (data.pid === pid) {
            await writeFile(pidPath, ""); // Clear only if we own the lock
          }
        })
        .catch(() => {});
    }
  } catch (error) {
    console.warn(`[cron] Failed to release lock for ${script}:`, error);
  }
}

async function runScript(script: string, timeout: number = CRON_TIMEOUT_MS) {
  if (isShuttingDown) {
    console.log(`[cron] Skipping ${script}: shutdown in progress`);
    return;
  }

  const acquired = await acquireLock(script);
  if (!acquired) {
    return;
  }

  const startTime = Date.now();

  const child = spawn("npm", ["run", script], {
    stdio: "inherit",
    shell: true,
  });

  runningProcesses.add(child);

  // Enforce timeout for individual jobs
  const timeoutHandle = setTimeout(() => {
    console.warn(
      `[cron] Script ${script} timed out after ${timeout}ms, terminating...`,
    );
    child.kill("SIGTERM");
  }, timeout);

  child.on("exit", async (code) => {
    clearTimeout(timeoutHandle);
    runningProcesses.delete(child);
    const duration = Date.now() - startTime;
    await releaseLock(script);
    if (code !== 0) {
      console.error(
        `[cron] Script ${script} exited with code ${code} after ${duration}ms`,
      );
    } else {
      console.log(`[cron] Script ${script} completed in ${duration}ms`);
    }
  });

  child.on("error", async (error) => {
    clearTimeout(timeoutHandle);
    runningProcesses.delete(child);
    await releaseLock(script);
    console.error(`[cron] Failed to spawn ${script}:`, error);
  });
}

// Enhanced graceful shutdown handler
async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    console.log(`[cron] Shutdown already in progress`);
    return;
  }

  isShuttingDown = true;
  console.log(`\n[cron] Received ${signal}, initiating graceful shutdown...`);

  // Stop accepting new cron jobs
  cron.getTasks().forEach((task) => task.stop());

  // Wait for running jobs to complete
  if (runningProcesses.size > 0) {
    console.log(
      `[cron] Waiting for ${runningProcesses.size} running job(s)...`,
    );

    const promises = Array.from(runningProcesses).map(
      (proc) =>
        new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            console.warn(
              `[cron] Job did not complete in time, force terminating...`,
            );
            proc.kill("SIGKILL");
            resolve();
          }, SHUTDOWN_TIMEOUT_MS);

          proc.once("exit", () => {
            clearTimeout(timeout);
            resolve();
          });
        }),
    );

    await Promise.all(promises);
  }

  // Release pidfile locks
  console.log("[cron] Releasing locks...");
  try {
    const { readdir, unlink } = await import("node:fs/promises");
    const files = await readdir(PID_DIR).catch(() => []);
    for (const file of files) {
      if (file.endsWith(".pid")) {
        const pidPath = join(PID_DIR, file);
        const content = await readFile(pidPath, "utf-8").catch(() => "");
        if (content) {
          const data = JSON.parse(content) as PidFileData;
          if (data.pid === pid) {
            await unlink(pidPath).catch(() => {});
          }
        }
      }
    }
  } catch (error) {
    console.warn("[cron] Error during lock cleanup:", error);
  }

  // Close database connections
  console.log("[cron] Closing database connections...");
  try {
    await closePool();
    console.log("[cron] Database connections closed");
  } catch (error) {
    console.error("[cron] Error closing database pool:", error);
  }

  console.log("[cron] Shutdown complete. Goodbye!");
  process.exit(0);
}

if (isEnabled) {
  // Scheduled tasks with per-task timeouts
  const scheduledTasks: ScheduledTask[] = [
    { schedule: "*/15 * * * *", name: "ingest", timeout: 300000 }, // 5 minutes
    { schedule: "*/2 * * * *", name: "process-queue", timeout: 120000 }, // 2 minutes
    { schedule: "0 3 * * *", name: "cleanup", timeout: 600000 }, // 10 minutes
    { schedule: "0 4 * * 0", name: "vacuum", timeout: 900000 }, // 15 minutes
    { schedule: "*/10 * * * *", name: "monitor", timeout: 60000 }, // 1 minute
  ];

  for (const task of scheduledTasks) {
    cron.schedule(task.schedule, () => runScript(task.name, task.timeout));
    console.log(`[cron] Scheduled: ${task.name} (${task.schedule})`);
  }

  console.log("Cron scheduler started with pidfile locking.");

  // Register shutdown handlers
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // Prevent unhandled rejections from silently crashing
  process.on("unhandledRejection", (reason, promise) => {
    console.error("[cron] Unhandled Rejection at:", promise, "reason:", reason);
  });

  process.on("uncaughtException", (error) => {
    console.error("[cron] Uncaught Exception:", error);
    gracefulShutdown("uncaughtException");
  });
} else {
  console.log("Cron scheduler disabled.");
}

export { runningProcesses, gracefulShutdown };
