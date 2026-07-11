"use client";

import { useRun } from "@/components/RunProvider";
import { runRejected } from "@/lib/run";

export default function RejectedPage() {
  const { run, loading, select } = useRun();

  if (loading || !run) {
    return (
      <main className="wrap">
        <p style={{ padding: "3rem 0", color: "var(--muted)" }}>Loading…</p>
      </main>
    );
  }

  const rej = runRejected(run);

  return (
    <main className="wrap">
      <section className="hero" style={{ padding: "44px 0 20px" }}>
        <div className="kicker">The reliability layer · {run.name}</div>
        <h1 className="serif" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)" }}>
          Rejected sketches
        </h1>
        <p className="lede">
          These pieces were generated but never reached the wall. Each failed the guard — the deterministic
          gauntlet every artwork passes: parses as SVG, no scripts or external URLs, enough drawable shapes,
          under budget, renders without error. This is “AI code that silently breaks,” caught and labeled.
        </p>
      </section>

      {rej.length === 0 ? (
        <p className="sub">Nothing rejected in this run — every piece passed the guard.</p>
      ) : (
        <div className="rejgrid">
          {rej.map((p) => (
            <div
              key={p.id}
              className="reject"
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() => select(p.id)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && select(p.id)}
            >
              <div className="art-name">{p.artist}</div>
              <div className="gen" style={{ color: "var(--faint)", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Gen {p.gen}
              </div>
              <div>
                <span className="stamp">{p.reason}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
