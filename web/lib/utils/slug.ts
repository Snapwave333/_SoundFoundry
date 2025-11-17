/**
 * Generate a URL-friendly slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug with a random suffix
 */
export function uniqueSlug(text: string, length: number = 6): string {
  const base = slugify(text).slice(0, 50); // Limit base length
  const suffix = generateRandomString(length);
  return `${base}-${suffix}`;
}

/**
 * Generate a random alphanumeric string
 */
export function generateRandomString(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Extract keywords from a prompt for naming/tagging
 */
export function extractKeywords(prompt: string): string[] {
  const stopWords = new Set([
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
    "be", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "must", "shall", "can", "need",
    "that", "this", "these", "those", "i", "you", "he", "she", "it",
    "we", "they", "me", "him", "her", "us", "them", "my", "your", "his",
    "its", "our", "their", "mine", "yours", "hers", "ours", "theirs",
  ]);

  return prompt
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .slice(0, 10);
}

/**
 * Generate a title from a prompt
 */
export function generateTitle(prompt: string): string {
  const keywords = extractKeywords(prompt);
  if (keywords.length === 0) {
    return "Untitled Track";
  }

  // Capitalize first letters
  const title = keywords
    .slice(0, 3)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return title;
}

// Alias for backward compatibility
export const slug = slugify;
