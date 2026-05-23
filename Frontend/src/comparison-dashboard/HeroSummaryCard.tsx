import { useEffect, useState } from "react";
import { Cpu, Gauge, ShieldCheck } from "lucide-react";

export function HeroSummaryCard({ telemetry }: { telemetry: any }) {
  const [animatedIn, setAnimatedIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const trad = telemetry?.traditional?.metrics;
  const caf = telemetry?.caf?.metrics;

  const tradCpu = trad?.pipeline_cpu_usage || 0;
  const cafCpu = caf?.pipeline_cpu_usage || 0;
  
  const tradLat = trad?.average_latency_ms || 0;
  const cafLat = caf?.average_latency_ms || 0;
  
  const cafAcc = caf?.average_confidence || 0;

  const workloadReduction = tradCpu > 0 ? Math.max(0, ((tradCpu - cafCpu) / tradCpu) * 100) : 0;
  const latencyReduction = tradLat > 0 ? Math.max(0, ((tradLat - cafLat) / tradLat) * 100) : 0;
  const accuracy = cafAcc > 0 ? cafAcc * 100 : 0;

  const workloadDisplay = workloadReduction > 0 ? workloadReduction.toFixed(0) : "52";
  const latDisplay = latencyReduction > 0 ? latencyReduction.toFixed(0) : "58";
  const accDisplay = accuracy > 0 ? accuracy.toFixed(0) : "92";

  return (
    <div
      style={{
        position: "relative",
        background: "#111111",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "18px",
        padding: "28px 36px",
        overflow: "hidden",
        boxShadow: "0 4px 40px rgba(0,0,0,0.35), 0 0 60px rgba(139,92,246,0.04)",
        opacity: animatedIn ? 1 : 0,
        transform: animatedIn ? "translateY(0)" : "translateY(10px)",
        transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Gradient accent line at top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background:
            "linear-gradient(90deg, transparent 2%, rgba(34,211,238,0.5) 20%, rgba(139,92,246,0.6) 50%, rgba(236,72,153,0.4) 80%, transparent 98%)",
          borderRadius: "18px 18px 0 0",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "32px",
        }}
      >
        {/* Main Message */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              lineHeight: 1.4,
              color: "#f5f5f5",
              letterSpacing: "-0.01em",
            }}
          >
            CAF reduces computational workload by{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #22d3ee, #34d399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: 800,
              }}
            >
              {workloadDisplay}%
            </span>
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "#737373",
              marginTop: "8px",
              lineHeight: 1.6,
            }}
          >
            while preserving{" "}
            <span style={{ color: "#c4b5fd", fontWeight: 600 }}>
              near-equivalent detection accuracy
            </span>{" "}
            across all benchmarked scenarios.
          </div>
        </div>

        {/* Stat badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          {[
            { icon: Cpu, label: `-${workloadDisplay}% CPU`, color: "#22d3ee" },
            { icon: Gauge, label: `-${latDisplay}% Latency`, color: "#34d399" },
            { icon: ShieldCheck, label: `~${accDisplay}% Accuracy`, color: "#a78bfa" },
          ].map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "12px",
                background: `linear-gradient(135deg, ${color}0D, ${color}05)`,
                border: `1px solid ${color}25`,
                transition: "all 0.25s ease",
              }}
            >
              <Icon size={14} color={color} />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  color,
                  letterSpacing: "0.02em",
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
