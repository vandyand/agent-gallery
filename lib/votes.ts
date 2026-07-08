// Vote store. In-memory by default (fine for the demo — votes are display +
// live-evolve seed). Swappable for Vercel KV / Upstash by setting KV_REST_API_URL
// (P3), without touching callers.

const mem = new Map<string, number>();

export async function recordVote(pieceId: string, delta: number): Promise<number> {
  const next = Math.max(0, (mem.get(pieceId) ?? 0) + delta);
  mem.set(pieceId, next);
  return next;
}

export async function getVotes(): Promise<Record<string, number>> {
  return Object.fromEntries(mem);
}
