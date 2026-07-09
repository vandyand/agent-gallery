// Client-side: turn accumulated live generations + a genome map into a growing
// flow-graph (nodes + edges), and mint client-side seed genomes for the
// workbench. Type-only engine imports — no server code bundled.
import type { Genome } from "@/engine/types";
import type { LivePiece } from "@/engine/live";
import type { FlowNode } from "@/lib/data";

export type LiveGen = { pieces: LivePiece[] };

export function clientId(prefix = "g"): string {
  return prefix + Math.random().toString(36).slice(2, 10);
}

export function clientSeed(name: string, styleDirective: string): Genome {
  return {
    id: clientId(),
    name: (name || "Artist").slice(0, 24),
    styleDirective: styleDirective.slice(0, 400),
    params: { paletteSize: 5, complexity: 0.5, symmetry: 0.5, strokeFill: 0.7 },
    lineage: { parents: [], generation: 0, op: "seed" },
    model: "anthropic/claude-haiku-4.5",
    temperature: 0.95,
  };
}

export type LiveFlow = { nodes: FlowNode[]; edges: { id: string; source: string; target: string; op: string }[]; generations: number };

export function buildLiveFlow(generations: LiveGen[], genomeById: Map<string, Genome>): LiveFlow {
  const nodes: FlowNode[] = [];
  const edges: { id: string; source: string; target: string; op: string }[] = [];
  const pieceByGenome = new Map<string, string>(); // survivors of prior gens

  generations.forEach((g, gi) => {
    const survivors = g.pieces.filter((p) => p.guardOk).sort((a, b) => b.fit - a.fit);
    const rejects = g.pieces.filter((p) => !p.guardOk);
    const ordered = [...survivors, ...rejects];
    ordered.forEach((p, i) => {
      nodes.push({
        id: p.id,
        gen: gi,
        indexInGen: i,
        colSize: ordered.length,
        artist: p.artist,
        thumb: "",
        svg: p.svg,
        fit: p.fit,
        op: p.op,
        disqualified: !p.guardOk,
        reason: p.reason,
        culled: false,
      });
      const genome = genomeById.get(p.genomeId);
      for (const parentId of genome?.lineage.parents ?? []) {
        const parentPiece = pieceByGenome.get(parentId);
        if (parentPiece) edges.push({ id: `${parentPiece}->${p.id}`, source: parentPiece, target: p.id, op: p.op });
      }
    });
    for (const p of survivors) pieceByGenome.set(p.genomeId, p.id);
  });

  const isParent = new Set(edges.map((e) => e.source));
  const last = generations.length - 1;
  for (const n of nodes) if (!n.disqualified && n.gen < last && !isParent.has(n.id)) n.culled = true;

  return { nodes, edges, generations: generations.length };
}
