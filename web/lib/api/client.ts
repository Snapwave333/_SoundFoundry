const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.promptbloom.app";

export interface CreateTrackRequest {
  prompt: string;
  lyrics?: string;
  vocals?: boolean;
  duration?: number;
  style_strength?: number;
  genre?: string;
  key?: string;
  reference_file_id?: number;
}

export interface CreateTrackResponse {
  job_id: number;
  track_id: number;
}

export interface Job {
  id: number;
  status: "PENDING" | "PROCESSING" | "COMPLETE" | "FAILED";
  progress: number;
  track_id?: number;
  error?: string;
}

export interface Track {
  id: number;
  title?: string;
  prompt: string;
  status: "PENDING" | "PROCESSING" | "COMPLETE" | "FAILED" | "complete";
  file_url?: string;
  preview_url?: string;
  duration?: number;
  created_at: string;
  share_url?: string;
  public?: boolean;
  series?: string;
  series_id?: number;
  visual_version?: number;
}

export interface AnalyzeReferenceResponse {
  bpm?: number;
  key?: string;
  file_id?: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async createTrack(data: CreateTrackRequest): Promise<CreateTrackResponse> {
    return this.request<CreateTrackResponse>("/api/tracks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getJob(jobId: number): Promise<Job> {
    return this.request<Job>(`/api/jobs/${jobId}`);
  }

  async getTrack(trackId: number): Promise<Track> {
    return this.request<Track>(`/api/tracks/${trackId}`);
  }

  async getTracks(): Promise<Track[]> {
    return this.request<Track[]>("/api/tracks");
  }

  async deleteTrack(trackId: number): Promise<void> {
    await this.request(`/api/tracks/${trackId}`, {
      method: "DELETE",
    });
  }

  async analyzeReference(file: File): Promise<AnalyzeReferenceResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${this.baseUrl}/api/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Upload failed" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  getTrackStreamUrl(trackId: number): string {
    return `${this.baseUrl}/api/tracks/${trackId}/stream`;
  }

  getTrackDownloadUrl(trackId: number, format: "mp3" | "wav" = "mp3"): string {
    return `${this.baseUrl}/api/tracks/${trackId}/download?format=${format}`;
  }

  async getCredits(): Promise<{
    balance: number;
    credits: number;
    plan?: string;
    pricing_breakdown?: {
      credit_packs: Record<string, { credits: number; price: number }>;
    };
  }> {
    const data = await this.request<{ balance: number }>("/api/tokens/balance");
    // Return enriched structure with fallbacks
    return {
      balance: data.balance ?? 0,
      credits: (data as { credits?: number }).credits ?? data.balance ?? 0,
      plan: (data as { plan?: string }).plan,
      pricing_breakdown: (data as { pricing_breakdown?: { credit_packs: Record<string, { credits: number; price: number }> } }).pricing_breakdown ?? {
        credit_packs: {
          starter: { credits: 100, price: 10 },
          pro: { credits: 500, price: 40 },
          studio: { credits: 2000, price: 150 },
        },
      },
    };
  }

  async publishTrack(trackId: number): Promise<{ share_url: string }> {
    return this.request<{ share_url: string }>(`/api/tracks/${trackId}/publish`, {
      method: "POST",
    });
  }

  async refundQualityIssue(trackId: number): Promise<void> {
    await this.request(`/api/tracks/${trackId}/refund`, {
      method: "POST",
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
