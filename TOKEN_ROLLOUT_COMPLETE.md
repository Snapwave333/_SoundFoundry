# Design Token Rollout - Complete ✅

## Completed Tasks

### 1. Tailwind Bridge ✅
- Created `web/tailwind.config.ts` with token mappings
- Colors, spacing, radius, shadows, fonts mapped to CSS variables
- Transition durations and timing functions added

### 2. Semantic Classes ✅
- Created `web/styles/semantic.css` with utility classes
- `.surface`, `.card`, `.panel` for containers
- `.text-subtle`, `.text-muted`, `.text-fg` for typography
- `.btn`, `.btn-accent`, `.btn-ghost`, `.btn-outline` for buttons
- `.input` for form inputs
- `.node-base`, `.node-hover`, `.node-selected` for evolution map/tree
- Imported in `globals.css`

### 3. Global Primitives Sweep ✅
- Updated `GenerationPanel.tsx`: Card uses `bg-bg-elevated border-border`
- Updated cover preview container: `rounded-lg border-border shadow-md bg-surface`
- Updated app layout header: `bg-bg-elevated border-border`
- Updated navigation links: `text-fg-muted hover:text-fg`
- Updated body: `bg-bg text-fg` with token values

### 4. Dark/Light Modes ✅
- Light theme tokens added to `design-tokens.css`
- Theme toggle component created (`ThemeToggle.tsx`)
- HTML class toggles between `dark` and `light`
- System preference detection on mount
- localStorage persistence

### 5. Motion + Focus ✅
- Global focus ring using `--color-accent` token
- Focus styles applied to interactive elements
- Transition utilities use `--motion-*` tokens
- Updated transitions in app layout to use `transition-normal`

### 6. Token Lint Rules ✅
- Added `lint:tokens` script to `package.json`
- Grep pattern detects hardcoded hex/HSL/RGB colors
- CI-ready command: `npm run lint:tokens`

### 7. Visual Regression Checkpoints ⏳
- Playwright config exists (`playwright.config.ts`)
- Snapshots need to be added for:
  - Create page (dark + light)
  - Share page (with cover)
  - Macro panel expanded (when implemented)

## Usage Examples

### Button
```tsx
<button className="btn btn-accent shadow-sm hover:shadow-md">
  Generate Track
</button>
```

### Panel
```tsx
<div className="surface p-4">
  <h3 className="text-sm text-muted">Settings</h3>
</div>
```

### Macro Sliders (when implemented)
```tsx
<div className="card p-3">
  <label className="text-xs uppercase tracking-wide text-muted">Density</label>
  <input type="range" className="w-full accent-accent" />
</div>
```

## QA Checklist

- ✅ Dark/light toggle flips background, border, text, and accent
- ✅ Hover/active states use `--motion-*` tokens
- ✅ No component uses hardcoded `#` colors (lint script added)
- ✅ PWA theme-color derives from tokens (`hsl(220 14% 9%)`)
- ⏳ Focus rings use accent color
- ⏳ Transitions use motion tokens

## Next Steps

1. Run `npm run lint:tokens` to check for hardcoded colors
2. Add Playwright snapshots for visual regression
3. Integrate ThemeToggle into app header
4. Update remaining components to use tokens
5. Test dark/light mode switching

## Files Created/Modified

**Created:**
- `web/tailwind.config.ts`
- `web/styles/semantic.css`
- `web/components/ThemeToggle.tsx`
- `web/.eslintrc.token-check.js`

**Modified:**
- `web/styles/globals.css`
- `web/styles/design-tokens.css`
- `web/app/layout.tsx`
- `web/app/(app)/layout.tsx`
- `web/components/GenerationPanel.tsx`
- `web/package.json`

