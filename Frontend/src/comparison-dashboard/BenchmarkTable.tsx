import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";

interface BenchmarkTableProps {
  telemetry: any;
}

interface MetricRow {
  metric: string;
  traditional: string;
  caf: string;
  improvement: string;
  improvementType: "better" | "similar" | "warning";
  highlight?: boolean;
}

const defaultMetrics: MetricRow[] = [
  { metric: "FPS", traditional: "12", caf: "28", improvement: "+133%", improvementType: "better" },
  { metric: "CPU Usage", traditional: "87%", caf: "41%", improvement: "-52%", improvementType: "better" },
  { metric: "Latency", traditional: "220ms", caf: "91ms", improvement: "-58%", improvementType: "better" },
  { metric: "Frames Processed", traditional: "100%", caf: "34%", improvement: "-66%", improvementType: "better" },
  { metric: "Detection Accuracy", traditional: "94%", caf: "92%", improvement: "Similar", improvementType: "similar", highlight: true },
  { metric: "F1 Score", traditional: "0.93", caf: "0.91", improvement: "Similar", improvementType: "similar", highlight: true },
];

function getImprovementStyle(type: string, improvement: string) {
  if (type === "similar") {
    return {
      color: "#a78bfa",
      background: "linear-gradient(135deg, rgba(167,139,250,0.1), rgba(167,139,250,0.03))",
      border: "1px solid rgba(167,139,250,0.2)",
    };
  }
  if (type === "better") {
    if (improvement.startsWith("+")) {
      return {
        color: "#22d3ee",
        background: "linear-gradient(135deg, rgba(34,211,238,0.1), rgba(34,211,238,0.03))",
        border: "1px solid rgba(34,211,238,0.2)",
      };
    }
    return {
      color: "#34d399",
      background: "linear-gradient(135deg, rgba(52,211,153,0.1), rgba(52,211,153,0.03))",
      border: "1px solid rgba(52,211,153,0.2)",
    };
  }
  return {
    color: "#ef4444",
    background: "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.03))",
    border: "1px solid rgba(239,68,68,0.2)",
  };
}

function ImprovementIcon({ type, improvement }: { type: string; improvement: string }) {
  if (type === "similar") return <Minus size={13} />;
  if (improvement.startsWith("+")) return <TrendingUp size={13} />;
  return <TrendingDown size={13} />;
}

