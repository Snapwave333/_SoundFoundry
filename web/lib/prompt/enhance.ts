/**
 * Prompt enhancement utilities for better music generation
 */

interface EnhancementOptions {
  genre?: string;
  mood?: string;
  energy?: number; // 0-100
  key?: string;
  bpm?: number;
}

const GENRE_KEYWORDS: Record<string, string[]> = {
  cinematic: ["orchestral", "epic", "dramatic", "sweeping strings", "brass section"],
  electronic: ["synthesizer", "808", "bass drop", "sidechain", "arpeggio"],
  ambient: ["atmospheric", "reverb", "pad", "drone", "textural"],
  hiphop: ["trap drums", "hi-hat rolls", "808 bass", "boom bap", "vinyl crackle"],
  pop: ["catchy hook", "radio-friendly", "verse-chorus", "bright", "polished"],
  rock: ["electric guitar", "distortion", "power chords", "drums", "bass guitar"],
  world: ["ethnic instruments", "traditional rhythms", "cultural", "acoustic"],
};

const MOOD_MODIFIERS: Record<string, string[]> = {
  energetic: ["upbeat", "driving", "powerful", "intense"],
  calm: ["peaceful", "gentle", "soothing", "relaxing"],
  dark: ["minor key", "ominous", "brooding", "suspenseful"],
  happy: ["major key", "bright", "cheerful", "uplifting"],
  melancholic: ["sad", "wistful", "nostalgic", "bittersweet"],
  aggressive: ["hard-hitting", "intense", "raw", "punchy"],
};

export function enhancePrompt(prompt: string, options: EnhancementOptions = {}): string {
  let enhanced = prompt.trim();
  const additions: string[] = [];

  // Add genre-specific keywords if not already present
  if (options.genre) {
    const genreKey = options.genre.toLowerCase().replace("-", "");
    const keywords = GENRE_KEYWORDS[genreKey] || [];
    const missingKeywords = keywords.filter(
      (kw) => !enhanced.toLowerCase().includes(kw.toLowerCase())
    );
    if (missingKeywords.length > 0) {
      additions.push(missingKeywords.slice(0, 2).join(", "));
    }
  }

  // Add mood modifiers
  if (options.mood) {
    const moodKey = options.mood.toLowerCase();
    const modifiers = MOOD_MODIFIERS[moodKey] || [];
    if (modifiers.length > 0) {
      const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
      if (!enhanced.toLowerCase().includes(modifier)) {
        additions.push(modifier);
      }
    }
  }

  // Add energy descriptor
  if (options.energy !== undefined) {
    if (options.energy > 75 && !enhanced.includes("high energy")) {
      additions.push("high energy");
    } else if (options.energy < 25 && !enhanced.includes("low energy")) {
      additions.push("low energy");
    }
  }

  // Add musical key if specified
  if (options.key && !enhanced.includes(options.key)) {
    additions.push(`in ${options.key} key`);
  }

  // Add BPM if specified
  if (options.bpm && !enhanced.includes("BPM")) {
    additions.push(`${options.bpm} BPM`);
  }

  // Combine enhanced prompt
  if (additions.length > 0) {
    enhanced = `${enhanced}. ${additions.join(", ")}.`;
  }

  return enhanced;
}

export function validatePrompt(prompt: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!prompt.trim()) {
    issues.push("Prompt cannot be empty");
  }

  if (prompt.length < 10) {
    issues.push("Prompt is too short. Add more description for better results.");
  }

  if (prompt.length > 1000) {
    issues.push("Prompt is too long. Keep it under 1000 characters.");
  }

  // Check for potentially problematic content
  const problematicTerms = ["copyright", "licensed", "famous song"];
  for (const term of problematicTerms) {
    if (prompt.toLowerCase().includes(term)) {
      issues.push(`Avoid using "${term}" to prevent copyright issues`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function getPromptSuggestions(genre?: string): string[] {
  const generalSuggestions = [
    "Upbeat electronic dance music with energetic synth leads",
    "Cinematic orchestral piece with dramatic strings and brass",
    "Chill ambient soundscape with atmospheric pads and textures",
    "Modern hip-hop beat with trap drums and 808 bass",
    "Acoustic folk song with warm guitar and gentle percussion",
  ];

  if (!genre) return generalSuggestions;

  const genreSpecific: Record<string, string[]> = {
    cinematic: [
      "Epic trailer music with powerful brass and sweeping strings",
      "Mysterious suspense score with tension-building elements",
      "Emotional piano piece with orchestral accompaniment",
    ],
    electronic: [
      "Progressive house with building drops and melodic synths",
      "Ambient techno with deep bass and hypnotic patterns",
      "Future bass with bright chords and energetic rhythm",
    ],
    hiphop: [
      "Dark trap beat with heavy 808s and hi-hat patterns",
      "Boom bap instrumental with jazzy samples and drums",
      "Lo-fi hip-hop with vinyl texture and mellow piano",
    ],
  };

  return genreSpecific[genre.toLowerCase()] || generalSuggestions;
}
