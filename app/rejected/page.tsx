import Link from "next/link";
import { rejected } from "@/lib/data";

export const metadata = { title: "Rejected sketches — The Evolving Gallery" };

export default function RejectedPage() {
  const rej = rejected();
  return (
    <main className="wrap">
      <section className="hero" style={{ padding: "44px 0 20px" }}>
        <div className="kicker">The reliability layer</div>
        <h1 className="serif" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)" }}>
          Rejected sketches
        </h1>
        <p className="lede">
          These pieces were generated but never reached the wall. Each one failed the guard — the
          deterministic gauntlet every artwork passes before it’s shown: parses as SVG, no scripts or
          external URLs, enough drawable shapes, under budget, and renders headless without error. This
          is “AI code that silently breaks,” caught and labeled instead.
        </p>
      </section>

      {rej.length === 0 ? (
        <p className="sub">Nothing rejected yet — every piece passed the guard.</p>
      ) : (
        <div className="rejgrid">
          {rej.map(({ piece, gen }) => (
            <Link key={piece.id} href={`/piece/${piece.id}`} className="reject">
              <div className="art-name">{piece.artistName}</div>
              <div className="gen" style={{ color: "var(--faint)", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Gen {gen}
              </div>
              <div>
                <span className="stamp">{piece.guard.reason}</span>
              </div>
              <div className="checks">
                {piece.guard.checks.slice(-3).map((c) => (
                  <div key={c.name}>
                    <span className={c.ok ? "ok" : "no"}>{c.ok ? "✓" : "✗"}</span> {c.name}
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
