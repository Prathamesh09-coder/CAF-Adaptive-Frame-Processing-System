import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { CanvasRenderer } from "./CanvasRenderer";

export interface SplitScreenHandle {
  startCamera: () => void;
  stopCamera: () => void;
}

interface SplitScreenViewProps {
  wsRef: React.RefObject<WebSocket | null>;
  telemetry: any;
  onCameraStateChange?: (active: boolean) => void;
}

export const SplitScreenView = forwardRef<SplitScreenHandle, SplitScreenViewProps>(
  function SplitScreenView({ wsRef, telemetry, onCameraStateChange }, ref) {
    const tradCanvasRef = useRef<HTMLCanvasElement>(null);
    const cafCanvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<any>(null);
    const [isCameraRunning, setIsCameraRunning] = useState(false);

    const stopCamera = useCallback(() => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraRunning(false);
      onCameraStateChange?.(false);
    }, [onCameraStateChange]);

    const startCamera = useCallback(async () => {
      stopCamera();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext("2d");

        intervalRef.current = setInterval(() => {
          if (
            wsRef.current &&
            wsRef.current.readyState === WebSocket.OPEN &&
            videoRef.current &&
            ctx
          ) {
            ctx.drawImage(videoRef.current, 0, 0, 640, 480);

            const base64 = canvas.toDataURL("image/jpeg", 0.6).split(",")[1];
            wsRef.current.send(
              JSON.stringify({
                frame: base64,
                timestamp: Date.now(),
              })
            );

            const tradCtx = tradCanvasRef.current?.getContext("2d");
            const cafCtx = cafCanvasRef.current?.getContext("2d");

            if (tradCtx && cafCtx) {
              tradCtx.drawImage(videoRef.current, 0, 0, 640, 480);
              cafCtx.drawImage(videoRef.current, 0, 0, 640, 480);
            }
          }
        }, 100);

        setIsCameraRunning(true);
        onCameraStateChange?.(true);
      } catch (err) {
        console.error("Camera error:", err);
        setIsCameraRunning(false);
        onCameraStateChange?.(false);
      }
    }, [wsRef, stopCamera, onCameraStateChange]);

    useImperativeHandle(ref, () => ({
      startCamera,
      stopCamera,
    }), [startCamera, stopCamera]);

    useEffect(() => {
      return () => { stopCamera(); };
    }, [stopCamera]);

    useEffect(() => {
      if (!telemetry) return;

      if (tradCanvasRef.current && telemetry.traditional?.result) {
        CanvasRenderer.drawOverlays(
          tradCanvasRef.current,
          telemetry.traditional.result,
          "traditional"
        );
      }

      if (cafCanvasRef.current && telemetry.caf?.result) {
        CanvasRenderer.drawOverlays(
          cafCanvasRef.current,
          telemetry.caf.result,
          "caf"
        );
      }
    }, [telemetry]);

    /* ── Placeholder overlay when camera is off ── */
    const renderPlaceholder = (accentColor: string, label: string) => (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5,
          background: "rgba(8,8,8,0.92)",
          backdropFilter: "blur(6px)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: `${accentColor}0D`,
              border: `1px solid ${accentColor}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="1.8">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#404040",
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              letterSpacing: "0.04em",
            }}
          >
            Awaiting Camera Feed
          </div>
          <div
            style={{
              fontSize: "10px",
              color: "#2a2a2a",
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              marginTop: "4px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {label}
          </div>
        </div>
      </div>
    );

    /* ── Pipeline label badge ── */
    const renderLabel = (text: string, color: string) => (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 10,
          margin: "16px",
          padding: "6px 14px",
          borderRadius: "10px",
          background: "rgba(8,8,8,0.85)",
          backdropFilter: "blur(8px)",
          border: `1px solid ${color}30`,
          fontSize: "10px",
          fontWeight: 700,
          fontFamily: "'SF Mono', 'Fira Code', monospace",
          color,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {text}
      </div>
    );

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "3px",
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
        }}
      >
        <video ref={videoRef} autoPlay playsInline muted style={{ display: "none" }} />

        {/* ── Traditional (Left) ── */}
        <div style={{ position: "relative", overflow: "hidden", borderRadius: "16px 0 0 16px" }}>
          {renderLabel("Traditional Pipeline · Dense", "#60a5fa")}
          {!isCameraRunning && renderPlaceholder("#60a5fa", "Traditional Dense Processing")}
          <canvas
            ref={tradCanvasRef}
            width={640}
            height={480}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>

        {/* ── CAF (Right) ── */}
        <div style={{ position: "relative", overflow: "hidden", borderRadius: "0 16px 16px 0" }}>
          {renderLabel("CAF Pipeline · Adaptive", "#a78bfa")}
          {!isCameraRunning && renderPlaceholder("#a78bfa", "Adaptive Frame Optimization")}
          <canvas
            ref={cafCanvasRef}
            width={640}
            height={480}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      </div>
    );
  }
);
