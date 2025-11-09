"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LyricsEditorProps {
  value: string;
  onChange: (value: string) => void;
  enabled: boolean;
}

export function LyricsEditor({ value, onChange, enabled }: LyricsEditorProps) {
  const generateStructure = () => {
    // Generate A-B-A-B-C structure template
    const structure = `[Verse 1]
Your lyrics here...

[Chorus]
Your chorus lyrics here...

[Verse 2]
Your lyrics here...

[Chorus]
Your chorus lyrics here...

[Bridge]
Your bridge lyrics here...`;

    onChange(structure);
  };

  if (!enabled) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Enable vocals to add lyrics
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Lyrics</CardTitle>
            <CardDescription>
              Add lyrics for vocal generation
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={generateStructure}>
            Generate Structure
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Enter your lyrics here..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={10}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Tip: Use section markers like [Verse], [Chorus], [Bridge] for better structure
        </p>
      </CardContent>
    </Card>
  );
}

