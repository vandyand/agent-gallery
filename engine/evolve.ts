// The optimization loop — the half a pure eval harness never has. Selection +
// mutation + crossover on style genomes, steered by the critic panel's own
// feedback (the eval feeds the optimizer). Human votes fold in via fitness.

import { chat } from "./llm";
import { MODELS } from "./models";
import { genomeId } from "./seeds";
import { parseJsonLoose, clamp } from "./util";
import type { Genome, Generation, GenomeParams, Critique } from "./types";

function perturb(p: GenomeParams, amt: number): GenomeParams {
  const j = (x: number) => clamp(x + (Math.random() * 2 - 1) * amt, 0, 1);
  return {
    paletteSize: clamp(Math.round(p.paletteSize + (Math.random() < 0.4 ? (Math.random() < 0.5 ? -1 : 1) : 0)), 2, 8),
    complexity: j(p.complexity),
    symmetry: j(p.symmetry),
    strokeFill: j(p.strokeFill),
  };
}

function blend(a: GenomeParams, b: GenomeParams): GenomeParams {
  const mix = (x: number, y: number) => clamp((x + y) / 2 + (Math.random() * 2 - 1) * 0.08, 0, 1);
  return {
    paletteSize: clamp(Math.round((a.paletteSize + b.paletteSize) / 2), 2, 8),
    complexity: mix(a.complexity, b.complexity),
    symmetry: mix(a.symmetry, b.symmetry),
    strokeFill: mix(a.strokeFill, b.strokeFill),
  };
}

function weakestCritique(critiques: Critique[]): Critique | undefined {
  if (!critiques.length) return undefined;
  return [...critiques].sort((x, y) => x.score - y.score)[0];
}

// Mutation, steered by the lens the critics scored lowest — the eval loop
// directly drives the optimizer. Returns the child genome + LLM cost.
export async function mutate(
  parent: Genome,
  parentCritiques: Critique[],
  gen: number,
): Promise<{ genome: Genome; costUsd: number }> {
  const weak = weakestCritique(parentCritiques);
  const steer = weak
    ? `Critics scored it lowest on "${weak.lens}" (${weak.score}/10): "${weak.oneLine}" Evolve the style to address that weakness while keeping its core identity.`
    : `Nudge the style in a fresh direction while keeping its core identity.`;

  const r = await chat({
    model: MODELS.mutate,
    system: `You evolve an artist's style genome. Keep the artist recognizable but push it forward.`,
    user: [
      `Current style: "${parent.styleDirective}"`,
      ``,
      steer,
      ``,
      `Return ONLY JSON: {"name": "<a short evocative artist name, 1 word>", "styleDirective": "<one vivid sentence, describes an aesthetic; no artist names>"}`,
    ].join("\n"),
    maxTokens: 220,
    temperature: 1.0,
  });
  const parsed = parseJsonLoose<{ name: string; styleDirective: string }>(r.text);
  return {
    costUsd: r.costUsd,
    genome: {
      id: genomeId(),
      name: parsed?.name?.slice(0, 24) || parent.name + "′",
      styleDirective: parsed?.styleDirective?.slice(0, 400) || parent.styleDirective,
      params: perturb(parent.params, 0.18),
      lineage: { parents: [parent.id], generation: gen, op: "mutation", note: weak ? `steered by "${weak.lens}"` : undefined },
      model: parent.model,
      temperature: parent.temperature,
      feedback: parentCritiques.map((c) => ({ lens: c.lens, score: c.score, oneLine: c.oneLine })),
    },
  };
}

// Crossover — merge two strong parents into a coherent new identity.
export async function crossover(a: Genome, b: Genome, gen: number): Promise<{ genome: Genome; costUsd: number }> {
  const r = await chat({
    model: MODELS.mutate,
    system: `You cross-breed two artists' style genomes into one coherent new identity that inherits from both.`,
    user: [
      `Parent A: "${a.styleDirective}"`,
      `Parent B: "${b.styleDirective}"`,
      ``,
      `Merge them into one new style that clearly inherits from both but is its own thing.`,
      `Return ONLY JSON: {"name": "<a short evocative artist name, 1 word>", "styleDirective": "<one vivid sentence; no artist names>"}`,
    ].join("\n"),
    maxTokens: 220,
    temperature: 1.0,
  });
  const parsed = parseJsonLoose<{ name: string; styleDirective: string }>(r.text);
  return {
    costUsd: r.costUsd,
    genome: {
      id: genomeId(),
      name: parsed?.name?.slice(0, 24) || `${a.name}×${b.name}`,
      styleDirective: parsed?.styleDirective?.slice(0, 400) || `${a.styleDirective}, merged with ${b.styleDirective}`,
      params: blend(a.params, b.params),
      lineage: { parents: [a.id, b.id], generation: gen, op: "crossover" },
      model: a.model,
      temperature: (a.temperature + b.temperature) / 2,
    },
  };
}

// Rank the previous generation's survivors by fitness and build the next
// population: elites carried, plus critic-steered mutations and crossovers.
export async function breed(
  prev: Generation,
  gen: number,
  targetSize: number,
): Promise<{ genomes: Genome[]; costUsd: number }> {
  // survivor genomes ranked by their piece's fitness
  const ranked = prev.pieces
    .filter((p) => !p.disqualified)
    .map((p) => ({
      genome: prev.genomes.find((g) => g.id === p.genomeId)!,
      critiques: prev.critiques[p.id] ?? [],
      fitness: prev.fitness[p.id]?.total ?? 0,
    }))
    .filter((x) => x.genome)
    .sort((a, b) => b.fitness - a.fitness);

  if (ranked.length === 0) return { genomes: [], costUsd: 0 };

  const genomes: Genome[] = [];
  let costUsd = 0;

  // 1. elites: top survivors carry unchanged — the quality floor ratchets up
  const eliteCount = Math.min(3, ranked.length);
  for (let i = 0; i < eliteCount; i++) {
    const e = ranked[i].genome;
    genomes.push({
      ...e,
      id: genomeId(),
      lineage: { parents: [e.id], generation: gen, op: "survive" },
      // an elite repaints with the critics' notes on its last piece → it refines
      feedback: ranked[i].critiques.map((c) => ({ lens: c.lens, score: c.score, oneLine: c.oneLine })),
    });
  }

  // 2. mutations of the top survivors (critic-steered)
  const mutCount = Math.min(3, ranked.length);
  for (let i = 0; i < mutCount && genomes.length < targetSize; i++) {
    const m = await mutate(ranked[i].genome, ranked[i].critiques, gen);
    costUsd += m.costUsd;
    genomes.push(m.genome);
  }

  // 3. crossovers among the top survivors, until the population is full
  let guard = 0;
  while (genomes.length < targetSize && ranked.length >= 2 && guard++ < 20) {
    const i = Math.floor(Math.random() * Math.min(4, ranked.length));
    let k = Math.floor(Math.random() * Math.min(4, ranked.length));
    if (k === i) k = (k + 1) % Math.min(4, ranked.length);
    const c = await crossover(ranked[i].genome, ranked[k].genome, gen);
    costUsd += c.costUsd;
    genomes.push(c.genome);
  }

  // top up with mutations if crossover couldn't fill (tiny survivor pool)
  while (genomes.length < targetSize && ranked.length) {
    const m = await mutate(ranked[0].genome, ranked[0].critiques, gen);
    costUsd += m.costUsd;
    genomes.push(m.genome);
  }

  return { genomes: genomes.slice(0, targetSize), costUsd };
}
