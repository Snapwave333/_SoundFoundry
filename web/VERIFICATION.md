# SoundFoundry Verification Checklist

## Quick Start

### 1. Environment Setup

Create `.env.local` in `/web` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=SoundFoundry
```

### 2. Install Dependencies

```bash
cd web
npm install
# or
pnpm install
```

### 3. Run Development Server

```bash
npm run dev
# or
pnpm dev
```

### 4. Access Routes

- App: http://localhost:3000
- Marketing Landing: http://localhost:3000/landing
- Create Flow: http://localhost:3000/create
- Library: http://localhost:3000/library
- Settings: http://localhost:3000/settings

## Brand Integration Verification

### Assets Present

Verify these files exist:

- `/public/brand/soundfoundry/soundfoundry_logomark_forge.svg`
- `/public/brand/soundfoundry/soundfoundry_wordmark_forge.svg`
- `/public/brand/soundfoundry/icons/` (all sizes: 16, 32, 64, 128, 256, 512, 1024, 2048)
- `/public/og/social_preview.png`
- `/public/brand/soundfoundry/hero_waveform_forge.html`
- `/public/favicon.ico`
- `/public/icon-192.png`
- `/public/icon-512.png`
- `/public/apple-touch-icon.png`
- `/public/site.webmanifest`

### Theme Tokens

Verify brand colors are available as Tailwind utilities:

- `bg-forge-black` → `#0D0D0F`
- `bg-forge-gray` → `#24262A`
- `text-forge-white` → `#F3F5F7`
- `bg-forge-amber` → `#FFB24D`
- `bg-forge-blue` → `#3A77FF`
- `text-success` → `#36C98C`
- `text-error` → `#FF4D4D`

**Test**: Inspect elements in browser DevTools and verify classes work.

### Global Styles

Verify in `/styles/globals.css`:

- Dark mode default (`html { @apply dark; }`)
- 8px spacing scale (`--spacing-unit: 8px`)
- Button radius 6px (`--radius: 6px`)
- Hover brightness +4% (`button:hover:not(:disabled) { filter: brightness(1.04); }`)
- Panel shadow (`--shadow-panel`)
- Reduced motion support (`@media (prefers-reduced-motion: reduce)`)

### Gradient Wordmark

Verify in `/app/(app)/layout.tsx`:

- "Sound" text is white (`text-forge-white`)
- "Foundry" text uses gradient (`bg-clip-text text-transparent` with `linear-gradient(90deg, #FFB24D, #3A77FF)`)

### Favicons/PWA

Verify:

- `/favicon.ico` exists
- `/icon-192.png` and `/icon-512.png` exist
- `/apple-touch-icon.png` exists
- `/public/site.webmanifest` has correct theme colors (`#0D0D0F`)

**Test**: Open http://localhost:3000 and check browser tab icon. Check manifest in DevTools > Application > Manifest.

## Functional Walkthrough

### 1. Create Flow (`/create`)

**Steps:**

1. Enter prompt: "downtempo bass with airy pads"
2. Set duration slider (15-240s)
3. Set style influence slider (0-100%)
4. Select genre (optional)
5. Select key (optional)
6. Toggle vocals checkbox
7. If vocals enabled, enter lyrics
8. Upload reference audio (optional)
9. Click "Generate Music"

**Expected:**

- Job appears with progress bar
- Status updates: QUEUED → RENDERING → COMPLETE
- On complete: Preview player appears
- Download MP3/WAV buttons enabled
- Publish toggle available

**Test with Mock Server:**

If backend isn't running, MSW will intercept requests. Check browser console for MSW logs.

**Test with Real API:**

```bash
# Create track
curl -X POST http://localhost:8000/api/tracks ^
  -H "Content-Type: application/json" ^
  -d "{\"prompt\":\"downtempo bass with airy pads\",\"duration\":120,\"style_strength\":0.5}"

# Get job status
curl http://localhost:8000/api/jobs/<job_id>

# Get track
curl http://localhost:8000/api/tracks/<track_id>
```

### 2. Library (`/library`)

**Steps:**

1. View generated tracks list
2. Search tracks by title/prompt
3. Click "Open" on a track
4. Click "Share" → URL copies to clipboard
5. Click "Download" → file downloads

**Expected:**

- Tracks display with title, duration, status
- Public/private badges visible
- Actions work correctly

### 3. Settings (`/settings`)

**Steps:**

1. View credits balance
2. View plan status
3. Click "Buy" on credit pack
4. Redirects to Stripe checkout

**Expected:**

- Credits display correctly
- Credit packs listed
- Purchase flow initiates

## Backend Sanity Tests

### With Mock Server (MSW)

MSW automatically intercepts API calls in development. No backend needed.

### With Real Backend

**Health Check:**

```bash
curl http://localhost:8000/api/health
```

**Create Track:**

```bash
curl -X POST http://localhost:8000/api/tracks ^
  -H "Content-Type: application/json" ^
  -d "{\"prompt\":\"test track\",\"duration\":60,\"style_strength\":0.5}"
```

**Get Credits:**

```bash
curl http://localhost:8000/api/credits
```

