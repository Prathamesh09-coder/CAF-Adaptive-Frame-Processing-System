import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";

const COLORS = {
  skip: "#ef4444",
  partial: "#eab308",
  full: "#22c55e",
};

export function Analytics() {
  const [frameData, setFrameData] = useState<any[]>([]);

  useEffect(() => {
    // Generate mock frame data
    const data = [];
    for (let i = 1; i <= 50; i++) {
      const rand = Math.random();
      const decision = rand < 0.3 ? "skip" : rand < 0.6 ? "partial" : "full";
      data.push({
        id: i,
        importance: (Math.random() * 0.4 + 0.4).toFixed(2),
        decision,
        timestamp: new Date(Date.now() - (50 - i) * 2000).toLocaleTimeString(),
        decisionValue:
          decision === "skip" ? 0 : decision === "partial" ? 0.5 : 1,
      });
    }
    setFrameData(data);
  }, []);

  const pieData = [
    {
      name: "Skip",
      value: frameData.filter((f) => f.decision === "skip").length,
    },
    {
      name: "Partial",
      value: frameData.filter((f) => f.decision === "partial").length,
    },
    {
      name: "Full",
      value: frameData.filter((f) => f.decision === "full").length,
    },
  ];

  return (
    <div className="h-full space-y-6 overflow-y-auto p-6">
      <div>
        <h2 className="mb-2 text-lg font-semibold text-white">
          Frame Decision Analytics
        </h2>
        <p className="text-sm text-neutral-400">
          ML behavior analysis and decision patterns
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <h3 className="mb-4 text-sm font-medium text-neutral-300">
            Decision Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.name === "Skip"
                        ? COLORS.skip
                        : entry.name === "Partial"
                        ? COLORS.partial
                        : COLORS.full
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#171717",
                  border: "1px solid #404040",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-neutral-950 p-3 text-center">
              <div className="text-2xl font-bold text-red-500">
                {pieData[0].value}
              </div>
              <div className="text-xs text-neutral-500">Skipped</div>
            </div>
            <div className="rounded-lg bg-neutral-950 p-3 text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {pieData[1].value}
              </div>
              <div className="text-xs text-neutral-500">Partial</div>
            </div>
            <div className="rounded-lg bg-neutral-950 p-3 text-center">
              <div className="text-2xl font-bold text-green-500">
                {pieData[2].value}
              </div>
              <div className="text-xs text-neutral-500">Full</div>
            </div>
          </div>
        </div>

        {/* Timeline Graph */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <h3 className="mb-4 text-sm font-medium text-neutral-300">
            Decision Timeline
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={frameData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis
                dataKey="id"
                stroke="#a3a3a3"
                label={{ value: "Frame Number", position: "insideBottom", offset: -5 }}
              />
              <YAxis
                stroke="#a3a3a3"
                domain={[0, 1]}
                ticks={[0, 0.5, 1]}
                tickFormatter={(value) =>
                  value === 0 ? "Skip" : value === 0.5 ? "Partial" : "Full"
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#171717",
                  border: "1px solid #404040",
                  borderRadius: "8px",
                }}
                formatter={(value: any, name: any, props: any) => [
                  props.payload.decision.toUpperCase(),
                  "Decision",
                ]}
              />
              <Line
                type="stepAfter"
                dataKey="decisionValue"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Frame Details Table */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <h3 className="mb-4 text-sm font-medium text-neutral-300">
          Recent Frame Details
        </h3>
        <div className="max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-neutral-800 hover:bg-neutral-800">
                <TableHead className="text-neutral-400">Frame ID</TableHead>
                <TableHead className="text-neutral-400">Importance Score</TableHead>
                <TableHead className="text-neutral-400">Decision</TableHead>
                <TableHead className="text-neutral-400">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {frameData.slice(-20).reverse().map((frame) => (
                <TableRow
                  key={frame.id}
                  className="border-neutral-800 hover:bg-neutral-800/50"
                >
                  <TableCell className="font-mono text-neutral-300">
                    #{frame.id.toString().padStart(5, "0")}
                  </TableCell>
                  <TableCell className="text-neutral-300">
                    {frame.importance}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium uppercase ${
                        frame.decision === "skip"
                          ? "bg-red-500/10 text-red-500"
                          : frame.decision === "partial"
                          ? "bg-yellow-500/10 text-yellow-500"
                          : "bg-green-500/10 text-green-500"
                      }`}
                    >
                      {frame.decision}
                    </span>
                  </TableCell>
                  <TableCell className="text-neutral-400">
                    {frame.timestamp}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
