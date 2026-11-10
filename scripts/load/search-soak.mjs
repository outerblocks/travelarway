/**
 * Lightweight origin soak: health + locations. Does not hold seats or start payments.
 *
 *   BASE_URL=http://localhost:5173 node scripts/load/search-soak.mjs
 */
const base = (process.env.BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');
const n = Number(process.env.SOAK_REQUESTS ?? '40');

let failed = 0;
const started = Date.now();

async function hit(path) {
  const response = await fetch(`${base}${path}`);
  if (!response.ok) failed += 1;
  return response.status;
}

const jobs = [];
for (let i = 0; i < n; i += 1) {
  jobs.push(hit('/api/health'));
  jobs.push(hit('/api/locations?mode=bus&q=dar'));
}
await Promise.all(jobs);
const elapsed = Date.now() - started;
console.log(
  JSON.stringify({
    ok: failed === 0,
    requests: n * 2,
    failed,
    elapsedMs: elapsed,
    base,
  }),
);
if (failed > 0) process.exit(1);