## Accessibility Verification

### Keyboard Navigation

1. Tab through create form
2. Verify focus-visible rings appear (amber outline)
3. Space/Enter activate buttons
4. All interactive elements reachable via keyboard

**Test**: Use only keyboard (Tab, Shift+Tab, Enter, Space, Arrow keys)

### ARIA Labels

Verify:

- Main navigation has `aria-label="Main navigation"`
- Buttons have descriptive `aria-label` attributes
- Form inputs have associated labels
- Icons have `aria-hidden="true"` or descriptive labels

**Test**: Use screen reader (NVDA/JAWS/VoiceOver) or browser DevTools Accessibility panel

### Color Contrast

Verify WCAG AA compliance:

- Text on `#24262A` (forge-gray) background
- Buttons on `#0D0D0F` (forge-black) background
- Amber (`#FFB24D`) on black meets contrast requirements

**Test**: Use browser DevTools > Lighthouse > Accessibility or online contrast checker

### Reduced Motion

1. Enable OS "Reduce Motion" setting
2. Verify animations/transitions are minimal
3. Hover effects still work but don't animate

**Test**: System Settings > Accessibility > Display > Reduce Motion (macOS) or Windows Ease of Access

## Performance & SEO

### Lighthouse Scores

Run Lighthouse audit (Chrome DevTools):

- Performance: ≥ 95
- Accessibility: ≥ 95
- Best Practices: ≥ 95
- SEO: ≥ 95
- PWA: ≥ 95

**Test**: Chrome DevTools > Lighthouse > Run audit

### OpenGraph

Verify:

- `/og/social_preview.png` loads (1200×630)
- Meta tags in `<head>`:
  - `og:title`: "SoundFoundry — Craft Your Sound"
  - `og:description`: "Generate full tracks from a prompt..."
  - `og:image`: "/og/social_preview.png"
  - `twitter:card`: "summary_large_image"

**Test**: Use https://www.opengraph.xyz/ or browser DevTools > Elements > `<head>`

### Sitemap & Robots

Verify:

- `/sitemap.xml` exists and is valid
- `/robots.txt` exists and allows crawling

**Test**: Visit http://localhost:3000/sitemap.xml and http://localhost:3000/robots.txt

## Common Gotchas & Fixes

### CORS Issues

**Symptom**: API requests fail with CORS error

**Fix**: Ensure backend has CORS middleware:

```python
# FastAPI example
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Audio MIME Types

**Symptom**: Audio doesn't play or download incorrectly

**Fix**: Ensure backend sets correct headers:

```
Content-Type: audio/mpeg  # for MP3
Content-Type: audio/wav    # for WAV
```

### Tailwind Classes Not Working

**Symptom**: `bg-forge-black` doesn't apply

**Fix**: 
1. Verify colors in `/styles/globals.css` `@theme inline`
2. Restart dev server
3. Clear `.next` cache: `rm -rf .next` (or `Remove-Item -Recurse -Force .next` on Windows)

### MSW Not Intercepting

**Symptom**: Real API calls go through instead of mocks

**Fix**:
1. Verify MSW is enabled in `/lib/providers.tsx`
2. Check browser console for MSW initialization
3. Ensure `NODE_ENV=development`

### Icons Not Loading

**Symptom**: Favicon or PWA icons don't appear

**Fix**:
1. Verify files exist in `/public`
2. Clear browser cache
3. Check `/public/site.webmanifest` paths
4. Restart dev server

### Windows Path Issues

**Symptom**: Assets not copying from OneDrive

**Fix**:
1. Ensure Files On-Demand is enabled (not offline)
2. Use absolute paths in copy commands
3. Check file permissions

## Testing Commands

```bash
# Install dependencies
cd web && npm install

# Run dev server
npm run dev

# Run Playwright tests
npm run test:e2e

# Run Playwright UI mode
npm run test:e2e:ui

# Build for production
npm run build

# Start production server
npm start
```

## Done Checklist

- [ ] All brand assets present in `/public/brand/soundfoundry/`
- [ ] Tailwind forge color utilities work (`bg-forge-black`, etc.)
- [ ] All routes render correctly (`/landing`, `/create`, `/library`, `/settings`)
- [ ] Create flow: prompt → generate → progress → preview → download
- [ ] Library: list → search → share → download
- [ ] Settings: credits display → purchase flow
- [ ] PWA icons and manifest valid (Lighthouse passes)
- [ ] OG card visible at `/og/social_preview.png`
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Focus-visible rings appear (amber outline)
- [ ] ARIA labels present on interactive elements
- [ ] Color contrast meets WCAG AA
- [ ] Reduced motion respected
- [ ] No console errors
- [ ] Network requests succeed (2xx) or handled gracefully
- [ ] Error states show clear messages with brand styling

## Next Steps

1. **Backend Integration**: Connect to real API endpoints
2. **Authentication**: Add NextAuth.js integration
3. **Error Handling**: Enhance error boundaries and user feedback
4. **Performance**: Optimize images, code splitting, lazy loading
5. **Analytics**: Add tracking for user actions
6. **Testing**: Expand Playwright test coverage

