import { listRuns, saveRun } from "@/lib/store";
import { allowIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

// GET /api/runs — the public run library (summaries).
export async function GET() {
  return Response.json({ runs: await listRuns() });
}

// POST /api/runs — save a run to the box store (token injected server-side).
export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (!allowIp(ip).ok) {
    return Response.json({ error: "rate_limited", message: "Give it a minute between saves." }, { status: 429 });
  }
  let body: { name?: string; generations?: unknown[]; population?: unknown[]; genomes?: unknown[]; forkedFrom?: string | null };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  if (!Array.isArray(body.generations) || body.generations.length === 0) {
    return Response.json({ error: "empty", message: "Nothing to save yet — evolve at least one generation." }, { status: 400 });
  }
  const res = await saveRun({
    name: String(body.name ?? "Untitled run").slice(0, 80),
    generations: body.generations,
    population: Array.isArray(body.population) ? body.population : [],
    genomes: Array.isArray(body.genomes) ? body.genomes : [],
    forkedFrom: body.forkedFrom ?? null,
  });
  if (res.error) return Response.json({ error: res.error }, { status: 502 });
  return Response.json({ id: res.id });
}
