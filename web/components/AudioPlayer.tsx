"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Download } from "lucide-react";
import { apiClient } from "@/lib/api";

interface AudioPlayerProps {
  src: string;
  title?: string;
  trackId?: number;
}

export function AudioPlayer({ src, title, trackId }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = () => {
    if (src) {
      window.open(src, "_blank");
    }
  };

  if (!src) {
    return <div className="text-forge-white/70">Loading audio...</div>;
  }

  return (
    <div className="bg-forge-gray/50 rounded-lg p-4 border border-forge-gray/50">
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-lg bg-forge-amber text-forge-black flex items-center justify-center hover:brightness-110 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-amber"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </button>
        <div className="flex-1">
          <audio
            ref={audioRef}
            src={src}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full"
          />
          <p className="text-sm font-medium text-forge-white">
            {title || (trackId ? `Track #${trackId}` : "Audio")}
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="w-10 h-10 rounded-lg border border-forge-gray text-forge-white flex items-center justify-center hover:bg-forge-gray/50 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-blue"
          aria-label="Download audio"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

