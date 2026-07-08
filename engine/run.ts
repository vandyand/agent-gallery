// Offline driver. Runs real generations against OpenRouter and writes the
// committed gallery manifest + assets. P1: generation 0 only. P2 extends this
// with the evolve loop (this file is rewritten to breed gen N+1 from gen N).

import "./env";
import { runGeneration } from "./generation";
import { seedGenomes } from "./seeds";
import { DEFAULT_WEIGHTS } from "./fitness";
import { writeGalleryData } from "./io";
import type { GalleryData, Generation } from "./types";

const MAX_USD = Number(process.env.GALLERY_MAX_USD ?? "2.0");

async function main() {
  const generations: Generation[] = [];
  const priorFeatures: number[][] = [];
  let totalCost = 0;

  const genomes = seedGenomes();
  const { gen, features } = await runGeneration({
    genomes,
    n: 0,
    priorFeatures,
    weights: DEFAULT_WEIGHTS,
    log: (m) => console.log(m),
  });
  generations.push(gen);
  priorFeatures.push(...features.map((f) => f.vec));
  totalCost += gen.costUsd;
  if (totalCost > MAX_USD) console.warn(`⚠ cost ${totalCost.toFixed(4)} exceeded ceiling ${MAX_USD}`);

  // hall of fame — best survivors across all generations
  const scored = generations.flatMap((g) =>
    g.pieces.filter((p) => !p.disqualified).map((p) => ({ id: p.id, total: g.fitness[p.id]?.total ?? 0 })),
  );
  scored.sort((a, b) => b.total - a.total);
  const hallOfFame = scored.slice(0, 6).map((s) => s.id);

  const data: GalleryData = {
    title: "The Evolving Gallery",
    generations,
    hallOfFame,
    fitnessWeights: DEFAULT_WEIGHTS,
    totalCostUsd: totalCost,
    builtAt: new Date().toISOString(),
  };
  writeGalleryData(data);
  console.log(`\n✅ wrote public/data/gallery.json — ${generations.length} generation(s), $${totalCost.toFixed(4)} total`);
  console.log(`   hall of fame: ${hallOfFame.join(", ")}`);
}

main().catch((e) => {
  console.error("run failed:", e);
  process.exit(1);
});
