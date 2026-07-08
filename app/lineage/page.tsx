import Link from "next/link";
import { gallery } from "@/lib/data";

export const metadata = { title: "Lineage — The Evolving Gallery" };

// P1: the founding population. P2 replaces this with the interactive family tree
// tracing masterpieces back through mutation and crossover to generation 0.
export default function LineagePage() {
  const gens = gallery().generations;
  return (
    <main className="wrap" style={{ maxWidth: 900 }}>
      <section className="hero" style={{ padding: "44px 0 16px" }}>
        <div className="kicker">Provenance</div>
        <h1 className="serif" style={{ fontSize: "clamp(1.9rem,4vw,2.9rem)" }}>
          Every artist has ancestors.
        </h1>
        <p className="lede">
          As generations breed, each artist’s style genome inherits from parents by mutation and
          crossover. Here is the founding population; the full family tree grows as the gallery evolves.
        </p>
      </section>

      {gens.map((gen) => (
        <div key={gen.n} className="card">
          <h3>Generation {gen.n}</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {gen.genomes.map((genome) => (
              <div key={genome.id} style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
                <span className="serif" style={{ color: "var(--gold-2)", minWidth: 90 }}>
                  {genome.name}
                </span>
                <span style={{ color: "var(--muted)", fontSize: "0.9rem", flex: 1 }}>
                  {genome.styleDirective}
                </span>
                <span className="mono" style={{ fontSize: "0.72rem", color: "var(--faint)" }}>
                  {genome.lineage.op}
                  {genome.lineage.parents.length ? ` ← ${genome.lineage.parents.length} parent(s)` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Link href="/" className="btn">
        ← Back to the wall
      </Link>
    </main>
  );
}
