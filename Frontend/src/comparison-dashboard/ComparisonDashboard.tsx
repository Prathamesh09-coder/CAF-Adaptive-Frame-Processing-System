import { useState, useEffect, useRef, useCallback } from "react";
import { SplitScreenView, SplitScreenHandle } from "./SplitScreenView";
import { ControlPanel } from "./ControlPanel";
import { PerformanceCharts } from "./PerformanceCharts";
import { CameraControls } from "./CameraControls";
import { HeroSummaryCard } from "./HeroSummaryCard";
import { BenchmarkTable } from "./BenchmarkTable";
import { ResearchValidation } from "./ResearchValidation";
import { useTelemetry } from "./useTelemetry";

/* ── Reusable section wrapper with elevated card styling ── */
function SectionCard({
  children,
  elevated = false,
  glow = false,
  style = {},
}: {
  children: React.ReactNode;
  elevated?: boolean;
  glow?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: elevated ? "#161616" : "#111111",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "18px",
        boxShadow: glow
          ? "0 4px 40px rgba(0,0,0,0.4), 0 0 60px rgba(139,92,246,0.03)"
          : "0 2px 20px rgba(0,0,0,0.3)",
        backdropFilter: "blur(12px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── Gradient divider between major sections ── */
function SectionDivider() {
  return (
    <div
      style={{
        height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.15), rgba(34,211,238,0.12), transparent)",
        margin: "4px 40px",
      }}
    />
  );
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function ComparisonDashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [rawTelemetry, setRawTelemetry] = useState<any>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [packetCount, setPacketCount] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const splitScreenRef = useRef<SplitScreenHandle>(null);
  
  const telemetry = useTelemetry(rawTelemetry);

  useEffect(() => {
    let timer: any;
    if (isCameraActive && sessionStartTime) {
      timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    }
    return () => clearInterval(timer);
  }, [isCameraActive, sessionStartTime]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/comparison");
    ws.binaryType = "blob";

    ws.onopen = () => setIsConnected(true);

    ws.onmessage = async (event) => {
      if (event.data instanceof Blob) {
        // Binary frame data — handled by child components
      } else {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "telemetry") {
            setRawTelemetry(data);
            setPacketCount(p => p + 1);
          }
        } catch (err) { }
      }
    };

    ws.onclose = () => setIsConnected(false);

    wsRef.current = ws;
    return () => { ws.close(); };
  }, []);

  const handleStartCamera = useCallback(() => {
    splitScreenRef.current?.startCamera();
    setSessionStartTime(Date.now());
  }, []);

  const handleStopCamera = useCallback(() => {
    splitScreenRef.current?.stopCamera();
    setIsCameraActive(false);
  }, []);

  const handleCameraStateChange = useCallback((active: boolean) => {
    setIsCameraActive(active);
  }, []);

  const getSystemHealth = () => {
    if (!telemetry || !isCameraActive) return { state: "STANDBY", color: "#737373" };
    const cpu = telemetry.caf?.metrics?.pipeline_cpu_usage || 0;
    const fps = telemetry.caf?.metrics?.fps || 0;
    if (cpu > 80 || fps < 10) return { state: "CRITICAL", color: "#ef4444" };
    if (cpu > 50 || fps < 20) return { state: "MODERATE", color: "#fbbf24" };
    return { state: "OPTIMAL", color: "#22c55e" };
  };

  const health = getSystemHealth();
  const sessionDuration = sessionStartTime && isCameraActive ? (currentTime - sessionStartTime) / 1000 : 0;

  return (
    /* ── Outer viewport: fills the screen, dark base ── */
    <div
      style={{
        height: "100%",
        background: "#080808",
        color: "#ffffff",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* ── Centered max-width container ── */}
      <div
        style={{
          maxWidth: "1600px",
          margin: "0 auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          minHeight: "100%",
        }}
      >
        {/* ═══════════════════ 1. HEADER ═══════════════════ */}
        <SectionCard style={{ padding: "18px 28px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #60a5fa, #a78bfa, #ec4899)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.01em",
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                CAF Comparative Intelligence
              </h1>
              <p
                style={{
                  fontSize: "11px",
                  color: "#525252",
                  margin: "4px 0 0",
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Real-Time Object Detection Benchmarking Platform
              </p>
              {isCameraActive && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px" }}>
                  {/* System Health */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "10px", color: "#737373", fontFamily: "monospace" }}>HEALTH:</span>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: health.color, fontFamily: "monospace" }}>
                      {health.state}
                    </span>
                  </div>
                  <div style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.1)" }} />
                  {/* Runtime Timer */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "10px", color: "#737373", fontFamily: "monospace" }}>RUNTIME:</span>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#e5e5e5", fontFamily: "monospace" }}>
                      {formatDuration(sessionDuration)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* WS Status & Monitoring */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                <div
                  style={{
                    fontSize: "11px",
                    fontFamily: "monospace",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "7px 14px",
                    borderRadius: "10px",
                    background: isConnected
                      ? "rgba(34,197,94,0.06)"
                      : "rgba(239,68,68,0.06)",
                    border: isConnected
                      ? "1px solid rgba(34,197,94,0.15)"
                      : "1px solid rgba(239,68,68,0.15)",
                  }}
                >
                  <div
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: isConnected ? "#22c55e" : "#ef4444",
                      boxShadow: isConnected
                        ? "0 0 8px rgba(34,197,94,0.5)"
                        : "0 0 8px rgba(239,68,68,0.4)",
                    }}
                  />
                  <span style={{ color: isConnected ? "#4ade80" : "#f87171", fontWeight: 500 }}>
                    {isConnected ? "WS Connected" : "Disconnected"}
                  </span>
                </div>
                {isConnected && isCameraActive && (
                  <div style={{ fontSize: "9px", color: "#737373", fontFamily: "monospace", paddingRight: "4px" }}>
                    PKT: {packetCount} | LAT: {telemetry?.e2e_latency_ms?.toFixed(0) || 0}ms
                  </div>
                )}
              </div>

              {/* Scenario controls */}
              <ControlPanel wsRef={wsRef} />
            </div>
          </div>
        </SectionCard>

        {/* ═══════════════════ 2. CAMERA CONTROL BAR ═══════════════════ */}
        <CameraControls
          isCameraActive={isCameraActive}
          onStart={handleStartCamera}
          onStop={handleStopCamera}
        />

        <SectionDivider />

        {/* ═══════════════════ 3. HERO SUMMARY ═══════════════════ */}
        <HeroSummaryCard telemetry={telemetry} />

        <SectionDivider />

        {/* ═══════════════════ 4. SPLIT SCREEN + HERO METRICS ═══════════════════ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 2fr 1.3fr",
            gap: "20px",
            minHeight: "380px",
          }}
        >
          {/* Split-screen video feeds (spans 2 cols) */}
          <SectionCard
            elevated
            style={{
              gridColumn: "1 / 3",
              overflow: "hidden",
              position: "relative",
              padding: "0",
            }}
          >
            <SplitScreenView
              ref={splitScreenRef}
              wsRef={wsRef}
              telemetry={telemetry}
              onCameraStateChange={handleCameraStateChange}
            />
          </SectionCard>

          {/* Metrics sidebar */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              minHeight: 0,
            }}
          >
            <PerformanceCharts telemetry={telemetry} />
          </div>
        </div>

        <SectionDivider />

        {/* ═══════════════════ 5. BENCHMARK TABLE + VALIDATION ═══════════════════ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gap: "20px",
            alignItems: "start",
          }}
        >
          <BenchmarkTable telemetry={telemetry} />
          <ResearchValidation telemetry={telemetry} />
        </div>

        {/* Bottom breathing room */}
        <div style={{ height: "12px", flexShrink: 0 }} />
      </div>
    </div>
  );
}
