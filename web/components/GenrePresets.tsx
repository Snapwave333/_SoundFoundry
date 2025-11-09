"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GenrePresetsProps {
  genres: readonly string[];
  selected: string;
  onSelect: (genre: string) => void;
}

export function GenrePresets({ genres, selected, onSelect }: GenrePresetsProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Genre Presets</label>
      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => (
          <Button
            key={genre}
            variant={selected === genre ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(selected === genre ? "" : genre)}
            className={cn(
              "transition-colors",
              selected === genre && "bg-primary text-primary-foreground"
            )}
          >
            {genre}
          </Button>
        ))}
      </div>
    </div>
  );
}

