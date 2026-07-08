// Offline evolution driver. Seeds generation 0, then breeds each subsequent
// generation from the previous one (critic-steered mutation + crossover),
// running the full guard→judge→fitness pipeline each time, and writes the
// committed manifest + assets that the deployed gallery reads.

import "./env";
import { runGeneration } from "./generation";
import { breed } from "./evolve";
import { seedGenomes } from "./seeds";
import { DEFAULT_WEIGHTS } from "./fitness";
import { writeGalleryData } from "./io";
import type { GalleryData, Generation } from "./types";

const NUM_GEN = Number(process.env.GALLERY_GENERATIONS ?? "6");
const POP = Number(process.env.GALLERY_POP ?? "8");
const MAX_USD = Number(process.env.GALLERY_MAX_USD ?? "3.0");

async function main() {
  const generations: Generation[] = [];
  const priorFeatures: number[][] = [];
  let totalCost = 0;
  const log = (m: string) => console.log(m);

  for (let n = 0; n < NUM_GEN; n++) {
    let genomes;
    if (n === 0) {
      genomes = seedGenomes();
    } else {
      const bred = await breed(generations[n - 1], n, POP);
      genomes = bred.genomes;
      totalCost += bred.costUsd;
      log(`gen ${n}: bred ${genomes.length} artists from gen ${n - 1} ($${bred.costUsd.toFixed(4)} breeding)`);
    }

    const { gen, features } = await runGeneration({
      genomes,
      n,
      priorFeatures: [...priorFeatures],
      weights: DEFAULT_WEIGHTS,
      log,
    });
    generations.push(gen);
    priorFeatures.push(...features.map((f) => f.vec));
    totalCost += gen.costUsd;

    if (totalCost > MAX_USD) {
      log(`⚠ cost ceiling $${MAX_USD} hit at gen ${n} — stopping early`);
      break;
    }
  }

  // hall of fame — best survivors across every generation
  const scored = generations.flatMap((g) =>
    g.pieces.filter((p) => !p.disqualified).map((p) => ({ id: p.id, total: g.fitness[p.id]?.total ?? 0 })),
  );
  scored.sort((a, b) => b.total - a.total);
  const hallOfFame = scored.slice(0, 8).map((s) => s.id);

  const data: GalleryData = {
    title: "The Evolving Gallery",
    generations,
    hallOfFame,
    fitnessWeights: DEFAULT_WEIGHTS,
    totalCostUsd: totalCost,
    builtAt: new Date().toISOString(),
  };
  writeGalleryData(data);

  console.log(`\n✅ ${generations.length} generations · $${totalCost.toFixed(4)} total`);
  console.log(
    "   fitness by gen: " +
      generations.map((g) => `${g.n}:${g.summary.meanFitness.toFixed(2)}`).join("  "),
  );
}

main().catch((e) => {
  console.error("run failed:", e);
  process.exit(1);
});
