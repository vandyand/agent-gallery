import Link from "next/link";
import { hallOfFame, ancestryOfPiece } from "@/lib/data";
import { LineageTree } from "@/components/LineageTree";

// Shared lineage view: a strip of masterpieces to pick from + the ancestry tree
// of the active one, traced back to the generation-0 seeds.
export function LineageView({ activeId }: { activeId: string }) {
  const hof = hallOfFame();
  const root = ancestryOfPiece(activeId);

  return (
    <>
      <section className="hero" style={{ padding: "44px 0 14px" }}>
        <div className="kicker">Provenance</div>
        <h1 className="serif" style={{ fontSize: "clamp(1.9rem,4vw,2.9rem)" }}>
          Trace a masterpiece back to gen 0.
        </h1>
        <p className="lede">
          As generations breed, each artist inherits from parents by mutation (steered by the critics’
          own feedback) and crossover. Pick a piece to follow its bloodline back to the founding seeds.
        </p>
      </section>

      <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "6px 0 20px" }}>
        {hof.map((v) => (
          <Link
            key={v.piece.id}
            href={`/lineage/${v.piece.id}`}
            title={`${v.piece.artistName} · fitness ${(v.fitness?.total ?? 0).toFixed(1)}`}
            style={{
              flex: "none",
              border: `2px solid ${v.piece.id === activeId ? "var(--gold)" : "transparent"}`,
              borderRadius: 8,
              padding: 3,
              background: "var(--panel)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={v.piece.thumbPath}
              alt={v.piece.artistName}
              style={{ width: 64, height: 64, borderRadius: 5, display: "block", background: "#fff" }}
            />
          </Link>
        ))}
      </div>

      {root ? (
        <LineageTree root={root} />
      ) : (
        <p className="sub">No lineage found for this piece.</p>
      )}
    </>
  );
}
