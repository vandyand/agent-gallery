// Server-only client for the box run-store. The bearer token never leaves the
// server; the app proxies reads/writes so the browser only talks to /api/runs.

const BASE = process.env.GALLERY_API_URL;
const TOKEN = process.env.GALLERY_STORE_TOKEN;

export type RunSummary = { id: string; name: string; createdAt: string; gens: number; forkedFrom: string | null };

export async function listRuns(): Promise<RunSummary[]> {
  if (!BASE) return [];
  try {
    const r = await fetch(`${BASE}/runs`, { cache: "no-store" });
    if (!r.ok) return [];
    return (await r.json()).runs ?? [];
  } catch {
    return [];
  }
}

export async function getRun(id: string): Promise<unknown | null> {
  if (!BASE) return null;
  try {
    const r = await fetch(`${BASE}/runs/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export async function saveRun(run: unknown): Promise<{ id?: string; error?: string }> {
  if (!BASE || !TOKEN) return { error: "store not configured" };
  try {
    const r = await fetch(`${BASE}/runs`, {
      method: "POST",
      headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify(run),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { error: j.error || `store ${r.status}` };
    return { id: j.id };
  } catch (e) {
    return { error: String(e) };
  }
}
