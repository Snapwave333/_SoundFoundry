-- Style seed system backfill
-- Run after migration 003_style_seed_system

-- Seed per user if null (deterministic fallback)
UPDATE users
SET user_style_seed = (
  abs(('x'||substr(md5(lower(email)||extract(epoch from created_at)::text),1,8))::bit(32)::int)
) 
WHERE user_style_seed IS NULL;

-- Create Default Series for users without one
INSERT INTO series (user_id, title, slug, palette, geometry, created_at)
SELECT 
  u.id,
  'Default Series',
  'default-'||u.id,
  jsonb_build_object(
    'primary_hue', (u.user_style_seed % 360),
    'secondary_hue', ((u.user_style_seed + 40) % 360),
    'luminance_base', 0.45,
    'saturation', 0.8
  ),
  jsonb_build_object(
    'stroke_width_base', 8 + (u.user_style_seed % 16),
    'rotation_base', ((u.user_style_seed >> 16) % 360),
    'gradient_angle', ((u.user_style_seed >> 8) % 90),
    'shape_count', 6
  ),
  now()
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM series s WHERE s.user_id = u.id AND s.slug = 'default-'||u.id
);

-- Set visual_version=1 for existing tracks
UPDATE tracks
SET visual_version = 1
WHERE visual_version IS NULL OR visual_version = 0;

