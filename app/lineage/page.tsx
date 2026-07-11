"use client";

import { useState } from "react";
import { useRun } from "@/components/RunProvider";
import { runHallOfFame, runLineage } from "@/lib/run";
import { LineageTree } from "@/components/LineageTree";
import { OpLegend } from "@/components/OpLegend";

export default function LineagePage() {
  const { run, loading, select } = useRun();
  const [activeId, setActiveId] = useState<string | null>(null);

  if (loading || !run) {
    return (
      <main className="wrap">
        <p style={{ padding: "3rem 0", color: "var(--muted)" }}>Loading…</p>
      </main>
    );
  }

  const hof = runHallOfFame(run);

  return (
    <main className="wrap">
      <section className="hero" style={{ padding: "44px 0 14px" }}>
        <div className="kicker">Provenance · {run.name}</div>
        <h1 className="serif" style={{ fontSize: "clamp(1.9rem,4vw,2.9rem)" }}>
          Trace a masterpiece back to gen 0.
        </h1>
        <p className="lede">
          Each artist inherits from parents by mutation (steered by the critics’ feedback) and crossover.
          Pick a piece to follow its bloodline back to the founding seeds — gen 0 at the top, flowing down
          to the masterpiece.
        </p>
      </section>

      {hof.length === 0 ? (
        <p className="sub">This run has no pieces yet — evolve it first.</p>
      ) : (
        (() => {
          const active = activeId ?? hof[0].id;
          const root = runLineage(run, active);
          return (
            <>
              <OpLegend />
              <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "6px 0 20px" }}>
                {hof.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActiveId(p.id)}
                    title={`${p.artist} · fitness ${p.fit.toFixed(1)}`}
                    style={{
                      flex: "none",
                      border: `2px solid ${p.id === active ? "var(--gold)" : "transparent"}`,
                      borderRadius: 8,
                      padding: 3,
                      background: "var(--panel)",
                      cursor: "pointer",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.art} alt={p.artist} style={{ width: 64, height: 64, borderRadius: 5, display: "block", background: "#fff" }} />
                  </button>
                ))}
              </div>
              {root ? <LineageTree root={root} onSelect={select} /> : <p className="sub">No lineage found for this piece.</p>}
            </>
          );
        })()
      )}
    </main>
  );
}
