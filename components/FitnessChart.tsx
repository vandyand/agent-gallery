"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export type Point = {
  gen: number;
  quality: number;
  mean: number;
  best: number;
  bestSoFar: number;
  cost: number;
};

export function FitnessChart({ data }: { data: Point[] }) {
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 6, left: -10 }}>
          <CartesianGrid stroke="#2a2731" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="gen"
            stroke="#6f6a7d"
            tick={{ fontSize: 12 }}
            label={{ value: "generation", position: "insideBottom", offset: -2, fill: "#6f6a7d", fontSize: 11 }}
          />
          <YAxis domain={[3, 8]} stroke="#6f6a7d" tick={{ fontSize: 12 }} width={40} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "#17161c",
              border: "1px solid #2a2731",
              borderRadius: 8,
              color: "#ece7f2",
              fontSize: 13,
            }}
            labelFormatter={(g) => `Generation ${g}`}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#a49fb0" }} />
          <Line
            type="monotone"
            dataKey="quality"
            name="Art quality (critics)"
            stroke="#e0c074"
            strokeWidth={3}
            dot={{ r: 3, fill: "#e0c074" }}
          />
          <Line
            type="monotone"
            dataKey="bestSoFar"
            name="Best so far"
            stroke="#6cc58f"
            strokeWidth={1.6}
            strokeDasharray="4 3"
            dot={{ r: 2 }}
          />
          <Line
            type="monotone"
            dataKey="mean"
            name="Fitness (mean)"
            stroke="#7a6bd8"
            strokeWidth={1.6}
            dot={{ r: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
