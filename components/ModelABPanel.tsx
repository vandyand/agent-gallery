import type { ModelAB } from "@/lib/data";

// Cost↔quality, measured — not asserted. Same genomes, cheap model vs expensive.
export function ModelABPanel({ ab }: { ab: ModelAB }) {
  const cheap = ab.byModel[0];
  const dear = ab.byModel[1];
  const qGain = dear && cheap ? dear.avgQuality - cheap.avgQuality : 0;
  const costX = dear && cheap && cheap.avgCostUsd > 0 ? dear.avgCostUsd / cheap.avgCostUsd : 0;

  return (
    <div className="card">
      <h3>Cost ↔ quality · measured</h3>
      <p className="sub" style={{ marginTop: 0, marginBottom: 16 }}>
        The same seed genomes painted on each model, judged by the same panel. The expensive tier is
        only worth it if the quality gain justifies the spend — so we measure it.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {ab.byModel.map((m, i) => (
          <div
            key={m.model}
            className="card"
            style={{ margin: 0, borderColor: i === 1 ? "var(--gold)" : "var(--line)" }}
          >
            <div className="mono" style={{ fontSize: "0.72rem", color: "var(--faint)" }}>
              {i === 0 ? "CHEAP TIER" : "EXPENSIVE TIER"}
            </div>
            <div className="serif" style={{ fontSize: "1.05rem", margin: "4px 0 10px" }}>
              {m.label}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>avg quality</span>
                <b className="mono" style={{ color: "var(--gold-2)" }}>{m.avgQuality.toFixed(1)}/10</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>$ / piece</span>
                <b className="mono">${m.avgCostUsd.toFixed(4)}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>latency</span>
                <b className="mono">{(m.avgMs / 1000).toFixed(1)}s</b>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mono" style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 14, marginBottom: 0 }}>
        Verdict: the expensive tier buys{" "}
        <b style={{ color: qGain >= 0 ? "var(--up)" : "var(--down)" }}>
          {qGain >= 0 ? "+" : ""}
          {qGain.toFixed(1)} quality
        </b>{" "}
        for <b style={{ color: "var(--gold-2)" }}>{costX.toFixed(0)}× the cost</b>. The gallery defaults to
        the cheap tier for exactly this reason.
      </p>
    </div>
  );
}
