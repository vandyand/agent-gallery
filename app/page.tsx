import Link from "next/link";
import { gallery, currentWall, latestGeneration, rejected, hallOfFame } from "@/lib/data";
import { PieceCard } from "@/components/PieceCard";

export default function Home() {
  const g = gallery();
  const wall = currentWall();
  const latest = latestGeneration();
  const rej = rejected();
  const hof = hallOfFame();
  const genCount = g.generations.length;

  return (
    <main className="wrap">
      <section className="hero">
        <div className="kicker">A gallery that evolves · Generation {latest.n}</div>
        <h1 className="serif">
          Artist agents that <span style={{ color: "var(--gold)" }}>measurably</span> get better.
        </h1>
        <p className="lede">
          Every piece here was painted by an AI artist with an evolving “style genome,” screened by a
          safety guard, and judged by a panel of AI critics. The fittest artists breed the next
          generation — and the art improves in front of you. It looks like a gallery; underneath it’s
          an evaluation harness with an optimization loop.
        </p>
        <div className="chips" style={{ marginTop: 24 }}>
          <span className="chip">
            <b className="tnum">{genCount}</b> generation{genCount === 1 ? "" : "s"}
          </span>
          <span className="chip">
            <b className="tnum">{wall.length}</b> on the wall
          </span>
          <span className="chip">
            <b className="tnum">{rej.length}</b> rejected
          </span>
          <span className="chip">
            mean fitness <b className="tnum">{latest.summary.meanFitness.toFixed(2)}</b>/10
          </span>
          <span className="chip mono">
            total spend <b>${g.totalCostUsd.toFixed(2)}</b>
          </span>
        </div>
        <div style={{ marginTop: 22, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/evolution" className="btn gold">
            Watch it evolve →
          </Link>
          <Link href="/studio" className="btn">
            Design your own ✨
          </Link>
          <Link href="/about" className="btn">
            How it works
          </Link>
        </div>
      </section>

      <section className="section" style={{ borderTop: "none", paddingTop: 8 }}>
        <h2 className="serif">The current wall · Generation {latest.n}</h2>
        <p className="sub">
          The living population — survivors of the latest generation, ranked by fitness.
        </p>
      </section>
      <div className="wall">
        {wall.map((v) => (
          <PieceCard key={v.piece.id} view={v} />
        ))}
      </div>

      {hof.length > 0 && (
        <section className="section">
          <h2 className="serif">Hall of fame</h2>
          <p className="sub">
            The highest-fitness pieces from every generation. →{" "}
            <Link href="/lineage" style={{ color: "var(--gold-2)" }}>
              trace their lineage
            </Link>
          </p>
          <div className="wall" style={{ columns: "4 220px" }}>
            {hof.map((v) => (
              <PieceCard key={v.piece.id} view={v} />
            ))}
          </div>
        </section>
      )}

      {rej.length > 0 && (
        <section className="section">
          <h2 className="serif">The reliability layer, made visible</h2>
          <p className="sub">
            {rej.length} generated piece{rej.length === 1 ? "" : "s"} never reached the wall — a
            malformed or unsafe SVG caught by the guard. AI writes code that silently breaks; here the
            breakage is caught, labeled, and shown. →{" "}
            <Link href="/rejected" style={{ color: "var(--gold-2)" }}>
              See the rejected sketches
            </Link>
          </p>
        </section>
      )}

      <footer className="footer wrap" style={{ padding: "30px 0 60px" }}>
        Built by Andrew VanDyke — an agent-evaluation harness dressed as an art gallery.{" "}
        <Link href="/about">How it works</Link> ·{" "}
        <a href="https://github.com/vandyand/agent-gallery">Source</a>
      </footer>
    </main>
  );
}
