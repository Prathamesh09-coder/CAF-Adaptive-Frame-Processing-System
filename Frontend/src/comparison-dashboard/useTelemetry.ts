import { useState, useEffect } from "react";

export function useTelemetry(rawTelemetry: any) {
  const [smoothed, setSmoothed] = useState<any>(null);

  useEffect(() => {
    if (!rawTelemetry) return;
    
    setSmoothed((prev: any) => {
      if (!prev) return rawTelemetry;

      // Alpha for Exponential Moving Average (lower = smoother, higher = more responsive)
      const alpha = 0.2; 
      const smoothValue = (oldVal: number, newVal: number) => {
        return oldVal * (1 - alpha) + newVal * alpha;
      };

      const smoothMetrics = (oldM: any, newM: any) => {
        if (!oldM || !newM) return newM;
        
        // Calculate CPU usage based on core utilization (latency * fps / 10)
        // 50ms per frame @ 20 FPS = 1000ms/sec = 1 CPU core (100%)
        const calculatedCpu = ((newM.average_latency_ms || 0) * (newM.fps || 0)) / 10;
        
        return {
          ...newM,
          fps: smoothValue(oldM.fps || 0, newM.fps || 0),
          pipeline_cpu_usage: smoothValue(oldM.pipeline_cpu_usage || 0, calculatedCpu),
          average_latency_ms: smoothValue(oldM.average_latency_ms || 0, newM.average_latency_ms || 0),
          average_confidence: smoothValue(oldM.average_confidence || 0, newM.average_confidence || 0),
        };
      };

      return {
        ...rawTelemetry,
        traditional: {
          ...rawTelemetry.traditional,
          metrics: smoothMetrics(prev.traditional?.metrics, rawTelemetry.traditional?.metrics)
        },
        caf: {
          ...rawTelemetry.caf,
          metrics: smoothMetrics(prev.caf?.metrics, rawTelemetry.caf?.metrics)
        }
      };
    });
  }, [rawTelemetry]);

  return smoothed || rawTelemetry;
}
