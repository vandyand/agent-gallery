// The four things that can happen to an artist between generations — the
// vocabulary the whole gallery runs on. Used on the evolution + lineage pages.

export const OPS = [
  { key: "seed", color: "#8fb4d8", label: "Seed", desc: "a founding artist in generation 0." },
  {
    key: "survive",
    color: "#e0c074",
    label: "Survived",
    desc: "a top artist carried unchanged — it simply paints a new piece next generation.",
  },
  {
    key: "mutation",
    color: "#a99cf0",
    label: "Mutation",
    desc: "one parent's style genome, rewritten with a small shift — steered by the artist's worst critique.",
  },
  {
    key: "crossover",
    color: "#6cc58f",
    label: "Crossover",
    desc: "two parents' styles blended by an LLM into one coherent new identity (two lines merge into one).",
  },
  {
    key: "culled",
    color: "#6f6a7d",
    label: "Culled",
    desc: "survived the guard but scored too low to reproduce — a dead end (shown faded).",
  },
];

export function OpLegend() {
  return (
    <div className="oplegend">
      {OPS.map((o) => (
        <span key={o.key} className="item" title={o.desc}>
          <span
            className="dot"
            style={{
              background: o.key === "culled" ? "transparent" : o.color,
              border: o.key === "culled" ? "1px dashed var(--faint)" : "none",
              opacity: o.key === "culled" ? 0.6 : 1,
            }}
          />
          <b>{o.label}</b>
        </span>
      ))}
    </div>
  );
}

export function OpExplainer() {
  return (
    <div className="card">
      <h3>How one generation breeds the next</h3>
      <div style={{ display: "grid", gap: 10 }}>
        {OPS.map((o) => (
          <div key={o.key} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
            <span
              className="dot"
              style={{
                width: 11,
                height: 11,
                borderRadius: 999,
                flex: "none",
                marginTop: 4,
                background: o.key === "culled" ? "transparent" : o.color,
                border: o.key === "culled" ? "1px dashed var(--faint)" : "none",
              }}
            />
            <div>
              <b style={{ color: "var(--ink)" }}>{o.label}</b>{" "}
              <span style={{ color: "var(--muted)" }}>— {o.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
