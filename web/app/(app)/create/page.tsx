"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCreateTrack, useJob, useTrack, useAnalyzeReference } from "@/lib/api/hooks";
import { apiClient } from "@/lib/api/client";
import { AudioPlayer } from "@/components/AudioPlayer";
import { ReferenceUpload } from "@/components/ReferenceUpload";
import { toast } from "sonner";
import { Download, Music, Loader2, Info } from "lucide-react";

const GENRES = [
  "Cinematic",
  "Electronic",
  "Pop",
  "Ambient",
  "Hip-Hop",
  "Rock",
  "World",
] as const;

const KEYS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;

export default function CreatePage() {
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [hasVocals, setHasVocals] = useState(false);
  const [duration, setDuration] = useState([60]);
  const [styleStrength, setStyleStrength] = useState([50]); // UI: 0-100, backend: 0-1
  const [genre, setGenre] = useState("");
  const [key, setKey] = useState("");
  const [referenceFileId, setReferenceFileId] = useState<number | undefined>();
  const [referenceAnalysis, setReferenceAnalysis] = useState<{
    bpm?: number;
    key?: string;
  } | null>(null);

  const createTrackMutation = useCreateTrack();
  const analyzeMutation = useAnalyzeReference();
  const [currentJobId, setCurrentJobId] = useState<number | null>(null);
  const [currentTrackId, setCurrentTrackId] = useState<number | null>(null);

  const { data: job, isLoading: jobLoading } = useJob(currentJobId);
  const { data: track } = useTrack(currentTrackId);

  // Handle reference upload
  const handleReferenceUpload = async (file: File) => {
    try {
      const result = await analyzeMutation.mutateAsync(file);
      setReferenceAnalysis({
        bpm: result.bpm,
        key: result.key,
      });
      if (result.file_id) {
        setReferenceFileId(result.file_id);
      }
      toast.success("Reference analyzed successfully");
    } catch (error) {
      // Error handled by hook
    }
  };

  // Handle generation
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    try {
      const result = await createTrackMutation.mutateAsync({
        prompt,
        lyrics: hasVocals ? lyrics : undefined,
        vocals: hasVocals,
        duration: duration[0],
        style_strength: styleStrength[0] / 100, // Convert UI 0-100 to 0-1
        genre: genre || undefined,
        key: key || undefined,
        reference_file_id: referenceFileId,
      });

      setCurrentJobId(result.job_id);
      setCurrentTrackId(result.track_id);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Watch job completion
  useEffect(() => {
    if (job?.status === "COMPLETE" && job.track_id) {
      setCurrentTrackId(job.track_id);
      toast.success("Track generation complete!");
    } else if (job?.status === "FAILED") {
      toast.error(job.error || "Generation failed");
    }
  }, [job]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold mb-2 text-forge-white">Create Music</h1>
        <p className="text-forge-white/70">
          Generate full tracks from a prompt. Add lyrics, guide with a reference, and export when ready.
        </p>
      </div>

      <div className="space-y-6">
        {/* Prompt Input */}
        <Card className="bg-forge-gray panel-shadow border-forge-gray/50">
          <CardHeader>
            <CardTitle className="text-forge-white">Prompt</CardTitle>
            <CardDescription className="text-forge-white/70">
              Describe the music you want to generate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g., Upbeat electronic dance music with synth leads and driving bass..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="bg-forge-black/50 border-forge-gray text-forge-white placeholder:text-forge-white/40 focus-visible:ring-forge-amber"
              aria-label="Music generation prompt"
            />
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="bg-forge-gray panel-shadow border-forge-gray/50">
          <CardHeader>
            <CardTitle className="text-forge-white">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Duration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-forge-white">
                  Duration: {duration[0]}s
                </label>
                <span className="text-xs text-forge-white/50">15-240s</span>
              </div>
              <Slider
                value={duration}
                onValueChange={setDuration}
                min={15}
                max={240}
                step={5}
                className="[&_[role=slider]]:bg-forge-amber"
                aria-label="Track duration in seconds"
              />
            </div>

            {/* Style Strength */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-forge-white">
                  Style Influence: {styleStrength[0]}%
                </label>
              </div>
              <Slider
                value={styleStrength}
                onValueChange={setStyleStrength}
                min={0}
                max={100}
                step={5}
                className="[&_[role=slider]]:bg-forge-amber"
                aria-label="Style influence percentage"
              />
            </div>

            {/* Genre */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-forge-white">Genre (optional)</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-forge-black/50 border border-forge-gray text-forge-white focus-visible:outline-2 focus-visible:outline-forge-amber"
                aria-label="Select genre"
              >
                <option value="">None</option>
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Key */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-forge-white">Key (optional)</label>
              <select
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-forge-black/50 border border-forge-gray text-forge-white focus-visible:outline-2 focus-visible:outline-forge-amber"
                aria-label="Select musical key"
              >
                <option value="">None</option>
                {KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            {/* Vocals Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="vocals"
                checked={hasVocals}
                onChange={(e) => setHasVocals(e.target.checked)}
                className="rounded w-4 h-4 accent-forge-amber"
                aria-label="Include vocals"
              />
              <label htmlFor="vocals" className="text-sm font-medium text-forge-white">
                Include vocals
              </label>
            </div>

            {/* Lyrics (conditional) */}
            {hasVocals && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-forge-white">Lyrics</label>
                <Textarea
                  placeholder="Enter lyrics for the vocals..."
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  rows={6}
                  className="bg-forge-black/50 border-forge-gray text-forge-white placeholder:text-forge-white/40 focus-visible:ring-forge-amber"
                  aria-label="Lyrics for vocals"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reference Upload */}
        <Card className="bg-forge-gray panel-shadow border-forge-gray/50">
          <CardHeader>
            <CardTitle className="text-forge-white">Reference Audio (optional)</CardTitle>
            <CardDescription className="text-forge-white/70">
              Upload a reference track to guide the style
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReferenceUpload
              onUploadComplete={handleReferenceUpload}
            />
            {referenceAnalysis && (
              <Alert className="mt-4 bg-forge-black/50 border-forge-gray">
                <Info className="h-4 w-4 text-forge-blue" />
                <AlertDescription className="text-forge-white">
                  Detected: {referenceAnalysis.bpm && `BPM ${referenceAnalysis.bpm}`}
                  {referenceAnalysis.bpm && referenceAnalysis.key && " • "}
                  {referenceAnalysis.key && `Key ${referenceAnalysis.key}`}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={createTrackMutation.isPending || !prompt.trim()}
          className="w-full bg-forge-amber text-forge-black hover:brightness-110 font-semibold py-6 text-lg"
          aria-label="Generate music track"
        >
          {createTrackMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Music className="mr-2 h-5 w-5" />
              Generate Music
            </>
          )}
        </Button>

        {/* Job Progress */}
        {currentJobId && job && (
          <Card className="bg-forge-gray panel-shadow border-forge-gray/50">
            <CardHeader>
              <CardTitle className="text-forge-white">Generation Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-forge-white/80">Status: {job.status}</span>
                  <span className="text-forge-white/80">{job.progress}%</span>
                </div>
                <Progress value={job.progress} className="h-2" />
                {job.error && (
                  <Alert className="bg-error/20 border-error">
                    <AlertDescription className="text-error">
                      {job.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Track Preview */}
        {track && track.status === "COMPLETE" && (track.preview_url || track.file_url) && (
          <Card className="bg-forge-gray panel-shadow border-forge-gray/50">
            <CardHeader>
              <CardTitle className="text-forge-white">Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AudioPlayer
                src={track.preview_url || track.file_url || ""}
                title={track.title || track.prompt}
              />
              <div className="flex gap-3">
                {track.file_url && (
                  <>
                    <Button
                      asChild
                      className="bg-forge-blue text-forge-white hover:brightness-110"
                    >
                      <a
                        href={apiClient.getTrackStreamUrl(track.id)}
                        download
                        aria-label="Download MP3"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download MP3
                      </a>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="border-forge-gray text-forge-white hover:bg-forge-gray/50"
                    >
                      <a
                        href={track.file_url}
                        download
                        aria-label="Download WAV"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download WAV
                      </a>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

