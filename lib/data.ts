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

// Fitness-over-generations series for the climbing curve.
export function fitnessSeries(): { gen: number; mean: number; best: number; cost: number }[] {
  return gallery().generations.map((g) => ({
    gen: g.n,
    mean: Number(g.summary.meanFitness.toFixed(2)),
    best: Number((g.summary.bestFitness ?? 0).toFixed(2)),
    cost: Number(g.costUsd.toFixed(4)),
  }));
}
