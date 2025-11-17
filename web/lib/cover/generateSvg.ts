/**
 * Generate SVG cover art based on track metadata
 */

interface CoverArtOptions {
  title: string;
  genre?: string;
  mood?: string;
  energy?: number; // 0-100
}

// Color palettes based on genre/mood
const COLOR_PALETTES: Record<string, string[]> = {
  cinematic: ["#1a1a2e", "#16213e", "#0f3460", "#e94560"],
  electronic: ["#0f0f0f", "#232323", "#00ff87", "#00c9ff"],
  ambient: ["#2d3436", "#636e72", "#b2bec3", "#dfe6e9"],
  hiphop: ["#2d132c", "#801336", "#c72c41", "#ee4540"],
  pop: ["#6c5ce7", "#a29bfe", "#fd79a8", "#ffeaa7"],
  rock: ["#2c3e50", "#34495e", "#e74c3c", "#f39c12"],
  default: ["#0d0d0f", "#2d2d2f", "#f5a623", "#ffffff"],
};

export function generateCoverSvg(options: CoverArtOptions): string {
  const { title, genre = "default", energy = 50 } = options;

  const palette = COLOR_PALETTES[genre.toLowerCase()] || COLOR_PALETTES.default;
  const [bg, secondary, accent, text] = palette;

  // Generate abstract shapes based on energy level
  const shapes = generateShapes(energy, accent, secondary);

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bg};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${secondary};stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" fill="url(#bg-gradient)" />

  <!-- Abstract shapes -->
  ${shapes}

  <!-- Title -->
  <text
    x="256"
    y="460"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="24"
    font-weight="600"
    fill="${text}"
    text-anchor="middle"
    filter="url(#glow)"
  >
    ${escapeXml(truncateTitle(title))}
  </text>

  <!-- Brand mark -->
  <text
    x="256"
    y="490"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="12"
    fill="${text}"
    text-anchor="middle"
    opacity="0.5"
  >
    PromptBloom
  </text>
</svg>
`.trim();
}

function generateShapes(energy: number, accent: string, secondary: string): string {
  const shapes: string[] = [];
  const numShapes = Math.floor(energy / 10) + 3;

  for (let i = 0; i < numShapes; i++) {
    const cx = 100 + Math.random() * 312;
    const cy = 100 + Math.random() * 250;
    const r = 20 + Math.random() * (energy / 2);
    const opacity = 0.1 + Math.random() * 0.3;
    const color = i % 2 === 0 ? accent : secondary;

    shapes.push(
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${opacity}" />`
    );
  }

  // Add wave pattern based on energy
  const waveHeight = energy * 0.5;
  const wavePath = generateWavePath(waveHeight);
  shapes.push(
    `<path d="${wavePath}" fill="none" stroke="${accent}" stroke-width="2" opacity="0.4" />`
  );

  return shapes.join("\n  ");
}

function generateWavePath(amplitude: number): string {
  const points: string[] = [];
  for (let x = 0; x <= 512; x += 20) {
    const y = 256 + Math.sin(x * 0.02) * amplitude;
    points.push(`${x},${y.toFixed(1)}`);
  }
  return `M ${points.join(" L ")}`;
}

function truncateTitle(title: string): string {
  if (title.length > 30) {
    return title.substring(0, 27) + "...";
  }
  return title;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function svgToDataUrl(svg: string): string {
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml,${encoded}`;
}

export function generateCoverDataUrl(options: CoverArtOptions): string {
  const svg = generateCoverSvg(options);
  return svgToDataUrl(svg);
}

// Simple in-memory cache for generated covers
const coverCache = new Map<string, string>();

export function generateCoverSVGCached(options: CoverArtOptions): string {
  const cacheKey = JSON.stringify(options);

  if (coverCache.has(cacheKey)) {
    return coverCache.get(cacheKey)!;
  }

  const svg = generateCoverSvg(options);
  coverCache.set(cacheKey, svg);

  // Limit cache size
  if (coverCache.size > 100) {
    const firstKey = coverCache.keys().next().value;
    if (firstKey) coverCache.delete(firstKey);
  }

  return svg;
}

export function downloadSVG(svg: string, filename: string = "cover.svg"): void {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export async function downloadPNG(
  svg: string,
  filename: string = "cover.png",
  size: number = 512
): Promise<void> {
  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Convert SVG to image
  const img = new Image();
  const svgBlob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);

      // Download PNG
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Failed to create PNG blob"));
          return;
        }

        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pngUrl);
        resolve();
      }, "image/png");
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG image"));
    };

    img.src = url;
  });
}

export function generateSeedFromPrompt(prompt: string): number {
  // Generate a deterministic seed from the prompt text
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
