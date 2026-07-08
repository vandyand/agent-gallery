// One generation: every artist paints, the guard gauntlet splits survivors from
// rejected sketches, the critic panel judges survivors, novelty + fitness rank
// them. Assets are written; a Generation manifest is returned.

import { paint } from "./artist";
import { guard } from "./guard";
import { judgePanel } from "./judge";
import { featureVector, noveltyScore } from "./novelty";
import { computeFitness, DEFAULT_WEIGHTS } from "./fitness";
import { savePieceAssets } from "./io";
import { pool, shortId } from "./util";
import type { Genome, Piece, Generation, Fitness } from "./types";

export type GenFeature = { pieceId: string; genomeId: string; vec: number[] };

export type RunGenOpts = {
  genomes: Genome[];
  n: number;
  priorFeatures: number[][]; // hall-of-fame feature vectors for novelty
  votes?: Record<string, number>; // pieceId -> vote count (from prior gens' pieces; new pieces start at 0)
  weights?: typeof DEFAULT_WEIGHTS;
  concurrency?: number;
  log?: (msg: string) => void;
};

export async function runGeneration(
  opts: RunGenOpts,
): Promise<{ gen: Generation; features: GenFeature[] }> {
  const { genomes, n, priorFeatures, weights = DEFAULT_WEIGHTS } = opts;
  const log = opts.log ?? (() => {});
  const concurrency = opts.concurrency ?? 4;

  // 1. paint + 2. guard
  log(`gen ${n}: ${genomes.length} artists painting…`);
  const painted = await pool(genomes, concurrency, async (g) => {
    const id = shortId("pc");
    try {
      const { svg, result, promptUsed } = await paint(g);
      const out = guard(svg);
      return { g, id, svg, out, result, promptUsed };
    } catch (e) {
      return { g, id, svg: null, out: guard(null), result: null, promptUsed: "", error: String(e) };
    }
  });

  const pieces: Piece[] = [];
  const survivors: { id: string; png: Buffer }[] = [];
  const features: GenFeature[] = [];
  let costUsd = 0;

  for (const p of painted) {
    costUsd += p.result?.costUsd ?? 0;
    const base: Piece = {
      id: p.id,
      genomeId: p.g.id,
      artistName: p.g.name,
      generation: n,
      svgPath: "",
      thumbPath: "",
      promptUsed: p.promptUsed,
      tokens: { prompt: p.result?.usage.prompt ?? 0, completion: p.result?.usage.completion ?? 0 },
      costUsd: p.result?.costUsd ?? 0,
      ms: p.result?.ms ?? 0,
      guard: p.out.guard,
      disqualified: !p.out.guard.ok,
    };
    if (p.out.guard.ok && p.out.sanitizedSvg && p.out.png) {
      savePieceAssets(p.id, p.out.sanitizedSvg, p.out.png);
      base.svgPath = `/gallery/${p.id}.svg`;
      base.thumbPath = `/gallery/${p.id}.png`;
      survivors.push({ id: p.id, png: p.out.png });
      features.push({ pieceId: p.id, genomeId: p.g.id, vec: featureVector(p.out.sanitizedSvg) });
    }
    pieces.push(base);
  }
  log(`  guard: ${survivors.length} passed, ${pieces.length - survivors.length} rejected`);

  // 3. judge survivors (vision panel)
  log(`  judging ${survivors.length} survivors across ${4} critics…`);
  const critiques = await judgePanel(survivors.map((s) => ({ pieceId: s.id, png: s.png })));
  for (const list of Object.values(critiques)) for (const c of list) costUsd += c.costUsd;

  // 4. novelty + 5. fitness
  const votes = opts.votes ?? {};
  const maxVotes = Math.max(1, ...Object.values(votes));
  const fitness: Record<string, Fitness> = {};
  // Novelty = how much a piece stands out from its CONTEMPORARIES on the wall
  // (intra-generation only). Measuring against the growing hall-of-fame would
  // make novelty decay every generation and mask real quality gains — this keeps
  // it a stable anti-collapse pressure. (priorFeatures kept for future use.)
  void priorFeatures;
  const peerVecs = features.map((x) => x.vec);
  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    const others = peerVecs.filter((_, j) => j !== i);
    const novelty = noveltyScore(f.vec, others);
    fitness[f.pieceId] = computeFitness(
      f.pieceId,
      critiques[f.pieceId] ?? [],
      votes[f.pieceId] ?? 0,
      maxVotes,
      novelty,
      weights,
    );
  }

  // summary
  const totals = Object.values(fitness).map((x) => x.total);
  const meanFitness = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
  let bestPieceId: string | undefined;
  let bestFitness = -1;
  for (const [pid, f] of Object.entries(fitness)) {
    if (f.total > bestFitness) {
      bestFitness = f.total;
      bestPieceId = pid;
    }
  }

  const gen: Generation = {
    n,
    createdAt: new Date().toISOString(),
    genomes,
    pieces,
    critiques,
    fitness,
    costUsd,
    summary: {
      population: genomes.length,
      survived: survivors.length,
      rejected: pieces.length - survivors.length,
      meanFitness,
      bestPieceId,
      bestFitness: bestFitness >= 0 ? bestFitness : undefined,
    },
  };
  log(`  gen ${n} done · mean fitness ${meanFitness.toFixed(2)} · $${costUsd.toFixed(4)}`);
  return { gen, features };
}
