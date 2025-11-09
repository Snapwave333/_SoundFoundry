# SoundFoundry Brand Guidelines

## Logo Usage

### Logomark
The SoundFoundry logomark is an abstract forge waveform with an amber→blue gradient strike. It represents the creative process of forging sound.

**File**: `logo.svg`, `logo_dark.svg`

**Usage**:
- Primary brand identifier
- Use on Forge Black or Graphite Gray backgrounds
- Minimum clearspace = cap-height of "S" in wordmark
- Never skew, rotate, or distort

### Wordmark
The wordmark combines "Sound" in Steel White with "Foundry" in gradient fill (amber→blue).

**File**: `wordmark.svg`

**Usage**:
- Horizontal layouts
- Marketing materials
- Header navigation (when space allows)

### Icon
Square icon variants for app icons, favicons, and social media profiles.

**Files**: `icon_512.png`, `icon_256.png`, `favicon.ico`

**Sizes Available**:
- 16×16px (favicon)
- 32×32px (favicon)
- 64×64px (app icon small)
- 128×128px (app icon medium)
- 256×256px (app icon large)
- 512×512px (app icon extra large)
- 1024×1024px (app store)
- 2048×2048px (app store high-res)

## Clearspace

The minimum clearspace around the logo is equal to the cap-height of the "S" in the wordmark. This ensures the logo has breathing room and maintains visual hierarchy.

```
┌─────────────────┐
│                 │
│   [Clearspace]  │
│                 │
│     [LOGO]      │
│                 │
│   [Clearspace]  │
│                 │
└─────────────────┘
```

## Color Palette

### Primary Colors

**Forge Black** `#0D0D0F`
- Primary background color
- HSL: `hsl(240, 13%, 5%)`
- Use for: Main backgrounds, dark mode primary

**Graphite Gray** `#24262A`
- Surface and panel color
- HSL: `hsl(220, 8%, 15%)`
- Use for: Cards, panels, borders, secondary surfaces

**Steel White** `#F3F5F7`
- Primary text color
- HSL: `hsl(210, 20%, 96%)`
- Use for: Body text, headings, high-contrast elements

**Forge Amber** `#FFB24D`
- Primary accent color
- HSL: `hsl(35, 100%, 65%)`
- Use for: CTAs, highlights, primary actions, gradient start

**Resonance Blue** `#3A77FF`
- Secondary accent color
- HSL: `hsl(220, 100%, 61%)`
- Use for: Links, interactive states, gradient end

### Semantic Colors

**Success** `#36C98C`
- HSL: `hsl(155, 55%, 50%)`
- Use for: Success messages, positive feedback, completed states

**Error** `#FF4D4D`
- HSL: `hsl(0, 100%, 65%)`
- Use for: Error messages, warnings, destructive actions

## Typography

### Headings
**Font**: Montserrat SemiBold
- Use for: H1, H2, H3, page titles, section headers
- Weight: 600 (SemiBold)
- Letter spacing: -0.02em

### Body Text
**Font**: Inter Regular
- Use for: Body copy, paragraphs, descriptions
- Weight: 400 (Regular)
- Line height: 1.6

### Monospace
**Font**: JetBrains Mono
- Use for: Code blocks, technical specifications, API endpoints
- Weight: 400 (Regular)

## Voice & Tone

### Characteristics
- **Clear**: Direct, unambiguous communication
- **Confident**: Assured without being arrogant
- **Technical**: Precise terminology when appropriate
- **Inclusive**: Accessible to all skill levels

### Do's
- Use active voice
- Be concise and specific
- Explain technical concepts clearly
- Use consistent terminology

### Don'ts
- Avoid hype language ("revolutionary", "game-changing")
- Don't use jargon without explanation
- Avoid excessive exclamation points
- Don't oversell features

## UI Style Guidelines

### Dark-First Design
- Primary interface is dark mode
- Light mode available as alternative
- Dark backgrounds reduce eye strain for extended use

### Spacing
- Use 8px base unit for spacing
- Common spacing: 8px, 16px, 24px, 32px, 48px, 64px
- Maintain consistent spacing hierarchy

### Border Radius
- Buttons: 6px
- Cards/Panels: 8px
- Modals/Dialogs: 12px
- Inputs: 6px

### Shadows
- Subtle elevation for depth
- Use sparingly
- Panel shadow: `0 2px 8px rgba(0, 0, 0, 0.3)`

### Hover States
- Brightness increase: +4%
- Smooth transitions (200ms ease)
- Clear visual feedback

## Social Media Assets

### Open Graph Image
**File**: `social-card_1200x630.png`
- Dimensions: 1200×630px
- Format: PNG
- Use for: Facebook, Twitter, LinkedIn shares

### Profile Images
- **Square (1:1)**: 1080×1080px recommended
- Use logomark centered on Forge Black background
- Maintain clearspace

### Banner Images
- **Hero Banner**: 1920×480px (light mode), 1920×480px (dark mode)
- **Compact Banner**: 1024×256px
- Use wordmark or logomark with tagline

## Do's and Don'ts

### ✅ Do's
- Use logo on approved backgrounds (Forge Black, Graphite Gray)
- Maintain aspect ratio
- Use approved color variants only
- Follow clearspace guidelines
- Use consistent typography
- Maintain dark-first UI approach

### ❌ Don'ts
- Don't skew, rotate, or distort the logo
- Don't add outlines or effects to the logo
- Don't use unapproved color combinations
- Don't place logo on busy backgrounds without contrast
- Don't use custom fonts outside the approved set
- Don't modify brand colors
- Don't use light mode as primary (dark-first)

## File Organization

All brand assets are located in `/assets/branding/`:

```
/assets/branding/
├── logo.svg                 # Primary logomark (light)
├── logo_dark.svg            # Logomark for dark backgrounds
├── logo.png                 # Logomark PNG (fallback)
├── logo_dark.png            # Logomark PNG dark variant
├── wordmark.svg             # Full wordmark
├── icon_512.png             # App icon 512×512
├── icon_256.png             # App icon 256×256
├── favicon.ico              # Favicon (32×32)
├── banner_hero_1920x480.png # Hero banner (light)
├── banner_hero_1024x256.png # Compact banner
├── social-card_1200x630.png # Open Graph image
└── palette.md               # Color reference
```

## Accessibility

### Contrast Ratios
- Forge Black on Steel White: **19.5:1** (AAA)
- Graphite Gray on Steel White: **12.8:1** (AAA)
- Forge Amber on Forge Black: **4.2:1** (AA Large)
- Resonance Blue on Forge Black: **4.8:1** (AA Large)

### WCAG Compliance
- All text meets WCAG AA contrast requirements
- Interactive elements have clear focus states
- Keyboard navigation supported throughout
- Screen reader friendly markup

## Questions?

For brand asset requests or usage questions, please open an issue on GitHub or contact the maintainers.

