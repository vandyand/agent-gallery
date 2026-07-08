import { hallOfFame } from "@/lib/data";
import { LineageView } from "@/components/LineageView";

export const metadata = { title: "Lineage — The Evolving Gallery" };

export default function LineagePage() {
  const hof = hallOfFame();
  if (!hof.length) return <main className="wrap"><p className="sub">No pieces yet.</p></main>;
  return (
    <main className="wrap">
      <LineageView activeId={hof[0].piece.id} />
    </main>
  );
}
