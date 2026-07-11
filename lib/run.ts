// The one central object: a "Run". The featured (precomputed) run, saved runs
// from the box store, and live in-session runs all normalize to this shape, so
// every view — wall, evolution graph, lineage, piece detail — renders the same
// way regardless of where the run came from. Client-safe (type-only imports).

import type { GalleryData } from "@/engine/types";
import type { Genome } from "@/engine/types";
import type { LivePiece } from "@/engine/live";

export type RunGenome = {
  id: string;
  name: string;
  styleDirective: string;
  params?: { paletteSize: number; complexity: number; symmetry: number; strokeFill: number };
  lineage: { parents: string[]; generation: number; op: string; note?: string };
  model?: string;
  temperature?: number;
};

export type RunCritique = { lens: string; score: number; oneLine: string; model?: string };

export type RunPiece = {
  id: string;
  genomeId: string;
  artist: string;
  gen: number; // run-relative generation index (0-based)
  art: string; // ready-to-use <img src>: a committed file path (featured) or a data URL (live/saved)
  svg?: string; // raw SVG for live/saved pieces (used to re-render + to save); absent for featured
  op: string; // seed | survive | mutation | crossover
  fit: number; // blended total, 0–10
  critics: number; // mean critic score, 0–10
  novelty?: number;
  human?: number;
  critiques: RunCritique[];
  disqualified: boolean;
  reason?: string;
  guardChecks?: { name: string; ok: boolean; detail?: string }[];
};

export type Run = {
  id: string;
  name: string;
  source: "featured" | "saved" | "live";
  generations: { n: number; pieces: RunPiece[] }[];
  genomeById: Record<string, RunGenome>;
  builtAt?: string;
  totalCostUsd?: number;
};

// ---- rendering helpers ----
export function svgToUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ---- adapters ----

/** Featured precomputed run (public/data/gallery.json). Art = committed SVG files. */
export function adaptFeatured(g: GalleryData): Run {
  const genomeById: Record<string, RunGenome> = {};
  for (const gen of g.generations)
    for (const gm of gen.genomes) genomeById[gm.id] = { ...gm, lineage: { ...gm.lineage } };

  const generations = g.generations.map((gen) => ({
    n: gen.n,
    pieces: gen.pieces.map((p): RunPiece => {
      const f = gen.fitness[p.id];
      const genome = genomeById[p.genomeId];
      return {
        id: p.id,
        genomeId: p.genomeId,
        artist: p.artistName,
        gen: gen.n,
        art: p.svgPath || p.thumbPath,
        op: genome?.lineage.op ?? "seed",
        fit: Number((f?.total ?? 0).toFixed(2)),
        critics: Number((f?.critics ?? 0).toFixed(2)),
        novelty: f?.novelty,
        human: f?.human,
        critiques: (gen.critiques[p.id] ?? []).map((c) => ({ lens: c.lens, score: c.score, oneLine: c.oneLine, model: c.judgeModel })),
        disqualified: p.disqualified,
        reason: p.disqualified ? p.guard.reason : undefined,
        guardChecks: p.guard.checks,
      };
    }),
  }));

  return { id: "featured", name: g.title ?? "The Evolving Gallery", source: "featured", generations, genomeById, builtAt: g.builtAt, totalCostUsd: g.totalCostUsd };
}

type StoredRun = { id?: string; name?: string; generations?: { pieces: LivePiece[] }[]; genomes?: Genome[] };

/** Saved run (box store) or a live in-session run — both carry inline SVGs. */
export function adaptStored(data: StoredRun, source: "saved" | "live" = "saved"): Run {
  const genomeById: Record<string, RunGenome> = {};
  for (const gm of data.genomes ?? []) genomeById[gm.id] = { ...gm, lineage: { ...gm.lineage } };

  const generations = (data.generations ?? []).map((gen, gi) => ({
    n: gi,
    pieces: gen.pieces.map((p): RunPiece => ({
      id: p.id,
      genomeId: p.genomeId,
      artist: p.artist,
      gen: gi,
      art: p.svg ? svgToUrl(p.svg) : "",
      svg: p.svg,
      op: p.op,
      fit: Number((p.fit ?? 0).toFixed(2)),
      critics: Number((p.critics ?? 0).toFixed(2)),
      critiques: (p.critiques ?? []).map((c) => ({ lens: c.lens, score: c.score, oneLine: c.oneLine })),
      disqualified: !p.guardOk,
      reason: p.reason,
    })),
  }));

  return { id: data.id ?? "live", name: data.name ?? "Untitled run", source, generations, genomeById };
}

// Build a live Run from workbench state (generations + genome map).
export function liveRun(generations: { pieces: LivePiece[] }[], genomes: Genome[], name: string, id = "live"): Run {
  return adaptStored({ id, name, generations, genomes }, "live");
}

