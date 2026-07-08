import Link from "next/link";
import { gallery, fitnessSeries } from "@/lib/data";

export const metadata = { title: "Evolution — The Evolving Gallery" };

// P1: shows the current generation summary + the evolve concept. P2 replaces
// this with the live climbing fitness curve, the Evolve-next-gen button, and the
// generation-to-generation A/B (improved / regressed / unchanged).
export default function EvolutionPage() {
  const g = gallery();
  const series = fitnessSeries();
  return (
    <main className="wrap" style={{ maxWidth: 900 }}>
      <section className="hero" style={{ padding: "44px 0 16px" }}>
        <div className="kicker">The optimization loop</div>
        <h1 className="serif" style={{ fontSize: "clamp(1.9rem,4vw,2.9rem)" }}>
          Watch the art get better.
        </h1>
        <p className="lede">
          Each generation, the fittest artists survive and their style genomes are mutated and
          cross-bred into the next population. Mean fitness climbs; the wall diversifies.
        </p>
      </section>

      <div className="card">
        <h3>Generations so far</h3>
        {series.map((s) => (
          <div key={s.gen} className="fitrow" style={{ gridTemplateColumns: "80px 1fr 120px" }}>
            <span className="label">Gen {s.gen}</span>
            <span className="bar">
              <span style={{ width: `${(s.mean / 10) * 100}%`, background: "linear-gradient(90deg,#c9a24b,#e0c074)" }} />
            </span>
            <span className="val mono">
              {s.mean.toFixed(2)} · ${s.cost.toFixed(2)}
            </span>
          </div>
        ))}
        <p className="mono" style={{ fontSize: "0.75rem", color: "var(--faint)", marginTop: 14, marginBottom: 0 }}>
          total spend ${g.totalCostUsd.toFixed(2)} across {series.length} generation
          {series.length === 1 ? "" : "s"}
        </p>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/" className="btn gold">
          ← Back to the wall
        </Link>
      </div>
    </main>
  );
}
