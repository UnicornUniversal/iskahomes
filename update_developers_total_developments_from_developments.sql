-- ============================================================================
-- Update Developers: total_developments from developments table
-- This script recalculates and updates each developer's total_developments
-- based on the actual count of developments in the developments table
--
-- IMPORTANT: 
-- - developments.developer_id stores developers.developer_id (UUID from user profile)
-- - NOT developers.id (primary key)
-- ============================================================================

-- Step 1: Update total_developments for all developers
UPDATE developers d
SET 
    -- Total developments: Count of developments where developer_id matches
    -- Note: developments.developer_id = developers.developer_id (not developers.id)
    total_developments = COALESCE(
        (SELECT COUNT(*) 
         FROM developments dev 
         WHERE dev.developer_id = d.developer_id),
        0
    )::integer,
    
    -- Update timestamp
    updated_at = NOW();

-- Step 2: Verification query - Check the results
SELECT 
    d.id,
    d.developer_id,
    d.name,
    d.slug,
    d.total_developments as updated_total_developments,
    (SELECT COUNT(*) 
     FROM developments dev 
     WHERE dev.developer_id = d.developer_id) as actual_developments_count,
    CASE 
        WHEN d.total_developments = (SELECT COUNT(*) FROM developments dev WHERE dev.developer_id = d.developer_id)
        THEN '✅ Match'
        ELSE '❌ Mismatch'
    END as status
FROM developers d
WHERE d.developer_id IS NOT NULL
ORDER BY d.total_developments DESC, d.name
LIMIT 50;

-- Step 3: Summary statistics
SELECT 
    COUNT(*) as total_developers,
    SUM(total_developments) as total_developments_sum,
    AVG(total_developments) as avg_developments_per_developer,
    MAX(total_developments) as max_developments,
    MIN(total_developments) as min_developments,
    (SELECT COUNT(*) FROM developments) as actual_total_developments
FROM developers
WHERE developer_id IS NOT NULL;

