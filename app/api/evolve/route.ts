import { runLiveGeneration } from "@/engine/live";
import { makeSeed } from "@/engine/seeds";
import { MODELS } from "@/engine/models";
import { allowIp, overBudget, addSpend, budgetStatus, LIVE_POP } from "@/lib/ratelimit";
import type { Genome } from "@/engine/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Coerce an untrusted client genome down to the fields we use.
function sanitizeGenome(g: unknown): Genome | null {
  if (!g || typeof g !== "object") return null;
  const o = g as Record<string, unknown>;
  const style = String(o.styleDirective ?? "").slice(0, 400);
  if (style.length < 8) return null;
  const p = (o.params ?? {}) as Record<string, number>;
  const lin = (o.lineage ?? {}) as Record<string, unknown>;
  const clamp01 = (x: unknown, d: number) => {
    const n = Number(x);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : d;
  };
  return {
    id: String(o.id ?? "").slice(0, 40) || `g${Math.random().toString(36).slice(2)}`,
    name: String(o.name ?? "Artist").slice(0, 24),
    styleDirective: style,
    params: {
      paletteSize: Math.max(2, Math.min(8, Math.round(Number(p.paletteSize) || 5))),
      complexity: clamp01(p.complexity, 0.5),
      symmetry: clamp01(p.symmetry, 0.5),
      strokeFill: clamp01(p.strokeFill, 0.7),
    },
    lineage: {
      parents: Array.isArray(lin.parents) ? (lin.parents as unknown[]).map(String).slice(0, 2) : [],
      generation: Math.max(0, Math.min(999, Math.round(Number(lin.generation) || 0))),
      op: (["seed", "survive", "mutation", "crossover"].includes(String(lin.op)) ? String(lin.op) : "seed") as Genome["lineage"]["op"],
    },
    model: MODELS.artist, // force cheap tier server-side (cost control)
    temperature: 0.95,
  };
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";

  const gate = allowIp(ip);
  if (!gate.ok) {
    return Response.json(
      { error: "rate_limited", retryMs: gate.retryMs, message: "Too many live runs from your network — try again in a few minutes, or watch the replay." },
      { status: 429 },
    );
  }
  if (overBudget()) {
    return Response.json(
      { error: "daily_cap", message: "The live-evolve daily budget is spent. The precomputed run still shows the whole process.", budget: budgetStatus() },
      { status: 503 },
    );
  }

  let body: { genomes?: unknown[]; directives?: { name?: string; styleDirective?: string; params?: Partial<Genome["params"]> }[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }

  let pop: Genome[] = [];
  if (Array.isArray(body.directives) && body.directives.length) {
    pop = body.directives
      .slice(0, LIVE_POP)
      .map((d) => makeSeed(String(d.name ?? "Artist"), String(d.styleDirective ?? ""), d.params))
      .filter((g) => g.styleDirective.length >= 8);
  } else if (Array.isArray(body.genomes) && body.genomes.length) {
    pop = body.genomes.slice(0, LIVE_POP).map(sanitizeGenome).filter((g): g is Genome => !!g);
  }

  if (pop.length < 2) {
    return Response.json({ error: "need_population", message: "Provide at least 2 artists (or style directives)." }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
        } catch {
          /* client gone */
        }
      };
      try {
        const res = await runLiveGeneration(pop, (e) => send(e));
        addSpend(res.costUsd);
      } catch (e) {
        send({ type: "error", message: String(e).slice(0, 200) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
