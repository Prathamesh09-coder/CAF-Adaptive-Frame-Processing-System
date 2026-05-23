import { useEffect, useState } from "react";
import { CheckCircle2, FlaskConical } from "lucide-react";

const validationItems = [
  { text: "Reduced CPU Usage", color: "#34d399" },
  { text: "Lower Latency", color: "#22d3ee" },
  { text: "Similar Detection Accuracy", color: "#a78bfa" },
  { text: "Stable Realtime Performance", color: "#f59e0b" },
  { text: "Adaptive Frame Optimization", color: "#ec4899" },
];

export function ResearchValidation({ telemetry }: { telemetry: any }) {
  const [animatedIn, setAnimatedIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedIn(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const getValidationItems = () => {
    const items = [];
    if (!telemetry || !telemetry.traditional || !telemetry.caf) {
        return [
          { text: "Awaiting Live Telemetry...", color: "#737373" }
        ];
    }
    
    const trad = telemetry.traditional.metrics;
    const caf = telemetry.caf.metrics;

    if ((caf.pipeline_cpu_usage || 0) < (trad.pipeline_cpu_usage || 0) - 0.5) {
      items.push({ text: "Reduced CPU Usage", color: "#34d399" });
    }
    
    if ((caf.average_latency_ms || 0) < (trad.average_latency_ms || 0) - 2) {
      items.push({ text: "Lower Inference Latency", color: "#22d3ee" });
    }
    
    const accDiff = Math.abs((caf.average_confidence || 0) - (trad.average_confidence || 0));
    if (accDiff < 0.05 && (caf.average_confidence || 0) > 0.1) {
      items.push({ text: "Similar Detection Accuracy", color: "#a78bfa" });
    }
    
    if ((caf.fps || 0) >= 10) {
      items.push({ text: "Stable Realtime Performance", color: "#f59e0b" });
    }
    
    if ((caf.frames_skipped || 0) > 0) {
      items.push({ text: "Adaptive Frame Optimization Active", color: "#ec4899" });
    }

    if (items.length === 0) {
      items.push({ text: "Gathering benchmark data...", color: "#737373" });
    }

    return items;
  };

  const dynamicItems = getValidationItems();

  return (
    <div
      style={{
        background: "#111111",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "18px",
        padding: "20px 22px",
        boxShadow: "0 2px 20px rgba(0,0,0,0.3)",
        opacity: animatedIn ? 1 : 0,
        transform: animatedIn ? "translateY(0)" : "translateY(8px)",
        transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s",
      }}
    >
      {/* Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, rgba(52,211,153,0.12), rgba(34,211,238,0.06))",
            border: "1px solid rgba(52,211,153,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FlaskConical size={13} color="#34d399" />
        </div>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            background: "linear-gradient(135deg, #34d399, #22d3ee)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "0.02em",
          }}
        >
          Research Validation
        </span>
      </div>

      {/* Validation Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {dynamicItems.map((item, idx) => (
          <div
            key={item.text}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 12px",
              borderRadius: "10px",
              transition: "all 0.2s ease",
              opacity: animatedIn ? 1 : 0,
              transform: animatedIn ? "translateX(0)" : "translateX(-8px)",
              transitionDelay: `${idx * 80 + 200}ms`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            {item.text.includes("Awaiting") || item.text.includes("Gathering") ? null : (
              <CheckCircle2 size={14} color={item.color} style={{ flexShrink: 0 }} />
            )}
            <span
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: item.text.includes("Awaiting") ? "#737373" : "#b5b5b5",
                letterSpacing: "0.01em",
                lineHeight: 1.5,
              }}
            >
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
