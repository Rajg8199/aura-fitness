"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const GRID = "hsl(var(--border))";
const AXIS = "hsl(var(--muted-foreground))";

const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 12,
    fontSize: 12,
    boxShadow: "0 8px 30px -12px rgba(0,0,0,0.4)",
  },
  labelStyle: { color: "hsl(var(--muted-foreground))", fontWeight: 600 },
};

const fmtDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export function AreaTrend({
  data,
  dataKey,
  xKey = "date",
  color = "hsl(258 90% 66%)",
  height = 240,
  unit = "",
  formatX = fmtDate,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  xKey?: string;
  color?: string;
  height?: number;
  unit?: string;
  formatX?: (v: string) => string;
}) {
  const id = `area-${dataKey}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} tickFormatter={formatX} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={44} unit={unit} domain={["auto", "auto"]} />
        <Tooltip {...tooltipStyle} labelFormatter={formatX} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#${id})`} dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarTrend({
  data,
  dataKey,
  xKey = "date",
  color = "hsl(258 90% 66%)",
  height = 240,
  formatX = fmtDate,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  xKey?: string;
  color?: string;
  height?: number;
  formatX?: (v: string) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} tickFormatter={formatX} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} minTickGap={20} />
        <YAxis tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
        <Tooltip {...tooltipStyle} labelFormatter={formatX} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MultiLine({
  data,
  lines,
  xKey = "date",
  height = 260,
  formatX = fmtDate,
}: {
  data: Record<string, unknown>[];
  lines: { key: string; color: string; name: string }[];
  xKey?: string;
  height?: number;
  formatX?: (v: string) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} tickFormatter={formatX} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={44} />
        <Tooltip {...tooltipStyle} labelFormatter={formatX} />
        {lines.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

const DONUT_COLORS = [
  "hsl(258 90% 66%)",
  "hsl(330 90% 64%)",
  "hsl(190 90% 55%)",
  "hsl(152 69% 45%)",
  "hsl(38 92% 55%)",
  "hsl(0 84% 62%)",
  "hsl(280 70% 60%)",
  "hsl(210 90% 60%)",
];

export function DonutChart({
  data,
  height = 240,
}: {
  data: { name: string; value: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={3} stroke="none">
          {data.map((_, i) => (
            <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export { DONUT_COLORS };
