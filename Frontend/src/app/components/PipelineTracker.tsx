import { Check, Play, SkipForward, Zap } from "lucide-react";
import { Progress } from "@/app/components/ui/progress";

interface PipelineStep {
  name: string;
  status: "completed" | "executing" | "skipped" | "pending";
}

interface PipelineTrackerProps {
  steps: PipelineStep[];
  completionPercent: number;
  isProcessing?: boolean;
}

export function PipelineTracker({ steps, completionPercent, isProcessing = false }: PipelineTrackerProps) {
  const getStatusIcon = (status: PipelineStep["status"]) => {
    switch (status) {
      case "completed":
        return <Check size={16} className="text-green-500" />;
      case "executing":
        return <Play size={16} className="text-yellow-500 animate-pulse" />;
      case "skipped":
        return <SkipForward size={16} className="text-neutral-500" />;
      case "pending":
        return <div className="h-4 w-4 rounded-full border-2 border-neutral-700" />;
    }
  };

  const getStatusColor = (status: PipelineStep["status"]) => {
    switch (status) {
      case "completed":
        return "border-green-500/30 bg-green-500/5 shadow-green-500/10";
      case "executing":
        return "border-yellow-500/30 bg-yellow-500/5 shadow-yellow-500/10 animate-pulse";
      case "skipped":
        return "border-neutral-700 bg-neutral-900";
      case "pending":
        return "border-neutral-800 bg-neutral-950";
    }
  };

  const getStepDescription = (name: string, status: PipelineStep["status"]) => {
    if (status === "executing") {
      switch (name) {
        case "Frame Capture": return "Capturing frame data...";
        case "Frame Preprocessing": return "Normalizing and filtering...";
        case "Motion Intensity Calculation": return "Analyzing movement patterns...";
        case "Scene Change Detection": return "Detecting scene transitions...";
        case "Context Vector Formation": return "Building feature context...";
        case "Adaptive ML Classification": return "Running importance scoring...";
        case "Inference Execution": return "Making processing decision...";
        case "Output Aggregation": return "Finalizing results...";
        default: return "Processing...";
      }
    }
    return "";
  };

  return (
    <div className={`rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition-all duration-300 ${
      isProcessing ? "shadow-lg shadow-blue-500/10" : ""
    }`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-300">
          Processing Pipeline Execution
        </h3>
        <div className="flex items-center gap-2">
          {isProcessing && <Zap size={14} className="text-blue-400 animate-pulse" />}
          <span className="text-xs text-neutral-500">Progress:</span>
          <span className="font-mono text-xs font-medium text-white">
            {completionPercent}%
          </span>
        </div>
      </div>

      <Progress
        value={completionPercent}
        className={`mb-4 h-1.5 transition-all duration-500 ${
          isProcessing ? "shadow-lg shadow-blue-500/20" : ""
        }`}
      />

      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 rounded-lg border p-3 transition-all duration-300 hover:scale-[1.02] ${getStatusColor(
              step.status
            )}`}
          >
            <div className="flex-shrink-0 transition-transform duration-200">
              {getStatusIcon(step.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium text-white transition-all duration-200 ${
                step.status === "executing" ? "text-yellow-400" : ""
              }`}>
                {step.name}
              </div>
              {step.status === "executing" && (
                <div className="text-xs text-neutral-400 animate-in slide-in-from-left mt-1">
                  {getStepDescription(step.name, step.status)}
                </div>
              )}
            </div>
            {step.status === "executing" && (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent"></div>
                <span className="text-xs text-yellow-400">Active</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {isProcessing && (
        <div className="mt-4 rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
          <div className="flex items-center gap-2 text-xs text-blue-400">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
            <span>Real-time processing active - {steps.filter(s => s.status === "completed").length} of {steps.length} steps completed</span>
          </div>
        </div>
      )}
    </div>
  );
}
