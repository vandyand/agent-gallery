"use client";

import { useState } from "react";
import { useRun } from "@/components/RunProvider";
import { runFlow, runFitnessSeries } from "@/lib/run";
import { EvolutionFlow } from "@/components/EvolutionFlow";
import { FitnessChart } from "@/components/FitnessChart";
import { OpLegend, OpExplainer } from "@/components/OpLegend";

const OP_COLOR: Record<string, string> = { seed: "#8fb4d8", survive: "#e0c074", mutation: "#a99cf0", crossover: "#6cc58f" };

export default function EvolutionPage() {
  const {
    run, loading, isLive, population, running, phase, log, error, saving, saveMsg,
    evolve, forkActive, addMember, removeMember, save, newRun, select,
  } = useRun();
  const [newArtist, setNewArtist] = useState({ name: "", styleDirective: "" });
  const [saveName, setSaveName] = useState("");
  const [theme, setTheme] = useState("");
  const [suggesting, setSuggesting] = useState(false);

  if (loading || !run) {
    return (
      <main className="wrap">
        <p style={{ padding: "3rem 0", color: "var(--muted)" }}>Loading…</p>
      </main>
    );
  }

  const flow = runFlow(run);
  const series = runFitnessSeries(run);
  const hasGens = run.generations.length > 0;
  const lastGen = run.generations.length - 1;

  async function suggest() {
    setSuggesting(true);
    try {
      const res = await fetch("/api/suggest", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ theme }) });
      const j = await res.json();
      if (j.artists) newRun(j.artists);
    } catch {
      /* ignore */
    }
    setSuggesting(false);
  }

  return (
    <main className="wrap">
      <section className="hero" style={{ padding: "40px 0 12px" }}>
        <div className="kicker">The optimization loop · {run.name}</div>
        <h1 className="serif" style={{ fontSize: "clamp(1.9rem,4vw,2.9rem)" }}>
          The whole algorithm, in one picture.
        </h1>
        <p className="lede">
          Each column is a generation; every artwork is a node and the lines show where each artist came
          from. Top artists <b style={{ color: "#e0c074" }}>survive</b>, promising ones{" "}
          <b style={{ color: "#a99cf0" }}>mutate</b> or <b style={{ color: "#6cc58f" }}>cross-breed</b>, and
          weak ones are <b style={{ color: "var(--faint)" }}>culled</b>. Click any piece to inspect it.
        </p>
      </section>

      {hasGens && (
        <>
          <OpLegend />
          <EvolutionFlow
            key={`${run.id}:${run.generations.length}`}
            nodes={flow.nodes}
            edges={flow.edges}
            generations={flow.generations}
            onSelect={select}
            height={520}
          />
          <p className="sub" style={{ marginTop: 8 }}>
            Scroll to zoom · drag to pan · click any piece to inspect it.
          </p>
        </>
      )}

      {/* ── controls: fork (read-only run) or the live workbench ─────────── */}
      <div className="card" style={{ marginTop: 20, borderColor: isLive ? "var(--gold)" : "var(--line)" }}>
        {!isLive ? (
          <>
            <h3>Grow this run — live</h3>
            <p className="sub" style={{ marginTop: 0 }}>
              You’re viewing the {run.source === "featured" ? "featured" : "saved"} run (read-only). Fork it
              to breed a fresh branch from its champions — the models actually paint and judge, and the tree
              keeps growing from here.
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn gold" disabled={running || !hasGens} onClick={() => forkActive(lastGen)}>
                ⑂ Fork &amp; evolve from gen {Math.max(0, lastGen)}
              </button>
              <span style={{ color: "var(--faint)", fontSize: "0.82rem" }}>or ↑ pick “New run” in the switcher to start fresh</span>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--up)", flex: "none" }} />
              <h3 style={{ margin: 0, color: "var(--up)" }}>Editing “{run.name}” — your live run</h3>
            </div>
            <p className="sub" style={{ marginTop: 0 }}>
              {hasGens
                ? "Tweak the population below, then evolve to add the next generation. Save it to keep it in your library."
                : "Add or remove artists, then paint generation 0 to begin."}
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <h4 style={{ margin: 0, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--gold)" }}>
                Population · {population.length} artists
              </h4>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
              {population.map((g) => (
                <span key={g.id} className="chip" title={g.styleDirective} style={{ gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: OP_COLOR[g.lineage.op] ?? "#888" }} />
                  {g.name}
                  {population.length > 2 && (
                    <button onClick={() => removeMember(g.id)} style={{ background: "none", border: "none", color: "var(--faint)", cursor: "pointer", padding: 0 }} title="remove">✕</button>
                  )}
                </span>
              ))}
            </div>

            {population.length < 6 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <input className="input" placeholder="name" value={newArtist.name} onChange={(e) => setNewArtist((a) => ({ ...a, name: e.target.value }))} style={{ width: 120, flex: "none" }} />
                <input className="input" placeholder="add an artist — a one-line style directive…" value={newArtist.styleDirective} onChange={(e) => setNewArtist((a) => ({ ...a, styleDirective: e.target.value }))} style={{ flex: 1, minWidth: 200 }} />
                <button className="btn" onClick={() => { addMember(newArtist.name, newArtist.styleDirective); setNewArtist({ name: "", styleDirective: "" }); }} disabled={newArtist.styleDirective.trim().length < 8}>+ Add</button>
              </div>
            )}

            {!hasGens && (
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <input className="input" placeholder="optional theme, e.g. “deep sea”" value={theme} onChange={(e) => setTheme(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
                <button className="btn" onClick={suggest} disabled={suggesting}>{suggesting ? <span className="spinner" /> : "✨ Suggest a set"}</button>
              </div>
            )}

            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn gold" onClick={evolve} disabled={running || population.length < 2}>
                {running ? "Evolving live…" : hasGens ? `Evolve → generation ${run.generations.length} · live ✨` : "Paint generation 0 — live ✨"}
              </button>
              {hasGens && (
                <>
                  <input className="input" placeholder="name this run…" value={saveName} onChange={(e) => setSaveName(e.target.value)} style={{ width: 190, flex: "none" }} />
                  <button className="btn" onClick={() => save(saveName)} disabled={saving}>
                    {saving ? <span className="spinner" /> : "💾 Save to library"}
                  </button>
                  {saveMsg === "saved" && <span style={{ color: "var(--up)", fontSize: "0.85rem" }}>✓ saved</span>}
                  {saveMsg && saveMsg !== "saved" && <span style={{ color: "var(--down)", fontSize: "0.85rem" }}>{saveMsg}</span>}
                </>
              )}
              <span style={{ color: "var(--faint)", fontSize: "0.82rem" }}>Real Haiku calls · rate-limited + daily-capped</span>
            </div>

            {error && (
              <p style={{ color: "var(--down)", marginTop: 12, marginBottom: 0, fontSize: "0.9rem" }}>
                <b>Live run unavailable.</b> {error}
              </p>
            )}
            {(running || phase) && (
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, color: "var(--gold-2)", flexWrap: "wrap" }}>
                <span className="spinner" />
                {phase === "painting" && "Artists are painting…"}
                {phase === "judging" && "The critic panel is scoring…"}
                {phase === "starting" && "Spinning up…"}
                <span className="mono" style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                  {log.map((l, i) => (
                    <span key={i} style={{ marginLeft: 8 }}>
                      <span style={{ color: l.ok ? "var(--up)" : "var(--down)" }}>{l.ok ? "✓" : "✗"}</span> {l.artist}
                    </span>
                  ))}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {hasGens && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, marginTop: 20 }} className="evo-grid">
          <div className="card">
            <h3>Art quality over generations</h3>
            <p className="sub" style={{ marginTop: 0, marginBottom: 10 }}>
              Critic quality climbs as artists refine on feedback; novelty declines as the population
              converges — the honest exploration/exploitation tradeoff.
            </p>
            <FitnessChart data={series.map((s) => ({ ...s, cost: 0 }))} />
          </div>
          <OpExplainer />
        </div>
      )}
    </main>
  );
}