// Serialize a (live) run back to the box-store shape for saving.
export function serializeRun(run: Run): { name: string; generations: unknown[]; genomes: RunGenome[]; forkedFrom: string | null } {
  return {
    name: run.name,
    generations: run.generations.map((g) => ({
      pieces: g.pieces.map((p) => ({
        id: p.id,
        genomeId: p.genomeId,
        artist: p.artist,
        op: p.op,
        svg: p.svg,
        fit: p.fit,
        critics: p.critics,
        critiques: p.critiques,
        guardOk: !p.disqualified,
        reason: p.reason,
      })),
    })),
    genomes: Object.values(run.genomeById),
    forkedFrom: run.source === "live" ? null : run.id,
  };
}

// ---- builders (every view uses these) ----

export type FlowNode = {
  id: string;
  gen: number;
  indexInGen: number;
  colSize: number;
  artist: string;
  thumb: string;
  svg?: string;
  fit: number;
  op: string;
  disqualified: boolean;
  reason?: string;
  culled: boolean;
};
export type FlowEdge = { id: string; source: string; target: string; op: string };

export function runFlow(run: Run): { nodes: FlowNode[]; edges: FlowEdge[]; generations: number } {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const pieceByGenome = new Map<string, string>();

  run.generations.forEach((g, gi) => {
    const survivors = g.pieces.filter((p) => !p.disqualified).sort((a, b) => b.fit - a.fit);
    const rejects = g.pieces.filter((p) => p.disqualified);
    const ordered = [...survivors, ...rejects];
    ordered.forEach((p, i) => {
      nodes.push({
        id: p.id,
        gen: gi,
        indexInGen: i,
        colSize: ordered.length,
        artist: p.artist,
        thumb: p.art,
        fit: Number(p.fit.toFixed(1)),
        op: p.op,
        disqualified: p.disqualified,
        reason: p.reason,
        culled: false,
      });
      for (const parentId of run.genomeById[p.genomeId]?.lineage.parents ?? []) {
        const parentPiece = pieceByGenome.get(parentId);
        if (parentPiece) edges.push({ id: `${parentPiece}->${p.id}`, source: parentPiece, target: p.id, op: p.op });
      }
    });
    for (const p of survivors) pieceByGenome.set(p.genomeId, p.id);
  });

  const isParent = new Set(edges.map((e) => e.source));
  const last = run.generations.length - 1;
  for (const n of nodes) if (!n.disqualified && n.gen < last && !isParent.has(n.id)) n.culled = true;

  return { nodes, edges, generations: run.generations.length };
}

export function runPiece(run: Run, id: string): { piece: RunPiece; genome?: RunGenome } | undefined {
  for (const g of run.generations) {
    const piece = g.pieces.find((p) => p.id === id);
    if (piece) return { piece, genome: run.genomeById[piece.genomeId] };
  }
  return undefined;
}

export function runWall(run: Run): RunPiece[] {
  const last = run.generations[run.generations.length - 1];
  if (!last) return [];
  return last.pieces.filter((p) => !p.disqualified).sort((a, b) => b.fit - a.fit);
}

export function runRejected(run: Run): RunPiece[] {
  return run.generations.flatMap((g) => g.pieces.filter((p) => p.disqualified));
}

export function runHallOfFame(run: Run, top = 8): RunPiece[] {
  return run.generations
    .flatMap((g) => g.pieces.filter((p) => !p.disqualified))
    .sort((a, b) => b.fit - a.fit)
    .slice(0, top);
}

export function runFitnessSeries(run: Run): { gen: number; quality: number; mean: number; best: number; bestSoFar: number }[] {
  let running = 0;
  return run.generations.map((g, gi) => {
    const survivors = g.pieces.filter((p) => !p.disqualified);
    const mean = survivors.length ? survivors.reduce((s, p) => s + p.fit, 0) / survivors.length : 0;
    const quality = survivors.length ? survivors.reduce((s, p) => s + p.critics, 0) / survivors.length : 0;
    const best = survivors.reduce((m, p) => Math.max(m, p.fit), 0);
    running = Math.max(running, best);
    return { gen: gi, quality: Number(quality.toFixed(2)), mean: Number(mean.toFixed(2)), best: Number(best.toFixed(2)), bestSoFar: Number(running.toFixed(2)) };
  });
}

// ---- lineage ----
export type Ancestor = { genome: RunGenome; piece?: RunPiece; fitness?: number; parents: Ancestor[] };

export function runLineage(run: Run, pieceId: string): Ancestor | undefined {
  const pv = runPiece(run, pieceId);
  if (!pv?.genome) return undefined;
  const pieceForGenome = new Map<string, RunPiece>();
  for (const g of run.generations) for (const p of g.pieces) if (!p.disqualified) pieceForGenome.set(p.genomeId, p);
  const seen = new Set<string>();
  const build = (genome: RunGenome): Ancestor => {
    seen.add(genome.id);
    const piece = pieceForGenome.get(genome.id);
    return {
      genome,
      piece,
      fitness: piece?.fit,
      parents: genome.lineage.parents
        .map((pid) => run.genomeById[pid])
        .filter((g): g is RunGenome => !!g && !seen.has(g.id))
        .map(build),
    };
  };
  return build(pv.genome);
}
