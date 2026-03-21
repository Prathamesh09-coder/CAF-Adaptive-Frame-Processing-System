import { Settings as SettingsIcon, Lock, Info } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";

export function Settings() {
  return (
    <div className="h-full space-y-6 overflow-y-auto p-6">
      <div>
        <h2 className="mb-2 text-lg font-semibold text-white">
          System Settings
        </h2>
        <p className="text-sm text-neutral-400">
          Current system configuration (Read-only)
        </p>
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
        <Lock size={20} className="mt-0.5 flex-shrink-0 text-yellow-500" />
        <div>
          <div className="mb-1 font-medium text-yellow-500">Read-Only Mode</div>
          <div className="text-sm text-neutral-300">
            Settings are automatically managed by the ML backend. Manual control is
            disabled to ensure optimal performance.
          </div>
        </div>
      </div>

      {/* Current Configuration */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <div className="mb-4 flex items-center gap-2">
          <SettingsIcon size={20} className="text-blue-500" />
          <h3 className="text-sm font-medium text-neutral-300">
            Current Configuration
          </h3>
        </div>

        <div className="space-y-4">
          {/* Adaptive Thresholds */}
          <div className="rounded-lg bg-neutral-950 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-medium text-white">
                Adaptive Thresholds
              </div>
              <Badge
                variant="outline"
                className="border-green-500/20 bg-green-500/10 text-green-500"
              >
                Active
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-neutral-900 p-3">
                <div>
                  <div className="text-sm text-neutral-300">T1 (Skip Threshold)</div>
                  <div className="text-xs text-neutral-500">
                    Frames below this importance score are skipped
                  </div>
                </div>
                <div className="font-mono text-lg font-bold text-white">0.35</div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-neutral-900 p-3">
                <div>
                  <div className="text-sm text-neutral-300">T2 (Full Processing Threshold)</div>
                  <div className="text-xs text-neutral-500">
                    Frames above this score get full processing
                  </div>
                </div>
                <div className="font-mono text-lg font-bold text-white">0.75</div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-neutral-900 p-3">
                <div>
                  <div className="text-sm text-neutral-300">Partial Processing Range</div>
                  <div className="text-xs text-neutral-500">
                    Scores between T1 and T2 get partial processing
                  </div>
                </div>
                <div className="font-mono text-lg font-bold text-yellow-500">
                  0.35 - 0.75
                </div>
              </div>
            </div>
          </div>

          {/* System Load Level */}
          <div className="rounded-lg bg-neutral-950 p-4">
            <div className="mb-3 text-sm font-medium text-white">
              System Load Level
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">Current Load</span>
                <Badge
                  variant="outline"
                  className="border-green-500/20 bg-green-500/10 text-green-500"
                >
                  Moderate
                </Badge>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-neutral-900">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-yellow-500"
                  style={{ width: "45%" }}
                />
              </div>

              <div className="flex justify-between text-xs text-neutral-500">
                <span>Low</span>
                <span>Moderate</span>
                <span>High</span>
              </div>
            </div>
          </div>

          {/* Model Configuration */}
          <div className="rounded-lg bg-neutral-950 p-4">
            <div className="mb-3 text-sm font-medium text-white">
              ML Model Configuration
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-neutral-900 p-2">
                <span className="text-sm text-neutral-400">Model Type</span>
                <span className="font-mono text-sm text-white">Custom CNN-LSTM</span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-neutral-900 p-2">
                <span className="text-sm text-neutral-400">Input Features</span>
                <span className="font-mono text-sm text-white">256</span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-neutral-900 p-2">
                <span className="text-sm text-neutral-400">Context Window</span>
                <span className="font-mono text-sm text-white">5 frames</span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-neutral-900 p-2">
                <span className="text-sm text-neutral-400">Model Version</span>
                <span className="font-mono text-sm text-white">v2.3.1</span>
              </div>
            </div>
          </div>

          {/* Last Update */}
          <div className="rounded-lg bg-neutral-950 p-4">
            <div className="mb-3 text-sm font-medium text-white">
              Last Threshold Update
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">Timestamp</span>
                <span className="font-mono text-sm text-white">
                  2026-01-30 14:25:33
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">Update Source</span>
                <span className="text-sm text-white">Automatic Calibration</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">Next Update</span>
                <span className="text-sm text-neutral-400">In ~2 hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
        <Info size={20} className="mt-0.5 flex-shrink-0 text-blue-500" />
        <div className="text-sm text-neutral-300">
          <div className="mb-1 font-medium text-blue-500">About Adaptive Processing</div>
          The system continuously monitors performance metrics and automatically adjusts
          thresholds to maintain optimal balance between processing quality and system
          resources. This ensures consistent performance across varying workloads and
          content types.
        </div>
      </div>
    </div>
  );
}
