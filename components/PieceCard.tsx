import Link from "next/link";
import type { PieceView } from "@/lib/data";

// A framed artwork on the gallery wall. SVGs are pre-sanitized by the guard, so
// loading them via <img> is both safe and crisp at any size.
export function PieceCard({ view }: { view: PieceView }) {
  const { piece, fitness, critiques } = view;
  const fit = fitness?.total ?? 0;
  return (
    <Link href={`/piece/${piece.id}`} className="frame">
      <div className="lenses">
        {critiques.slice(0, 4).map((c) => (
          <span key={c.lens} className="lens-pill" title={c.lens}>
            {c.lens[0]} {c.score}
          </span>
        ))}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="art" src={piece.svgPath} alt={`Artwork by ${piece.artistName}`} loading="lazy" />
      <div className="plaque">
        <div>
          <div className="name">{piece.artistName}</div>
          <div className="gen">Gen {piece.generation}</div>
        </div>
        <div className="fit-badge" title="Fitness (0–10)">
          {fit.toFixed(1)}
        </div>
      </div>
    </Link>
  );
}
