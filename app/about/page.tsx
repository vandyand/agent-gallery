import Link from "next/link";
import { gallery } from "@/lib/data";
import { MODELS } from "@/engine/models";

export const metadata = { title: "How it works — The Evolving Gallery" };

export default function AboutPage() {
  const g = gallery();
  return (
    <main className="wrap" style={{ maxWidth: 820 }}>
      <section className="hero" style={{ padding: "44px 0 10px" }}>
        <div className="kicker">How it works</div>
        <h1 className="serif" style={{ fontSize: "clamp(1.9rem,4vw,2.9rem)" }}>
          A gallery is the disguise. It’s an eval harness with an optimizer.
        </h1>
        <p className="lede">
          The fun surface — a wall of AI art that improves over time — sits on the exact machinery that
          keeps real AI agents from silently rotting: measurement, guardrails, a judge panel, and a
          human-in-the-loop optimization loop.
        </p>
      </section>

      <div className="card">
        <h3>One generation, step by step</h3>
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
          <li>
            <b>Generate.</b> Each artist agent is an LLM ({MODELS.artist}) with an evolving “style
            genome” — a natural-language aesthetic plus numeric knobs. It writes a self-contained SVG.
          </li>
          <li>
            <b>Guard (deterministic).</b> Every SVG runs a gauntlet: parses? no scripts / handlers /
            external URLs / foreignObject? enough drawable shapes? under 50&nbsp;KB? renders headless
            without error? A failure is disqualified <em>with a reason</em> and sent to the{" "}
            <Link href="/rejected" style={{ color: "var(--gold-2)" }}>
              rejected drawer
            </Link>
            . This is the reliability story, made literal.
          </li>
          <li>
            <b>Judge (subjective).</b> Survivors are rasterized and shown to a panel of{" "}
            {MODELS.judges.length} AI critics across three providers, each scoring one lens 0–10 with a
            one-line verdict.
          </li>
          <li>
            <b>Score.</b> Fitness = a transparent blend of critic scores, human votes, and a novelty
            bonus (to prevent mode collapse). Weights are shown on every piece.
          </li>
          <li>
            <b>Select &amp; breed.</b> The fittest artists survive; the optimizer mutates and
            cross-breeds their genomes into the next generation — with a human able to vote and veto.
          </li>
        </ol>
      </div>

      <div className="card">
        <h3>Why it’s honest</h3>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Every artwork was really generated and really judged. Token cost is tracked per call and
          totaled openly (${g.totalCostUsd.toFixed(2)} so far). The guard rejections are real
          failures, not staged. Cheap models by default; an expensive tier is used for A/B so the
          cost↔quality tradeoff is visible rather than hidden.
        </p>
      </div>

      <div className="card">
        <h3>The critic panel</h3>
        <div className="mono" style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.9 }}>
          {MODELS.judges.map((j) => (
            <div key={j.lens}>
              <span style={{ color: "var(--gold-2)" }}>{j.lens}</span> — {j.model}
            </div>
          ))}
        </div>
      </div>

      <footer className="footer" style={{ padding: "20px 0 60px" }}>
        Built by Andrew VanDyke. <a href="https://github.com/vandyand/agent-gallery">Source on GitHub</a>.
      </footer>
    </main>
  );
}
