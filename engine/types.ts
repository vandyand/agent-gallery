// Shared domain model — the engine writes these, the app reads them.

export type GenomeParams = {
  paletteSize: number; // 2–8 distinct colors
  complexity: number; // 0–1 element-count budget bias
  symmetry: number; // 0–1 symmetry bias
  strokeFill: number; // 0–1 stroke-heavy(0) .. fill-heavy(1)
};

export type Lineage = {
  parents: string[]; // parent genome ids
  generation: number;
  op: "seed" | "survive" | "mutation" | "crossover";
  note?: string; // e.g. the critic feedback a mutation was steered by
};

export type Genome = {
  id: string;
  name: string; // fun artist name
  styleDirective: string; // the main heritable trait (NL aesthetic identity)
  params: GenomeParams;
  lineage: Lineage;
  model: string; // artist LLM
  temperature: number;
  // Transient: critic notes on the parent's piece, fed back so a refined artist
  // paints an improved version (the measure→improve loop, in-context).
  feedback?: { lens: string; score: number; oneLine: string }[];
};

export type GuardCheck = { name: string; ok: boolean; detail?: string };

export type GuardResult = {
  ok: boolean;
  checks: GuardCheck[];
  reason?: string; // first failure, human-readable — shown in the rejected drawer
  bytes: number;
  elements: number;
};

export type Piece = {
  id: string;
  genomeId: string;
  artistName: string;
  generation: number;
  svgPath: string; // /gallery/<id>.svg (sanitized source)
  thumbPath: string; // /gallery/<id>.png (rasterized)
  promptUsed: string;
  tokens: { prompt: number; completion: number };
  costUsd: number;
  ms: number;
  guard: GuardResult;
  disqualified: boolean; // true => lives in the rejected-sketches drawer
};

export type Critique = {
  lens: string; // "Composition & balance" ...
  judgeModel: string;
  score: number; // 0–10
  oneLine: string;
  costUsd: number;
};

export type Fitness = {
  pieceId: string;
  critics: number; // mean critic score, 0–10
  human: number; // normalized votes contribution, 0–10
  novelty: number; // novelty bonus, 0–10
  total: number; // weighted blend, 0–10
};

export type Generation = {
  n: number;
  createdAt: string;
  genomes: Genome[];
  pieces: Piece[];
  critiques: Record<string, Critique[]>; // pieceId -> critiques
  fitness: Record<string, Fitness>; // pieceId -> fitness (survivors only)
  costUsd: number;
  summary: {
    population: number;
    survived: number;
    rejected: number;
    meanFitness: number; // over survivors
    bestPieceId?: string;
    bestFitness?: number;
  };
};

export type GalleryData = {
  title: string;
  generations: Generation[];
  hallOfFame: string[]; // piece ids, best all-time
  fitnessWeights: { critics: number; human: number; novelty: number };
  totalCostUsd: number;
  builtAt: string;
};
