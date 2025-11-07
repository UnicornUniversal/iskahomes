-- Migration script to restructure media field from mediaFiles to albums structure
-- This converts the old media.mediaFiles array to media.albums with a "General" album
-- 
-- Usage: Run this query in your PostgreSQL/Supabase SQL editor
-- 
-- Before running: Make a backup of your listings table!

-- Step 1: Update listings that have mediaFiles in the old structure
-- This query converts mediaFiles to albums with a "General" album containing all images

UPDATE listings
SET media = jsonb_build_object(
  -- Preserve existing fields
  'video', COALESCE(media->'video', 'null'::jsonb),
  'youtubeUrl', COALESCE(media->'youtubeUrl', '""'::jsonb),
  'virtualTourUrl', COALESCE(media->'virtualTourUrl', '""'::jsonb),
  -- Create albums structure
  'albums', CASE
    -- If mediaFiles exists and has items, convert them to General album
    WHEN media ? 'mediaFiles' 
         AND jsonb_typeof(media->'mediaFiles') = 'array'
         AND jsonb_array_length(media->'mediaFiles') > 0 THEN
      jsonb_build_array(
        jsonb_build_object(
          'id', 'album_general_' || id::text,
          'name', 'General',
          'images', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', 'img_' || ordinal::text || '_' || id::text,
                'url', img->>'url',
                'path', img->>'path',
                'size', CASE 
                  WHEN img->>'size' ~ '^[0-9]+$' THEN (img->>'size')::int
                  ELSE NULL
                END,
                'type', img->>'type',
                'filename', img->>'filename',
                'originalName', img->>'originalName',
                'name', COALESCE(img->>'originalName', img->>'filename', ''),
                'created_at', COALESCE(img->>'created_at', created_at::text)
              )
              ORDER BY ordinal
            )
            FROM jsonb_array_elements(media->'mediaFiles') WITH ORDINALITY AS t(img, ordinal)
          ),
          'created_at', created_at::text,
          'isDefault', true
        )
      )
    -- If no mediaFiles or empty, create empty General album
    ELSE
      jsonb_build_array(
        jsonb_build_object(
          'id', 'album_general_' || id::text,
          'name', 'General',
          'images', '[]'::jsonb,
          'created_at', created_at::text,
          'isDefault', true
        )
      )
  END
)
WHERE 
  -- Update rows that have mediaFiles (old structure)
  (media ? 'mediaFiles' AND jsonb_typeof(media->'mediaFiles') = 'array')
  OR
  -- Or rows that don't have albums yet (to ensure they have General album)
  (NOT (media ? 'albums') OR jsonb_array_length(COALESCE(media->'albums', '[]'::jsonb)) = 0);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Query 1: Check migration status - see which listings have been migrated
SELECT 
  id,
  title,
  CASE 
    WHEN media ? 'albums' AND jsonb_array_length(media->'albums') > 0 THEN '✅ Migrated (has albums)'
    WHEN media ? 'mediaFiles' THEN '⚠️ Needs migration (has old mediaFiles)'
    ELSE '❌ No media structure'
  END as migration_status,
  CASE 
    WHEN media ? 'albums' THEN 
      (SELECT COUNT(*) FROM jsonb_array_elements(media->'albums') AS album 
       CROSS JOIN jsonb_array_elements(album->'images') AS img)
    WHEN media ? 'mediaFiles' THEN jsonb_array_length(media->'mediaFiles')
    ELSE 0
  END as image_count
FROM listings
ORDER BY updated_at DESC
LIMIT 20;

-- Query 2: Count listings by migration status
SELECT 
  CASE 
    WHEN media ? 'albums' AND jsonb_array_length(media->'albums') > 0 THEN 'Migrated (has albums)'
    WHEN media ? 'mediaFiles' THEN 'Needs migration (has mediaFiles)'
    ELSE 'No media'
  END as status,
  COUNT(*) as count
FROM listings
GROUP BY 
  CASE 
    WHEN media ? 'albums' AND jsonb_array_length(media->'albums') > 0 THEN 'Migrated (has albums)'
    WHEN media ? 'mediaFiles' THEN 'Needs migration (has mediaFiles)'
    ELSE 'No media'
  END
ORDER BY count DESC;

-- Query 3: Preview a migrated listing's media structure
SELECT 
  id,
  title,
  jsonb_pretty(media) as media_structure
FROM listings
WHERE media ? 'albums'
LIMIT 3;

-- Query 4: Check if General album was created correctly
SELECT 
  id,
  title,
  (SELECT jsonb_array_length(album->'images') 
   FROM jsonb_array_elements(media->'albums') AS album 
   WHERE album->>'name' = 'General') as general_album_image_count,
  (SELECT jsonb_array_length(media->'mediaFiles')) as old_mediafiles_count
FROM listings
WHERE media ? 'albums' OR media ? 'mediaFiles'
ORDER BY updated_at DESC
LIMIT 10;
