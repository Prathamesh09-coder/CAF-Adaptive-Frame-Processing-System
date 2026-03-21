import { type ReactNode, useEffect, useState } from "react";
import { Activity, Cpu, HardDrive, TimerReset } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FRAME_HISTORY_STORAGE_KEY,
  TELEMETRY_STORAGE_KEY,
  classifyHealth,
  readHistory,
  summarizeDecisions,
  type FrameHistoryPoint,
  type TelemetryPoint,
} from "@/app/lib/telemetry";

const palette = {
  fps: "#38bdf8",
  latency: "#f59e0b",
  cpu: "#34d399",
  memory: "#fb923c",
  grid: "#262626",
  text: "#737373",
} as const;

function formatAxisTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function MetricCard({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  accent: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-neutral-800 bg-neutral-900/95 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.16)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">
            {label}
          </p>
          <div className="mt-3 text-3xl font-semibold" style={{ color: accent }}>
            {value}
          </div>
          <p className="mt-2 text-sm text-neutral-400">{hint}</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-3">
          {icon}
        </div>
      </div>
    </div>
  );
}

function DashboardTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const heading =
    typeof label === "number" ? formatAxisTime(label) : String(label);

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/95 p-3 shadow-xl">
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
        {heading}
      </p>
      {payload.map((entry: any) => (
        <p
          key={entry.dataKey}
          className="mt-2 text-sm font-medium"
          style={{ color: entry.color }}
        >
          {entry.name}: {Number(entry.value).toFixed(1)}
        </p>
      ))}
    </div>
  );
}

function EmptyDashboardState() {
  return (
    <div className="rounded-[32px] border border-dashed border-neutral-800 bg-neutral-900/95 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950/80">
        <Activity size={22} className="text-neutral-500" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-white">
        Dashboard will fill itself once analysis starts
      </h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
        Open the live-analysis tab, process a few frames, and these charts will
        switch from placeholders to real CPU, memory, latency, FPS, and decision
        history.
      </p>
    </div>
  );
}

