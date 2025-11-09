# Design Tokens System

## Core Principle

**Never use raw colors.** Always use design tokens.

## Quick Reference

### Colors
- `bg-bg` / `bg-bg-elevated` / `bg-surface` - Backgrounds
- `text-fg` / `text-fg-muted` / `text-fg-subtle` - Text colors
- `border-border` / `border-border-strong` - Borders
- `accent` / `accent-hover` / `accent-muted` - Accent colors
- `positive` / `warning` / `danger` - Semantic colors

### Spacing
- `space-1` through `space-12` (4px to 48px)
- Use Tailwind: `p-4`, `gap-6`, etc.

### Radius
- `rounded-sm` (4px), `rounded-md` (8px), `rounded-lg` (16px), `rounded-full`

### Shadows
- `shadow-sm`, `shadow-md`, `shadow-lg`

### Motion
- `transition-fast` (120ms), `transition-normal` (200ms), `transition-slow` (350ms)

## Adding a New Token

1. **Add to `web/lib/design-tokens.ts`**:
```ts
export const tokens = {
  color: {
    // ... existing
    newColor: "hsl(220 14% 50%)",
  },
  // ...
};
```

2. **Add CSS variable to `web/styles/design-tokens.css`**:
```css
:root {
  --color-new-color: hsl(220 14% 50%);
}
```

3. **Map to Tailwind in `web/tailwind.config.ts`**:
```ts
colors: {
  "new-color": "hsl(var(--color-new-color))",
}
```

4. **Update light theme** in `design-tokens.css`:
```css
:root.light {
  --color-new-color: hsl(220 14% 80%);
}
```

## Creating a Theme Pack

1. **Add to `web/styles/theme-packs.css`**:
```css
:root.theme-yourname {
  --color-accent: 180 90% 55%;
  --color-accent-hover: 180 90% 48%;
  --color-accent-muted: 180 20% 45%;
  --accent-hue: 180;
}
```

2. **Apply via HTML attribute**:
```tsx
<html data-theme="yourname">
```

## Per-User Accent Colors

Use `applyUserAccent(seed)` from `@/lib/utils/theme`:

```tsx
import { applyUserAccent } from "@/lib/utils/theme";

// On user login/load
if (userStyleSeed) {
  applyUserAccent(userStyleSeed);
}
```

## Accessibility

- All text must meet WCAG AA contrast (4.5:1 for normal, 3:1 for large)
- Focus outlines are 2px minimum
- Reduced motion is respected automatically

## Performance

- Tokens are in critical CSS path (no FOUC)
- Use `content-visibility: auto` on large sections
- Token CSS is cached via `Cache-Control` headers

## Deprecation

Old brand colors (`--color-forge-*`) are deprecated. Migration schedule:
- Phase 1 (current): Both systems coexist
- Phase 2 (next release): Warnings for old tokens
- Phase 3 (future): Remove old tokens

## Linting

Run token lint check:
```bash
npm run lint:tokens
```

This detects hardcoded colors in components.

## Design Tool Integration

Export tokens for Figma/Sketch:
- JSON: `/api/tokens`
- Or import: `import tokensExport from '@/lib/design-tokens-export'`

## Examples

### Button
```tsx
<button className="btn btn-accent">Click</button>
```

### Panel
```tsx
<div className="surface p-4">
  <h3 className="text-sm text-muted">Title</h3>
</div>
```

### Slider (mood-reactive)
```tsx
<div data-mood="energetic">
  <input type="range" className="slider-track" />
</div>
```

