"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRun } from "@/components/RunProvider";
import { runPiece } from "@/lib/run";

const OP_LABEL: Record<string, string> = { seed: "seed", survive: "survived", mutation: "mutation", crossover: "crossover" };

export function PieceOverlay() {
  const { run, selectedPieceId, select, forkActive, running } = useRun();
  const router = useRouter();

  // Dialog behavior: close on Escape when open.
  useEffect(() => {
    if (!selectedPieceId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") select(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedPieceId, select]);

  if (!run || !selectedPieceId) return null;
  const pv = runPiece(run, selectedPieceId);
  if (!pv) return null;
  const { piece, genome } = pv;
  const lastGen = run.generations.length - 1;

  return (
    <div className="overlay-backdrop" onClick={() => select(null)}>
      <div className="overlay-card" role="dialog" aria-modal="true" aria-label={`${piece.artist} — piece detail`} onClick={(e) => e.stopPropagation()}>
        <button className="overlay-close" onClick={() => select(null)} aria-label="Close">
          ✕
        </button>
        <div className="overlay-grid">
          <div className="overlay-art">
            {piece.disqualified ? (
              <div style={{ color: "var(--down)", padding: 24, border: "1px dashed #3a2b30", borderRadius: 8 }}>
                rejected — {piece.reason}
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={piece.art} alt={piece.artist} />
            )}
          </div>
          <div>
            <div className="kicker">
              Gen {piece.gen} · {OP_LABEL[piece.op] ?? piece.op}
            </div>
            <h2 className="serif" style={{ fontSize: "1.7rem", margin: "4px 0 6px" }}>
              {piece.artist}
            </h2>
            <div style={{ color: "var(--muted)", marginBottom: 14 }}>
              Fitness <b className="mono" style={{ color: "var(--gold-2)" }}>{piece.fit.toFixed(1)}</b>/10 · critics{" "}
              <b className="mono">{piece.critics.toFixed(1)}</b>
            </div>

            {genome && (
              <div className="card" style={{ marginBottom: 14 }}>
                <h3>Style genome</h3>
                <p className="directive" style={{ fontSize: "1rem" }}>“{genome.styleDirective}”</p>
              </div>
            )}

            {piece.critiques.length > 0 && (
              <div className="card" style={{ marginBottom: 14 }}>
                <h3>The critics</h3>
                {piece.critiques.map((c) => (
                  <div key={c.lens} className="critic" style={{ gridTemplateColumns: "30px 1fr" }}>
                    <div className="score">{c.score}</div>
                    <div>
                      <div className="lens">{c.lens}</div>
                      <div className="verdict">“{c.oneLine}”</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!piece.disqualified && (
              <button
                className="btn gold"
                disabled={running}
                onClick={() => {
                  forkActive(piece.gen);
                  select(null);
                  router.push("/evolution");
                }}
                title={`Start a new run from generation ${piece.gen}, carrying its history`}
              >
                ⑂ Fork the run from gen {piece.gen}
              </button>
            )}
            {piece.gen === lastGen && !piece.disqualified && (
              <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>
                This is the newest generation — fork to breed a fresh branch from here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