export function Dashboard() {
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>(
    () => readHistory<TelemetryPoint>(TELEMETRY_STORAGE_KEY),
  );
  const [frameHistory, setFrameHistory] = useState<FrameHistoryPoint[]>(
    () => readHistory<FrameHistoryPoint>(FRAME_HISTORY_STORAGE_KEY),
  );

  useEffect(() => {
    const sync = () => {
      setTelemetryHistory(readHistory<TelemetryPoint>(TELEMETRY_STORAGE_KEY));
      setFrameHistory(readHistory<FrameHistoryPoint>(FRAME_HISTORY_STORAGE_KEY));
    };

    sync();
    const timer = window.setInterval(sync, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const runtimeSeries = telemetryHistory.slice(-24);
  const decisionData = summarizeDecisions(frameHistory);
  const healthData = [
    {
      name: "Nominal",
      value: telemetryHistory.filter((entry) => classifyHealth(entry) === "Nominal")
        .length,
      color: "#34d399",
    },
    {
      name: "Elevated",
      value: telemetryHistory.filter((entry) => classifyHealth(entry) === "Elevated")
        .length,
      color: "#f59e0b",
    },
    {
      name: "Critical",
      value: telemetryHistory.filter((entry) => classifyHealth(entry) === "Critical")
        .length,
      color: "#fb7185",
    },
  ];

  const latest = runtimeSeries[runtimeSeries.length - 1] ?? {
    fps: 0,
    latency: 0,
    cpu: 0,
    memory: 0,
    memoryUsedMB: 0,
    memoryLimitMB: 0,
  };

  return (
    <div className="h-full space-y-6 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(251,146,60,0.08),_transparent_28%)] p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">
            Operations Dashboard
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Runtime pressure, throughput, and system headroom
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            CPU and memory are now calculated from live browser telemetry and recent
            frame-processing behavior, not random placeholders.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/90 px-4 py-2 text-xs text-neutral-400">
          <TimerReset size={14} />
          Refreshing every second from the latest analysis session
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="FPS"
          value={`${latest.fps.toFixed(1)}`}
          hint="Measured frame throughput"
          accent={palette.fps}
          icon={<Activity size={20} style={{ color: palette.fps }} />}
        />
        <MetricCard
          label="Latency"
          value={`${latest.latency.toFixed(0)}ms`}
          hint="Inference turnaround per frame"
          accent={palette.latency}
          icon={<TimerReset size={20} style={{ color: palette.latency }} />}
        />
        <MetricCard
          label="CPU Load"
          value={`${latest.cpu.toFixed(1)}%`}
          hint="Estimated from event-loop pressure"
          accent={palette.cpu}
          icon={<Cpu size={20} style={{ color: palette.cpu }} />}
        />
        <MetricCard
          label="Memory"
          value={`${latest.memory.toFixed(1)}%`}
          hint={
            latest.memoryLimitMB
              ? `${latest.memoryUsedMB.toFixed(1)} / ${latest.memoryLimitMB.toFixed(0)} MB heap`
              : "Browser heap estimate"
          }
          accent={palette.memory}
          icon={<HardDrive size={20} style={{ color: palette.memory }} />}
        />
      </div>

      {!runtimeSeries.length ? (
        <EmptyDashboardState />
      ) : (
        <>
          <div className="rounded-[32px] border border-neutral-800 bg-neutral-900/95 p-6 shadow-[0_28px_60px_rgba(0,0,0,0.18)]">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">
                  Runtime Load Profile
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  CPU, latency, and FPS in one view
                </h3>
              </div>
              <p className="text-sm text-neutral-500">
                Overlaying throughput against latency and load makes spikes easier to
                spot during long captures.
              </p>
            </div>

            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={runtimeSeries}>
                  <defs>
                    <linearGradient id="cpu-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={palette.cpu} stopOpacity={0.22} />
                      <stop offset="95%" stopColor={palette.cpu} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={palette.grid} vertical={false} />
                  <XAxis
                    dataKey="time"
                    tickFormatter={formatAxisTime}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={28}
                    tick={{ fill: palette.text, fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="load"
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: palette.text, fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="latency"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: palette.text, fontSize: 11 }}
                  />
                  <Tooltip content={<DashboardTooltip />} />
                  <Area
                    yAxisId="load"
                    type="monotone"
                    dataKey="cpu"
                    name="CPU %"
                    stroke={palette.cpu}
                    fill="url(#cpu-fill)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    yAxisId="load"
                    type="monotone"
                    dataKey="fps"
                    name="FPS"
                    stroke={palette.fps}
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    yAxisId="latency"
                    type="monotone"
                    dataKey="latency"
                    name="Latency ms"
                    stroke={palette.latency}
                    strokeWidth={2.5}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
            <div className="rounded-[32px] border border-neutral-800 bg-neutral-900/95 p-6 shadow-[0_24px_50px_rgba(0,0,0,0.16)]">
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">
                    Resource Envelope
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    CPU versus memory pressure
                  </h3>
                </div>
                <p className="text-sm text-neutral-500">
                  Memory uses browser heap data when available and falls back to an
                  estimate tied to session complexity.
                </p>
              </div>

              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={runtimeSeries}>
                    <defs>
                      <linearGradient id="memory-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={palette.memory} stopOpacity={0.28} />
                        <stop offset="95%" stopColor={palette.memory} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={palette.grid} vertical={false} />
                    <XAxis
                      dataKey="time"
                      tickFormatter={formatAxisTime}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={28}
                      tick={{ fill: palette.text, fontSize: 11 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: palette.text, fontSize: 11 }}
                    />
                    <Tooltip content={<DashboardTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="memory"
                      name="Memory %"
                      stroke={palette.memory}
                      fill="url(#memory-fill)"
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="cpu"
                      name="CPU %"
                      stroke={palette.cpu}
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[32px] border border-neutral-800 bg-neutral-900/95 p-6 shadow-[0_24px_50px_rgba(0,0,0,0.16)]">
                <div className="mb-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">
                    Decision Mix
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    Recent frame outcomes
                  </h3>
                </div>

                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={decisionData}>
                      <CartesianGrid stroke={palette.grid} vertical={false} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: palette.text, fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: palette.text, fontSize: 11 }}
                      />
                      <Tooltip content={<DashboardTooltip />} />
                      <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                        {decisionData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-[32px] border border-neutral-800 bg-neutral-900/95 p-6 shadow-[0_24px_50px_rgba(0,0,0,0.16)]">
                <div className="mb-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">
                    Runtime Health
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    Session stability distribution
                  </h3>
                </div>

                <div className="space-y-3">
                  {healthData.map((item) => {
                    const total = telemetryHistory.length || 1;
                    const width = (item.value / total) * 100;

                    return (
                      <div
                        key={item.name}
                        className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-3"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm text-neutral-300">{item.name}</span>
                          <span className="text-sm font-medium text-white">
                            {item.value}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(width, item.value ? 8 : 0)}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
