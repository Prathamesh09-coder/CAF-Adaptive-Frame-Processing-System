import { useState } from "react";
import { Header } from "@/app/components/Header";
import { LiveAnalysis } from "@/app/components/LiveAnalysis";

export default function App() {
  const [inputMode, setInputMode] = useState<"live" | "upload">("live");

  return (
    <div className="flex h-screen flex-col bg-neutral-950">
      <Header inputMode={inputMode} onInputModeChange={setInputMode} />

      {/* Single combined view: LiveAnalysis (no extra tab navigation) */}
      <main className="flex-1 overflow-hidden">
        <LiveAnalysis inputMode={inputMode} />
      </main>
    </div>
  );
}
