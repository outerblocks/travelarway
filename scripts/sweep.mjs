/**
 * Expiry sweep for a scheduler.
 *
 *   node scripts/sweep.mjs [baseUrl]
 *
 * Closes bookings whose payment window has passed and returns their seats to inventory.
 * Run it every couple of minutes (cron, Windows Task Scheduler, or the platform's own
 * scheduler). The application expires a booking whenever somebody opens it, so a missed
 * run delays the truth rather than changing it — but only the sweep cleans up bookings
 * nobody returns to.
 *
 * Reads MAINTENANCE_SECRET from .env. Refuses to call anything without it.
 */
import { config as loadEnv } from 'dotenv';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

const base = process.argv[2] ?? 'http://localhost:5431';
const secret = process.env.MAINTENANCE_SECRET ?? '';

if (secret.length < 32) {
  console.log(JSON.stringify({ ok: false, reason: 'MAINTENANCE_SECRET missing or too short' }));
  process.exit(1);
}

const response = await fetch(`${base}/api/internal/sweep`, {
  method: 'POST',
  headers: { 'x-sweep-secret': secret },
});

const body = await response.json().catch(() => null);
console.log(JSON.stringify({ ok: response.ok, status: response.status, ...body }, null, 2));

if (!response.ok) process.exitCode = 1;
