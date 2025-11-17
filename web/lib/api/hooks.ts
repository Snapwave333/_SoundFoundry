"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, type CreateTrackRequest, type Track, type Job } from "./client";
import { toast } from "sonner";

// Query keys
export const queryKeys = {
  tracks: ["tracks"] as const,
  track: (id: number) => ["track", id] as const,
  job: (id: number) => ["job", id] as const,
  tokenBalance: ["tokenBalance"] as const,
  tokenLedger: ["tokenLedger"] as const,
};

// Hooks
export function useTracks() {
  return useQuery({
    queryKey: queryKeys.tracks,
    queryFn: () => apiClient.getTracks(),
  });
}

export function useTrack(trackId: number | null) {
  return useQuery({
    queryKey: queryKeys.track(trackId!),
    queryFn: () => apiClient.getTrack(trackId!),
    enabled: !!trackId,
  });
}

export function useJob(jobId: number | null) {
  return useQuery({
    queryKey: queryKeys.job(jobId!),
    queryFn: () => apiClient.getJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data as Job | undefined;
      // Poll every 2 seconds while job is in progress
      if (data?.status === "PENDING" || data?.status === "PROCESSING") {
        return 2000;
      }
      return false;
    },
  });
}

export function useCreateTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTrackRequest) => apiClient.createTrack(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tracks });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create track");
    },
  });
}

export function useDeleteTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trackId: number) => apiClient.deleteTrack(trackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tracks });
      toast.success("Track deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete track");
    },
  });
}

export function useAnalyzeReference() {
  return useMutation({
    mutationFn: (file: File) => apiClient.analyzeReference(file),
    onError: (error: Error) => {
      toast.error(error.message || "Failed to analyze reference");
    },
  });
}

// Token balance hooks
interface CreditsInfo {
  balance: number;
  credits: number;
  plan?: string;
  pricing_breakdown?: Array<{ name: string; credits: number; price: number }>;
}

export function useTokenBalance() {
  return useQuery<CreditsInfo>({
    queryKey: queryKeys.tokenBalance,
    queryFn: async () => {
      const response = await fetch("/api/tokens/balance");
      if (!response.ok) throw new Error("Failed to fetch balance");
      const data = await response.json();
      // Normalize response to include both balance and credits
      return {
        balance: data.balance ?? 0,
        credits: data.credits ?? data.balance ?? 0,
        plan: data.plan,
        pricing_breakdown: data.pricing_breakdown,
      };
    },
  });
}

export function useTokenLedger() {
  return useQuery({
    queryKey: queryKeys.tokenLedger,
    queryFn: async () => {
      const response = await fetch("/api/tokens/ledger");
      if (!response.ok) throw new Error("Failed to fetch ledger");
      return response.json();
    },
  });
}

export function usePublishTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { trackId: number; isPublic: boolean } | number) => {
      const trackId = typeof params === "number" ? params : params.trackId;
      return apiClient.publishTrack(trackId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tracks });
      toast.success("Track published successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to publish track");
    },
  });
}

export function usePurchaseCredits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (packIdOrCredits: string | number) => {
      const packId = String(packIdOrCredits);
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create checkout session");
      }
      return response.json();
    },
    onSuccess: (data: { url: string }) => {
      // Redirect to Stripe checkout
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start purchase");
    },
  });
}
