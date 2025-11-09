"use client";

import { useState, useEffect } from "react";
import { apiClient, CostPreview } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export function FreeModeBanner() {
  const [freeModeEnabled, setFreeModeEnabled] = useState(false);

  useEffect(() => {
    const checkFreeMode = async () => {
      try {
        // Check free mode by getting cost preview for a test duration
        const preview = await apiClient.getCostPreview(60);
        setFreeModeEnabled(preview.free_mode_enabled);
      } catch {
        // Silently fail
      }
    };

    checkFreeMode();
  }, []);

  if (!freeModeEnabled) {
    return null;
  }

  return (
    <Alert className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
        <strong>Free Test Mode (for development)</strong> — Some limits apply. Set FREE_MODE=false for production.
      </AlertDescription>
    </Alert>
  );
}

