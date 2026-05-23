import { useState } from "react";
import { Video, VideoOff } from "lucide-react";

interface CameraControlsProps {
  isCameraActive: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function CameraControls({ isCameraActive, onStart, onStop }: CameraControlsProps) {
  const [startHover, setStartHover] = useState(false);
  const [stopHover, setStopHover] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#111111",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "18px",
        padding: "16px 28px",
        backdropFilter: "blur(12px)",
        boxShadow: "0 2px 20px rgba(0,0,0,0.3)",
      }}
    >
      {/* Left: Camera Controls Label */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: isCameraActive
              ? "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.04))"
              : "linear-gradient(135deg, rgba(100,100,100,0.12), rgba(100,100,100,0.04))",
            border: isCameraActive
              ? "1px solid rgba(34,197,94,0.2)"
              : "1px solid rgba(100,100,100,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease",
          }}
        >
          {isCameraActive ? (
            <Video size={16} color="#22c55e" />
          ) : (
            <VideoOff size={16} color="#737373" />
          )}
        </div>
        <div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#e5e5e5",
              letterSpacing: "0.02em",
            }}
          >
            Camera Controls
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#525252",
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              marginTop: "2px",
              letterSpacing: "0.04em",
            }}
          >
            Webcam Stream • WebSocket Pipeline
          </div>
        </div>
      </div>

      {/* Center: Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={onStart}
          disabled={isCameraActive}
          onMouseEnter={() => setStartHover(true)}
          onMouseLeave={() => setStartHover(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 22px",
            borderRadius: "12px",
            border: isCameraActive
              ? "1px solid rgba(64,64,64,0.3)"
              : "1px solid rgba(34,197,94,0.3)",
            background: isCameraActive
              ? "rgba(38,38,38,0.4)"
              : startHover
                ? "linear-gradient(135deg, rgba(34,197,94,0.22), rgba(34,197,94,0.08))"
                : "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.03))",
            color: isCameraActive ? "#404040" : "#22c55e",
            fontSize: "12px",
            fontWeight: 600,
            cursor: isCameraActive ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            boxShadow: !isCameraActive && startHover
              ? "0 0 24px rgba(34,197,94,0.15), inset 0 0 24px rgba(34,197,94,0.04)"
              : !isCameraActive
                ? "0 0 12px rgba(34,197,94,0.06)"
                : "none",
            transform: !isCameraActive && startHover ? "translateY(-1px)" : "translateY(0)",
            letterSpacing: "0.04em",
          }}
        >
          <Video size={14} />
          Start Camera
        </button>

        <button
          onClick={onStop}
          disabled={!isCameraActive}
          onMouseEnter={() => setStopHover(true)}
          onMouseLeave={() => setStopHover(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 22px",
            borderRadius: "12px",
            border: !isCameraActive
              ? "1px solid rgba(64,64,64,0.3)"
              : "1px solid rgba(239,68,68,0.3)",
            background: !isCameraActive
              ? "rgba(38,38,38,0.4)"
              : stopHover
                ? "linear-gradient(135deg, rgba(239,68,68,0.22), rgba(239,68,68,0.08))"
                : "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.03))",
            color: !isCameraActive ? "#404040" : "#ef4444",
            fontSize: "12px",
            fontWeight: 600,
            cursor: !isCameraActive ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            boxShadow: isCameraActive && stopHover
              ? "0 0 24px rgba(239,68,68,0.15), inset 0 0 24px rgba(239,68,68,0.04)"
              : isCameraActive
                ? "0 0 12px rgba(239,68,68,0.06)"
                : "none",
            transform: isCameraActive && stopHover ? "translateY(-1px)" : "translateY(0)",
            letterSpacing: "0.04em",
          }}
        >
          <VideoOff size={14} />
          Stop Camera
        </button>
      </div>

      {/* Right: Status Indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: isCameraActive ? "#22c55e" : "#ef4444",
            boxShadow: isCameraActive
              ? "0 0 10px rgba(34,197,94,0.6), 0 0 20px rgba(34,197,94,0.25)"
              : "0 0 8px rgba(239,68,68,0.35)",
            animation: isCameraActive ? "pulse-dot 2s ease-in-out infinite" : "none",
            transition: "all 0.3s ease",
          }}
        />
        <span
          style={{
            fontSize: "12px",
            fontWeight: 500,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            color: isCameraActive ? "#22c55e" : "#ef4444",
            letterSpacing: "0.04em",
          }}
        >
          {isCameraActive ? "Camera Active" : "Camera Stopped"}
        </span>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
