import { evolveFrames, fitnessSeries, modelAB } from "@/lib/data";
import { EvolveTheatre } from "@/components/EvolveTheatre";
import { ModelABPanel } from "@/components/ModelABPanel";

export const metadata = { title: "Evolution — The Evolving Gallery" };

export default function EvolutionPage() {
  const frames = evolveFrames();
  const series = fitnessSeries();
  const ab = modelAB();
  return (
    <main className="wrap">
      <section className="hero" style={{ padding: "40px 0 14px" }}>
        <div className="kicker">The optimization loop</div>
        <h1 className="serif" style={{ fontSize: "clamp(1.9rem,4vw,2.9rem)" }}>
          Watch the art get better.
        </h1>
        <p className="lede">
          Hit <b style={{ color: "var(--gold-2)" }}>Evolve</b> to advance the gallery one generation at a
          time. Each step, the fittest artists survive; their style genomes are mutated — steered by the
          critics’ own feedback — and cross-bred into a new population. The curve is real data from a run
          that already happened.
        </p>
      </section>

      <EvolveTheatre frames={frames} series={series} />

      {ab && (
        <section className="section" style={{ marginTop: 30 }}>
          <h2 className="serif">The cost of quality</h2>
          <p className="sub">Every call is metered. Cheap by default; the expensive tier earns its place only if measured.</p>
          <ModelABPanel ab={ab} />
        </section>
      )}
    </main>
  );
}
