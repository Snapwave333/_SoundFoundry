/**
 * Hook for style system integration
 * Fetches user style seed, unlocks, and default series on mount
 */

import { useEffect, useState } from "react";
import { fetchStyleMe, fetchSeries, type StyleMeResponse, type SeriesResponse } from "@/lib/api/style";
import { applyUserAccent } from "@/lib/utils/theme";

export function useStyleSystem() {
  const [styleSeed, setStyleSeed] = useState<number | null>(null);
  const [unlocks, setUnlocks] = useState<string[]>([]);
  const [defaultSeries, setDefaultSeries] = useState<SeriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadStyleSystem() {
      try {
        // Fetch user style info
        const styleInfo = await fetchStyleMe();
        if (!mounted) return;

        setStyleSeed(styleInfo.user_style_seed);
        setUnlocks(styleInfo.style_unlocks || []);

        // Apply user accent color
        if (styleInfo.user_style_seed) {
          applyUserAccent(styleInfo.user_style_seed);
        }

        // Fetch default series
        const seriesList = await fetchSeries();
        if (!mounted) return;

        const defaultSeries = seriesList.find((s) => s.slug.startsWith("default-"));
        setDefaultSeries(defaultSeries || null);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err : new Error("Failed to load style system"));
        console.error("Style system load error:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadStyleSystem();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    styleSeed,
    unlocks,
    defaultSeries,
    loading,
    error,
  };
}

