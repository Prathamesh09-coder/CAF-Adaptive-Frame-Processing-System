import { API_BASE_URL } from "../services/backendConfig";

export class UploadService {
  async uploadVideo(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE_URL}/upload-video`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async getUploadStatus(sessionId: string) {
    const res = await fetch(`${API_BASE_URL}/upload/status/${sessionId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async cleanupUpload(sessionId: string) {
    await fetch(`${API_BASE_URL}/upload/${sessionId}`, {
      method: "DELETE",
    });
  }
}

export const uploadService = new UploadService();