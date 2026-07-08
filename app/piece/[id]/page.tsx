import Link from "next/link";
import { notFound } from "next/navigation";
import { pieceView, allPieceIds, gallery } from "@/lib/data";
import { VoteButton } from "@/components/VoteButton";

export function generateStaticParams() {
  return allPieceIds().map((id) => ({ id }));
}

export default async function PiecePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const view = pieceView(id);
  if (!view) notFound();
  const { piece, gen, fitness, critiques, genome } = view;

  if (piece.disqualified) {
    return (
      <main className="wrap">
        <Link href="/rejected" className="back">
          ← Rejected sketches
        </Link>
        <div className="detail" style={{ gridTemplateColumns: "1fr" }}>
          <div>
            <div className="kicker">Rejected · Gen {piece.generation}</div>
            <h1 className="serif" style={{ fontSize: "2rem", margin: "6px 0 16px" }}>
              {piece.artistName}
            </h1>
            <div className="card">
              <h3>Why the guard rejected it</h3>
              <div className="reject" style={{ background: "none", border: "none", padding: 0 }}>
                <span className="stamp">{piece.guard.reason}</span>
              </div>
              <div className="checks" style={{ marginTop: 14, fontSize: "0.85rem" }}>
                {piece.guard.checks.map((c) => (
                  <div key={c.name} className="mono">
                    <span className={c.ok ? "ok" : "no"} style={{ color: c.ok ? "var(--up)" : "var(--down)" }}>
                      {c.ok ? "✓" : "✗"}
                    </span>{" "}
                    {c.name}
                    {c.detail ? ` — ${c.detail}` : ""}
                  </div>
                ))}
              </div>
            </div>
            <p className="sub">
              This is the point: AI-generated code that doesn’t render, or smuggles in a script tag,
              gets caught here instead of on the wall.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const bars: { label: string; val: number; color: string }[] = [
    { label: "Critics", val: fitness?.critics ?? 0, color: "linear-gradient(90deg,#c9a24b,#e0c074)" },
    { label: "Human votes", val: fitness?.human ?? 0, color: "linear-gradient(90deg,#3f8f63,#6cc58f)" },
    { label: "Novelty", val: fitness?.novelty ?? 0, color: "linear-gradient(90deg,#7a6bd8,#a99cf0)" },
  ];

  return (
    <main className="wrap">
      <Link href="/" className="back">
        ← The wall
      </Link>
      <div className="detail">
        <div className="canvas">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={piece.svgPath} alt={`Artwork by ${piece.artistName}`} />
        </div>

        <div>
          <div className="kicker">Gen {piece.generation}</div>
          <h1 className="serif" style={{ fontSize: "2.2rem", margin: "6px 0 4px" }}>
            {piece.artistName}
          </h1>
          <div style={{ color: "var(--muted)", marginBottom: 18, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span>
              Fitness <b style={{ color: "var(--gold-2)" }} className="mono">{(fitness?.total ?? 0).toFixed(2)}</b>/10
            </span>
            <VoteButton pieceId={piece.id} />
          </div>

          <div className="card">
            <h3>Style genome</h3>
            <p className="directive">“{genome?.styleDirective}”</p>
            {genome && (
              <div className="mono" style={{ marginTop: 12, fontSize: "0.8rem", color: "var(--faint)" }}>
                palette {genome.params.paletteSize} · complexity {genome.params.complexity.toFixed(2)} ·
                symmetry {genome.params.symmetry.toFixed(2)} · stroke/fill {genome.params.strokeFill.toFixed(2)}
                <br />
                {genome.lineage.op} · {genome.model}
              </div>
            )}
          </div>

          <div className="card">
            <h3>The critics · {critiques.length} lenses</h3>
            {critiques.map((c) => (
              <div key={c.lens} className="critic">
                <div className="score">{c.score}</div>
                <div>
                  <div className="lens">{c.lens}</div>
                  <div className="verdict">“{c.oneLine}”</div>
                  <div className="model">{c.judgeModel}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3>Fitness breakdown</h3>
            {bars.map((b) => (
              <div key={b.label} className="fitrow">
                <span className="label">{b.label}</span>
                <span className="bar">
                  <span style={{ width: `${(b.val / 10) * 100}%`, background: b.color }} />
                </span>
                <span className="val mono">{b.val.toFixed(1)}</span>
              </div>
            ))}
            <div className="fitrow" style={{ marginTop: 8, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
              <span className="label" style={{ color: "var(--ink)", fontWeight: 600 }}>
                Total
              </span>
              <span className="bar">
                <span style={{ width: `${((fitness?.total ?? 0) / 10) * 100}%`, background: "linear-gradient(90deg,#e0c074,#c9a24b)" }} />
              </span>
              <span className="val mono" style={{ color: "var(--gold-2)", fontWeight: 700 }}>
                {(fitness?.total ?? 0).toFixed(1)}
              </span>
            </div>
            <p className="mono" style={{ fontSize: "0.72rem", color: "var(--faint)", marginTop: 12, marginBottom: 0 }}>
              weights: critics {gallery().fitnessWeights.critics} · votes {gallery().fitnessWeights.human} ·
              novelty {gallery().fitnessWeights.novelty}
            </p>
          </div>

          <div className="card">
            <h3>Guard · passed {piece.guard.checks.length}/{piece.guard.checks.length}</h3>
            <div className="mono" style={{ fontSize: "0.78rem", lineHeight: 1.7 }}>
              {piece.guard.checks.map((c) => (
                <span key={c.name} style={{ display: "inline-block", marginRight: 12, color: "var(--muted)" }}>
                  <span style={{ color: c.ok ? "var(--up)" : "var(--down)" }}>{c.ok ? "✓" : "✗"}</span> {c.name}
                </span>
              ))}
            </div>
            <p className="mono" style={{ fontSize: "0.72rem", color: "var(--faint)", marginTop: 10, marginBottom: 0 }}>
              {piece.guard.elements} shapes · {(piece.guard.bytes / 1024).toFixed(1)} KB · rendered headless
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
