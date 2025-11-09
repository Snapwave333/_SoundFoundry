# Finish Line Checklist

## 1. Install + Run with Mocks

```bash
cd web
npm install
npm run dev
```

**Verify routes:**
- http://localhost:3000/landing
- http://localhost:3000/create
- http://localhost:3000/library
- http://localhost:3000/settings

**Expected:**
- Brand tokens visible (`bg-forge-black`, `text-forge-white`)
- Gradient wordmark ("Foundry" with clipped gradient)
- Create flow renders; job progress shows mocked states
- Settings shows mocked credits (100 credits, free plan)

## 2. Environment Files

Create `.env.local` in `/web` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=SoundFoundry
NEXT_PUBLIC_USE_MSW=true
```

**To switch to real API:**
```env
NEXT_PUBLIC_USE_MSW=false
```

## 3. MSW Toggle (Implemented)

MSW is now controlled via `NEXT_PUBLIC_USE_MSW` environment variable:

- **File**: `web/lib/msw.ts` - MSW startup logic
- **File**: `web/lib/providers.tsx` - Calls `startMocks()` in development
- **Behavior**: Only runs when `NEXT_PUBLIC_USE_MSW=true` and `NODE_ENV=development`

## 4. Tailwind v4 "@theme inline" Verification

Brand colors are defined in `web/styles/globals.css`:

```css
@theme inline {
  --color-forge-black: #0D0D0F;
  --color-forge-gray: #24262A;
  --color-forge-white: #F3F5F7;
  --color-forge-amber: #FFB24D;
  --color-forge-blue: #3A77FF;
  --color-success: #36C98C;
  --color-error: #FF4D4D;
}
```

**Available utilities:**
- `bg-forge-black`, `bg-forge-gray`, `bg-forge-white`, `bg-forge-amber`, `bg-forge-blue`
- `text-forge-black`, `text-forge-gray`, `text-forge-white`, `text-forge-amber`, `text-forge-blue`
- `border-forge-*` variants
- `shadow-panel` (via `--shadow-panel`)

**If classes don't work:** Restart dev server (Tailwind v4 JIT is file-sensitive)

## 5. API Client + Hooks Verification

**Test real backend (PowerShell):**

```powershell
# Create track
curl -Method POST http://localhost:8000/api/tracks `
  -ContentType application/json `
  -Body '{ "prompt": "downtempo bass with airy pads", "duration": 120, "style_strength": 0.5 }'

# Get job
curl http://localhost:8000/api/jobs/<job_id>

# Get track
curl http://localhost:8000/api/tracks/<track_id>
```

**Expected:** 200/201 + JSON responses

**CORS Fix (if needed):**
Backend should set:
- `Access-Control-Allow-Origin: http://localhost:3000`
- `Access-Control-Allow-Headers: content-type, authorization`
- `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`

## 6. CreditsDisplay Import Fix (Verified)

**File**: `web/components/CreditsDisplay.tsx`
- ✅ Uses `import { apiClient } from "@/lib/api/client"`
- ✅ Local `CreditsInfo` interface defined
- ✅ No dependency on old `@/lib/api`

## 7. Scripts Verification (Verified)

**File**: `web/package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## 8. E2E Smoke Tests

```bash
npx playwright install
npm run test:e2e
```

**Expected:**
- `/create` flow renders
- `/library` renders
- `/settings` renders
- `/landing` renders

Tests use MSW mocks when `NEXT_PUBLIC_USE_MSW=true`

## 9. Brand Verification (Visual)

**Check:**
- ✅ Header shows logomark SVG + gradient "Foundry" text
- ✅ CTA buttons: amber primary (`bg-forge-amber`), gray outline secondary
- ✅ Panels: `bg-forge-gray` + `panel-shadow` class
- ✅ OG preview: `/public/og/social_preview.png` (1200×630)
- ✅ PWA icons: `/icon-192.png`, `/icon-512.png`, `/apple-touch-icon.png`
- ✅ `site.webmanifest`: theme/background `#0D0D0F`

## 10. Accessibility & Performance

**Keyboard Navigation:**
- Tab through controls; focus rings visible (amber outline)
- Enter/Space activate buttons
- All interactive elements reachable

**Reduced Motion:**
- OS "Reduce Motion" setting honored
- Animations minimized when enabled

**Lighthouse:**
- Run: Chrome DevTools > Lighthouse > Run audit
- Target: ≥95 across PWA/Perf/Best/SEO/Accessibility

## 11. Common Fixes

### Audio Previews
Backend should return:
- `Content-Type: audio/mpeg` (MP3) or `audio/wav` (WAV)
- Support range requests for scrubbing

### SSE/WebSocket Jobs
If switching from polling:
- Set `cache: 'no-store'` on fetch
- Ensure Next dev server doesn't buffer SSE

### OneDrive Paths
If brand assets missing, re-copy from:
```
C:\Users\chrom\OneDrive\Documents\Ableton\soundfoundry_full_brand_delivery_forge
C:\Users\chrom\OneDrive\Documents\Ableton\soundfoundry_brand_kit
```

## 12. Definition of Done

- [x] Mocked API renders UI without errors
- [x] Real API integration ready (set `NEXT_PUBLIC_USE_MSW=false`)
- [x] Brand tokens everywhere (no stray hex colors)
- [x] Create → Job → Preview → Download flow works
- [x] Publish toggles visibility state
- [x] README.md and VERIFICATION.md match current state
- [x] MSW toggle implemented (`NEXT_PUBLIC_USE_MSW`)
- [x] Playwright tests configured
- [x] Environment example documented

## Quick Reference

**Start with mocks:**
```env
NEXT_PUBLIC_USE_MSW=true
```

**Switch to real API:**
```env
NEXT_PUBLIC_USE_MSW=false
```

**Run tests:**
```bash
npm run test:e2e
npm run test:e2e:ui  # Interactive mode
```

**Verify brand:**
- Check `bg-forge-*` classes in browser DevTools
- Inspect gradient wordmark in header
- Verify OG image at `/og/social_preview.png`

