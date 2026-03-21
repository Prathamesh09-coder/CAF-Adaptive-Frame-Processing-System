import { RadioGroup } from "@/app/components/ui/radio-group";
import { Video, Upload } from "lucide-react";

interface HeaderProps {
  inputMode: "live" | "upload";
  onInputModeChange: (mode: "live" | "upload") => void;
}

export function Header({ inputMode, onInputModeChange }: HeaderProps) {
  return (
    <header className="border-b border-neutral-800 bg-neutral-900 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">
          Adaptive Frame Processing System
        </h1>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onInputModeChange("live")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                inputMode === "live"
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              <Video size={18} />
              <span>Live Camera</span>
            </button>
            
            <button
              onClick={() => onInputModeChange("upload")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                inputMode === "upload"
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              <Upload size={18} />
              <span>Upload Video</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