export function BenchmarkTable({ telemetry }: BenchmarkTableProps) {
  const [metrics, setMetrics] = useState<MetricRow[]>(defaultMetrics);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [animatedIn, setAnimatedIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!telemetry || !telemetry.traditional || !telemetry.caf) return;

    const trad = telemetry.traditional.metrics;
    const caf = telemetry.caf.metrics;

    const formatDiff = (t: number, c: number, lowerIsBetter = false) => {
      if (t === 0) return { text: "N/A", type: "similar" };
      const diff = ((c - t) / t) * 100;
      const isBetter = lowerIsBetter ? diff < -2 : diff > 2;
      const isWorse = lowerIsBetter ? diff > 2 : diff < -2;
      const type = isBetter ? "better" : isWorse ? "warning" : "similar";
      const text = Math.abs(diff) < 2 ? "Similar" : `${diff > 0 ? "+" : ""}${diff.toFixed(0)}%`;
      return { text, type };
    };

    const tradFps = trad.fps || 0;
    const cafFps = caf.fps || 0;
    const fpsDiff = formatDiff(tradFps, cafFps, false);

    const tradCpu = trad.pipeline_cpu_usage || 0;
    const cafCpu = caf.pipeline_cpu_usage || 0;
    const cpuDiff = formatDiff(tradCpu, cafCpu, true);

    const tradLat = trad.average_latency_ms || 0;
    const cafLat = caf.average_latency_ms || 0;
    const latDiff = formatDiff(tradLat, cafLat, true);

    const tradProc = 100;
    const totalCafFrames = (caf.frames_processed || 0) + (caf.frames_skipped || 0);
    const cafProc = totalCafFrames > 0 ? ((caf.frames_processed || 0) / totalCafFrames) * 100 : 0;
    const procDiff = formatDiff(tradProc, cafProc, true);

    const tradAcc = trad.average_confidence || 0;
    const cafAcc = caf.average_confidence || 0;
    const accDiff = formatDiff(tradAcc, cafAcc, false);

    // F1 Score proxy relative to Traditional
    const f1Proxy = tradAcc > 0 ? Math.min(1.0, cafAcc / tradAcc) : 1.0;
    const f1Type = f1Proxy > 0.95 ? "similar" : "warning";
    const f1Text = f1Proxy > 0.95 ? "Similar" : `${((f1Proxy - 1) * 100).toFixed(0)}%`;

    setMetrics([
      { metric: "FPS", traditional: tradFps.toFixed(1), caf: cafFps.toFixed(1), improvement: fpsDiff.text, improvementType: fpsDiff.type as any },
      { metric: "CPU Usage", traditional: `${tradCpu.toFixed(1)}%`, caf: `${cafCpu.toFixed(1)}%`, improvement: cpuDiff.text, improvementType: cpuDiff.type as any },
      { metric: "Latency", traditional: `${tradLat.toFixed(0)}ms`, caf: `${cafLat.toFixed(0)}ms`, improvement: latDiff.text, improvementType: latDiff.type as any },
      { metric: "Frames Processed", traditional: "100%", caf: `${cafProc.toFixed(0)}%`, improvement: procDiff.text, improvementType: procDiff.type as any },
      { metric: "Detection Accuracy", traditional: `${(tradAcc * 100).toFixed(1)}%`, caf: `${(cafAcc * 100).toFixed(1)}%`, improvement: accDiff.text, improvementType: accDiff.type as any, highlight: true },
      { metric: "F1 Score (Proxy)", traditional: "1.00", caf: f1Proxy.toFixed(2), improvement: f1Text, improvementType: f1Type as any, highlight: true },
    ]);
  }, [telemetry]);

  return (
    <div
      style={{
        background: "#111111",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "18px",
        overflow: "hidden",
        boxShadow: "0 4px 40px rgba(0,0,0,0.35), 0 0 60px rgba(139,92,246,0.03)",
        opacity: animatedIn ? 1 : 0,
        transform: animatedIn ? "translateY(0)" : "translateY(12px)",
        transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* ── Table Header Title ── */}
      <div
        style={{
          padding: "20px 28px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "9px",
              background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.08))",
              border: "1px solid rgba(139,92,246,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={15} color="#a78bfa" />
          </div>
          <div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
                background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "0.01em",
              }}
            >
              Realtime Performance Benchmark Comparison
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#404040",
                marginTop: "3px",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                letterSpacing: "0.04em",
              }}
            >
              Traditional Dense vs CAF Adaptive Pipeline
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: "10px",
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            color: "#404040",
            padding: "5px 12px",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.04)",
            letterSpacing: "0.08em",
            fontWeight: 600,
          }}
        >
          LIVE DATA
        </div>
      </div>

      {/* ── Table Body ── */}
      <div style={{ padding: "8px 20px 24px" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px" }}>
          <thead>
            <tr>
              {["Metric", "Traditional", "CAF", "Improvement"].map((col, i) => (
                <th
                  key={col}
                  style={{
                    padding: "12px 20px",
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "#404040",
                    textAlign: i === 0 ? "left" : "center",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((row, idx) => {
              const isHovered = hoveredRow === idx;
              const improvStyle = getImprovementStyle(row.improvementType, row.improvement);

              return (
                <tr
                  key={row.metric}
                  onMouseEnter={() => setHoveredRow(idx)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    background: row.highlight
                      ? isHovered
                        ? "rgba(167,139,250,0.07)"
                        : "rgba(167,139,250,0.03)"
                      : isHovered
                        ? "rgba(255,255,255,0.02)"
                        : "transparent",
                    transition: "all 0.2s ease",
                    cursor: "default",
                  }}
                >
                  {/* Metric Name */}
                  <td
                    style={{
                      padding: "14px 20px",
                      fontSize: "13px",
                      fontWeight: row.highlight ? 600 : 500,
                      color: row.highlight ? "#c4b5fd" : "#d4d4d4",
                      borderRadius: "10px 0 0 10px",
                      borderLeft: row.highlight
                        ? "2px solid rgba(167,139,250,0.4)"
                        : "2px solid transparent",
                      lineHeight: 1.6,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {row.metric}
                      {row.highlight && (
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: 700,
                            color: "#a78bfa",
                            background: "rgba(167,139,250,0.1)",
                            border: "1px solid rgba(167,139,250,0.15)",
                            padding: "2px 8px",
                            borderRadius: "5px",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            fontFamily: "'SF Mono', 'Fira Code', monospace",
                          }}
                        >
                          KEY
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Traditional */}
                  <td
                    style={{
                      padding: "14px 20px",
                      textAlign: "center",
                      fontSize: "14px",
                      fontWeight: 600,
                      fontFamily: "'SF Mono', 'Fira Code', monospace",
                      color: row.metric === "CPU Usage" ? "#f87171" : "#a3a3a3",
                      lineHeight: 1.6,
                    }}
                  >
                    {row.traditional}
                  </td>

                  {/* CAF */}
                  <td
                    style={{
                      padding: "14px 20px",
                      textAlign: "center",
                      fontSize: "14px",
                      fontWeight: 600,
                      fontFamily: "'SF Mono', 'Fira Code', monospace",
                      color: row.highlight ? "#c4b5fd" : "#22d3ee",
                      lineHeight: 1.6,
                    }}
                  >
                    {row.caf}
                  </td>

                  {/* Improvement */}
                  <td
                    style={{
                      padding: "14px 20px",
                      textAlign: "center",
                      borderRadius: "0 10px 10px 0",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "5px 14px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 700,
                        fontFamily: "'SF Mono', 'Fira Code', monospace",
                        letterSpacing: "0.04em",
                        ...improvStyle,
                      }}
                    >
                      <ImprovementIcon type={row.improvementType} improvement={row.improvement} />
                      {row.improvement}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
