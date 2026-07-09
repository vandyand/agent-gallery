"use client";

import type { useLiveEvolve } from "@/lib/useLiveEvolve";

const OP_COLOR: Record<string, string> = {
  seed: "#8fb4d8",
  survive: "#e0c074",
  mutation: "#a99cf0",
  crossover: "#6cc58f",
};

function svgUrl(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function LiveResults({ ev }: { ev: ReturnType<typeof useLiveEvolve> }) {
  const { running, phase, log, pieces, error } = ev;

  return (
    <div style={{ marginTop: 18 }}>
      {error && (
        <div className="card" style={{ borderColor: "var(--down)", color: "var(--ink)" }}>
          <b style={{ color: "var(--down)" }}>Live run unavailable.</b> {error}
        </div>
      )}

      {(running || phase) && (
        <div className="card" style={{ borderColor: "var(--gold)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="spinner" />
            <span style={{ color: "var(--gold-2)" }}>
              {phase === "painting" && "Artists are painting…"}
              {phase === "judging" && "The critic panel is scoring…"}
              {phase === "starting" && "Spinning up the generation…"}
              {!phase && "Working…"}
            </span>
          </div>
          {log.length > 0 && (
            <div className="mono" style={{ marginTop: 10, fontSize: "0.8rem", color: "var(--muted)", display: "flex", flexWrap: "wrap", gap: 10 }}>
              {log.map((l, i) => (
                <span key={i}>
                  <span style={{ color: l.ok ? "var(--up)" : "var(--down)" }}>{l.ok ? "✓" : "✗"}</span> {l.artist}
                  {l.reason ? ` (${l.reason})` : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {pieces.length > 0 && !running && (
        <div className="wall" style={{ columns: "4 210px", marginTop: 4 }}>
          {[...pieces]
            .filter((p) => p.guardOk)
            .sort((a, b) => b.fit - a.fit)
            .map((p) => (
              <div key={p.id} className="frame" style={{ padding: 10 }}>
                {/* live SVG rendered via <img> data URL — script-safe */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="art" src={svgUrl(p.svg!)} alt={p.artist} />
                <div className="plaque" style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: OP_COLOR[p.op] ?? "#888" }} />
                    <span className="name" style={{ fontSize: "0.86rem" }}>{p.artist}</span>
                  </div>
                  <span className="fit-badge">{p.fit.toFixed(1)}</span>
                </div>
                <div style={{ marginTop: 8, display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {p.critiques.map((c) => (
                    <span
                      key={c.lens}
                      className="mono"
                      title={`${c.lens}: ${c.oneLine}`}
                      style={{ fontSize: "0.66rem", color: "#5a4a2a", background: "#e8dcc0", borderRadius: 999, padding: "1px 6px" }}
                    >
                      {c.lens[0]} {c.score}
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
