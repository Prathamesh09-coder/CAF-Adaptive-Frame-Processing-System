export function PerformanceCharts({ telemetry }: { telemetry: any }) {
  const currentTrad = telemetry?.traditional?.metrics || {};
  const currentCaf = telemetry?.caf?.metrics || {};

  const heroMetrics = [
    {
      label: "CAF FPS",
      value: currentCaf.fps ? Number(currentCaf.fps).toFixed(1) : "0.0",
      color: "#34d399",
      accent: "rgba(52,211,153,0.1)",
      border: "rgba(52,211,153,0.15)",
    },
    {
      label: "Trad FPS",
      value: currentTrad.fps ? Number(currentTrad.fps).toFixed(1) : "0.0",
      color: "#60a5fa",
      accent: "rgba(96,165,250,0.1)",
      border: "rgba(96,165,250,0.15)",
    },
    {
      label: "E2E Latency",
      value: telemetry ? `${telemetry.e2e_latency_ms.toFixed(1)} ms` : "0.0 ms",
      color: "#fbbf24",
      accent: "rgba(251,191,36,0.08)",
      border: "rgba(251,191,36,0.12)",
    },
    {
      label: "CAF CPU Load",
      value: `${currentCaf.pipeline_cpu_usage ? currentCaf.pipeline_cpu_usage.toFixed(1) : "0.0"}%`,
      color: "#f87171",
      accent: "rgba(248,113,113,0.08)",
      border: "rgba(248,113,113,0.12)",
    },
  ];

  const totalFramesProcessed = (currentCaf.frames_processed || 0) + (currentCaf.frames_skipped || 0);
  const cpuSaved = (currentTrad.pipeline_cpu_usage || 0) - (currentCaf.pipeline_cpu_usage || 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
      {/* ── Hero Metrics Card ── */}
      <div
        style={{
          background: "#111111",
          padding: "20px",
          borderRadius: "18px",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 2px 20px rgba(0,0,0,0.3)",
        }}
      >
        <h3
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#404040",
            marginBottom: "16px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            margin: "0 0 16px",
          }}
        >
          Hero Metrics
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
          }}
        >
          {heroMetrics.map(({ label, value, color, accent, border }) => (
            <div
              key={label}
              style={{
                background: accent,
                padding: "14px 16px",
                borderRadius: "14px",
                border: `1px solid ${border}`,
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  color: "#525252",
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                  fontWeight: 600,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  color,
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Optimization Savings Card ── */}
      <div
        style={{
          background: "#111111",
          padding: "20px",
          borderRadius: "18px",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 2px 20px rgba(0,0,0,0.3)",
        }}
      >
        <h3
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#404040",
            marginBottom: "16px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            margin: "0 0 16px",
          }}
        >
          Live Optimization Gains
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#737373", fontFamily: "monospace" }}>Frames Skipped</span>
            <span style={{ fontSize: "12px", color: "#a78bfa", fontWeight: "bold", fontFamily: "monospace" }}>
              {currentCaf.frames_skipped || 0} / {totalFramesProcessed}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#737373", fontFamily: "monospace" }}>Compute Avoided</span>
            <span style={{ fontSize: "12px", color: "#34d399", fontWeight: "bold", fontFamily: "monospace" }}>
              {totalFramesProcessed > 0 
                ? `${(((currentCaf.frames_skipped || 0) / totalFramesProcessed) * 100).toFixed(1)}%`
                : "0.0%"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#737373", fontFamily: "monospace" }}>Est. CPU Load Saved</span>
            <span style={{ fontSize: "12px", color: "#22d3ee", fontWeight: "bold", fontFamily: "monospace" }}>
              {cpuSaved > 0 ? `-${cpuSaved.toFixed(1)}%` : "0.0%"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Detection Consistency Analytics Card ── */}
      <div
        style={{
          background: "#111111",
          padding: "20px",
          borderRadius: "18px",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 2px 20px rgba(0,0,0,0.3)",
        }}
      >
        <h3
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#404040",
            marginBottom: "16px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            margin: "0 0 16px",
          }}
        >
          Detection Consistency Analytics
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#737373", fontFamily: "monospace" }}>Detection Stability</span>
            <span style={{ fontSize: "12px", color: "#fbbf24", fontWeight: "bold", fontFamily: "monospace" }}>
              {currentCaf.detection_stability ? `${currentCaf.detection_stability.toFixed(1)}%` : "0.0%"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#737373", fontFamily: "monospace" }}>Refresh Frequency</span>
            <span style={{ fontSize: "12px", color: "#60a5fa", fontWeight: "bold", fontFamily: "monospace" }}>
              {currentCaf.refresh_frequency ? `${currentCaf.refresh_frequency.toFixed(1)}%` : "0.0%"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#737373", fontFamily: "monospace" }}>Drift Rate</span>
            <span style={{ fontSize: "12px", color: "#f87171", fontWeight: "bold", fontFamily: "monospace" }}>
              {currentCaf.drift_rate ? `${currentCaf.drift_rate.toFixed(1)}%` : "0.0%"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#737373", fontFamily: "monospace" }}>Missed Detections</span>
            <span style={{ fontSize: "12px", color: "#f87171", fontWeight: "bold", fontFamily: "monospace" }}>
              {currentCaf.missed_detections || 0}
            </span>
          </div>
        </div>
      </div>

      {/* ── Class Analytics Card ── */}
      <div
        style={{
          background: "#111111",
          padding: "20px",
          borderRadius: "18px",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 2px 20px rgba(0,0,0,0.3)",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <h3
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#404040",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            margin: "0 0 14px",
          }}
        >
          Class Analytics (CAF)
        </h3>
        <div
          style={{
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          {Object.entries(currentCaf.class_counts || {}).length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                color: "#2a2a2a",
                fontSize: "11px",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                letterSpacing: "0.04em",
              }}
            >
              Awaiting Detection Data
            </div>
          ) : (
            Object.entries(currentCaf.class_counts || {}).map(([cls, count]) => (
              <div
                key={cls}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "rgba(255,255,255,0.02)",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.03)",
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  fontSize: "12px",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ color: "#a3a3a3", fontWeight: 500 }}>{cls}</span>
                <span style={{ color: "#a78bfa", fontWeight: 700, fontSize: "14px" }}>
                  {count as number}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Alerts ── */}
      {currentCaf.alerts && currentCaf.alerts.length > 0 && (
        <div
          style={{
            background: "rgba(239,68,68,0.04)",
            border: "1px solid rgba(239,68,68,0.12)",
            padding: "18px 20px",
            borderRadius: "18px",
          }}
        >
          <h3
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#f87171",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              margin: "0 0 10px",
            }}
          >
            System Alerts
          </h3>
          <ul
            style={{
              listStyle: "disc inside",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {currentCaf.alerts.map((a: any, i: number) => (
              <li
                key={i}
                style={{
                  fontSize: "11px",
                  color: "#fca5a5",
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  lineHeight: 1.5,
                }}
              >
                {a.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
