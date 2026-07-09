import Link from "next/link";
import type { Ancestor } from "@/lib/data";

const OP_LABEL: Record<string, string> = {
  seed: "seed",
  survive: "survived",
  mutation: "mutation",
  crossover: "crossover",
};
const OP_COLOR: Record<string, string> = {
  seed: "#8fb4d8",
  survive: "#e0c074",
  mutation: "#a99cf0",
  crossover: "#6cc58f",
};

// Vertical family tree: gen-0 ancestors at the top, flowing DOWN to the selected
// masterpiece at the bottom. A crossover shows two parents merging into one node.
function VNode({ a }: { a: Ancestor }) {
  const op = a.genome.lineage.op;
  const color = OP_COLOR[op] ?? "#888";
  return (
    <div className="vnode">
      {a.parents.length > 0 && (
        <div className="vparents" data-multi={a.parents.length > 1 ? "1" : "0"}>
          {a.parents.map((p) => (
            <VNode key={p.genome.id} a={p} />
          ))}
        </div>
      )}
      <div className="vcard" style={{ borderColor: color }}>
        {a.piece ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.piece.thumbPath} alt={a.genome.name} className="vthumb" />
        ) : (
          <div className="vthumb vempty">✕</div>
        )}
        <div className="vmeta">
          <div className="vname">
            {a.piece ? <Link href={`/piece/${a.piece.id}`}>{a.genome.name}</Link> : a.genome.name}
          </div>
          <div className="vsub">
            <span className="vop" style={{ color }}>
              {OP_LABEL[op] ?? op}
            </span>
            <span className="vgen">gen {a.genome.lineage.generation}</span>
            {a.fitness !== undefined && <span className="vfit">{a.fitness.toFixed(1)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LineageTree({ root }: { root: Ancestor }) {
  return (
    <div className="vtree-scroll">
      <VNode a={root} />
    </div>
  );
}
