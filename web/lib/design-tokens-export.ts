/**
 * Design tokens export for consistent styling
 */

export interface DesignToken {
  name: string;
  value: string;
  type: "color" | "spacing" | "typography" | "shadow" | "radius";
  category: string;
}

export const designTokens: DesignToken[] = [
  // Colors - Core
  { name: "forge-black", value: "#0D0D0F", type: "color", category: "core" },
  { name: "forge-gray", value: "#2D2D2F", type: "color", category: "core" },
  { name: "forge-white", value: "#F3F5F7", type: "color", category: "core" },

  // Colors - Brand
  { name: "forge-amber", value: "#F5A623", type: "color", category: "brand" },
  { name: "forge-blue", value: "#4A90E2", type: "color", category: "brand" },
  { name: "forge-green", value: "#7ED321", type: "color", category: "brand" },

  // Colors - Semantic
  { name: "success", value: "#22C55E", type: "color", category: "semantic" },
  { name: "warning", value: "#F59E0B", type: "color", category: "semantic" },
  { name: "error", value: "#EF4444", type: "color", category: "semantic" },
  { name: "info", value: "#3B82F6", type: "color", category: "semantic" },

  // Spacing
  { name: "spacing-xs", value: "0.25rem", type: "spacing", category: "spacing" },
  { name: "spacing-sm", value: "0.5rem", type: "spacing", category: "spacing" },
  { name: "spacing-md", value: "1rem", type: "spacing", category: "spacing" },
  { name: "spacing-lg", value: "1.5rem", type: "spacing", category: "spacing" },
  { name: "spacing-xl", value: "2rem", type: "spacing", category: "spacing" },
  { name: "spacing-2xl", value: "3rem", type: "spacing", category: "spacing" },

  // Typography
  { name: "font-sans", value: "var(--font-geist-sans)", type: "typography", category: "font-family" },
  { name: "font-mono", value: "var(--font-geist-mono)", type: "typography", category: "font-family" },
  { name: "font-size-xs", value: "0.75rem", type: "typography", category: "font-size" },
  { name: "font-size-sm", value: "0.875rem", type: "typography", category: "font-size" },
  { name: "font-size-base", value: "1rem", type: "typography", category: "font-size" },
  { name: "font-size-lg", value: "1.125rem", type: "typography", category: "font-size" },
  { name: "font-size-xl", value: "1.25rem", type: "typography", category: "font-size" },
  { name: "font-size-2xl", value: "1.5rem", type: "typography", category: "font-size" },
  { name: "font-size-3xl", value: "1.875rem", type: "typography", category: "font-size" },
  { name: "font-size-4xl", value: "2.25rem", type: "typography", category: "font-size" },

  // Shadows
  { name: "shadow-sm", value: "0 1px 2px 0 rgb(0 0 0 / 0.05)", type: "shadow", category: "shadow" },
  { name: "shadow-md", value: "0 4px 6px -1px rgb(0 0 0 / 0.1)", type: "shadow", category: "shadow" },
  { name: "shadow-lg", value: "0 10px 15px -3px rgb(0 0 0 / 0.1)", type: "shadow", category: "shadow" },
  { name: "panel-shadow", value: "0 4px 24px 0 rgb(0 0 0 / 0.4)", type: "shadow", category: "shadow" },

  // Border Radius
  { name: "radius-sm", value: "0.125rem", type: "radius", category: "radius" },
  { name: "radius-md", value: "0.375rem", type: "radius", category: "radius" },
  { name: "radius-lg", value: "0.5rem", type: "radius", category: "radius" },
  { name: "radius-xl", value: "0.75rem", type: "radius", category: "radius" },
  { name: "radius-2xl", value: "1rem", type: "radius", category: "radius" },
  { name: "radius-full", value: "9999px", type: "radius", category: "radius" },
];

export function getTokensByType(type: DesignToken["type"]): DesignToken[] {
  return designTokens.filter((token) => token.type === type);
}

export function getTokensByCategory(category: string): DesignToken[] {
  return designTokens.filter((token) => token.category === category);
}

export function getTokenValue(name: string): string | undefined {
  return designTokens.find((token) => token.name === name)?.value;
}

export function exportTokensAsCSS(): string {
  const lines = designTokens.map(
    (token) => `  --${token.name}: ${token.value};`
  );
  return `:root {\n${lines.join("\n")}\n}`;
}

export function exportTokensAsJSON(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const token of designTokens) {
    result[token.name] = token.value;
  }
  return result;
}

// Default export for backward compatibility
export default designTokens;
