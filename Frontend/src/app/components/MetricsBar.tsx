import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";

interface MetricsBarProps {
  fps: number;
  latency: number;
  cpuUsage: number;
  memoryUsage: number;
  memoryUsedMB?: number;
  memoryLimitMB?: number;
  isConnected?: boolean;
}

const tone = {
  good: {
    text: "text-emerald-300",
    icon: "text-emerald-300",
    bar: "bg-emerald-400",
    surface: "bg-emerald-500/10",
    border: "border-emerald-500/15",
  },
  warning: {
    text: "text-amber-300",
    icon: "text-amber-300",
    bar: "bg-amber-400",
    surface: "bg-amber-500/10",
    border: "border-amber-500/15",
  },
  danger: {
    text: "text-rose-300",
    icon: "text-rose-300",
    bar: "bg-rose-400",
    surface: "bg-rose-500/10",
    border: "border-rose-500/15",
  },
  info: {
    text: "text-sky-300",
    icon: "text-sky-300",
    bar: "bg-sky-400",
    surface: "bg-sky-500/10",
    border: "border-sky-500/15",
  },
} as const;

function getFpsTone(fps: number) {
  if (fps >= 24) return tone.good;
  if (fps >= 14) return tone.warning;
  return tone.danger;
}

function getLatencyTone(latency: number) {
  if (latency <= 50) return tone.good;
  if (latency <= 100) return tone.warning;
  return tone.danger;
}

function getUsageTone(value: number) {
  if (value <= 55) return tone.good;
  if (value <= 80) return tone.warning;
  return tone.danger;
}

export function MetricsBar({
  fps,
  latency,
  cpuUsage,
  memoryUsage,
  memoryUsedMB,
  memoryLimitMB,
  isConnected = false,
}: MetricsBarProps) {
  const fpsTone = getFpsTone(fps);
  const latencyTone = getLatencyTone(latency);
  const cpuTone = getUsageTone(cpuUsage);
  const memoryTone = getUsageTone(memoryUsage);

  return (
    <div className="rounded-[28px] border border-neutral-800 bg-neutral-900/95 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">
            Runtime Metrics
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            System Load Snapshot
          </h3>
        </div>

        <div
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
            isConnected
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/20 bg-rose-500/10 text-rose-300"
          }`}
        >
          {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
          {isConnected ? "Backend Connected" : "Backend Offline"}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={`rounded-3xl border p-4 ${fpsTone.border} ${fpsTone.surface}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                Throughput
              </p>
              <div className={`mt-3 text-3xl font-semibold ${fpsTone.text}`}>
                {fps.toFixed(1)}
              </div>
              <p className="mt-1 text-sm text-neutral-400">frames per second</p>
            </div>
            <div className="rounded-2xl bg-neutral-950/70 p-3">
              <Activity size={20} className={fpsTone.icon} />
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-neutral-950/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${fpsTone.bar}`}
              style={{ width: `${Math.max(Math.min((fps / 30) * 100, 100), 6)}%` }}
            />
          </div>
        </div>

        <div className={`rounded-3xl border p-4 ${latencyTone.border} ${latencyTone.surface}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                Latency
              </p>
              <div className={`mt-3 text-3xl font-semibold ${latencyTone.text}`}>
                {latency.toFixed(0)}ms
              </div>
              <p className="mt-1 text-sm text-neutral-400">
                inference turnaround
              </p>
            </div>
            <div className="rounded-2xl bg-neutral-950/70 p-3">
              <Zap size={20} className={latencyTone.icon} />
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-neutral-950/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${latencyTone.bar}`}
              style={{ width: `${Math.max(Math.min((latency / 140) * 100, 100), 6)}%` }}
            />
          </div>
        </div>

        <div className={`rounded-3xl border p-4 ${cpuTone.border} ${cpuTone.surface}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                CPU Load
              </p>
              <div className={`mt-3 text-3xl font-semibold ${cpuTone.text}`}>
                {cpuUsage.toFixed(1)}%
              </div>
              <p className="mt-1 text-sm text-neutral-400">
                estimated from frame time and event-loop lag
              </p>
            </div>
            <div className="rounded-2xl bg-neutral-950/70 p-3">
              <Cpu size={20} className={cpuTone.icon} />
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-neutral-950/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${cpuTone.bar}`}
              style={{ width: `${Math.max(cpuUsage, 6)}%` }}
            />
          </div>
        </div>

        <div className={`rounded-3xl border p-4 ${memoryTone.border} ${memoryTone.surface}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                Memory
              </p>
              <div className={`mt-3 text-3xl font-semibold ${memoryTone.text}`}>
                {memoryUsage.toFixed(1)}%
              </div>
              <p className="mt-1 text-sm text-neutral-400">
                {memoryUsedMB && memoryLimitMB
                  ? `${memoryUsedMB.toFixed(1)} / ${memoryLimitMB.toFixed(0)} MB`
                  : "browser heap estimate"}
              </p>
            </div>
            <div className="rounded-2xl bg-neutral-950/70 p-3">
              <HardDrive size={20} className={memoryTone.icon} />
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-neutral-950/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${memoryTone.bar}`}
              style={{ width: `${Math.max(memoryUsage, 6)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
