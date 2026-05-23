export class CanvasRenderer {
  static drawOverlays(canvas: HTMLCanvasElement, result: any, type: "traditional" | "caf") {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { processed, decision, detections, reused, score, skip_reason } = result;

    // ── Skipped CAF frames: dark overlay + red border ──
    if (type === "caf" && decision === "SKIP") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Pulsing red border
      ctx.strokeStyle = "rgba(255, 60, 60, 0.7)";
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 6]);
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
      ctx.setLineDash([]);

      // Skip reason badge
      const text = `SKIPPED: ${skip_reason}`;
      ctx.font = "bold 18px 'SF Mono', monospace";
      const tm = ctx.measureText(text);
      const bw = tm.width + 24;
      const bh = 32;
      const bx = (canvas.width - bw) / 2;
      const by = (canvas.height - bh) / 2;

      ctx.fillStyle = "rgba(239, 68, 68, 0.12)";
      CanvasRenderer.roundRect(ctx, bx, by, bw, bh, 8);
      ctx.fill();
      ctx.strokeStyle = "rgba(239, 68, 68, 0.3)";
      ctx.lineWidth = 1;
      CanvasRenderer.roundRect(ctx, bx, by, bw, bh, 8);
      ctx.stroke();

      ctx.fillStyle = "rgba(248, 113, 113, 0.95)";
      ctx.fillText(text, bx + 12, by + 22);
    }

    // ── Deduplication overlay ──
    if (reused && decision === "DEDUPLICATED") {
      ctx.fillStyle = "rgba(34, 211, 238, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Reused badge top-right
      const text = "REUSED DETECTION";
      ctx.font = "bold 12px 'SF Mono', monospace";
      const tm = ctx.measureText(text);
      const px = canvas.width - tm.width - 32;
      const py = 12;
      ctx.fillStyle = "rgba(34, 211, 238, 0.1)";
      CanvasRenderer.roundRect(ctx, px, py, tm.width + 20, 26, 6);
      ctx.fill();
      ctx.strokeStyle = "rgba(34, 211, 238, 0.2)";
      ctx.lineWidth = 1;
      CanvasRenderer.roundRect(ctx, px, py, tm.width + 20, 26, 6);
      ctx.stroke();
      ctx.fillStyle = "rgba(34, 211, 238, 0.9)";
      ctx.fillText(text, px + 10, py + 18);
    }

    // ── CAF Telemetry HUD (when processing) ──
    if (type === "caf" && decision === "PROCESS") {
      const hx = 12, hy = 12, hw = 200, hh = 100;

      // Frosted glass background
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      CanvasRenderer.roundRect(ctx, hx, hy, hw, hh, 10);
      ctx.fill();
      ctx.strokeStyle = "rgba(52, 211, 153, 0.25)";
      ctx.lineWidth = 1;
      CanvasRenderer.roundRect(ctx, hx, hy, hw, hh, 10);
      ctx.stroke();

      // Green accent bar
      ctx.fillStyle = "rgba(52, 211, 153, 0.6)";
      ctx.fillRect(hx, hy, 3, hh);

      ctx.font = "bold 10px 'SF Mono', monospace";
      ctx.fillStyle = "rgba(52, 211, 153, 0.5)";
      ctx.fillText("CAF TELEMETRY", hx + 14, hy + 16);

      ctx.font = "11px 'SF Mono', monospace";
      ctx.fillStyle = "rgba(209, 250, 229, 0.9)";
      ctx.fillText(`Motion:    ${result.features?.M?.toFixed(3) ?? "—"}`, hx + 14, hy + 36);
      ctx.fillText(`Scene:     ${result.features?.S?.toFixed(3) ?? "—"}`, hx + 14, hy + 52);
      ctx.fillText(`CAF Score: ${score?.toFixed(3) ?? "—"}`, hx + 14, hy + 72);
      ctx.fillText(`Threshold: ${result.threshold?.toFixed(3) ?? "—"}`, hx + 14, hy + 88);
    }

    // ── Traditional pipeline HUD ──
    if (type === "traditional" && detections) {
      const hx = 12, hy = 12, hw = 150, hh = 30;

      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      CanvasRenderer.roundRect(ctx, hx, hy, hw, hh, 8);
      ctx.fill();
      ctx.strokeStyle = "rgba(96, 165, 250, 0.2)";
      ctx.lineWidth = 1;
      CanvasRenderer.roundRect(ctx, hx, hy, hw, hh, 8);
      ctx.stroke();

      ctx.fillStyle = "rgba(96, 165, 250, 0.6)";
      ctx.fillRect(hx, hy, 3, hh);

      ctx.font = "bold 11px 'SF Mono', monospace";
      ctx.fillStyle = "rgba(191, 219, 254, 0.9)";
      ctx.fillText(`Detections: ${detections.length}`, hx + 14, hy + 20);
    }

    // ── Bounding Boxes with enhanced glow ──
    if (detections && detections.length > 0) {
      detections.forEach((det: any) => {
        const [x1, y1, x2, y2] = det.bbox;
        const conf = det.confidence;
        const w = x2 - x1;
        const h = y2 - y1;

        let color: string;
        let glowColor: string;
        let bgAlpha: string;

        if (reused) {
          color = "rgba(34, 211, 238, 1)";
          glowColor = "rgba(34, 211, 238, 0.4)";
          bgAlpha = "rgba(34, 211, 238, 0.85)";
        } else if (conf < 0.5) {
          color = "rgba(248, 113, 113, 1)";
          glowColor = "rgba(248, 113, 113, 0.4)";
          bgAlpha = "rgba(248, 113, 113, 0.85)";
        } else if (conf < 0.8) {
          color = "rgba(250, 204, 21, 1)";
          glowColor = "rgba(250, 204, 21, 0.4)";
          bgAlpha = "rgba(250, 204, 21, 0.85)";
        } else {
          color = "rgba(52, 211, 153, 1)";
          glowColor = "rgba(52, 211, 153, 0.4)";
          bgAlpha = "rgba(52, 211, 153, 0.85)";
        }

        // Glow effect
        ctx.shadowBlur = 18;
        ctx.shadowColor = glowColor;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        // Rounded box (corner ticks style)
        const cornerLen = Math.min(16, w * 0.2, h * 0.2);

        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(x1, y1 + cornerLen);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x1 + cornerLen, y1);
        ctx.stroke();

        // Top-right corner
        ctx.beginPath();
        ctx.moveTo(x2 - cornerLen, y1);
        ctx.lineTo(x2, y1);
        ctx.lineTo(x2, y1 + cornerLen);
        ctx.stroke();

        // Bottom-left corner
        ctx.beginPath();
        ctx.moveTo(x1, y2 - cornerLen);
        ctx.lineTo(x1, y2);
        ctx.lineTo(x1 + cornerLen, y2);
        ctx.stroke();

        // Bottom-right corner
        ctx.beginPath();
        ctx.moveTo(x2 - cornerLen, y2);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x2, y2 - cornerLen);
        ctx.stroke();

        // Subtle full-box outline
        ctx.shadowBlur = 0;
        ctx.strokeStyle = color.replace("1)", "0.2)");
        ctx.lineWidth = 1;
        ctx.strokeRect(x1, y1, w, h);

        // Label
        const label = `${det.class_name.toUpperCase()} ${(conf * 100).toFixed(0)}%`;
        ctx.font = "bold 11px 'SF Mono', monospace";
        const labelWidth = ctx.measureText(label).width + 16;
        const labelHeight = 22;

        // Label background
        ctx.fillStyle = bgAlpha;
        CanvasRenderer.roundRect(ctx, x1, y1 - labelHeight - 4, labelWidth, labelHeight, 5);
        ctx.fill();

        // Label text
        ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
        ctx.fillText(label, x1 + 8, y1 - 10);
      });
    }
  }

  /** Utility: draw a rounded rectangle path */
  private static roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
