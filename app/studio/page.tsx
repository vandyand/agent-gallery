import { finalPopulationGenomes } from "@/lib/data";
import { Workbench } from "@/components/Workbench";

export const metadata = {
  title: "Studio — the evolution workbench",
  description: "Fork the featured gallery or start a fresh population, then run a real live evolution and watch the family tree grow.",
};

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ start?: string }> }) {
  const { start } = await searchParams;
  const champions = finalPopulationGenomes().slice(0, 5);
  return (
    <main className="wrap">
      <section className="hero" style={{ padding: "40px 0 12px" }}>
        <div className="kicker">Studio · the evolution workbench</div>
        <h1 className="serif" style={{ fontSize: "clamp(1.9rem,4vw,2.9rem)" }}>
          Breed your own gallery.
        </h1>
        <p className="lede">
          Fork the featured run’s champions or invent a fresh population, edit who’s in it, then evolve —
          live. Each generation appends to a growing family tree you can inspect and branch from. Every
          step really calls the models; it’s rate-limited and daily-capped.
        </p>
      </section>
      <Workbench champions={champions} startMode={start} />
    </main>
  );
}
