"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRun } from "@/components/RunProvider";
import { runWall, runHallOfFame, runRejected } from "@/lib/run";
import { RunPieceCard } from "@/components/RunPieceCard";

const NEW_DEFAULTS = [
  { name: "Ember", styleDirective: "glowing molten geometric fragments on deep charcoal with a few warm colors" },
  { name: "Frost", styleDirective: "crystalline symmetric ice-blue lattice with delicate white linework" },
  { name: "Verdant", styleDirective: "organic tangled vines and leaf shapes in layered greens with hand-drawn energy" },
];

export default function Home() {
  const { run, loading, newRun } = useRun();
  const router = useRouter();

  if (loading || !run) {
    return (
      <main className="wrap">
        <p style={{ padding: "3rem 0", color: "var(--muted)" }}>Loading the gallery…</p>
      </main>
    );
  }

  const wall = runWall(run);
  const hof = runHallOfFame(run);
  const rej = runRejected(run);
  const latestGen = Math.max(0, run.generations.length - 1);
  const meanFit = wall.length ? wall.reduce((s, p) => s + p.fit, 0) / wall.length : 0;
  const kicker = run.source === "featured" ? "A gallery that evolves" : run.source === "saved" ? "A saved run" : "A live run";

  return (
    <main className="wrap">
      <section className="hero">
        <div className="kicker">
          {kicker} · Generation {latestGen}
        </div>
        <h1 className="serif">
          Artist agents that <span style={{ color: "var(--gold)" }}>measurably</span> get better.
        </h1>
        <p className="lede">
          Every piece here was painted by an AI artist with an evolving “style genome,” screened by a
          safety guard, and judged by a panel of AI critics. The fittest artists breed the next
          generation — and the art improves in front of you.
        </p>
        <div className="chips" style={{ marginTop: 24 }}>
          <span className="chip">
            <b className="tnum">{run.generations.length}</b> generation{run.generations.length === 1 ? "" : "s"}
          </span>
          <span className="chip">
            <b className="tnum">{wall.length}</b> on the wall
          </span>
          <span className="chip">
            <b className="tnum">{rej.length}</b> rejected
          </span>
          <span className="chip">
            mean fitness <b className="tnum">{meanFit.toFixed(2)}</b>/10
          </span>
        </div>
        <div style={{ marginTop: 22, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/evolution" className="btn gold">
            {run.source === "featured" ? "Watch it evolve →" : "Open the workbench →"}
          </Link>
          <button
            className="btn"
            onClick={() => {
              newRun(NEW_DEFAULTS);
              router.push("/evolution");
            }}
          >
            Design your own ✨
          </button>
          <Link href="/about" className="btn">
            How it works
          </Link>
        </div>
      </section>

      {run.generations.length === 0 ? (
        <p className="sub">
          This run has no generations yet.{" "}
          <Link href="/evolution" style={{ color: "var(--gold-2)" }}>
            Paint its first generation →
          </Link>
        </p>
      ) : (
        <>
          <section className="section" style={{ borderTop: "none", paddingTop: 8 }}>
            <h2 className="serif">The current wall · Generation {latestGen}</h2>
            <p className="sub">Survivors of the latest generation, ranked by fitness. Click any piece to inspect it.</p>
          </section>
          <div className="wall">
            {wall.map((p) => (
              <RunPieceCard key={p.id} piece={p} />
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
                {hof.map((p) => (
                  <RunPieceCard key={p.id} piece={p} />
                ))}
              </div>
            </section>
          )}

          {rej.length > 0 && (
            <section className="section">
              <h2 className="serif">The reliability layer, made visible</h2>
              <p className="sub">
                {rej.length} generated piece{rej.length === 1 ? "" : "s"} never reached the wall — caught by
                the guard. →{" "}
                <Link href="/rejected" style={{ color: "var(--gold-2)" }}>
                  See the rejected sketches
                </Link>
              </p>
            </section>
          )}
        </>
      )}

      <footer className="footer" style={{ padding: "30px 0 60px" }}>
        Built by Andrew VanDyke — an agent-evaluation harness dressed as an art gallery.{" "}
        <Link href="/about">How it works</Link> · <a href="https://github.com/vandyand/agent-gallery">Source</a>
      </footer>
    </main>
  );
}
