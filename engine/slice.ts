// Phase 0 vertical slice: one genome -> paint -> guard -> rasterize -> save.
// Proves the whole loop end-to-end with N=1 before we build a population.

import "./env";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { paint } from "./artist";
import { guard } from "./guard";
import { seedGenomes } from "./seeds";

async function main() {
  const g = seedGenomes()[0]; // Bauhau
  console.log(`🎨 ${g.name} painting — "${g.styleDirective.slice(0, 60)}…"`);

  const { svg, result, promptUsed } = await paint(g);
  console.log(`   ${result.usage.prompt}+${result.usage.completion} tok · $${result.costUsd.toFixed(5)} · ${result.ms}ms`);

  const out = guard(svg);
  console.log(`\n🛡  guard: ${out.guard.ok ? "PASS ✓" : "REJECT ✗ — " + out.guard.reason}`);
  for (const c of out.guard.checks) console.log(`     ${c.ok ? "✓" : "✗"} ${c.name}${c.detail ? ` (${c.detail})` : ""}`);

  if (out.guard.ok && out.sanitizedSvg && out.png) {
    const dir = join(process.cwd(), "public", "gallery");
    mkdirSync(dir, { recursive: true });
    const id = "slice-" + g.id;
    writeFileSync(join(dir, `${id}.svg`), out.sanitizedSvg);
    writeFileSync(join(dir, `${id}.png`), out.png);
    const dataDir = join(process.cwd(), "public", "data");
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(
      join(dataDir, "slice.json"),
      JSON.stringify({ genome: g, promptUsed, guard: out.guard, id, cost: result.costUsd }, null, 2),
    );
    console.log(`\n💾 saved public/gallery/${id}.svg (+ .png ${(out.png.length / 1024).toFixed(1)} KB)`);
    console.log(`   ${out.guard.elements} shapes · ${(out.guard.bytes / 1024).toFixed(1)} KB svg`);
  } else {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error("slice failed:", e);
  process.exit(1);
});
