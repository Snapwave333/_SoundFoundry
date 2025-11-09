"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient, Track } from "@/lib/api/client";
import { usePublishTrack } from "@/lib/api/hooks";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Search, Download, Share2, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // TODO: Add API endpoint for listing user tracks
  // For now, this is a placeholder that will need backend support
  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ["tracks"],
    queryFn: async () => {
      // Placeholder - replace with actual API call when endpoint exists
      return [] as Track[];
    },
  });

  const publishMutation = usePublishTrack();

  const filteredTracks = tracks.filter((track) =>
    (track.title || track.prompt || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleShare = async (track: Track) => {
    if (track.share_url) {
      await navigator.clipboard.writeText(track.share_url);
      toast.success("Share link copied to clipboard");
    } else if (track.public) {
      const shareUrl = `${window.location.origin}/share/${track.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard");
    } else {
      // Publish first
      try {
        await publishMutation.mutateAsync({
          trackId: track.id,
          isPublic: true,
        });
        const shareUrl = `${window.location.origin}/share/${track.id}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Track published and link copied");
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  const handleDownload = (track: Track) => {
    if (track.file_url) {
      window.open(track.file_url, "_blank");
    } else if (track.preview_url) {
      window.open(track.preview_url, "_blank");
    } else {
      toast.error("No download available");
    }
  };

  const handleOpen = (track: Track) => {
    window.location.href = `/share/${track.id}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold mb-2 text-forge-white">Library</h1>
        <p className="text-forge-white/70">
          Your generated tracks and music collection
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-forge-white/50" />
          <Input
            placeholder="Search tracks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-forge-gray/50 border-forge-gray text-forge-white placeholder:text-forge-white/40 focus-visible:ring-forge-amber"
            aria-label="Search tracks"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-forge-white/70">Loading tracks...</div>
      ) : filteredTracks.length === 0 ? (
        <Card className="bg-forge-gray panel-shadow border-forge-gray/50">
          <CardContent className="pt-6">
            <p className="text-center text-forge-white/70">
              {searchQuery ? "No tracks found" : "No tracks yet. Start generating!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTracks.map((track) => (
            <Card
              key={track.id}
              className="bg-forge-gray panel-shadow border-forge-gray/50 hover:border-forge-gray transition-colors"
            >
              <CardHeader>
                <CardTitle className="truncate text-forge-white">
                  {track.title || `Track ${track.id}`}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-forge-white/70">
                  {track.prompt}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded capitalize ${
                      track.status === "COMPLETE"
                        ? "bg-success/20 text-success"
                        : track.status === "FAILED"
                        ? "bg-error/20 text-error"
                        : "bg-forge-gray text-forge-white/70"
                    }`}
                  >
                    {track.status}
                  </span>
                  {track.public && (
                    <span className="text-xs px-2 py-1 bg-forge-blue/20 text-forge-blue rounded">
                      Public
                    </span>
                  )}
                </div>
                {track.status === "COMPLETE" && (track.preview_url || track.file_url) && (
                  <>
                    <AudioPlayer
                      src={track.preview_url || track.file_url || ""}
                      title={track.title || track.prompt}
                      trackId={track.id}
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleOpen(track)}
                        className="w-full bg-forge-blue text-forge-white hover:brightness-110"
                        aria-label="Open track"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleShare(track)}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-forge-gray text-forge-white hover:bg-forge-gray/50"
                          aria-label="Share track"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                        <Button
                          onClick={() => handleDownload(track)}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-forge-gray text-forge-white hover:bg-forge-gray/50"
                          aria-label="Download track"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

