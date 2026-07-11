"use client";

import { useRun } from "@/components/RunProvider";
import type { RunPiece } from "@/lib/run";

// A framed artwork on a wall. Clicking opens the shared inspect overlay for the
// active run — works whether the run is featured, saved, or live.
export function RunPieceCard({ piece }: { piece: RunPiece }) {
  const { select } = useRun();
  return (
    <div
      className="frame"
      role="button"
      tabIndex={0}
      style={{ cursor: "pointer" }}
      onClick={() => select(piece.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") select(piece.id);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="art" src={piece.art} alt={`Artwork by ${piece.artist}`} loading="lazy" />
      <div className="plaque">
        <div>
          <div className="name">{piece.artist}</div>
          <div className="gen">Gen {piece.gen}</div>
        </div>
        <div className="fit-badge" title="Fitness (0–10)">
          {piece.fit.toFixed(1)}
        </div>
      </div>
    </div>
  );
}
