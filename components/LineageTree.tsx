"use client";

import type { Ancestor } from "@/lib/run";

const OP_LABEL: Record<string, string> = { seed: "seed", survive: "survived", mutation: "mutation", crossover: "crossover" };
const OP_COLOR: Record<string, string> = { seed: "#8fb4d8", survive: "#e0c074", mutation: "#a99cf0", crossover: "#6cc58f" };

// Vertical family tree: gen-0 ancestors at the top, flowing DOWN to the selected
// masterpiece at the bottom. A crossover shows two parents merging. Clicking a
// node opens the shared inspect overlay for that ancestor.
function VNode({ a, onSelect }: { a: Ancestor; onSelect: (id: string) => void }) {
  const op = a.genome.lineage.op;
  const color = OP_COLOR[op] ?? "#888";
  return (
    <div className="vnode">
      {a.parents.length > 0 && (
        <div className="vparents" data-multi={a.parents.length > 1 ? "1" : "0"}>
          {a.parents.map((p) => (
            <VNode key={p.genome.id} a={p} onSelect={onSelect} />
          ))}
        </div>
      )}
      <div
        className="vcard"
        style={{ borderColor: color, cursor: a.piece ? "pointer" : "default" }}
        onClick={() => a.piece && onSelect(a.piece.id)}
      >
        {a.piece ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.piece.art} alt={a.genome.name} className="vthumb" />
        ) : (
          <div className="vthumb vempty">✕</div>
        )}
        <div className="vmeta">
          <div className="vname">{a.genome.name}</div>
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

export function LineageTree({ root, onSelect }: { root: Ancestor; onSelect: (id: string) => void }) {
  return (
    <div className="vtree-scroll">
      <VNode a={root} onSelect={onSelect} />
    </div>
  );
}
