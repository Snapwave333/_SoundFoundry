"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiClient, TrackCreate, CostPreview } from "@/lib/api";
import { toast } from "sonner";
import { GenrePresets } from "./GenrePresets";
import { LyricsEditor } from "./LyricsEditor";
import { ReferenceUpload } from "./ReferenceUpload";
import { Coins, Info, Sparkles, Undo2, Redo2, Copy, ChevronDown, ChevronUp, Image as ImageIcon, RefreshCw, Download } from "lucide-react";
import { enhancePrompt, type PromptOut } from "@/lib/prompt/enhance";
import { usePromptStore, type PromptFormState, clearPromptDraft } from "@/lib/state/usePromptStore";
import { throttle } from "@/lib/utils/throttle";
import { slug } from "@/lib/utils/slug";
import { Badge } from "@/components/ui/badge";

interface GenerationPanelProps {
  onTrackCreated?: (jobId: number) => void;
}

const GENRES = [
  "Cinematic",
  "Electronic",
  "Pop",
  "Ambient",
  "Hip-Hop",
  "Rock",
  "World",
] as const;

export function GenerationPanel({ onTrackCreated }: GenerationPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState<string>("");
  const [hasVocals, setHasVocals] = useState(false);
  const [lyrics, setLyrics] = useState("");
  const [duration, setDuration] = useState([60]);
  const [styleStrength, setStyleStrength] = useState([0.5]);
  const [tempo, setTempo] = useState<number | undefined>();
  const [key, setKey] = useState("");
  const [referenceFileId, setReferenceFileId] = useState<number | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [costPreview, setCostPreview] = useState<CostPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [enhancedPreview, setEnhancedPreview] = useState<PromptOut | null>(null);
  const [showEnhancedDiff, setShowEnhancedDiff] = useState(false);
  const [hasShownKeyboardHint, setHasShownKeyboardHint] = useState(false);
  const [showCoverPreview, setShowCoverPreview] = useState(false);
  const [flashBorder, setFlashBorder] = useState(false);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Undo/redo store
  const { set: setStoreSnapshot, undo, redo, canUndo, canRedo, snapshot: storedSnapshot } = usePromptStore();

  // Throttled state sync to undo store (leading+trailing)
  const syncToStoreRef = useRef(
    throttle(() => {
      const snapshot: PromptFormState = {
        prompt,
        genre,
        hasVocals,
        lyrics,
        duration,
        styleStrength,
        tempo,
        key,
        referenceFileId,
      };
      setStoreSnapshot(snapshot);
    }, 200)
  );

  // Update throttle function with latest values
  useEffect(() => {
    syncToStoreRef.current = throttle(() => {
      const snapshot: PromptFormState = {
        prompt,
        genre,
        hasVocals,
        lyrics,
        duration,
        styleStrength,
        tempo,
        key,
        referenceFileId,
      };
      setStoreSnapshot(snapshot);
    }, 200);
  }, [prompt, genre, hasVocals, lyrics, duration, styleStrength, tempo, key, referenceFileId, setStoreSnapshot]);

  // Restore from store snapshot
  const restoreSnapshot = useCallback((snapshot: PromptFormState) => {
    setPrompt(snapshot.prompt);
    setGenre(snapshot.genre);
    setHasVocals(snapshot.hasVocals);
    setLyrics(snapshot.lyrics);
    setDuration(snapshot.duration);
    setStyleStrength(snapshot.styleStrength);
    setTempo(snapshot.tempo);
    setKey(snapshot.key);
    setReferenceFileId(snapshot.referenceFileId);
  }, []);

  // Sync state changes to store
  useEffect(() => {
    syncToStoreRef.current();
  }, [prompt, genre, hasVocals, lyrics, duration, styleStrength, tempo, key, referenceFileId]);

  // Restore from localStorage on mount (only if there's actual content)
  useEffect(() => {
    if (
      storedSnapshot &&
      typeof window !== "undefined" &&
      (storedSnapshot.prompt.trim() || storedSnapshot.genre || storedSnapshot.lyrics.trim())
    ) {
      const shouldRestore = window.confirm(
        "Restore your previous draft? Click Cancel to start fresh."
      );
      if (shouldRestore) {
        restoreSnapshot(storedSnapshot);
        toast.info("Draft restored");
      }
    }
  }, []); // Only run on mount

  // Flash border animation
  useEffect(() => {
    if (flashBorder) {
      const timer = setTimeout(() => setFlashBorder(false), 200);
      return () => clearTimeout(timer);
    }
  }, [flashBorder]);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (!canUndo()) {
      toast.info("Nothing to undo");
      return;
    }
    const prevSnapshot = undo();
    if (prevSnapshot) {
      restoreSnapshot(prevSnapshot);
      setFlashBorder(true);
    }
  }, [undo, restoreSnapshot, canUndo]);

  // Handle redo
  const handleRedo = useCallback(() => {
    if (!canRedo()) {
      toast.info("Nothing to redo");
      return;
    }
    const nextSnapshot = redo();
    if (nextSnapshot) {
      restoreSnapshot(nextSnapshot);
      setFlashBorder(true);
    }
  }, [redo, restoreSnapshot, canRedo]);

  // Keyboard shortcuts
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onKey = (e: KeyboardEvent) => {
      const z = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z";
      if (!z) return;

      // Don't interfere with text input undo/redo
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      e.preventDefault();
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }

      // Show hint once
      if (!hasShownKeyboardHint) {
        setHasShownKeyboardHint(true);
        toast.info("Tip: Use Ctrl/Cmd+Z to undo, Shift+Ctrl/Cmd+Z to redo", {
          duration: 3000,
        });
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleUndo, handleRedo, hasShownKeyboardHint]);

  // Handle enhance
  const handleEnhance = useCallback(() => {
    const enhanced = enhancePrompt({
      text: prompt || "music",
      duration: duration[0],
      vocals: hasVocals,
    });
    setEnhancedPreview(enhanced);
    setShowEnhancedDiff(true);
    setShowCoverPreview(true);
    
    // Apply enhanced values (only if field is empty to avoid overwriting manual edits)
    if (!prompt.trim()) setPrompt(enhanced.prompt);
    if (!genre) setGenre(enhanced.genre);
    if (!tempo) setTempo(enhanced.bpm);
    if (!key) setKey(enhanced.key);
    setDuration([enhanced.duration]);
    setStyleStrength([enhanced.style_strength]);
    setHasVocals(enhanced.vocals);

    toast.success("Prompt enhanced", { duration: 1500 });
  }, [prompt, duration, hasVocals, genre, tempo, key]);

  // Copy prompt to clipboard
  const handleCopyPrompt = useCallback(async () => {
    if (!enhancedPreview) return;
    try {
      await navigator.clipboard.writeText(enhancedPreview.prompt);
      toast.success("Prompt copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  }, [enhancedPreview]);

  // Fetch cost preview when duration changes
  useEffect(() => {
    const fetchPreview = async () => {
      setLoadingPreview(true);
      try {
        const preview = await apiClient.getCostPreview(duration[0]);
        setCostPreview(preview);
      } catch {
        // Silently fail
      } finally {
        setLoadingPreview(false);
      }
    };

    fetchPreview();
  }, [duration]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    try {
      const trackData: TrackCreate = {
        prompt,
        lyrics: hasVocals ? lyrics : undefined,
        has_vocals: hasVocals,
        duration_s: duration[0],
        style_strength: styleStrength[0],
        genre: genre || undefined,
        tempo: tempo || undefined,
        key: key || undefined,
        reference_file_id: referenceFileId,
      };

      const result = await apiClient.createTrack(trackData);
      
      toast.success(
        `Track generation started! Job ID: ${result.job_id}${result.credits_required ? ` (${result.credits_required} credits)` : ""}`
      );
      
      if (onTrackCreated) {
        onTrackCreated(result.job_id);
      }

      // Clear draft after successful submit
      clearPromptDraft();

      // Reset form
      setPrompt("");
      setGenre("");
      setHasVocals(false);
      setLyrics("");
      setDuration([60]);
      setStyleStrength([0.5]);
      setTempo(undefined);
      setKey("");
      setReferenceFileId(undefined);
      setEnhancedPreview(null);
      setShowEnhancedDiff(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create track");
    } finally {
      setIsGenerating(false);
    }
  };

  // Cover seed for pre-submit (stable hash) - includes counter for regeneration
  const coverSeed = useMemo(() => {
    const base = JSON.stringify({
      text: prompt.trim(),
      duration: duration[0],
      vocals: hasVocals,
      structure: enhancedPreview?.structure ?? ["intro", "verse", "chorus", "outro"],
    });
    return coverSeedCounter > 0 ? `${base}-${coverSeedCounter}` : base;
  }, [prompt, duration, hasVocals, enhancedPreview?.structure, coverSeedCounter]);

  // Detect dark mode from system preference
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDarkMode(mediaQuery.matches);
      
      const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, []);

  // Generate cover SVG reactively
  const coverSvg = useMemo(() => {
    const title = (prompt.trim() || "Untitled").slice(0, 48);
    const mood = enhancedPreview?.mood ?? "Neutral";
    const genreValue = genre || enhancedPreview?.genre ?? "Electronic";
    const keyValue = key || enhancedPreview?.key ?? "Am";
    const bpmValue = tempo || enhancedPreview?.bpm ?? 110;

    return generateCoverSVGCached({
      title,
      seed: coverSeed,
      mood,
      genre: genreValue,
      key: keyValue,
      bpm: bpmValue,
      dark: isDarkMode,
      size: 1024,
      cacheKey: `${coverSeed}-${isDarkMode ? "dark" : "light"}-${title}-${genreValue}-${mood}-${keyValue}-${bpmValue}`,
    });
  }, [prompt, coverSeed, genre, enhancedPreview, tempo, key, isDarkMode]);

  const [coverSeedCounter, setCoverSeedCounter] = useState(0);

  const handleDownloadSvg = () => {
    const blob = new Blob([coverSvg], { type: "image/svg+xml;charset=utf-8" });
    const a = document.createElement("a");
    // "cover-" (6) + ".svg" (4) = 10 chars, so max 90 for base to stay ≤100 total
    const base = slug(`${prompt || "untitled"}-${coverSeed.slice(0, 8)}`, 90);
    a.href = URL.createObjectURL(blob);
    a.download = `cover-${base}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("SVG downloaded");
  };

  const handleDownloadPng = async () => {
    const startTime = performance.now();
    const blob = await svgToPng(coverSvg, 1024);
    const duration = performance.now() - startTime;
    
    const a = document.createElement("a");
    // "cover-" (6) + ".png" (4) = 10 chars, so max 90 for base to stay ≤100 total
    const base = slug(`${prompt || "untitled"}-${coverSeed.slice(0, 8)}`, 90);
    a.href = URL.createObjectURL(blob);
    a.download = `cover-${base}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
    
    if (duration > 150) {
      console.warn(`PNG export took ${duration.toFixed(0)}ms (target: <150ms)`);
    }
    toast.success("PNG downloaded");
  };

  const handleRegenerateCover = () => {
    setCoverSeedCounter((prev) => prev + 1);
    toast.success("Cover regenerated");
  };

  return (
    <Card className="bg-bg-elevated border-border">
      <CardHeader>
        <CardTitle className="text-fg">Generate Music</CardTitle>
        <CardDescription>
          Create AI-generated music from your prompt
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 large-section">
          {/* LEFT: Prompt + controls */}
          <div className="flex flex-col gap-4">
            {/* Compact Creative Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEnhance}
                className="h-8 px-3 text-xs"
                aria-label="Enhance prompt"
                title="Improve clarity, structure, and musical intent. No internet or AI calls. Fully local."
                tabIndex={1}
              >
                <Sparkles className="h-3 w-3 mr-1.5" />
                Enhance
              </Button>
              <div className="h-5 w-px bg-border" aria-hidden="true" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                disabled={!canUndo()}
                className="h-8 px-3 text-xs"
                aria-label="Undo changes"
                title="Step back one edit (Ctrl/Cmd+Z)"
                tabIndex={2}
              >
                <Undo2 className="h-3.5 w-3.5 mr-1.5" />
                Undo
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRedo}
                disabled={!canRedo()}
                className="h-8 px-3 text-xs"
                aria-label="Redo changes"
                title="Step forward one edit (Shift+Ctrl/Cmd+Z)"
                tabIndex={3}
              >
                <Redo2 className="h-3.5 w-3.5 mr-1.5" />
                Redo
              </Button>
              <div className="h-5 w-px bg-border" aria-hidden="true" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const el = document.getElementById("cover-preview");
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="h-8 px-3 text-xs"
                aria-label="View cover preview"
                title="Creates a deterministic vector cover based on your prompt. No upload. No cost."
                tabIndex={4}
              >
                <ImageIcon className="h-3 w-3 mr-1.5" />
                Generate Cover
              </Button>
            </div>

            {/* Prompt textarea */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Prompt</label>
              <Textarea
                ref={promptTextareaRef}
                placeholder="Describe the music you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                tabIndex={5}
                className={flashBorder ? "animate-[flash_200ms_ease-in-out] outline outline-2 outline-accent outline-offset-2" : ""}
              />
            </div>

            {/* Metadata Tags - Show when enhanced or when fields are set */}
            {(enhancedPreview || genre || tempo || key) && (
              <div className="flex flex-wrap items-center gap-2 text-xs opacity-80 animate-in fade-in slide-in-from-top-1 duration-300">
                {genre && <Badge variant="outline" className="h-6 px-2 py-0 text-[11px]">{genre}</Badge>}
                {enhancedPreview?.mood && <Badge variant="outline" className="h-6 px-2 py-0 text-[11px]">{enhancedPreview.mood}</Badge>}
                {(tempo || enhancedPreview?.bpm) && (
                  <Badge variant="outline" className="h-6 px-2 py-0 text-[11px]">
                    {(tempo || enhancedPreview?.bpm)} BPM
                  </Badge>
                )}
                {(key || enhancedPreview?.key) && (
                  <Badge variant="outline" className="h-6 px-2 py-0 text-[11px]">
                    {key || enhancedPreview?.key}
                  </Badge>
                )}
                {enhancedPreview && (
                  <>
                    <Badge variant="outline" className="h-6 px-2 py-0 text-[11px]">
                      Style {enhancedPreview.style_strength.toFixed(1)}
                    </Badge>
                    <Badge variant="outline" className="h-6 px-2 py-0 text-[11px]">
                      {hasVocals ? "Vocals" : "Instrumental"}
                    </Badge>
                  </>
                )}
              </div>
            )}

            {/* Enhanced Prompt Preview (Collapsible) */}
            {enhancedPreview && showEnhancedDiff && (
              <Alert className="animate-in fade-in slide-in-from-top-1 duration-300">
                <Info className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">Enhanced prompt</p>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyPrompt}
                        className="h-6 text-xs"
                        aria-label="Copy prompt"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEnhancedPreview(null);
                          setShowEnhancedDiff(false);
                        }}
                        className="h-6 text-xs"
                        aria-label="Dismiss preview"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {enhancedPreview.prompt}
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <GenrePresets
              genres={GENRES}
              selected={genre}
              onSelect={setGenre}
            />

            <Tabs defaultValue="settings" className="w-full">
              <TabsList>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
                <TabsTrigger value="reference">Reference</TabsTrigger>
              </TabsList>

              <TabsContent value="settings" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Duration: {duration[0]}s</label>
                    <span className="text-xs text-muted-foreground">15-240s</span>
                  </div>
                  <Slider
                    value={duration}
                    onValueChange={setDuration}
                    min={15}
                    max={240}
                    step={5}
                  />
                  {costPreview && (
                    <Alert className="mt-2">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="flex items-center gap-2">
                        <Coins className="h-3 w-3" />
                        <span className="text-sm">
                          This render will use <strong>{costPreview.credits_required} credits</strong>
                          {costPreview.free_mode_enabled && " (Free mode: no credits deducted)"}
                        </span>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Style Strength: {styleStrength[0].toFixed(2)}</label>
                  </div>
                  <Slider
                    value={styleStrength}
                    onValueChange={setStyleStrength}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="vocals"
                    checked={hasVocals}
                    onChange={(e) => setHasVocals(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="vocals" className="text-sm font-medium">
                    Include vocals
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tempo (BPM)</label>
                    <Input
                      type="number"
                      placeholder="120"
                      value={tempo || ""}
                      onChange={(e) => setTempo(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Key</label>
                    <Input
                      placeholder="C"
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="lyrics">
                <LyricsEditor
                  value={lyrics}
                  onChange={setLyrics}
                  enabled={hasVocals}
                />
              </TabsContent>

              <TabsContent value="reference">
                <ReferenceUpload
                  onUploadComplete={(fileId) => setReferenceFileId(fileId)}
                />
              </TabsContent>
            </Tabs>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? "Generating..." : "Generate Music"}
            </Button>
          </div>

          {/* RIGHT: Live Cover Preview + downloads */}
          <div id="cover-preview" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Cover Preview</h3>
              <span className="text-xs text-muted-foreground">Generated locally · deterministic</span>
            </div>

            <div className="relative overflow-hidden rounded-lg border border-border shadow-md bg-surface">
              {/* Render SVG string safely via data URL */}
              <img
                src={`data:image/svg+xml;utf8,${encodeURIComponent(coverSvg)}`}
                alt="Generated cover art"
                className="block h-auto w-full"
                style={{ imageRendering: "crisp-edges" }}
              />
              {/* Regenerate button overlay */}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRegenerateCover}
                className="absolute top-2 right-2 h-7 w-7 p-0"
                aria-label="Regenerate cover with new variation"
                title="Generate a new variation"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadSvg}
                className="flex-1"
                title="Download vector (best for crisp social posts)"
              >
                <Download className="h-3 w-3 mr-1.5" />
                SVG
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadPng}
                className="flex-1"
                title="Download PNG (1024x1024)"
              >
                <Download className="h-3 w-3 mr-1.5" />
                PNG
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

