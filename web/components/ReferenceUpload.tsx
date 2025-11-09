"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface ReferenceUploadProps {
  onUploadComplete?: (file: File) => void | Promise<void>;
}

export function ReferenceUpload({ onUploadComplete }: ReferenceUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analysis, setAnalysis] = useState<{
    bpm?: number;
    key?: string;
    energy?: number;
    loudness?: number;
  } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setAnalysis(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      if (onUploadComplete) {
        await onUploadComplete(file);
      } else {
        const result = await apiClient.analyzeReference(file);
        
        setAnalysis({
          bpm: result.bpm,
          key: result.key,
          energy: result.energy,
          loudness: result.loudness,
        });

        toast.success("Reference audio analyzed successfully");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload reference");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reference Audio</CardTitle>
        <CardDescription>
          Upload a reference track to guide the style
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <label htmlFor="reference-file" className="cursor-pointer">
            <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent">
              <Upload className="h-4 w-4" />
              <span className="text-sm">Choose File</span>
            </div>
            <input
              id="reference-file"
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          {file && (
            <span className="text-sm text-muted-foreground">
              {file.name}
            </span>
          )}
        </div>

        {file && (
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? "Analyzing..." : "Upload & Analyze"}
          </Button>
        )}

        {analysis && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            {analysis.bpm && (
              <div>
                <p className="text-xs text-muted-foreground">BPM</p>
                <p className="text-lg font-semibold">{analysis.bpm}</p>
              </div>
            )}
            {analysis.key && (
              <div>
                <p className="text-xs text-muted-foreground">Key</p>
                <p className="text-lg font-semibold">{analysis.key}</p>
              </div>
            )}
            {analysis.energy !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Energy</p>
                <p className="text-lg font-semibold">
                  {(analysis.energy * 100).toFixed(0)}%
                </p>
              </div>
            )}
            {analysis.loudness !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Loudness</p>
                <p className="text-lg font-semibold">
                  {analysis.loudness.toFixed(1)} LUFS
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

