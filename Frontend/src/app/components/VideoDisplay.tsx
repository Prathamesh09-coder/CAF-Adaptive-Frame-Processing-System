import { useState, useRef, useEffect } from "react";
import { Play, Pause, Upload as UploadIcon } from "lucide-react";
import { Button } from "../../app/components/ui/button";

interface VideoDisplayProps {
  frameId: number;
  importanceScore: number;
  decision: "skip" | "partial" | "full";
  showBoundingBoxes: boolean;
  inputMode: "live" | "upload";
  isProcessing: boolean;
  lastUpdateTime: number;
  previewUrl: string | null;
  liveStream: MediaStream | null;
  storedFrames: string[];
  skippedFrames: Array<{frameId: number, timestamp: number, reason: string}>;
}

export function VideoDisplay({
  frameId,
  importanceScore,
  decision,
  showBoundingBoxes,
  inputMode,
  isProcessing,
  lastUpdateTime,
  previewUrl,
  liveStream,
  storedFrames,
  skippedFrames,
}: VideoDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(inputMode === "live");
  const [showPulse, setShowPulse] = useState(false);
  const liveVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isProcessing) {
      setShowPulse(true);
      const timeout = setTimeout(() => setShowPulse(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [isProcessing]);

  useEffect(() => {
    const videoElement = liveVideoRef.current;

    if (!videoElement) {
      return;
    }

    if (!liveStream) {
      videoElement.srcObject = null;
      return;
    }

    videoElement.srcObject = liveStream;
    const playPromise = videoElement.play();

    if (playPromise instanceof Promise) {
      playPromise.catch((error) => {
        console.warn("Live preview play deferred:", error);
      });
    }
  }, [liveStream]);

  const togglePlayPause = () => setIsPlaying((prev) => !prev);

  const getDecisionColor = () => {
    switch (decision) {
      case "skip":
        return "border-red-500/50";
      case "partial":
        return "border-yellow-500/50";
      case "full":
        return "border-green-500/50";
      default:
        return "border-neutral-800";
    }
  };

  const getDecisionGlow = () => {
    switch (decision) {
      case "skip":
        return "shadow-red-500/20";
      case "partial":
        return "shadow-yellow-500/20";
      case "full":
        return "shadow-green-500/20";
      default:
        return "";
    }
  };

  return (
    <div
      className={`flex h-full flex-col rounded-lg border-2 bg-neutral-900 p-4 transition-all duration-300 ${
        showPulse ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-neutral-800"
      } ${getDecisionGlow()}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-300">Video Feed</h3>
        <span className="text-xs text-neutral-500">
          {inputMode === "live" ? "Live Camera" : "Uploaded Video"}
        </span>
      </div>

      <div
        className={`relative mb-4 flex flex-1 items-center justify-center overflow-hidden rounded-lg bg-neutral-950 transition-all duration-300 ${
          showBoundingBoxes ? getDecisionColor() : "border border-neutral-800"
        }`}
      >
        {inputMode === "live" && liveStream ? (
          <video
            ref={liveVideoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
          />
        ) : inputMode === "upload" && previewUrl ? (
          <video
            src={previewUrl}
            controls
            autoPlay={isPlaying}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-center p-8">
            <div className="rounded-full bg-neutral-800 p-4">
              <UploadIcon size={32} className="text-neutral-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-2">No source selected</p>
              <p className="text-xs text-neutral-600">
                {inputMode === "live"
                  ? "Start the camera to preview live video."
                  : "Select a video file to show preview."}
              </p>
            </div>
          </div>
        )}

        {showBoundingBoxes && (
          <>
            <div className="absolute left-[20%] top-[30%] h-[120px] w-[100px] border-2 border-green-500" />
            <div className="absolute left-[60%] top-[40%] h-[80px] w-[80px] border-2 border-green-500" />
          </>
        )}

        {importanceScore > 0 && (
          <div className="absolute top-2 right-2 bg-neutral-900/80 backdrop-blur-sm rounded px-2 py-1">
            <span className="text-xs text-white">Importance {importanceScore.toFixed(2)}</span>
          </div>
        )}

        {/* Skipped frames overlay */}
        {inputMode === "live" && skippedFrames.length > 0 && (
          <div className="absolute bottom-2 left-2 bg-red-900/80 backdrop-blur-sm rounded px-2 py-1 max-w-xs">
            <div className="text-xs text-red-200 font-medium mb-1">Skipped Frames:</div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {skippedFrames.slice(-3).map((skipped, index) => (
                <div key={`${skipped.frameId}-${index}`} className="text-xs text-red-300">
                  Frame {skipped.frameId}: {skipped.reason}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {storedFrames.length > 0 && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
          <div className="mb-2 text-xs text-neutral-400">Stored frame previews ({storedFrames.length})</div>
          <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
            {storedFrames.slice(-20).map((frame, index) => (
              <img
                key={`${index}-${frameId}`}
                src={frame}
                alt={`frame-${index}`}
                className="h-16 w-24 rounded-sm object-cover border border-neutral-700"
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {inputMode === "upload" && previewUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={togglePlayPause}
              className="border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            >
              {isPlaying ? <Pause size={16} className="mr-2" /> : <Play size={16} className="mr-2" />}
              {isPlaying ? "Pause" : "Play"}
            </Button>
          )}
          {inputMode === "live" && liveStream && (
            <span className="text-xs text-neutral-400">Live camera feed visible above.</span>
          )}
        </div>
      </div>
    </div>
  );
}
