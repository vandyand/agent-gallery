// Serverless-safe live generation. Runs a real bounded generation inside an API
// route: paint → guard-core (pure JS) → text-judge → novelty → fitness → breed
// the next population. Emits progress events for SSE streaming. Returns the
// pieces (SVG inline, rendered client-side) plus the bred next genomes so the
// client can chain another generation.

import { paint } from "./artist";
import { guardCore } from "./guard-core";
import { judgePanelText } from "./judge";
import { featureVector, noveltyScore } from "./novelty";
import { computeFitness, DEFAULT_WEIGHTS } from "./fitness";
import { breed } from "./evolve";
import { pool, shortId } from "./util";
import type { Genome, Critique } from "./types";

export type LivePiece = {
  id: string;
  genomeId: string;
  artist: string;
  op: string;
  svg?: string; // sanitized-enough SVG, rendered in the browser
  fit: number;
  critics: number;
  critiques: { lens: string; score: number; oneLine: string }[];
  guardOk: boolean;
  reason?: string;
};

export type LiveEvent =
  | { type: "start"; gen: number; count: number }
  | { type: "painted"; artist: string; ok: boolean; reason?: string }
  | { type: "judging"; count: number }
  | { type: "done"; gen: number; pieces: LivePiece[]; nextGenomes: Genome[]; costUsd: number };

export type LiveResult = { gen: number; pieces: LivePiece[]; nextGenomes: Genome[]; costUsd: number };

export async function runLiveGeneration(
  genomes: Genome[],
  onEvent?: (e: LiveEvent) => void | Promise<void>,
): Promise<LiveResult> {
  const gen = Math.max(0, ...genomes.map((g) => g.lineage.generation));
  const emit = async (e: LiveEvent) => {
    if (onEvent) await onEvent(e);
  };
  await emit({ type: "start", gen, count: genomes.length });

  let costUsd = 0;

  // 1. paint + 2. guard (pure JS)
  const painted = await pool(genomes, 4, async (g) => {
    const id = shortId("lv");
    try {
      const { svg, result } = await paint(g);
      const core = guardCore(svg);
      costUsd += result.costUsd;
      await emit({ type: "painted", artist: g.name, ok: core.guard.ok, reason: core.guard.reason });
      return { g, id, core, ok: core.guard.ok };
    } catch (e) {
      await emit({ type: "painted", artist: g.name, ok: false, reason: "generation error" });
      return { g, id, core: guardCore(null), ok: false, err: String(e) };
    }
  });

  const survivors = painted.filter((p) => p.ok && p.core.svg);

  // 3. text-judge survivors
  await emit({ type: "judging", count: survivors.length });
  const critiques = await judgePanelText(survivors.map((s) => ({ pieceId: s.id, svg: s.core.svg! })));
  for (const list of Object.values(critiques)) for (const c of list) costUsd += c.costUsd;

  // 4. novelty (intra-generation) + 5. fitness
  const vecs = survivors.map((s) => featureVector(s.core.svg!));
  const pieces: LivePiece[] = painted.map((p) => {
    const genome = p.g;
    if (!p.ok || !p.core.svg) {
      return {
        id: p.id,
        genomeId: genome.id,
        artist: genome.name,
        op: genome.lineage.op,
        fit: 0,
        critics: 0,
        critiques: [],
        guardOk: false,
        reason: p.core.guard.reason,
      };
    }
    const idx = survivors.indexOf(p);
    const others = vecs.filter((_, j) => j !== idx);
    const novelty = noveltyScore(vecs[idx], others);
    const crit = critiques[p.id] ?? [];
    const f = computeFitness(p.id, crit, 0, 1, novelty, DEFAULT_WEIGHTS);
    return {
      id: p.id,
      genomeId: genome.id,
      artist: genome.name,
      op: genome.lineage.op,
      svg: p.core.svg,
      fit: Number(f.total.toFixed(1)),
      critics: Number(f.critics.toFixed(1)),
      critiques: crit.map((c: Critique) => ({ lens: c.lens, score: c.score, oneLine: c.oneLine })),
      guardOk: true,
    };
  });

  // build a minimal Generation for the breeder
  const prevLike = {
    n: gen,
    pieces: pieces.map((p) => ({ id: p.id, genomeId: p.genomeId, disqualified: !p.guardOk })),
    genomes,
    critiques: Object.fromEntries(
      pieces.filter((p) => p.guardOk).map((p) => [p.id, critiques[p.id] ?? []]),
    ),
    fitness: Object.fromEntries(pieces.map((p) => [p.id, { total: p.fit }])),
    // fields breed() doesn't read
  } as unknown as Parameters<typeof breed>[0];

  const bred = await breed(prevLike, gen + 1, genomes.length);
  costUsd += bred.costUsd;

  const result: LiveResult = { gen, pieces, nextGenomes: bred.genomes, costUsd };
  await emit({ type: "done", ...result });
  return result;
}
