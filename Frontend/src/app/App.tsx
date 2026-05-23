import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Header } from "@/app/components/Header";
import { LiveAnalysis } from "@/app/components/LiveAnalysis";
import { ComparisonDashboard } from "@/comparison-dashboard/ComparisonDashboard";

export default function App() {
  const [inputMode, setInputMode] = useState<"live" | "upload">("live");
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col bg-neutral-950">
      <Header inputMode={inputMode} onInputModeChange={setInputMode} />

      <main className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<LiveAnalysis inputMode={inputMode} />} />
          <Route path="/comparison-dashboard" element={<ComparisonDashboard />} />
        </Routes>
      </main>
    </div>
  );
}
