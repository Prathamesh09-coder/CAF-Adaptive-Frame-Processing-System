/**
 * WebSocket Service for both Live and Upload modes
 */

import { WS_BASE_URL } from "../services/backendConfig";

export interface FrameResult {
  frame_id: number;
  importance_score: number;
  decision: "skip" | "partial" | "full";
  features: {
    M: number;
    S: number;
    E: number;
    C: number;
    T: number;
  };
  metrics: {
    fps: number;
    latency_ms: number;
  };
}

export interface UploadResult {
  status: "completed";
  total_frames: number;
  message: string;
}

export interface ErrorResult {
  error: string;
}

type ResultListener = (data: FrameResult | UploadResult | ErrorResult) => void;
type StatusListener = (status: "connected" | "disconnected" | "error") => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private resultListeners = new Set<ResultListener>();
  private statusListeners = new Set<StatusListener>();
  private currentMode: "live" | "upload" = "live";
  private sessionId: string | null = null;
  private connectionAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(mode: "live" | "upload" = "live", sessionId?: string) {
    this.disconnect();
    this.currentMode = mode;
    this.sessionId = sessionId || null;

    const attemptId = ++this.connectionAttempt;
    void this.openFirstAvailableSocket(mode, this.sessionId, attemptId);
  }

  sendFrame(data: string) {
    if (
      this.socket &&
      this.socket.readyState === WebSocket.OPEN &&
      this.currentMode === "live"
    ) {
      this.socket.send(data);
    }
  }

  onResult(listener: ResultListener) {
    this.resultListeners.add(listener);
    return () => this.resultListeners.delete(listener);
  }

  onStatusChange(listener: StatusListener) {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  disconnect() {
    this.connectionAttempt += 1;
    this.clearReconnectTimer();

    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      this.socket.close();
    }

    this.socket = null;
    this.sessionId = null;
  }

  getCurrentMode(): "live" | "upload" {
    return this.currentMode;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  private async openFirstAvailableSocket(
    mode: "live" | "upload",
    sessionId: string | null,
    attemptId: number
  ) {
    const baseUrls = [WS_BASE_URL];
    for (const baseUrl of baseUrls) {
      if (attemptId !== this.connectionAttempt) {
        return;
      }

      const endpoint =
        mode === "live" ? `${baseUrl}/live` : `${baseUrl}/upload/${sessionId}`;
      const connected = await this.tryOpenSocket(endpoint, mode, sessionId, attemptId);

      if (connected) {
        return;
      }
    }

    if (attemptId === this.connectionAttempt) {
      this.notifyStatus("error");
      this.scheduleReconnect(mode, sessionId, attemptId);
    }
  }

  private tryOpenSocket(
    endpoint: string,
    mode: "live" | "upload",
    sessionId: string | null,
    attemptId: number
  ) {
    return new Promise<boolean>((resolve) => {
      const socket = new WebSocket(endpoint);
      let opened = false;
      let settled = false;

      const finish = (value: boolean) => {
        if (!settled) {
          settled = true;
          resolve(value);
        }
      };

      console.log(`Connecting to ${endpoint}`);

      socket.onopen = () => {
        if (attemptId !== this.connectionAttempt) {
          socket.close();
          finish(false);
          return;
        }

        opened = true;
        this.clearReconnectTimer();
        this.socket = socket;
        console.log(`WebSocket connected (${mode})`);
        this.notifyStatus("connected");
        finish(true);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyResult(data);
        } catch (error) {
          console.error("WebSocket parse error:", error);
        }
      };

      socket.onerror = () => {
        if (!opened) {
          finish(false);
          try {
            socket.close();
          } catch {
            // no-op
          }
          return;
        }

        console.log(`WebSocket error (${mode})`);
        this.notifyStatus("error");
      };

      socket.onclose = () => {
        if (!opened) {
          finish(false);
          return;
        }

        console.log(`WebSocket disconnected (${mode})`);

        if (this.socket === socket) {
          this.socket = null;
          this.notifyStatus("disconnected");
          this.scheduleReconnect(mode, sessionId, attemptId);
        }
      };
    });
  }

  private notifyResult(data: FrameResult | UploadResult | ErrorResult) {
    this.resultListeners.forEach((cb) => cb(data));
  }

  private notifyStatus(status: "connected" | "disconnected" | "error") {
    this.statusListeners.forEach((cb) => cb(status));
  }

  private scheduleReconnect(
    mode: "live" | "upload",
    sessionId: string | null,
    attemptId: number
  ) {
    if (mode !== "live" || this.reconnectTimer !== null) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;

      if (attemptId === this.connectionAttempt && this.socket === null) {
        void this.openFirstAvailableSocket(mode, sessionId, attemptId);
      }
    }, 2000);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}


export const wsService = new WebSocketService();
