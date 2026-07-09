// Best-effort guards for the public live-evolve endpoint. In-memory (per
// serverless instance), so not a hard cross-instance cap — the true ceiling is
// the OpenRouter key's own monthly spend limit. These stop casual abuse:
//   - fixed small population per run  => bounded cost per request (~$0.03–0.05)
//   - per-IP token bucket             => no single client can hammer it
//   - in-memory daily $ counter       => soft global brake
export const LIVE_POP = 5; // artists per live generation (bounded cost)

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 6;
const ipHits = new Map<string, number[]>();

export function allowIp(ip: string): { ok: boolean; retryMs?: number } {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    return { ok: false, retryMs: WINDOW_MS - (now - hits[0]) };
  }
  hits.push(now);
  ipHits.set(ip, hits);
  return { ok: true };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DAILY_USD = Number(process.env.GALLERY_LIVE_DAILY_USD ?? "3");
let dayStart = Date.now();
let daySpend = 0;

function rollDay() {
  if (Date.now() - dayStart > DAY_MS) {
    dayStart = Date.now();
    daySpend = 0;
  }
}

export function overBudget(): boolean {
  rollDay();
  return daySpend >= DAILY_USD;
}

export function addSpend(usd: number) {
  rollDay();
  daySpend += usd;
}

export function budgetStatus() {
  rollDay();
  return { spent: Number(daySpend.toFixed(4)), cap: DAILY_USD, left: Number(Math.max(0, DAILY_USD - daySpend).toFixed(4)) };
}
