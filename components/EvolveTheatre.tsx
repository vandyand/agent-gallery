"use client";

import { useState } from "react";
import Link from "next/link";
import { FitnessChart, type Point } from "@/components/FitnessChart";
import type { EvolveFrame } from "@/lib/data";

const PHASES = [
  "Generating — artists painting SVGs…",
  "Guarding — sanitizing & rendering…",
  "Judging — the critic panel scores…",
  "Breeding — the fittest mutate & cross…",
];

const OP_DOT: Record<string, string> = {
  seed: "#8fb4d8",
  survive: "#e0c074",
  mutation: "#a99cf0",
  crossover: "#6cc58f",
};

export function EvolveTheatre({ frames, series }: { frames: EvolveFrame[]; series: Point[] }) {
  const [gen, setGen] = useState(0);
  const [phase, setPhase] = useState<number | null>(null);
  const atEnd = gen >= frames.length - 1;
  const cur = frames[gen];
  const prev = gen > 0 ? frames[gen - 1] : null;
  const dMean = prev ? cur.mean - prev.mean : 0;

  function evolve() {
    if (atEnd || phase !== null) return;
    let i = 0;
    setPhase(0);
    const tick = () => {
      i += 1;
      if (i < PHASES.length) {
        setPhase(i);
        setTimeout(tick, 620);
      } else {
        setPhase(null);
        setGen((g) => Math.min(g + 1, frames.length - 1));
      }
    };
    setTimeout(tick, 620);
  }

  const totalCost = series.reduce((s, p) => s + p.cost, 0);

  return (
    <div>
      <div className="card" style={{ padding: "18px 18px 6px" }}>
        <FitnessChart data={series.slice(0, gen + 1)} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", margin: "18px 0 10px" }}>
        <button className="btn gold" onClick={evolve} disabled={atEnd || phase !== null}>
          {phase !== null ? "Evolving…" : atEnd ? "Fully evolved" : "Evolve next generation →"}
        </button>
        {gen > 0 && (
          <button className="btn" onClick={() => setGen(0)} disabled={phase !== null}>
            ↺ Reset to gen 0
          </button>
        )}
        <span className="chip">
          Generation <b className="tnum">{cur.n}</b> / {frames.length - 1}
        </span>
        <span className="chip">
          mean fitness <b className="tnum">{cur.mean.toFixed(2)}</b>
          {prev && (
            <b style={{ color: dMean >= 0 ? "var(--up)" : "var(--down)", marginLeft: 4 }}>
              {dMean >= 0 ? "▲" : "▼"}
              {Math.abs(dMean).toFixed(2)}
            </b>
          )}
        </span>
        <span className="chip">
          <b className="tnum">{cur.survived}</b> kept · <b className="tnum">{cur.rejected}</b> rejected
        </span>
        <span className="chip mono">${totalCost.toFixed(2)} spent</span>
      </div>

      {phase !== null && (
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 12, borderColor: "var(--gold)" }}>
          <span className="spinner" />
          <span style={{ color: "var(--gold-2)" }}>{PHASES[phase]}</span>
        </div>
      )}

      <div className="wall" style={{ columns: "5 150px", opacity: phase !== null ? 0.4 : 1, transition: "opacity 0.3s" }}>
        {cur.pieces.map((p) => (
          <Link key={p.id} href={`/piece/${p.id}`} className="frame" style={{ padding: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="art" src={p.thumb} alt={p.name} loading="lazy" />
            <div className="plaque" style={{ marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: OP_DOT[p.op] ?? "#888" }} />
                <span className="name" style={{ fontSize: "0.82rem" }}>
                  {p.name}
                </span>
              </div>
              <span className="fit-badge" style={{ fontSize: "0.72rem" }}>
                {p.fit.toFixed(1)}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <p className="mono" style={{ fontSize: "0.74rem", color: "var(--faint)", marginTop: 4 }}>
        <span style={{ color: "#e0c074" }}>●</span> survived&nbsp;&nbsp;
        <span style={{ color: "#a99cf0" }}>●</span> mutation&nbsp;&nbsp;
        <span style={{ color: "#6cc58f" }}>●</span> crossover&nbsp;&nbsp;
        <span style={{ color: "#8fb4d8" }}>●</span> seed
      </p>
    </div>
  );
}
