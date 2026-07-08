import { hallOfFame } from "@/lib/data";
import { LineageView } from "@/components/LineageView";

export function generateStaticParams() {
  return hallOfFame().map((v) => ({ id: v.piece.id }));
}

export default async function LineagePiecePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="wrap">
      <LineageView activeId={id} />
    </main>
  );
}
