"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient, Track } from "@/lib/api";
import { AudioPlayer } from "@/components/AudioPlayer";
import { CoverArt } from "@/components/CoverArt";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export default function SharePage() {
  const params = useParams();
  const trackId = parseInt(params.id as string);
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    const fetchTrack = async () => {
      try {
        const data = await apiClient.getTrack(trackId);
        setTrack(data);
      } catch (error) {
        console.error("Failed to fetch track:", error);
      } finally {
        setLoading(false);
      }
    };

    if (trackId) {
      fetchTrack();
    }
  }, [trackId]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!track) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Track not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{track.title || `Track ${track.id}`}</CardTitle>
          <CardDescription>
            {track.prompt}
            {track.series && (
              <span className="block mt-2 text-xs text-muted-foreground">
                Part of <strong>{track.series.title}</strong>
                {track.visual_version && track.visual_version > 1 && (
                  <> · v{track.visual_version}</>
                )}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {track.status === "complete" && track.preview_url && (
            <>
              <CoverArt
                trackId={track.id}
                title={track.title}
                prompt={track.prompt}
                visualVersion={track.visual_version || 1}
                seriesId={track.series_id}
                seriesTitle={track.series?.title}
              />
              <AudioPlayer trackId={track.id} />
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setRefunding(true);
                    try {
                      const result = await apiClient.refundQualityIssue(track.id);
                      toast.success(result.message);
                      // Refresh track data
                      const updated = await apiClient.getTrack(trackId);
                      setTrack(updated);
                    } catch (error: any) {
                      toast.error(error.message || "Failed to refund");
                    } finally {
                      setRefunding(false);
                    }
                  }}
                  disabled={refunding}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refunding ? "animate-spin" : ""}`} />
                  Quality not as expected? Get 50% refund
                </Button>
              </div>
            </>
          )}
          {track.status !== "complete" && (
            <p className="text-muted-foreground text-center">
              Track is still being generated...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

