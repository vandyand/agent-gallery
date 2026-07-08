// Model A/B — the cost↔quality tradeoff, measured honestly. Paint the same seed
// genomes on a cheap model and an expensive one, guard + judge both, and record
// what each generation of quality actually costs. Powers the cost-awareness
// panel (SPEC §5/§6).

import "./env";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { paint } from "./artist";
import { guard } from "./guard";
import { judgePanel } from "./judge";
import { meanCritics } from "./fitness";
import { seedGenomes } from "./seeds";
import { MODELS } from "./models";
import { pool } from "./util";

const CONTENDERS = [
  { label: "Claude Haiku 4.5", model: MODELS.artist },
  { label: "Claude Sonnet 4.5", model: MODELS.artistExpensive },
];
const SAMPLE = 4; // seed genomes to test on each model

type Row = { model: string; label: string; artist: string; quality: number; costUsd: number; ms: number; ok: boolean };

async function main() {
  const genomes = seedGenomes().slice(0, SAMPLE);
  const rows: Row[] = [];

  for (const c of CONTENDERS) {
    console.log(`\n▶ ${c.label}`);
    const painted = await pool(genomes, 3, async (g) => {
      const gg = { ...g, model: c.model };
      const { svg, result } = await paint(gg);
      const out = guard(svg);
      return { g, out, result };
    });

    const survivors = painted.filter((p) => p.out.guard.ok && p.out.png);
    const critiques = await judgePanel(survivors.map((p, i) => ({ pieceId: String(i), png: p.out.png! })));

    painted.forEach((p, i) => {
      const idx = survivors.indexOf(p);
      const judgeCost = idx >= 0 ? (critiques[String(idx)] ?? []).reduce((s, x) => s + x.costUsd, 0) : 0;
      const quality = idx >= 0 ? meanCritics(critiques[String(idx)] ?? []) : 0;
      rows.push({
        model: c.model,
        label: c.label,
        artist: p.g.name,
        quality: Number(quality.toFixed(2)),
        costUsd: Number(((p.result?.costUsd ?? 0) + judgeCost).toFixed(5)),
        ms: p.result?.ms ?? 0,
        ok: p.out.guard.ok,
      });
      console.log(`   ${p.g.name}: quality ${quality.toFixed(1)} · $${((p.result?.costUsd ?? 0)).toFixed(4)} · ${p.result?.ms}ms`);
    });
  }

  const byModel = CONTENDERS.map((c) => {
    const r = rows.filter((x) => x.model === c.model && x.ok);
    const avg = (f: (x: Row) => number) => (r.length ? r.reduce((s, x) => s + f(x), 0) / r.length : 0);
    return {
      label: c.label,
      model: c.model,
      avgQuality: Number(avg((x) => x.quality).toFixed(2)),
      avgCostUsd: Number(avg((x) => x.costUsd).toFixed(5)),
      avgMs: Math.round(avg((x) => x.ms)),
      n: r.length,
    };
  });

  const dir = join(process.cwd(), "public", "data");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "model-ab.json"), JSON.stringify({ rows, byModel, builtAt: new Date().toISOString() }, null, 2));
  console.log("\n✅ wrote public/data/model-ab.json");
  for (const m of byModel) console.log(`   ${m.label}: quality ${m.avgQuality} · $${m.avgCostUsd}/piece · ${m.avgMs}ms`);
}

main().catch((e) => {
  console.error("model-ab failed:", e);
  process.exit(1);
});
