import Link from "next/link";
import type { Ancestor } from "@/lib/data";

const OP_LABEL: Record<string, string> = {
  seed: "seed",
  survive: "survived",
  mutation: "mutation",
  crossover: "crossover",
};

// Horizontal family tree: the selected piece on the right, its ancestors
// branching left back to the generation-0 seeds. Crossovers branch into two.
function Node({ a }: { a: Ancestor }) {
  const op = a.genome.lineage.op;
  return (
    <div className="lin-node">
      {a.parents.length > 0 && (
        <div className="lin-parents">
          {a.parents.map((p) => (
            <Node key={p.genome.id} a={p} />
          ))}
        </div>
      )}
      <div className="lin-card">
        {a.piece ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.piece.thumbPath} alt={a.genome.name} className="lin-thumb" />
        ) : (
          <div className="lin-thumb lin-empty">✕</div>
        )}
        <div className="lin-meta">
          <div className="lin-name">
            {a.piece ? <Link href={`/piece/${a.piece.id}`}>{a.genome.name}</Link> : a.genome.name}
          </div>
          <div className="lin-op">
            <span className={`op op-${op}`}>{OP_LABEL[op] ?? op}</span>
            <span className="lin-gen">gen {a.genome.lineage.generation}</span>
            {a.fitness !== undefined && <span className="lin-fit">{a.fitness.toFixed(1)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LineageTree({ root }: { root: Ancestor }) {
  return (
    <div className="lin-scroll">
      <Node a={root} />
    </div>
  );
}
