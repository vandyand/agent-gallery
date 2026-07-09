"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { FlowNode } from "@/lib/data";

const OP_COLOR: Record<string, string> = {
  seed: "#8fb4d8",
  survive: "#e0c074",
  mutation: "#a99cf0",
  crossover: "#6cc58f",
};
const OP_LABEL: Record<string, string> = {
  seed: "seed",
  survive: "survived",
  mutation: "mutation",
  crossover: "crossover",
};

const COL_W = 210;
const ROW_H = 120;

function artSrc(n: FlowNode) {
  return n.svg ? `data:image/svg+xml;utf8,${encodeURIComponent(n.svg)}` : n.thumb;
}

function PieceNode({ data }: NodeProps) {
  const n = data as unknown as FlowNode;
  const color = OP_COLOR[n.op] ?? "#888";
  if (n.disqualified) {
    return (
      <div className="flow-node reject" title={n.reason}>
        <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
        <div className="fn-x">✕</div>
        <div className="fn-meta">
          <div className="fn-name" style={{ color: "var(--down)" }}>{n.artist}</div>
          <div className="fn-reason">{n.reason}</div>
        </div>
        <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      </div>
    );
  }
  return (
    <div
      className="flow-node"
      style={{ borderColor: color, opacity: n.culled ? 0.45 : 1 }}
      title={`${n.artist} · fitness ${n.fit} · ${OP_LABEL[n.op]}${n.culled ? " · culled (no offspring)" : ""}`}
    >
      <Handle type="target" position={Position.Left} style={{ background: color }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={artSrc(n)} alt={n.artist} className="fn-thumb" />
      <div className="fn-meta">
        <div className="fn-name">{n.artist}</div>
        <div className="fn-sub">
          <span className="fn-op" style={{ color }}>
            {OP_LABEL[n.op]}
          </span>
          <span className="fn-fit">{n.fit}</span>
        </div>
      </div>
      {n.culled && <div className="fn-culled">culled</div>}
      <Handle type="source" position={Position.Right} style={{ background: color }} />
    </div>
  );
}

const nodeTypes = { piece: PieceNode };

export function EvolutionFlow({
  nodes,
  edges,
  generations,
  onSelect,
  height,
}: {
  nodes: FlowNode[];
  edges: { id: string; source: string; target: string; op: string }[];
  generations: number;
  onSelect?: (id: string) => void; // inline inspect (workbench); default = navigate
  height?: number;
}) {
  const router = useRouter();

  const rfNodes = useMemo<Node[]>(() => {
    const pieceNodes: Node[] = nodes.map((n) => ({
      id: n.id,
      type: "piece",
      position: { x: n.gen * COL_W, y: n.indexInGen * ROW_H },
      data: n as unknown as Record<string, unknown>,
      draggable: false,
      connectable: false,
    }));
    // generation column headers
    const labels: Node[] = Array.from({ length: generations }, (_, g) => ({
      id: `gen-label-${g}`,
      position: { x: g * COL_W, y: -64 },
      data: { label: `Gen ${g}` },
      draggable: false,
      selectable: false,
      connectable: false,
      style: {
        background: "transparent",
        border: "none",
        color: "#a49fb0",
        fontFamily: "var(--font-mono), monospace",
        fontSize: 12,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        width: 120,
      },
    }));
    return [...labels, ...pieceNodes];
  }, [nodes, generations]);

  const rfEdges = useMemo<Edge[]>(
    () =>
      edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "smoothstep",
        style: { stroke: OP_COLOR[e.op] ?? "#555", strokeWidth: 1.5, opacity: 0.7 },
      })),
    [edges],
  );

  return (
    <div className="flow-wrap" style={height ? { height } : undefined}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.2}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node) => {
          if (String(node.id).startsWith("gen-label")) return;
          if (onSelect) onSelect(String(node.id));
          else router.push(`/piece/${node.id}`);
        }}
        nodesDraggable={false}
        nodesConnectable={false}
      >
        <Background color="#2a2731" gap={22} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
