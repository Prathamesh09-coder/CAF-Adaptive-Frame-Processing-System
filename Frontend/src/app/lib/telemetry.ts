export interface FrameHistoryPoint {
  time: number;
  score: number;
  decision: string;
  fps: number;
  latency: number;
}

export interface TelemetryPoint {
  time: number;
  fps: number;
  latency: number;
  cpu: number;
  memory: number;
  memoryUsedMB: number;
  memoryLimitMB: number;
}

interface CpuUsageInput {
  fps: number;
  latency: number;
  eventLoopLagMs: number;
  isProcessing: boolean;
}

interface MemoryUsageInput {
  historySize: number;
  fps: number;
  latency: number;
}

interface MemoryUsageResult {
  percent: number;
  usedMB: number;
  limitMB: number;
  source: "browser" | "estimated";
}

type BrowserPerformance = Performance & {
  memory?: {
    usedJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
};

export const FRAME_HISTORY_STORAGE_KEY = "afps.frame-history";
export const TELEMETRY_STORAGE_KEY = "afps.telemetry-history";

const MAX_STORED_POINTS = 60;
const FALLBACK_MEMORY_LIMIT_MB = 256;
const MB = 1024 * 1024;

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function calculateCpuUsage({
  fps,
  latency,
  eventLoopLagMs,
  isProcessing,
}: CpuUsageInput) {
  const safeFps = Math.max(fps, 0);
  const safeLatency = Math.max(latency, 0);
  const frameBudgetMs = safeFps > 0 ? 1000 / Math.max(safeFps, 1) : 1000 / 30;

  const latencyLoad = clamp(
    (safeLatency / Math.max(frameBudgetMs, 16)) * 100,
    0,
    100,
  );
  const lagLoad = clamp((Math.max(eventLoopLagMs, 0) / 40) * 100, 0, 100);
  const throughputLoad = clamp((safeFps / 30) * 100, 0, 100);
  const baseline = isProcessing ? 12 : 4;

  return Number(
    clamp(
      baseline + latencyLoad * 0.5 + lagLoad * 0.25 + throughputLoad * 0.25,
      0,
      100,
    ).toFixed(1),
  );
}

export function calculateMemoryUsage({
  historySize,
  fps,
  latency,
}: MemoryUsageInput): MemoryUsageResult {
  const browserPerformance = performance as BrowserPerformance;

  if (
    browserPerformance.memory?.usedJSHeapSize &&
    browserPerformance.memory.jsHeapSizeLimit
  ) {
    const usedMB = browserPerformance.memory.usedJSHeapSize / MB;
    const limitMB = browserPerformance.memory.jsHeapSizeLimit / MB;

    return {
      percent: Number(clamp((usedMB / limitMB) * 100, 0, 100).toFixed(1)),
      usedMB: Number(usedMB.toFixed(1)),
      limitMB: Number(limitMB.toFixed(1)),
      source: "browser",
    };
  }

  const estimatedUsedMB =
    48 + historySize * 0.75 + Math.max(fps, 0) * 0.35 + Math.max(latency, 0) * 0.08;

  return {
    percent: Number(
      clamp((estimatedUsedMB / FALLBACK_MEMORY_LIMIT_MB) * 100, 0, 100).toFixed(1),
    ),
    usedMB: Number(estimatedUsedMB.toFixed(1)),
    limitMB: FALLBACK_MEMORY_LIMIT_MB,
    source: "estimated",
  };
}

export function persistHistory<T>(key: string, history: T[]) {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(
      key,
      JSON.stringify(history.slice(-MAX_STORED_POINTS)),
    );
  } catch {
    // Ignore storage quota and serialization issues in telemetry caching.
  }
}

export function readHistory<T>(key: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function classifyHealth({
  cpu,
  memory,
  latency,
}: Pick<TelemetryPoint, "cpu" | "memory" | "latency">) {
  if (cpu >= 85 || memory >= 85 || latency >= 120) {
    return "Critical";
  }

  if (cpu >= 60 || memory >= 65 || latency >= 75) {
    return "Elevated";
  }

  return "Nominal";
}

export function summarizeDecisions(history: FrameHistoryPoint[]) {
  const counts = { skip: 0, partial: 0, full: 0 };

  history.forEach((entry) => {
    if (entry.decision === "skip") counts.skip += 1;
    if (entry.decision === "partial") counts.partial += 1;
    if (entry.decision === "full") counts.full += 1;
  });

  return [
    { name: "Skipped", value: counts.skip, color: "#fb7185" },
    { name: "Partial", value: counts.partial, color: "#fbbf24" },
    { name: "Full", value: counts.full, color: "#34d399" },
  ];
}
