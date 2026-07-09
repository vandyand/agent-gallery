// Server-side loader for the committed gallery manifest. Read once, cached.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { GalleryData, Generation, Piece, Fitness, Critique, Genome } from "@/engine/types";

let cache: GalleryData | null = null;

export function gallery(): GalleryData {
  if (!cache) {
    const raw = readFileSync(join(process.cwd(), "public", "data", "gallery.json"), "utf8");
    cache = JSON.parse(raw) as GalleryData;
  }
  return cache;
}

export type PieceView = {
  piece: Piece;
  gen: Generation;
  fitness?: Fitness;
  critiques: Critique[];
  genome?: Genome;
};

export function latestGeneration(): Generation {
  const g = gallery().generations;
  return g[g.length - 1];
}

export function generation(n: number): Generation | undefined {
  return gallery().generations.find((g) => g.n === n);
}

function genomeOf(gen: Generation, id: string): Genome | undefined {
  return gen.genomes.find((x) => x.id === id);
}

// Survivors of the latest generation, ranked by fitness (the current wall).
export function currentWall(): PieceView[] {
  const gen = latestGeneration();
  return gen.pieces
    .filter((p) => !p.disqualified)
    .map((piece) => ({
      piece,
      gen,
      fitness: gen.fitness[piece.id],
      critiques: gen.critiques[piece.id] ?? [],
      genome: genomeOf(gen, piece.genomeId),
    }))
    .sort((a, b) => (b.fitness?.total ?? 0) - (a.fitness?.total ?? 0));
}

export function pieceView(id: string): PieceView | undefined {
  for (const gen of gallery().generations) {
    const piece = gen.pieces.find((p) => p.id === id);
    if (piece)
      return {
        piece,
        gen,
        fitness: gen.fitness[piece.id],
        critiques: gen.critiques[piece.id] ?? [],
        genome: genomeOf(gen, piece.genomeId),
      };
  }
  return undefined;
}

export function allPieceIds(): string[] {
  return gallery().generations.flatMap((g) => g.pieces.map((p) => p.id));
}

// Every rejected sketch across all generations (the drawer).
export function rejected(): { piece: Piece; gen: number }[] {
  return gallery().generations.flatMap((g) =>
    g.pieces.filter((p) => p.disqualified).map((piece) => ({ piece, gen: g.n })),
  );
}

export function hallOfFame(): PieceView[] {
  return gallery()
    .hallOfFame.map((id) => pieceView(id))
    .filter((x): x is PieceView => !!x);
}

// ---- lineage ----

let genomeIdx: Map<string, Genome> | null = null;
export function genomeById(id: string): Genome | undefined {
  if (!genomeIdx) {
    genomeIdx = new Map();
    for (const g of gallery().generations) for (const gm of g.genomes) genomeIdx.set(gm.id, gm);
  }
  return genomeIdx.get(id);
}

let pieceByGenomeIdx: Map<string, Piece> | null = null;
export function pieceForGenome(genomeId: string): Piece | undefined {
  if (!pieceByGenomeIdx) {
    pieceByGenomeIdx = new Map();
    for (const g of gallery().generations) for (const p of g.pieces) if (!p.disqualified) pieceByGenomeIdx.set(p.genomeId, p);
  }
  return pieceByGenomeIdx.get(genomeId);
}

export type Ancestor = {
  genome: Genome;
  piece?: Piece;
  fitness?: number;
  parents: Ancestor[];
};

// Ancestry tree for a piece — recursively resolves parent genomes back to seeds.
export function ancestryOfPiece(pieceId: string): Ancestor | undefined {
  const pv = pieceView(pieceId);
  if (!pv?.genome) return undefined;
  const seen = new Set<string>();
  const build = (genome: Genome): Ancestor => {
    seen.add(genome.id);
    const piece = pieceForGenome(genome.id);
    const gen = piece ? gallery().generations.find((g) => g.n === piece.generation) : undefined;
    return {
      genome,
      piece,
      fitness: piece && gen ? gen.fitness[piece.id]?.total : undefined,
      parents: genome.lineage.parents
        .map((pid) => genomeById(pid))
        .filter((g): g is Genome => !!g && !seen.has(g.id))
        .map(build),
    };
  };
  return build(pv.genome);
}

// The final generation's surviving genomes, ranked by fitness — the starting
// population the live-evolve button continues from.
export function finalPopulationGenomes(): Genome[] {
  const gen = latestGeneration();
  return gen.pieces
    .filter((p) => !p.disqualified)
    .sort((a, b) => (gen.fitness[b.id]?.total ?? 0) - (gen.fitness[a.id]?.total ?? 0))
    .map((p) => gen.genomes.find((g) => g.id === p.genomeId))
    .filter((g): g is Genome => !!g);
}

// ---- generational flow graph (the whole algorithm, one view) ----

export type FlowNode = {
  id: string; // pieceId
  gen: number;
  indexInGen: number; // rank within its generation column (0 = fittest)
  colSize: number; // how many nodes in this generation column
  artist: string;
  thumb: string; // committed thumbnail path (featured run) …
  svg?: string; // … or inline SVG (live workbench run)
  fit: number;
  op: string; // seed | survive | mutation | crossover
  disqualified: boolean;
  reason?: string;
  culled: boolean; // survived guard but produced no offspring (a dead end)
};

