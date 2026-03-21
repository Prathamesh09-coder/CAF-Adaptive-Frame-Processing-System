import { Badge } from "@/app/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface FrameDecisionProps {
  frameId: number;
  importanceScore: number;
  decision: "skip" | "partial" | "full";
  features: {
    M: number;
    S: number;
    E: number;
    C: number;
    T: number;
  };
  inputMode: "live" | "upload";
  isProcessing: boolean;
}

export function FrameDecision({
  frameId,
  importanceScore,
  decision,
  features,
  inputMode,
  isProcessing,
}: FrameDecisionProps) {
  const getDecisionColor = () => {
    switch (decision) {
      case "skip":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "partial":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "full":
        return "bg-green-500/10 text-green-500 border-green-500/20";
    }
  };

  const getDecisionIcon = () => {
    switch (decision) {
      case "skip":
        return "🟥";
      case "partial":
        return "🟨";
      case "full":
        return "🟩";
    }
  };

  const getDecisionGlow = () => {
    switch (decision) {
      case "skip":
        return "shadow-red-500/10";
      case "partial":
        return "shadow-yellow-500/10";
      case "full":
        return "shadow-green-500/10";
    }
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case "M": return "🏃"; // Motion
      case "S": return "🎭"; // Scene
      case "E": return "⚡"; // Energy
      case "C": return "🎯"; // Context
      case "T": return "⏱️"; // Time
      default: return "📊";
    }
  };

  const getFeatureLabel = (feature: string) => {
    switch (feature) {
      case "M": return "Motion";
      case "S": return "Scene Change";
      case "E": return "Energy";
      case "C": return "Context";
      case "T": return "Temporal";
      default: return feature;
    }
  };

  const getFeatureColor = (value: number) => {
    if (value > 0.7) return "text-green-400";
    if (value > 0.4) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className={`rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition-all duration-300 ${
      isProcessing ? "shadow-lg " + getDecisionGlow() : ""
    }`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-300">
          Frame Decision Panel
        </h3>
        {isProcessing && (
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-blue-400">Analyzing</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-neutral-950 p-3 transition-all hover:bg-neutral-900">
          <span className="text-sm text-neutral-400">Frame ID</span>
          <span className="font-mono text-sm font-medium text-white animate-in slide-in-from-right">
            #{frameId.toString().padStart(5, "0")}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-neutral-950 p-3 transition-all hover:bg-neutral-900">
          <span className="text-sm text-neutral-400">Input Mode</span>
          <Badge
            variant="outline"
            className="border-blue-500/20 bg-blue-500/10 text-blue-500 animate-in zoom-in"
          >
            {inputMode === "live" ? "Live" : "Uploaded"}
          </Badge>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-neutral-950 p-3 transition-all hover:bg-neutral-900">
          <span className="text-sm text-neutral-400">Importance Score</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-neutral-800">
              <div
                className={`h-full transition-all duration-500 ${
                  importanceScore > 0.7 ? "bg-green-500" :
                  importanceScore > 0.4 ? "bg-yellow-500" : "bg-red-500"
                }`}
                style={{ width: `${importanceScore * 100}%` }}
              />
            </div>
            <span className="font-mono text-sm font-medium text-white animate-in slide-in-from-left">
              {importanceScore.toFixed(2)}
            </span>
          </div>
        </div>

        <div className={`rounded-lg bg-neutral-950 p-3 transition-all duration-300 ${
          isProcessing ? "border " + getDecisionColor().split(" ")[1] : ""
        }`}>
          <div className="mb-2 text-sm text-neutral-400">Decision Status</div>
          <div
            className={`flex items-center gap-2 rounded-md border px-3 py-2 transition-all duration-300 ${getDecisionColor()} ${
              isProcessing ? "animate-pulse" : ""
            }`}
          >
            <span className="text-lg animate-in zoom-in">{getDecisionIcon()}</span>
            <span className="text-sm font-medium uppercase animate-in slide-in-from-bottom">
              {decision}
            </span>
          </div>
        </div>

        {/* Feature Analysis */}
        <div className="rounded-lg bg-neutral-950 p-3">
          <div className="mb-3 text-sm text-neutral-400">Feature Analysis</div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(features).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded bg-neutral-900 p-2 transition-all hover:bg-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{getFeatureIcon(key)}</span>
                  <span className="text-xs text-neutral-500">{getFeatureLabel(key)}</span>
                </div>
                <span className={`text-xs font-medium ${getFeatureColor(value)} animate-in slide-in-from-right`}>
                  {value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Processing Insights */}
        <div className="rounded-lg bg-neutral-950 p-3">
          <div className="mb-2 text-sm text-neutral-400">Processing Insights</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-neutral-900 p-2">
              <div className="text-xs text-neutral-500">Motion Level</div>
              <div className="text-sm font-medium text-white">
                {features.M > 0.7 ? "High" : features.M > 0.4 ? "Medium" : "Low"}
              </div>
            </div>
            <div className="rounded-lg bg-neutral-900 p-2">
              <div className="text-xs text-neutral-500">Scene Change</div>
              <div className="text-sm font-medium text-white">
                {features.S > 0.5 ? "Yes" : "No"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
