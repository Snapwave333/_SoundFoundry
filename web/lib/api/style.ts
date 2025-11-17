// Style-related API utilities

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  genres: string[];
  moods: string[];
  energy: number; // 0-100
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "cinematic",
    name: "Cinematic",
    description: "Epic orchestral soundscapes for films and trailers",
    genres: ["orchestral", "epic", "soundtrack"],
    moods: ["dramatic", "powerful", "emotional"],
    energy: 70,
  },
  {
    id: "ambient",
    name: "Ambient",
    description: "Atmospheric and relaxing soundscapes",
    genres: ["ambient", "atmospheric", "downtempo"],
    moods: ["calm", "peaceful", "meditative"],
    energy: 20,
  },
  {
    id: "electronic",
    name: "Electronic",
    description: "Modern electronic dance music",
    genres: ["electronic", "edm", "house"],
    moods: ["energetic", "uplifting", "danceable"],
    energy: 85,
  },
  {
    id: "hiphop",
    name: "Hip-Hop",
    description: "Urban beats and rhythms",
    genres: ["hip-hop", "trap", "rap"],
    moods: ["urban", "confident", "rhythmic"],
    energy: 75,
  },
  {
    id: "pop",
    name: "Pop",
    description: "Catchy mainstream melodies",
    genres: ["pop", "mainstream", "radio"],
    moods: ["catchy", "upbeat", "commercial"],
    energy: 70,
  },
];

export function getStylePreset(id: string): StylePreset | undefined {
  return STYLE_PRESETS.find((preset) => preset.id === id);
}

export function getStylesByMood(mood: string): StylePreset[] {
  return STYLE_PRESETS.filter((preset) =>
    preset.moods.some((m) => m.toLowerCase().includes(mood.toLowerCase()))
  );
}

export function getStylesByEnergy(minEnergy: number, maxEnergy: number): StylePreset[] {
  return STYLE_PRESETS.filter(
    (preset) => preset.energy >= minEnergy && preset.energy <= maxEnergy
  );
}

// Cover saving and versioning utilities
export async function saveCover(
  trackId: number,
  svgContent: string
): Promise<{ url: string }> {
  // In production, this would upload to S3/CDN
  // For now, return a data URL
  const encoded = encodeURIComponent(svgContent);
  const url = `data:image/svg+xml,${encoded}`;
  return { url };
}

export async function incrementVisualVersion(trackId: number): Promise<number> {
  // In production, this would update the database
  // For now, return a mock version number
  return Date.now();
}
