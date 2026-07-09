import Link from "next/link";
import { flowData, fitnessSeries, modelAB, finalPopulationGenomes } from "@/lib/data";
import { EvolutionFlow } from "@/components/EvolutionFlow";
import { FitnessChart } from "@/components/FitnessChart";
import { ModelABPanel } from "@/components/ModelABPanel";
import { OpLegend, OpExplainer } from "@/components/OpLegend";
import { LiveEvolve } from "@/components/LiveEvolve";

export const metadata = { title: "Evolution — The Evolving Gallery" };

export default function EvolutionPage() {
  const flow = flowData();
  const series = fitnessSeries();
  const ab = modelAB();
  const champions = finalPopulationGenomes().slice(0, 5);

  return (
    <main className="wrap">
      <section className="hero" style={{ padding: "40px 0 12px" }}>
        <div className="kicker">The optimization loop</div>
        <h1 className="serif" style={{ fontSize: "clamp(1.9rem,4vw,2.9rem)" }}>
          The whole algorithm, in one picture.
        </h1>
        <p className="lede">
          Read it left to right: each column is a generation. Every artwork is a node; the lines show
          where each new artist came from. Top artists <b style={{ color: "#e0c074" }}>survive</b>,
          the promising ones <b style={{ color: "#a99cf0" }}>mutate</b> or{" "}
          <b style={{ color: "#6cc58f" }}>cross-breed</b>, and the weak ones are{" "}
          <b style={{ color: "var(--faint)" }}>culled</b>. Click any piece to inspect it.
        </p>
      </section>

      <OpLegend />
      <EvolutionFlow nodes={flow.nodes} edges={flow.edges} generations={flow.generations} />

      <section className="section" style={{ marginTop: 26 }}>
        <h2 className="serif">Run it live</h2>
        <p className="sub">
          The graph above is a real run that already happened. Push it further right now: this spawns a
          genuine new generation from the current champions — the models actually paint and judge, live.
          Want to start from scratch instead?{" "}
          <Link href="/studio" style={{ color: "var(--gold-2)" }}>
            Design your own population →
          </Link>
        </p>
        <LiveEvolve initialGenomes={champions} />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, marginTop: 24 }} className="evo-grid">
        <div className="card">
          <h3>Art quality over generations</h3>
          <p className="sub" style={{ marginTop: 0, marginBottom: 10 }}>
            The critic score climbs as artists refine on feedback. Novelty declines as the population
            converges on winning styles — the honest exploration/exploitation tradeoff.
          </p>
          <FitnessChart data={series} />
        </div>
        <OpExplainer />
      </div>

      {ab && (
        <section className="section" style={{ marginTop: 20 }}>
          <h2 className="serif">The cost of quality</h2>
          <p className="sub">
            Every call is metered. Cheap by default; the expensive tier earns its place only if measured.
          </p>
          <ModelABPanel ab={ab} />
        </section>
      )}
    </main>
  );
}
