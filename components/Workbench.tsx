"use client";

import { useEffect, useMemo, useState } from "react";
import { useWorkbench } from "@/lib/useWorkbench";
import { EvolutionFlow } from "@/components/EvolutionFlow";
import { OpLegend } from "@/components/OpLegend";
import type { Genome } from "@/engine/types";

const OP_COLOR: Record<string, string> = {
  seed: "#8fb4d8",
  survive: "#e0c074",
  mutation: "#a99cf0",
  crossover: "#6cc58f",
};
function svgUrl(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

type Row = { name: string; styleDirective: string };
const FRESH_DEFAULTS: Row[] = [
  { name: "Ember", styleDirective: "glowing molten geometric fragments on deep charcoal with a few warm colors" },
  { name: "Frost", styleDirective: "crystalline symmetric ice-blue lattice with delicate white linework" },
  { name: "Verdant", styleDirective: "organic tangled vines and leaf shapes in layered greens with hand-drawn energy" },
];

export function Workbench({ champions, startMode }: { champions: Genome[]; startMode?: string }) {
  const wb = useWorkbench();
  const [selId, setSelId] = useState<string | null>(null);
  const [newArtist, setNewArtist] = useState<Row>({ name: "", styleDirective: "" });

  // fresh-start editor
  const [rows, setRows] = useState<Row[]>(FRESH_DEFAULTS);
  const [theme, setTheme] = useState("");
  const [suggesting, setSuggesting] = useState(false);

  // deep-link: /studio?start=featured pre-forks the champions
  useEffect(() => {
    if (startMode === "featured" && !wb.started && champions.length) wb.init(champions.slice(0, 5), "Fork of the featured gallery");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startMode]);

  const selected = useMemo(
    () => wb.generations.flatMap((g) => g.pieces).find((p) => p.id === selId) ?? null,
    [wb.generations, selId],
  );
  const selGen = useMemo(
    () => wb.generations.findIndex((g) => g.pieces.some((p) => p.id === selId)),
    [wb.generations, selId],
  );

  async function suggest() {
    setSuggesting(true);
    try {
      const res = await fetch("/api/suggest", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ theme }) });
      const j = await res.json();
      if (j.artists) setRows(j.artists);
    } catch {
      /* ignore */
    }
    setSuggesting(false);
  }

  // ---------- starting-point screen ----------
  if (!wb.started) {
    const valid = rows.filter((r) => r.styleDirective.trim().length >= 8);
    return (
      <div>
        {champions.length > 0 && (
          <div className="card" style={{ borderColor: "var(--gold)" }}>
            <h3>Fork the featured gallery</h3>
            <p className="sub" style={{ marginTop: 0 }}>
              Start from the champions of the precomputed 8-generation run and evolve them further, live.
            </p>
            <button className="btn gold" onClick={() => wb.init(champions.slice(0, 5), "Fork of the featured gallery")}>
              Fork the champions →
            </button>
          </div>
        )}

        <div className="card">
          <h3>…or start a fresh population</h3>
          <p className="sub" style={{ marginTop: 0 }}>
            Write 2–5 artists (a name + a one-line aesthetic), or let the machine invent a set.
          </p>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <input className="input" placeholder="optional theme, e.g. “deep sea”, “bauhaus”" value={theme} onChange={(e) => setTheme(e.target.value)} style={{ flex: 1, minWidth: 220 }} />
            <button className="btn" onClick={suggest} disabled={suggesting}>
              {suggesting ? <span className="spinner" /> : "✨ Suggest artists"}
            </button>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {rows.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 8 }}>
                <input className="input" placeholder="name" value={r.name} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} style={{ width: 130, flex: "none" }} />
                <input className="input" placeholder="a one-line style directive…" value={r.styleDirective} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, styleDirective: e.target.value } : x)))} style={{ flex: 1 }} />
                <button className="btn" onClick={() => setRows((rs) => (rs.length <= 2 ? rs : rs.filter((_, j) => j !== i)))} disabled={rows.length <= 2} style={{ padding: "8px 12px", flex: "none" }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn" onClick={() => setRows((rs) => (rs.length >= 5 ? rs : [...rs, { name: "", styleDirective: "" }]))} disabled={rows.length >= 5}>+ Add artist</button>
            <button className="btn gold" onClick={() => wb.startFresh(valid)} disabled={valid.length < 2}>Start this population →</button>
            <span style={{ color: "var(--faint)", fontSize: "0.82rem" }}>{valid.length}/5 ready</span>
          </div>
        </div>
      </div>
    );
  }

  // ---------- the workbench ----------
  return (
    <div>
      {/* population panel */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>Current population · {wb.population.length} artists</h3>
          <button className="btn" onClick={wb.reset} style={{ padding: "6px 12px", fontSize: "0.82rem" }}>↺ Start over</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
          {wb.population.map((g) => (
            <span key={g.id} className="chip" title={g.styleDirective} style={{ gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: OP_COLOR[g.lineage.op] ?? "#888" }} />
              {g.name}
              {wb.population.length > 2 && (
                <button onClick={() => wb.removeMember(g.id)} style={{ background: "none", border: "none", color: "var(--faint)", cursor: "pointer", padding: 0 }} title="remove">✕</button>
              )}
            </span>
          ))}
        </div>

        {wb.population.length < 6 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <input className="input" placeholder="name" value={newArtist.name} onChange={(e) => setNewArtist((a) => ({ ...a, name: e.target.value }))} style={{ width: 120, flex: "none" }} />
            <input className="input" placeholder="add a new artist — a one-line style directive…" value={newArtist.styleDirective} onChange={(e) => setNewArtist((a) => ({ ...a, styleDirective: e.target.value }))} style={{ flex: 1, minWidth: 200 }} />
            <button className="btn" onClick={() => { wb.addMember(newArtist.name, newArtist.styleDirective); setNewArtist({ name: "", styleDirective: "" }); }} disabled={newArtist.styleDirective.trim().length < 8} style={{ flex: "none" }}>+ Add member</button>
          </div>
        )}

        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn gold" onClick={wb.evolve} disabled={wb.running || wb.population.length < 2}>
            {wb.running ? "Evolving live…" : wb.generations.length === 0 ? "Paint generation 0 — live ✨" : `Evolve → generation ${wb.generations.length} · live ✨`}
          </button>
          <span style={{ color: "var(--faint)", fontSize: "0.82rem" }}>Real Haiku calls · rate-limited + daily-capped</span>
        </div>

        {wb.error && (
          <p style={{ color: "var(--down)", marginTop: 12, marginBottom: 0, fontSize: "0.9rem" }}>
            <b>Live run unavailable.</b> {wb.error}
          </p>
        )}
        {(wb.running || wb.phase) && (
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, color: "var(--gold-2)" }}>
            <span className="spinner" />
            {wb.phase === "painting" && "Artists are painting…"}
            {wb.phase === "judging" && "The critic panel is scoring…"}
            {wb.phase === "starting" && "Spinning up…"}
            <span className="mono" style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
              {wb.log.map((l, i) => (
                <span key={i} style={{ marginLeft: 8 }}>
                  <span style={{ color: l.ok ? "var(--up)" : "var(--down)" }}>{l.ok ? "✓" : "✗"}</span> {l.artist}
                </span>
              ))}
            </span>
          </div>
        )}
      </div>

      {/* growing graph */}
      {wb.generations.length > 0 ? (
        <div style={{ marginTop: 20 }}>
          <OpLegend />
          <EvolutionFlow
            key={wb.generations.length}
            nodes={wb.flow.nodes}
            edges={wb.flow.edges}
            generations={wb.flow.generations}
            onSelect={setSelId}
            height={520}
          />
          <p className="sub" style={{ marginTop: 8 }}>Click any piece to inspect it. Each “Evolve” adds the next generation.</p>
        </div>
      ) : (
        <p className="sub" style={{ marginTop: 20 }}>Hit “Paint generation 0” to grow your first column.</p>
      )}

      {/* inspect panel */}
      {selected && (
        <div className="card" style={{ marginTop: 16, display: "grid", gridTemplateColumns: "220px 1fr", gap: 18 }}>
          <div>
            {selected.svg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={svgUrl(selected.svg)} alt={selected.artist} style={{ width: "100%", borderRadius: 6, background: "#fff" }} />
            ) : (
              <div style={{ color: "var(--down)" }}>rejected — {selected.reason}</div>
            )}
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h3 style={{ margin: 0, color: "var(--gold)" }}>
                {selected.artist} · fitness {selected.fit.toFixed(1)}
              </h3>
              <button className="btn" onClick={() => setSelId(null)} style={{ padding: "4px 10px", fontSize: "0.8rem" }}>✕</button>
            </div>
            {selected.guardOk && selGen >= 0 && selGen < wb.generations.length - 1 && (
              <button
                className="btn"
                onClick={() => { wb.forkFromGeneration(selGen); setSelId(null); }}
                disabled={wb.running}
                style={{ marginTop: 10, padding: "6px 12px", fontSize: "0.82rem" }}
                title={`Rewind the run to generation ${selGen} and evolve a new branch from its survivors`}
              >
                ⑂ Fork the run from generation {selGen}
              </button>
            )}
            <div style={{ marginTop: 10 }}>
              {selected.critiques.map((c) => (
                <div key={c.lens} className="critic" style={{ gridTemplateColumns: "30px 1fr" }}>
                  <div className="score">{c.score}</div>
                  <div>
                    <div className="lens">{c.lens}</div>
                    <div className="verdict">“{c.oneLine}”</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
