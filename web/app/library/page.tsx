"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient, Track } from "@/lib/api";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Search, Download, Share2 } from "lucide-react";

export default function LibraryPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch user's tracks from API
    // For now, use empty array
    setLoading(false);
  }, []);

  const filteredTracks = tracks.filter((track) =>
    track.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Library</h1>
        <p className="text-muted-foreground">
          Your generated tracks and music collection
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tracks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : filteredTracks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {searchQuery ? "No tracks found" : "No tracks yet. Start generating!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTracks.map((track) => (
            <Card key={track.id}>
              <CardHeader>
                <CardTitle className="truncate">
                  {track.title || `Track ${track.id}`}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {track.prompt}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-muted rounded capitalize">
                    {track.status}
                  </span>
                </div>
                {track.status === "complete" && (
                  <>
                    <AudioPlayer trackId={track.id} />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
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

