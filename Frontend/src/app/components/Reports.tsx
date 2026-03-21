import { useState, useEffect } from "react";
import { FileDown, Eye } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";

interface Session {
  id: string;
  inputType: "Live" | "Upload";
  videoName: string;
  avgFps: number;
  cpuSaved: number;
  timestamp: string;
}

export function Reports() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    // Generate mock session data
    const mockSessions: Session[] = [
      {
        id: "SES-001",
        inputType: "Upload",
        videoName: "traffic_analysis.mp4",
        avgFps: 29.8,
        cpuSaved: 34.2,
        timestamp: "2026-01-30 14:23:15",
      },
      {
        id: "SES-002",
        inputType: "Live",
        videoName: "Live Camera Feed",
        avgFps: 28.5,
        cpuSaved: 28.7,
        timestamp: "2026-01-30 13:45:32",
      },
      {
        id: "SES-003",
        inputType: "Upload",
        videoName: "warehouse_monitoring.mp4",
        avgFps: 30.2,
        cpuSaved: 41.5,
        timestamp: "2026-01-30 12:10:48",
      },
      {
        id: "SES-004",
        inputType: "Live",
        videoName: "Live Camera Feed",
        avgFps: 27.9,
        cpuSaved: 25.3,
        timestamp: "2026-01-30 11:30:22",
      },
      {
        id: "SES-005",
        inputType: "Upload",
        videoName: "retail_analytics.mp4",
        avgFps: 29.4,
        cpuSaved: 37.8,
        timestamp: "2026-01-30 10:15:55",
      },
      {
        id: "SES-006",
        inputType: "Upload",
        videoName: "security_footage.mp4",
        avgFps: 28.1,
        cpuSaved: 32.1,
        timestamp: "2026-01-30 09:42:18",
      },
    ];

    setSessions(mockSessions);
  }, []);

  const handleExport = (format: "pdf" | "csv", sessionId: string) => {
    // Mock export functionality
    console.log(`Exporting ${sessionId} as ${format.toUpperCase()}`);
    alert(`Exporting session ${sessionId} as ${format.toUpperCase()}`);
  };

  return (
    <div className="h-full space-y-6 overflow-y-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">
            Session Reports
          </h2>
          <p className="text-sm text-neutral-400">
            Historical session data and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            onClick={() => handleExport("csv", "ALL")}
          >
            <FileDown size={16} className="mr-2" />
            Export All (CSV)
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            onClick={() => handleExport("pdf", "ALL")}
          >
            <FileDown size={16} className="mr-2" />
            Export All (PDF)
          </Button>
        </div>
      </div>

      {/* Session Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <div className="text-sm text-neutral-400">Total Sessions</div>
          <div className="mt-2 text-3xl font-bold text-white">{sessions.length}</div>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <div className="text-sm text-neutral-400">Avg FPS</div>
          <div className="mt-2 text-3xl font-bold text-blue-500">
            {(sessions.reduce((acc, s) => acc + s.avgFps, 0) / sessions.length).toFixed(1)}
          </div>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <div className="text-sm text-neutral-400">Avg CPU Saved</div>
          <div className="mt-2 text-3xl font-bold text-green-500">
            {(sessions.reduce((acc, s) => acc + s.cpuSaved, 0) / sessions.length).toFixed(1)}%
          </div>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <div className="text-sm text-neutral-400">Live Sessions</div>
          <div className="mt-2 text-3xl font-bold text-purple-500">
            {sessions.filter((s) => s.inputType === "Live").length}
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-800 hover:bg-neutral-800">
              <TableHead className="text-neutral-400">Session ID</TableHead>
              <TableHead className="text-neutral-400">Input Type</TableHead>
              <TableHead className="text-neutral-400">Video Name</TableHead>
              <TableHead className="text-neutral-400">Avg FPS</TableHead>
              <TableHead className="text-neutral-400">CPU Saved %</TableHead>
              <TableHead className="text-neutral-400">Timestamp</TableHead>
              <TableHead className="text-right text-neutral-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow
                key={session.id}
                className="border-neutral-800 hover:bg-neutral-800/50"
              >
                <TableCell className="font-mono text-neutral-300">
                  {session.id}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      session.inputType === "Live"
                        ? "border-blue-500/20 bg-blue-500/10 text-blue-500"
                        : "border-purple-500/20 bg-purple-500/10 text-purple-500"
                    }
                  >
                    {session.inputType}
                  </Badge>
                </TableCell>
                <TableCell className="text-neutral-300">
                  {session.videoName}
                </TableCell>
                <TableCell className="font-mono text-neutral-300">
                  {session.avgFps.toFixed(1)}
                </TableCell>
                <TableCell>
                  <span className="font-medium text-green-500">
                    {session.cpuSaved.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-neutral-400">
                  {session.timestamp}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-neutral-400 hover:text-white"
                      onClick={() => alert(`Viewing session ${session.id}`)}
                    >
                      <Eye size={16} className="mr-1" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-neutral-400 hover:text-white"
                      onClick={() => handleExport("pdf", session.id)}
                    >
                      <FileDown size={16} className="mr-1" />
                      Export
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
