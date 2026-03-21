import { ArrowRight, TrendingUp, Zap } from "lucide-react";

export function Comparison() {
  const baselineMetrics = {
    fps: 18.5,
    cpuUsage: 78.3,
    latency: 54.2,
    framesProcessed: 300,
    skipRate: 0,
  };

  const adaptiveMetrics = {
    fps: 29.4,
    cpuUsage: 45.8,
    latency: 34.1,
    framesProcessed: 300,
    skipRate: 40,
  };

  const improvements = {
    fps: ((adaptiveMetrics.fps - baselineMetrics.fps) / baselineMetrics.fps) * 100,
    cpuUsage: ((baselineMetrics.cpuUsage - adaptiveMetrics.cpuUsage) / baselineMetrics.cpuUsage) * 100,
    latency: ((baselineMetrics.latency - adaptiveMetrics.latency) / baselineMetrics.latency) * 100,
  };

  return (
    <div className="h-full space-y-6 overflow-y-auto p-6">
      <div>
        <h2 className="mb-2 text-lg font-semibold text-white">
          Comparison Mode
        </h2>
        <p className="text-sm text-neutral-400">
          Baseline vs Adaptive System Performance
        </p>
      </div>

      {/* Improvement Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-500" />
            <span className="text-sm text-neutral-400">FPS Improvement</span>
          </div>
          <div className="text-3xl font-bold text-green-500">
            +{improvements.fps.toFixed(1)}%
          </div>
        </div>

        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Zap size={20} className="text-green-500" />
            <span className="text-sm text-neutral-400">CPU Saved</span>
          </div>
          <div className="text-3xl font-bold text-green-500">
            {improvements.cpuUsage.toFixed(1)}%
          </div>
        </div>

        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-500" />
            <span className="text-sm text-neutral-400">Latency Reduced</span>
          </div>
          <div className="text-3xl font-bold text-green-500">
            {improvements.latency.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Side-by-side Comparison */}
      <div className="grid grid-cols-3 gap-4">
        {/* Baseline System */}
        <div className="rounded-lg border border-red-500/30 bg-neutral-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <h3 className="text-lg font-semibold text-white">Baseline System</h3>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg bg-neutral-950 p-4">
              <div className="mb-1 text-sm text-neutral-400">Frames Per Second</div>
              <div className="text-3xl font-bold text-white">{baselineMetrics.fps}</div>
              <div className="mt-1 text-xs text-neutral-500">FPS</div>
            </div>

            <div className="rounded-lg bg-neutral-950 p-4">
              <div className="mb-1 text-sm text-neutral-400">CPU Usage</div>
              <div className="text-3xl font-bold text-red-500">
                {baselineMetrics.cpuUsage}%
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${baselineMetrics.cpuUsage}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg bg-neutral-950 p-4">
              <div className="mb-1 text-sm text-neutral-400">Avg Latency</div>
              <div className="text-3xl font-bold text-white">
                {baselineMetrics.latency}
              </div>
              <div className="mt-1 text-xs text-neutral-500">milliseconds</div>
            </div>

            <div className="rounded-lg bg-neutral-950 p-4">
              <div className="mb-1 text-sm text-neutral-400">Frames Processed</div>
              <div className="text-2xl font-bold text-white">
                {baselineMetrics.framesProcessed}
              </div>
              <div className="mt-1 text-xs text-neutral-500">All frames fully processed</div>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center">
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <ArrowRight size={48} className="text-blue-500" />
            <div className="text-center">
              <div className="text-sm font-medium text-blue-500">Adaptive Processing</div>
              <div className="text-xs text-neutral-500">ML-Based Optimization</div>
            </div>
          </div>
        </div>

        {/* Adaptive System */}
        <div className="rounded-lg border border-green-500/30 bg-neutral-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <h3 className="text-lg font-semibold text-white">Adaptive System</h3>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg bg-neutral-950 p-4">
              <div className="mb-1 text-sm text-neutral-400">Frames Per Second</div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-green-500">
                  {adaptiveMetrics.fps}
                </div>
                <div className="text-sm font-medium text-green-500">
                  +{((adaptiveMetrics.fps - baselineMetrics.fps) / baselineMetrics.fps * 100).toFixed(0)}%
                </div>
              </div>
              <div className="mt-1 text-xs text-neutral-500">FPS</div>
            </div>

            <div className="rounded-lg bg-neutral-950 p-4">
              <div className="mb-1 text-sm text-neutral-400">CPU Usage</div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-green-500">
                  {adaptiveMetrics.cpuUsage}%
                </div>
                <div className="text-sm font-medium text-green-500">
                  -{improvements.cpuUsage.toFixed(0)}%
                </div>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${adaptiveMetrics.cpuUsage}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg bg-neutral-950 p-4">
              <div className="mb-1 text-sm text-neutral-400">Avg Latency</div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-green-500">
                  {adaptiveMetrics.latency}
                </div>
                <div className="text-sm font-medium text-green-500">
                  -{improvements.latency.toFixed(0)}%
                </div>
              </div>
              <div className="mt-1 text-xs text-neutral-500">milliseconds</div>
            </div>

            <div className="rounded-lg bg-neutral-950 p-4">
              <div className="mb-1 text-sm text-neutral-400">Processing Efficiency</div>
              <div className="text-2xl font-bold text-white">
                {adaptiveMetrics.framesProcessed}
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                {adaptiveMetrics.skipRate}% frames skipped intelligently
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <h3 className="mb-4 text-sm font-medium text-neutral-300">Key Insights</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-neutral-950 p-4">
            <div className="mb-2 text-sm text-neutral-400">Processing Strategy</div>
            <div className="text-sm text-white">
              The adaptive system intelligently skips redundant frames and adjusts
              processing intensity based on content importance, resulting in significant
              performance improvements without sacrificing accuracy.
            </div>
          </div>
          <div className="rounded-lg bg-neutral-950 p-4">
            <div className="mb-2 text-sm text-neutral-400">Resource Efficiency</div>
            <div className="text-sm text-white">
              By reducing CPU usage by {improvements.cpuUsage.toFixed(0)}% while
              increasing FPS by {improvements.fps.toFixed(0)}%, the system demonstrates
              superior efficiency for real-time video processing applications.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
