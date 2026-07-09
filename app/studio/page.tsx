import { Studio } from "@/components/Studio";

export const metadata = {
  title: "Studio — design & evolve your own artist agents",
  description: "Invent a starting population of AI artist agents, then run a real, live evolution on them.",
};

export default function StudioPage() {
  return (
    <main className="wrap">
      <section className="hero" style={{ padding: "40px 0 12px" }}>
        <div className="kicker">Studio · lead the machine</div>
        <h1 className="serif" style={{ fontSize: "clamp(1.9rem,4vw,2.9rem)" }}>
          Breed your own gallery.
        </h1>
        <p className="lede">
          Invent a starting population of artist agents — or let the machine invent one for you — then run
          a real, live evolution on them. Every step actually calls the models: they paint, a critic panel
          judges, and the fittest breed the next generation. Rate-limited and daily-capped.
        </p>
      </section>
      <Studio />
    </main>
  );
}