export type FlowEdge = { id: string; source: string; target: string; op: string };

export function flowData(): { generations: number; nodes: FlowNode[]; edges: FlowEdge[] } {
  const gens = gallery().generations;

  // genomeId -> its (survivor) pieceId, to resolve parent links
  const genomeToPiece = new Map<string, string>();
  for (const g of gens) for (const p of g.pieces) if (!p.disqualified) genomeToPiece.set(p.genomeId, p.id);

  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const isParent = new Set<string>();

  for (const g of gens) {
    const survivors = g.pieces
      .filter((p) => !p.disqualified)
      .sort((a, b) => (g.fitness[b.id]?.total ?? 0) - (g.fitness[a.id]?.total ?? 0));
    const rejects = g.pieces.filter((p) => p.disqualified);
    const ordered = [...survivors, ...rejects];
    const colSize = ordered.length;

    ordered.forEach((p, i) => {
      const genome = g.genomes.find((gm) => gm.id === p.genomeId);
      const op = genome?.lineage.op ?? "seed";
      nodes.push({
        id: p.id,
        gen: g.n,
        indexInGen: i,
        colSize,
        artist: p.artistName,
        thumb: p.thumbPath,
        fit: Number((g.fitness[p.id]?.total ?? 0).toFixed(1)),
        op,
        disqualified: p.disqualified,
        reason: p.disqualified ? p.guard.reason : undefined,
        culled: false,
      });
      // edges from each parent's piece to this one
      for (const parentGenomeId of genome?.lineage.parents ?? []) {
        const parentPieceId = genomeToPiece.get(parentGenomeId);
        if (parentPieceId) {
          edges.push({ id: `${parentPieceId}->${p.id}`, source: parentPieceId, target: p.id, op });
          isParent.add(parentPieceId);
        }
      }
    });
  }

  // a survivor before the final generation that never became a parent = culled
  const lastGen = gens[gens.length - 1]?.n ?? 0;
  for (const n of nodes) {
    if (!n.disqualified && n.gen < lastGen && !isParent.has(n.id)) n.culled = true;
  }

  return { generations: gens.length, nodes, edges };
}

// Optional model A/B artifact (Haiku vs Sonnet cost↔quality).
export type ModelAB = {
  rows: { model: string; label: string; artist: string; quality: number; costUsd: number; ms: number; ok: boolean }[];
  byModel: { label: string; model: string; avgQuality: number; avgCostUsd: number; avgMs: number; n: number }[];
  builtAt: string;
};

export function modelAB(): ModelAB | null {
  try {
    const raw = readFileSync(join(process.cwd(), "public", "data", "model-ab.json"), "utf8");
    return JSON.parse(raw) as ModelAB;
  } catch {
    return null;
  }
}

// Slim per-generation frames for the client-side "Evolve" replay theatre.
export type EvolveFrame = {
  n: number;
  mean: number;
  best: number;
  survived: number;
  rejected: number;
  cost: number;
  pieces: { id: string; name: string; thumb: string; fit: number; op: string }[];
};

export function evolveFrames(): EvolveFrame[] {
  return gallery().generations.map((g) => ({
    n: g.n,
    mean: Number(g.summary.meanFitness.toFixed(2)),
    best: Number((g.summary.bestFitness ?? 0).toFixed(2)),
    survived: g.summary.survived,
    rejected: g.summary.rejected,
    cost: Number(g.costUsd.toFixed(4)),
    pieces: g.pieces
      .filter((p) => !p.disqualified)
      .map((p) => ({
        id: p.id,
        name: p.artistName,
        thumb: p.thumbPath,
        fit: Number((g.fitness[p.id]?.total ?? 0).toFixed(1)),
        op: g.genomes.find((gm) => gm.id === p.genomeId)?.lineage.op ?? "seed",
      }))
      .sort((a, b) => b.fit - a.fit),
  }));
}

// Fitness-over-generations series for the climbing curve. `bestSoFar` is the
// cumulative max — monotonic by construction (elites carry forward), the clean
// climbing line; `mean` is the noisier population trend.
export function fitnessSeries(): {
  gen: number;
  quality: number;
  mean: number;
  best: number;
  bestSoFar: number;
  cost: number;
}[] {
  let running = 0;
  return gallery().generations.map((g) => {
    const best = Number((g.summary.bestFitness ?? 0).toFixed(2));
    running = Math.max(running, best);
    const survivors = g.pieces.filter((p) => !p.disqualified);
    const quality =
      survivors.reduce((s, p) => s + (g.fitness[p.id]?.critics ?? 0), 0) / (survivors.length || 1);
    return {
      gen: g.n,
      quality: Number(quality.toFixed(2)),
      mean: Number(g.summary.meanFitness.toFixed(2)),
      best,
      bestSoFar: Number(running.toFixed(2)),
      cost: Number(g.costUsd.toFixed(4)),
    };
  });
}
