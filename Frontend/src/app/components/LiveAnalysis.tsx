import { useState, useEffect, useRef } from "react";
import { VideoDisplay } from "../../app/components/VideoDisplay";
import { FrameDecision } from "../../app/components/FrameDecision";
import { PipelineTracker } from "../../app/components/PipelineTracker";
import { MetricsBar } from "../../app/components/MetricsBar";
import { RealTimeChart } from "../../app/components/RealTimeChart";
import { wsService, FrameResult, UploadResult, ErrorResult } from "../../services/websocketService";
import { uploadService } from "../../services/uploadService";
import {
  FRAME_HISTORY_STORAGE_KEY,
  TELEMETRY_STORAGE_KEY,
  calculateCpuUsage,
  calculateMemoryUsage,
  persistHistory,
  readHistory,
  type FrameHistoryPoint,
  type TelemetryPoint,
} from "../../app/lib/telemetry";

interface LiveAnalysisProps {
  inputMode: "live" | "upload";
}

const PIPELINE_STEPS = [
  "Frame Capture",
  "Frame Preprocessing",
  "Motion Intensity Calculation",
  "Scene Change Detection",
  "Context Vector Formation",
  "Adaptive ML Classification",
  "Inference Execution",
  "Output Aggregation",
];

export function LiveAnalysis({ inputMode }: LiveAnalysisProps) {
  // State for current frame data
  const [frameId, setFrameId] = useState(0);
  const [importanceScore, setImportanceScore] = useState(0);
  const [decision, setDecision] = useState<"skip" | "partial" | "full">("skip");
  const [features, setFeatures] = useState({
    M: 0, S: 0, E: 0, C: 0, T: 0
  });
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [cpuUsage, setCpuUsage] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [memoryUsedMB, setMemoryUsedMB] = useState(0);
  const [memoryLimitMB, setMemoryLimitMB] = useState(0);

  // UI state
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploadVideoUrl, setUploadVideoUrl] = useState<string | null>(null);
  const [storedFrames, setStoredFrames] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live camera state
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isContinuousCapture, setIsContinuousCapture] = useState(false);
  const [skippedFrames, setSkippedFrames] = useState<Array<{frameId: number, timestamp: number, reason: string}>>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<ReturnType<typeof window.setInterval> | null>(null);
  const autoStartCaptureRef = useRef(false);
  const telemetryHistoryRef = useRef<TelemetryPoint[]>(
    readHistory<TelemetryPoint>(TELEMETRY_STORAGE_KEY)
  );
  const telemetrySnapshotRef = useRef({
    fps: 0,
    latency: 0,
    isProcessing: false,
    historySize: 0,
  });

  const clearCaptureInterval = () => {
    if (captureIntervalRef.current) {
      window.clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }

    setIsContinuousCapture(false);
  };

  const releaseCameraStream = () => {
    clearCaptureInterval();
    autoStartCaptureRef.current = false;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraReady(false);
    setIsStreaming(false);
  };

  // Animation and dynamic state
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [frameHistory, setFrameHistory] = useState<FrameHistoryPoint[]>(
    () => readHistory<FrameHistoryPoint>(FRAME_HISTORY_STORAGE_KEY)
  );
  const [showStats, setShowStats] = useState(false);
  const [showCharts, setShowCharts] = useState(false);

  // WebSocket event handlers
  useEffect(() => {
    const unsubscribeResult = wsService.onResult((data: FrameResult | UploadResult | ErrorResult) => {
      if ("error" in data) {
        setError(data.error);
        setIsProcessing(false);
        return;
      }

      if ("status" in data && data.status === "completed") {
        // Upload completed
        setUploadProgress("Processing completed!");
        setIsProcessing(false);
        setTimeout(() => {
          setUploadProgress("");
          setSessionId(null);
        }, 3000);
        return;
      }

      // Frame result
      const frameData = data as FrameResult;
      setFrameId(frameData.frame_id);
      setImportanceScore(frameData.importance_score);
      setDecision(frameData.decision);
      setFeatures(frameData.features);
      setFps(frameData.metrics.fps);
      setLatency(frameData.metrics.latency_ms);

      // Show bounding boxes only for full processing
      setShowBoundingBoxes(frameData.decision === "full");

      // Track skipped frames for display
      if (frameData.decision === "skip") {
        setSkippedFrames(prev => {
          const newSkipped = [...prev, {
            frameId: frameData.frame_id,
            timestamp: Date.now(),
            reason: `Low importance (${frameData.importance_score.toFixed(2)})`
          }];
          // Keep only last 10 skipped frames
          return newSkipped.slice(-10);
        });
      }

      // Reset pipeline animation
      setCurrentStep(0);
      setCompletionPercent(0);
      setIsProcessing(true);
      setLastUpdateTime(Date.now());

      // Add to frame history for statistics
      setFrameHistory(prev => {
        const newHistory = [...prev, {
          time: Date.now(),
          score: frameData.importance_score,
          decision: frameData.decision,
          fps: frameData.metrics.fps,
          latency: frameData.metrics.latency_ms
        }];
        // Keep only last 50 frames
        return newHistory.slice(-50);
      });
    });

    const unsubscribeStatus = wsService.onStatusChange((status) => {
      setIsConnected(status === "connected");
      if (status === "error") {
        setError("WebSocket connection failed");
        setIsProcessing(false);
      } else {
        setError(null);
      }
    });

    return () => {
      unsubscribeResult();
      unsubscribeStatus();
    };
  }, []);

  // Handle input mode changes
  useEffect(() => {
    // Disconnect existing connection
    wsService.disconnect();
    setIsConnected(false);
    setError(null);
    setIsProcessing(false);
    setFrameHistory([]);
    setSkippedFrames([]);
    setCpuUsage(0);
    setMemoryUsage(0);
    setMemoryUsedMB(0);
    setMemoryLimitMB(0);
    telemetryHistoryRef.current = [];
    persistHistory(FRAME_HISTORY_STORAGE_KEY, []);
    persistHistory(TELEMETRY_STORAGE_KEY, []);

    releaseCameraStream();

    if (inputMode === "live") {
      // Connect to live WebSocket
      wsService.connect("live");
    }
    // For upload mode, wait for file selection
  }, [inputMode]);

  useEffect(() => {
    return () => {
      if (uploadVideoUrl) {
        URL.revokeObjectURL(uploadVideoUrl);
      }
      // Cleanup camera and continuous capture
      releaseCameraStream();
    };
  }, [uploadVideoUrl]);

  useEffect(() => {
    telemetrySnapshotRef.current = {
      fps,
      latency,
      isProcessing,
      historySize: frameHistory.length,
    };
  }, [fps, latency, isProcessing, frameHistory.length]);

  useEffect(() => {
    persistHistory(FRAME_HISTORY_STORAGE_KEY, frameHistory);
  }, [frameHistory]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let lastTick = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const eventLoopLagMs = Math.max(now - lastTick - 1000, 0);
      lastTick = now;

      const snapshot = telemetrySnapshotRef.current;
      const nextCpuUsage = calculateCpuUsage({
        fps: snapshot.fps,
        latency: snapshot.latency,
        eventLoopLagMs,
        isProcessing: snapshot.isProcessing,
      });
      const memoryMetrics = calculateMemoryUsage({
        historySize: snapshot.historySize,
        fps: snapshot.fps,
        latency: snapshot.latency,
      });

      setCpuUsage(nextCpuUsage);
      setMemoryUsage(memoryMetrics.percent);
      setMemoryUsedMB(memoryMetrics.usedMB);
      setMemoryLimitMB(memoryMetrics.limitMB);

      const nextTelemetryPoint: TelemetryPoint = {
        time: Date.now(),
        fps: snapshot.fps,
        latency: snapshot.latency,
        cpu: nextCpuUsage,
        memory: memoryMetrics.percent,
        memoryUsedMB: memoryMetrics.usedMB,
        memoryLimitMB: memoryMetrics.limitMB,
      };

      telemetryHistoryRef.current = [
        ...telemetryHistoryRef.current,
        nextTelemetryPoint,
      ].slice(-60);

      persistHistory(TELEMETRY_STORAGE_KEY, telemetryHistoryRef.current);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  // Animate pipeline steps
  useEffect(() => {
    if (isProcessing && currentStep < PIPELINE_STEPS.length) {
      const timeout = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setCompletionPercent(
          Math.round(((currentStep + 1) / PIPELINE_STEPS.length) * 100)
        );
      }, 150);
      return () => clearTimeout(timeout);
    } else if (!isProcessing) {
      setCurrentStep(0);
      setCompletionPercent(0);
    }
  }, [currentStep, isProcessing]);

  // Auto-stop processing animation after completion
  useEffect(() => {
    if (completionPercent >= 100) {
      const timeout = setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [completionPercent]);

  useEffect(() => {
    if (
      inputMode !== "live" ||
      !autoStartCaptureRef.current ||
      !isStreaming ||
      !isCameraReady ||
      !isConnected ||
      isContinuousCapture
    ) {
      return;
    }

    autoStartCaptureRef.current = false;
    clearCaptureInterval();
    setIsContinuousCapture(true);
    setError(null);

    captureIntervalRef.current = window.setInterval(() => {
      captureFrame();
    }, 100);
  }, [inputMode, isStreaming, isCameraReady, isConnected, isContinuousCapture]);

  // Live camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      const videoElement = videoRef.current;

      if (!videoElement) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("Camera preview element is unavailable");
      }

      streamRef.current = stream;
      videoElement.srcObject = stream;
      videoElement.muted = true;
      videoElement.playsInline = true;

      const handleCameraReady = () => {
        videoElement.removeEventListener("loadeddata", handleCameraReady);
        videoElement.removeEventListener("canplay", handleCameraReady);

        if (streamRef.current === stream) {
          setIsCameraReady(true);
          setError(null);
        }
      };

      setIsCameraReady(false);
      videoElement.addEventListener("loadeddata", handleCameraReady);
      videoElement.addEventListener("canplay", handleCameraReady);

      if (
        videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        videoElement.videoWidth > 0 &&
        videoElement.videoHeight > 0
      ) {
        handleCameraReady();
      }

      const playPromise = videoElement.play();
      if (playPromise instanceof Promise) {
        playPromise.catch((playError) => {
          console.warn("Camera capture video play deferred:", playError);
        });
      }

      if (!isConnected) {
        wsService.connect("live");
      }

      autoStartCaptureRef.current = true;
      setError(null);
      setStoredFrames([]);
      setSkippedFrames([]);
      setIsProcessing(false);
      setLastUpdateTime(Date.now());
      setIsStreaming(true);
    } catch (err) {
      releaseCameraStream();
      setError("Failed to access camera");
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    releaseCameraStream();
    setIsProcessing(false);
  };

  const startContinuousCapture = () => {
    if (!isStreaming || !isCameraReady) return;
    if (!isConnected) {
      wsService.connect("live");
      setError("Connecting to backend...");
      return;
    }

    clearCaptureInterval();
    setIsContinuousCapture(true);
    setError(null);
    // Capture at ~10 FPS (every 100ms)
    captureIntervalRef.current = window.setInterval(() => {
      captureFrame();
    }, 100);
  };

  const stopContinuousCapture = () => {
    autoStartCaptureRef.current = false;
    clearCaptureInterval();
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) return;
    if (!isConnected) {
      wsService.connect("live");
      setError("Connecting to backend...");
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;
    if (
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      setError("Camera feed is still initializing");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Convert to base64
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    const base64Frame = dataUrl.split(",")[1];

    // Send via WebSocket
    wsService.sendFrame(JSON.stringify({ frame: base64Frame }));
    setIsProcessing(true);
    setError(null);

    // Store captured frame for preview/history
    setStoredFrames((prev) => {
      const next = [...prev, dataUrl];
      return next.slice(-300); // keep last 300 frames
    });
  };

  // Upload functions
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      setError("Please select a video file");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress("Uploading video...");
    setFrameHistory([]);
    setStoredFrames([]);
    telemetryHistoryRef.current = [];
    persistHistory(FRAME_HISTORY_STORAGE_KEY, []);
    persistHistory(TELEMETRY_STORAGE_KEY, []);

    if (uploadVideoUrl) {
      URL.revokeObjectURL(uploadVideoUrl);
    }

    try {
      // Upload file
      const uploadResult = await uploadService.uploadVideo(file);
      setSessionId(uploadResult.session_id);
      setUploadProgress("Video uploaded. Starting processing...");

      // Set preview URL for uploaded video before processing
      const url = URL.createObjectURL(file);
      setUploadVideoUrl(url);

      // Connect to upload WebSocket
      wsService.connect("upload", uploadResult.session_id);
      setIsProcessing(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploadProgress("");
      setIsProcessing(false);
    } finally {
      setIsUploading(false);
    }
  };

  const pipelineSteps = PIPELINE_STEPS.map((name, index) => {
    let status: "completed" | "executing" | "skipped" | "pending";

    if (index < currentStep) {
      // Skip inference execution if decision is skip or partial
      if (
        name === "Inference Execution" &&
        (decision === "skip" || decision === "partial")
      ) {
        status = "skipped";
      } else {
        status = "completed";
      }
    } else if (index === currentStep && isProcessing) {
      status = "executing";
    } else {
      status = "pending";
    }

    return { name, status };
  });

  // Calculate statistics
  const stats = {
    totalFrames: frameHistory.length,
    avgScore: frameHistory.length > 0 ? frameHistory.reduce((sum, f) => sum + f.score, 0) / frameHistory.length : 0,
    skipRate: frameHistory.length > 0 ? (frameHistory.filter(f => f.decision === 'skip').length / frameHistory.length) * 100 : 0,
    fullRate: frameHistory.length > 0 ? (frameHistory.filter(f => f.decision === 'full').length / frameHistory.length) * 100 : 0,
  };


  return (
    <div className="h-full space-y-4 overflow-y-auto p-6">
      {/* Enhanced Status Bar */}
      <div className="flex items-center justify-between rounded-lg bg-neutral-900 p-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className={`h-3 w-3 rounded-full transition-all duration-300 ${
            isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
          }`} />
          <span className="text-sm text-neutral-300">
            {inputMode === "live" ? "Live Camera" : "Video Upload"} •
            {isConnected ? " Connected" : " Disconnected"}
          </span>
          {isProcessing && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-xs text-blue-400">Processing...</span>
            </div>
          )}
          {error && (
            <span className="text-sm text-red-400 animate-pulse">• {error}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="rounded-lg bg-neutral-800 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-700 transition-colors"
          >
            {showStats ? "Hide Stats" : "Show Stats"}
          </button>
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="rounded-lg bg-neutral-800 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-700 transition-colors"
          >
            {showCharts ? "Hide Charts" : "Show Charts"}
          </button>

          {inputMode === "live" ? (
            <div className="flex gap-2">
              {!isStreaming ? (
                <button
                  onClick={startCamera}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-all hover:scale-105"
                >
                  Start Camera
                </button>
              ) : (
                <>
                  {!isContinuousCapture ? (
                    <button
                      onClick={startContinuousCapture}
                      disabled={!isConnected || !isCameraReady}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-all hover:scale-105 disabled:hover:scale-100"
                    >
                      Start Continuous
                    </button>
                  ) : (
                    <button
                      onClick={stopContinuousCapture}
                      className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-all hover:scale-105"
                    >
                      Stop Continuous
                    </button>
                  )}
                  <button
                    onClick={captureFrame}
                    disabled={!isConnected || !isCameraReady || isContinuousCapture}
                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition-all hover:scale-105 disabled:hover:scale-100"
                  >
                    Single Frame
                  </button>
                  <button
                    onClick={stopCamera}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-all hover:scale-105"
                  >
                    Stop Camera
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                aria-label="Upload video file"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-all hover:scale-105 disabled:hover:scale-100"
              >
                {isUploading ? "Uploading..." : "Select Video"}
              </button>
              {uploadProgress && (
                <span className="text-sm text-neutral-300 animate-pulse">{uploadProgress}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Statistics Panel */}
      {showStats && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 animate-in slide-in-from-top-2">
          <h3 className="mb-3 text-sm font-medium text-neutral-300">Processing Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg bg-neutral-950 p-3">
              <div className="text-xs text-neutral-500">Total Frames</div>
              <div className="text-lg font-semibold text-white">{stats.totalFrames}</div>
            </div>
            <div className="rounded-lg bg-neutral-950 p-3">
              <div className="text-xs text-neutral-500">Avg Score</div>
              <div className="text-lg font-semibold text-blue-400">{stats.avgScore.toFixed(2)}</div>
            </div>
            <div className="rounded-lg bg-neutral-950 p-3">
              <div className="text-xs text-neutral-500">Skip Rate</div>
              <div className="text-lg font-semibold text-red-400">{stats.skipRate.toFixed(1)}%</div>
            </div>
            <div className="rounded-lg bg-neutral-950 p-3">
              <div className="text-xs text-neutral-500">Full Rate</div>
              <div className="text-lg font-semibold text-green-400">{stats.fullRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Offscreen video and canvas for live capture */}
      {inputMode === "live" && (
        <div className="pointer-events-none absolute left-0 top-0 h-px w-px overflow-hidden opacity-0">
          <video ref={videoRef} autoPlay playsInline muted />
          <canvas ref={canvasRef} />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <VideoDisplay
          frameId={frameId}
          importanceScore={importanceScore}
          decision={decision}
          showBoundingBoxes={showBoundingBoxes}
          inputMode={inputMode}
          isProcessing={isProcessing}
          lastUpdateTime={lastUpdateTime}
          previewUrl={inputMode === "upload" ? uploadVideoUrl : null}
          liveStream={inputMode === "live" ? streamRef.current : null}
          storedFrames={storedFrames}
          skippedFrames={skippedFrames}
        />
        <FrameDecision
          frameId={frameId}
          importanceScore={importanceScore}
          decision={decision}
          features={features}
          inputMode={inputMode}
          isProcessing={isProcessing}
        />
      </div>

      {/* Pipeline and Metrics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PipelineTracker
          steps={pipelineSteps}
          completionPercent={completionPercent}
          isProcessing={isProcessing}
        />
        <MetricsBar
          fps={fps}
          latency={latency}
          cpuUsage={cpuUsage}
          memoryUsage={memoryUsage}
          memoryUsedMB={memoryUsedMB}
          memoryLimitMB={memoryLimitMB}
          isConnected={isConnected}
        />
      </div>

      {/* Real-time Charts */}
      {showCharts && (
        <div className="space-y-4 animate-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RealTimeChart
              data={frameHistory}
              title="Importance Score Trend"
              color="blue"
              height={250}
              showArea={true}
            />
            <RealTimeChart
              data={frameHistory.map(d => ({ ...d, score: d.fps }))}
              title="FPS Performance"
              color="green"
              height={250}
            />
          </div>
          <RealTimeChart
            data={frameHistory.map(d => ({ ...d, score: d.latency }))}
            title="Latency Analysis"
            color="purple"
            height={200}
          />
        </div>
      )}
    </div>
  );
}
