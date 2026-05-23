import { useState } from "react";
import { Activity, ShieldCheck, Zap } from "lucide-react";

const scenarios = [
  {
    id: "performance_optimized",
    label: "Performance Optimized",
    icon: Zap,
    activeColor: "#fbbf24",
    activeBg: "rgba(251,191,36,0.12)",
    activeBorder: "rgba(251,191,36,0.25)",
  },
  {
    id: "balanced",
    label: "Balanced",
    icon: Activity,
    activeColor: "#34d399",
    activeBg: "rgba(52,211,153,0.1)",
    activeBorder: "rgba(52,211,153,0.2)",
  },
  {
    id: "accuracy_preserved",
    label: "Accuracy Preserved",
    icon: ShieldCheck,
    activeColor: "#a78bfa",
    activeBg: "rgba(167,139,250,0.1)",
    activeBorder: "rgba(167,139,250,0.2)",
  },
] as const;

export function ControlPanel({ wsRef }: { wsRef: any }) {
  const [activeScenario, setActiveScenario] = useState("balanced");

  const handleScenario = (scenario: string) => {
    setActiveScenario(scenario);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ config: { scenario } }));
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      {scenarios.map(({ id, label, icon: Icon, activeColor, activeBg, activeBorder }) => {
        const isActive = activeScenario === id;
        return (
          <button
            key={id}
            onClick={() => handleScenario(id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "10px",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.03em",
              border: isActive
                ? `1px solid ${activeBorder}`
                : "1px solid rgba(255,255,255,0.04)",
              background: isActive
                ? activeBg
                : "rgba(255,255,255,0.02)",
              color: isActive ? activeColor : "#525252",
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}
          >
            <Icon size={12} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
