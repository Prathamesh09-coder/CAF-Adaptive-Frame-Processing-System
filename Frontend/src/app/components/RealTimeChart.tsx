import { ActivitySquare } from "lucide-react";
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { TooltipProps } from "recharts";


interface DataPoint {
  time: number;
  score: number;
  fps: number;
  latency: number;
}

interface RealTimeChartProps {
  data: DataPoint[];
  title: string;
  color: "blue" | "green" | "purple" | "orange";
  height?: number;
  showArea?: boolean;
}

const chartTheme = {
  blue: {
    stroke: "#38bdf8",
    fill: "#38bdf8",
    badge: "border-sky-500/20 bg-sky-500/10 text-sky-300",
  },
  green: {
    stroke: "#34d399",
    fill: "#34d399",
    badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  },
  purple: {
    stroke: "#c084fc",
    fill: "#c084fc",
    badge: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  },
  orange: {
    stroke: "#fb923c",
    fill: "#fb923c",
    badge: "border-orange-500/20 bg-orange-500/10 text-orange-300",
  },
} as const;

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function RealTimeChart({
  data,
  title,
  color,
  height = 220,
  showArea = false,
}: RealTimeChartProps) {
  const theme = chartTheme[color];
  const chartData = data.slice(-24);

  if (!chartData.length) {
    return (
      <div className="rounded-[28px] border border-neutral-800 bg-neutral-900/95 p-6">
        <div className="flex h-full min-h-56 flex-col items-center justify-center rounded-[24px] border border-dashed border-neutral-800 bg-neutral-950/70 text-center">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-3">
            <ActivitySquare size={22} className="text-neutral-500" />
          </div>
          <p className="mt-4 text-sm font-medium text-neutral-300">
            {title}
          </p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-neutral-500">
            Start a live or upload session to populate this chart with runtime data.
          </p>
        </div>
      </div>
    );
  }

  const latest = chartData[chartData.length - 1]?.score ?? 0;
  const average =
    chartData.reduce((sum, entry) => sum + entry.score, 0) / chartData.length;
  const peak = Math.max(...chartData.map((entry) => entry.score));


const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/95 p-3 shadow-xl">
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
        {new Date(label ?? Date.now()).toLocaleTimeString()}
      </p>

      {payload.map((entry, index) => (
        <p
          key={index}
          className="mt-2 text-sm font-medium"
          style={{ color: entry.color }}
        >
          {entry.name}: {Number(entry.value).toFixed(2)}
        </p>
      ))}
    </div>
  );
};
  return (
    <div className="rounded-[28px] border border-neutral-800 bg-neutral-900/95 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Live Trend
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${theme.badge}`}
        >
          <span className="h-2 w-2 rounded-full bg-current" />
          Active
        </div>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {showArea ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.fill} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={theme.fill} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                axisLine={false}
                tickLine={false}
                minTickGap={28}
                tick={{ fill: "#737373", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={36}
                tick={{ fill: "#737373", fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="score"
                name={title}
                stroke={theme.stroke}
                strokeWidth={2.5}
                fill={`url(#gradient-${color})`}
                dot={false}
                activeDot={{ r: 4, fill: theme.stroke }}
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData}>
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                axisLine={false}
                tickLine={false}
                minTickGap={28}
                tick={{ fill: "#737373", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={36}
                tick={{ fill: "#737373", fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="score"
                name={title}
                stroke={theme.stroke}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: theme.stroke }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Latest
          </p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: theme.stroke }}>
            {latest.toFixed(2)}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Average
          </p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: theme.stroke }}>
            {average.toFixed(2)}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Peak
          </p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: theme.stroke }}>
            {peak.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
