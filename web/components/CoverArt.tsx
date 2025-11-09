"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Image as ImageIcon, RefreshCw } from "lucide-react";
import {
  generateCoverSVGCached,
  downloadSVG,
  downloadPNG,
  generateSeedFromPrompt,
} from "@/lib/cover/generateSvg";
import { enhancePrompt } from "@/lib/prompt/enhance";
import { slug } from "@/lib/utils/slug";
import { toast } from "sonner";
import { saveCover, incrementVisualVersion } from "@/lib/api/style";

interface CoverArtProps {
  trackId?: number; // Optional for pre-submit covers
  title?: string;
  prompt: string;
  bpm?: number;
  key?: string;
  genre?: string;
  dark?: boolean;
  structure?: string[];
  duration?: number;
  vocals?: boolean;
  visualVersion?: number; // Track visual_version for mutation
  seriesId?: number; // Series ID for display
  seriesTitle?: string; // Series title for display
  onSaveCover?: (svg: string) => Promise<void>; // Optional callback to save cover
}

export function CoverArt({
  trackId,
  title,
  prompt,
  bpm,
  key: trackKey,
  genre,
  dark = false,
  structure,
  duration,
  vocals,
  visualVersion = 1,
  seriesId,
  seriesTitle,
  onSaveCover,
}: CoverArtProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const seedCounterRef = useRef(0);
  const autoGenerateRef = useRef(false);

  // Infer metadata from prompt if not provided
  const metadata = useMemo(() => {
    const enhanced = enhancePrompt({ text: prompt });
    return {
      genre: genre || enhanced.genre,
      mood: enhanced.mood,
      bpm: bpm || enhanced.bpm,
      key: trackKey || enhanced.key,
      structure: structure || enhanced.structure,
    };
  }, [prompt, genre, bpm, trackKey, structure]);

  // Generate seed: use trackId if available, otherwise use prompt hash for pre-submit
  const seed = useMemo(() => {
    if (trackId) {
      return `track-${trackId}-${seedCounterRef.current}`;
    }
    return generateSeedFromPrompt({
      prompt,
      structure: metadata.structure,
      duration: duration || 60,
      vocals: vocals || false,
    });
  }, [trackId, prompt, metadata.structure, duration, vocals]);

  // Memoized cover generation with cache
  const coverSvg = useMemo(() => {
    if (!coverUrl) return null;
    return generateCoverSVGCached({
      title: title || (trackId ? `Track ${trackId}` : "Untitled"),
      seed,
      mood: metadata.mood,
      genre: metadata.genre,
      key: metadata.key,
      bpm: metadata.bpm,
      dark,
      visualVersion: visualVersion,
      cacheKey: `${seed}-${dark ? "dark" : "light"}-${title || trackId || "pre"}-v${visualVersion}`,
    });
  }, [coverUrl, seed, title, trackId, metadata, dark, visualVersion]);

  const generateCover = useCallback(() => {
    setIsGenerating(true);
    try {
      const svg = generateCoverSVGCached({
        title: title || (trackId ? `Track ${trackId}` : "Untitled"),
        seed,
        mood: metadata.mood,
        genre: metadata.genre,
        key: metadata.key,
        bpm: metadata.bpm,
        dark,
        visualVersion: visualVersion,
        cacheKey: `${seed}-${dark ? "dark" : "light"}-${title || trackId || "pre"}-v${visualVersion}`,
      });
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      // Clean up old URL
      if (coverUrl) {
        URL.revokeObjectURL(coverUrl);
      }
      setCoverUrl(url);
      if (!autoGenerateRef.current) {
        toast.success("Cover art generated");
      }
      autoGenerateRef.current = false;
    } catch (error) {
      console.error("Failed to generate cover:", error);
      toast.error("Failed to generate cover");
    } finally {
      setIsGenerating(false);
    }
  }, [title, trackId, seed, metadata, dark, coverUrl]);

  // Auto-generate when metadata changes (reactive)
  useEffect(() => {
    if (prompt && metadata.genre) {
      autoGenerateRef.current = true;
      generateCover();
    }
  }, [prompt, metadata.genre, metadata.mood, metadata.bpm, metadata.key, generateCover]);

  const handleRegenerate = async () => {
    seedCounterRef.current += 1;
    
    // If trackId exists, increment visual_version on server
    if (trackId) {
      try {
        await incrementVisualVersion(trackId);
        toast.success("Cover regenerated • deterministic across devices");
      } catch (error) {
        console.error("Failed to increment visual version:", error);
        // Still regenerate locally
      }
    }
    
    generateCover();
  };

  // Generate fresh SVG for downloads (always deterministic)
  const getCoverSvg = () => {
    return generateCoverSVGCached({
      title: title || (trackId ? `Track ${trackId}` : "Untitled"),
      seed,
      mood: metadata.mood,
      genre: metadata.genre,
      key: metadata.key,
      bpm: metadata.bpm,
      dark,
      visualVersion: visualVersion,
      cacheKey: `${seed}-${dark ? "dark" : "light"}-${title || trackId || "pre"}-v${visualVersion}`,
    });
  };

  const handleDownloadSVG = () => {
    if (!coverUrl) return;
    const svg = getCoverSvg();
    const base = slug(`${title || (trackId ? `track-${trackId}` : "untitled")}-${trackId || seed.slice(0, 8)}`, 80);
    downloadSVG(svg, `cover-${base}.svg`);
  };

  const handleDownloadPNG = async () => {
    if (!coverUrl) return;
    const svg = getCoverSvg();
    const base = slug(`${title || (trackId ? `track-${trackId}` : "untitled")}-${trackId || seed.slice(0, 8)}`, 80);
    await downloadPNG(svg, `cover-${base}.png`, 1024);
  };

  const handleDownloadPNG2K = async () => {
    if (!coverUrl) return;
    const svg = getCoverSvg();
    const base = slug(`${title || (trackId ? `track-${trackId}` : "untitled")}-${trackId || seed.slice(0, 8)}`, 80);
    await downloadPNG(svg, `cover-${base}-2k.png`, 2048);
  };

  const handleSaveCover = async () => {
    if (!coverUrl) return;
    const svg = getCoverSvg();
    setIsSaving(true);
    try {
      if (trackId) {
        // Use API endpoint
        await saveCover(trackId, svg, dark);
        toast.success("Saved • deterministic across devices");
      } else if (onSaveCover) {
        // Use callback if provided
        await onSaveCover(svg);
        toast.success("Saved • deterministic across devices");
      } else {
        toast.error("Cannot save cover: no track ID or callback");
      }
    } catch (error: any) {
      console.error("Failed to save cover:", error);
      toast.error(error.message || "Failed to save cover");
    } finally {
      setIsSaving(false);
    }
  };


  const displayTitle = title || (trackId ? `Track ${trackId}` : "Untitled");
  const ariaLabel = `Cover art for ${displayTitle}: ${metadata.genre} ${metadata.mood} track in ${metadata.key} at ${metadata.bpm} BPM`;

  return (
    <div className="space-y-2">
      {coverUrl ? (
        <Card>
          <CardContent className="p-0">
            <div className="relative focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 rounded-lg">
              <div
                role="img"
                aria-label={ariaLabel}
                className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
                tabIndex={0}
              >
                <img
                  src={coverUrl}
                  alt={ariaLabel}
                  className="w-full h-auto rounded-t-lg"
                />
              </div>
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleRegenerate}
                    className="h-7 text-xs"
                    aria-label="Regenerate cover art"
                    title="Generate a new variation"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                  {onSaveCover && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleSaveCover}
                      disabled={isSaving}
                      className="h-7 text-xs"
                      aria-label="Save as default cover"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleDownloadSVG}
                    className="h-7 text-xs"
                    aria-label="Download SVG"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    SVG
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleDownloadPNG}
                    className="h-7 text-xs"
                    aria-label="Download PNG (1024px)"
                    title="Download PNG 1024x1024"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    PNG
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleDownloadPNG2K}
                    className="h-7 text-xs"
                    aria-label="Download PNG (2048px)"
                    title="Download PNG 2048x2048"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    2K
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={generateCover}
          disabled={isGenerating}
          className="w-full"
          aria-label="Generate cover art"
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          {isGenerating ? "Generating..." : "Generate Cover Art"}
        </Button>
      )}
    </div>
  );
}

