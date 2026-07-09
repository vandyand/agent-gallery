"use client";

import { useLiveEvolve } from "@/lib/useLiveEvolve";
import { LiveResults } from "@/components/LiveResults";
import type { Genome } from "@/engine/types";

// Continue mode: run a REAL new generation live, from the gallery's current
// champions. Each run paints + judges a fresh population and breeds the next.
export function LiveEvolve({ initialGenomes }: { initialGenomes: Genome[] }) {
  const ev = useLiveEvolve(initialGenomes);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <button className="btn gold" disabled={ev.running} onClick={() => ev.run({ genomes: ev.population })}>
          {ev.running ? "Evolving live…" : ev.runs === 0 ? "Run a generation — live ✨" : "Evolve again — live ✨"}
        </button>
        {ev.genNum !== null && !ev.running && (
          <span className="chip">
            live generation <b>{ev.genNum}</b>
          </span>
        )}
        <span style={{ color: "var(--faint)", fontSize: "0.82rem" }}>
          Really calls the models (~5 artists on Haiku). Rate-limited + daily-capped.
        </span>
      </div>
      <LiveResults ev={ev} />
    </div>
  );
}
