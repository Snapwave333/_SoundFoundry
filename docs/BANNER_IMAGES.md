# Banner Images Creation Guide

## Required Banner Images

The following banner images need to be created from brand assets for use in the README and marketing materials:

### Hero Banners

1. **`banner_hero_1920x480.png`** (Light Mode)
   - Dimensions: 1920×480px
   - Content: SoundFoundry wordmark centered on light background
   - Background: Steel White (#F3F5F7) or light gradient
   - Use: README header, landing page hero

2. **`banner_hero_1920x480.png`** (Dark Mode)
   - Dimensions: 1920×480px
   - Content: SoundFoundry wordmark centered on dark background
   - Background: Forge Black (#0D0D0F) or dark gradient
   - Use: README header (dark mode variant)

3. **`banner_hero_1024x256.png`** (Compact)
   - Dimensions: 1024×256px
   - Content: SoundFoundry wordmark or logomark
   - Background: Brand colors
   - Use: Compact README header, social media headers

## Creation Instructions

### Using Existing Assets

Base assets available in `/assets/branding/`:
- `wordmark.svg` - Full wordmark
- `logo.svg` - Logomark
- `social-card_1200x630.png` - Can be cropped/resized

### Design Specifications

- **Clearspace**: Maintain minimum clearspace around logo (cap-height of "S")
- **Typography**: Use Montserrat SemiBold for any text
- **Colors**: 
  - Light: Steel White background, Forge Black text
  - Dark: Forge Black background, Steel White text
  - Accents: Forge Amber (#FFB24D) and Resonance Blue (#3A77FF)

### Tools

- **Figma/Adobe Illustrator**: Use SVG assets, export as PNG
- **ImageMagick**: Resize/crop existing images
- **Online Tools**: Canva, Figma, etc.

### Example Command (ImageMagick)

```bash
# Create banner from social card (crop and resize)
convert assets/branding/social-card_1200x630.png \
  -crop 1920x480+0+75 \
  -resize 1920x480 \
  assets/branding/banner_hero_1920x480.png

# Create compact banner
convert assets/branding/social-card_1200x630.png \
  -resize 1024x256 \
  assets/branding/banner_hero_1024x256.png
```

## Current Status

- ✅ Social card created (`social-card_1200x630.png`)
- ⏳ Hero banners pending creation
- ⏳ Compact banner pending creation

## Temporary Solution

The README currently uses `social-card_1200x630.png` as a placeholder banner. Once hero banners are created, update the README to use the appropriate banner images.

