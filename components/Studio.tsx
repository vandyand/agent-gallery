"use client";

import { useState } from "react";
import { useLiveEvolve } from "@/lib/useLiveEvolve";
import { LiveResults } from "@/components/LiveResults";

type Row = { name: string; styleDirective: string };

const DEFAULTS: Row[] = [
  { name: "Ember", styleDirective: "glowing molten geometric fragments on deep charcoal with a few warm colors" },
  { name: "Frost", styleDirective: "crystalline symmetric ice-blue lattice with delicate white linework" },
  { name: "Verdant", styleDirective: "organic tangled vines and leaf shapes in layered greens with hand-drawn energy" },
];

export function Studio() {
  const ev = useLiveEvolve([]);
  const [rows, setRows] = useState<Row[]>(DEFAULTS);
  const [theme, setTheme] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestErr, setSuggestErr] = useState<string | null>(null);

  const valid = rows.filter((r) => r.styleDirective.trim().length >= 8);
  const started = ev.runs > 0 || ev.running || ev.pieces.length > 0;

  async function suggest() {
    setSuggesting(true);
    setSuggestErr(null);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      const j = await res.json();
      if (j.artists) setRows(j.artists);
      else setSuggestErr(j.message || "Couldn't suggest — try again.");
    } catch {
      setSuggestErr("Network error.");
    }
    setSuggesting(false);
  }

  function setRow(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((rs) => (rs.length >= 5 ? rs : [...rs, { name: "", styleDirective: "" }]));
  }
  function removeRow(i: number) {
    setRows((rs) => (rs.length <= 2 ? rs : rs.filter((_, j) => j !== i)));
  }

  return (
    <div>
      {!started && (
        <div className="card">
          <h3>Design your starting population</h3>
          <p className="sub" style={{ marginTop: 0 }}>
            Write 2–5 artists (a name + a one-line aesthetic), or let the machine invent a set. Then run a
            real evolution on them, live.
          </p>

          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <input
              className="input"
              placeholder="optional theme, e.g. “deep sea”, “bauhaus”, “fire”"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{ flex: 1, minWidth: 220 }}
            />
            <button className="btn" onClick={suggest} disabled={suggesting}>
              {suggesting ? <span className="spinner" /> : "✨ Suggest artists"}
            </button>
          </div>
          {suggestErr && <p style={{ color: "var(--down)", fontSize: "0.85rem" }}>{suggestErr}</p>}

          <div style={{ display: "grid", gap: 10 }}>
            {rows.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <input
                  className="input"
                  placeholder="name"
                  value={r.name}
                  onChange={(e) => setRow(i, { name: e.target.value })}
                  style={{ width: 130, flex: "none" }}
                />
                <input
                  className="input"
                  placeholder="a one-line style directive (aesthetic)…"
                  value={r.styleDirective}
                  onChange={(e) => setRow(i, { styleDirective: e.target.value })}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn"
                  onClick={() => removeRow(i)}
                  disabled={rows.length <= 2}
                  style={{ padding: "8px 12px", flex: "none" }}
                  title="remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn" onClick={addRow} disabled={rows.length >= 5}>
              + Add artist
            </button>
            <button
              className="btn gold"
              onClick={() => ev.run({ directives: valid })}
              disabled={valid.length < 2 || ev.running}
            >
              Create &amp; evolve — live ✨
            </button>
            <span style={{ color: "var(--faint)", fontSize: "0.82rem" }}>
              {valid.length}/5 ready · runs on Haiku, rate-limited + daily-capped
            </span>
          </div>
        </div>
      )}

      {started && (
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn gold" onClick={() => ev.run({ genomes: ev.population })} disabled={ev.running}>
            {ev.running ? "Evolving live…" : "Evolve this population again — live ✨"}
          </button>
          {ev.genNum !== null && !ev.running && (
            <span className="chip">
              live generation <b>{ev.genNum}</b>
            </span>
          )}
          <button className="btn" onClick={() => window.location.reload()} disabled={ev.running}>
            ↺ Start over
          </button>
        </div>
      )}

      <LiveResults ev={ev} />
    </div>
  );
}
