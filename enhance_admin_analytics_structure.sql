-- ============================================
-- MIGRATION: Enhance admin_analytics Table Structure
-- Adds: day, leads, impressions, user_signups, views columns
-- Run this BEFORE updating the cron job code
-- ============================================

-- ============================================
-- 1. ADD 'day' COLUMN (Day of Week: 1=Monday, 7=Sunday)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admin_analytics' AND column_name = 'day'
    ) THEN
        ALTER TABLE admin_analytics 
        ADD COLUMN day INTEGER;
        
        -- Add check constraint for day of week (1-7)
        ALTER TABLE admin_analytics 
        ADD CONSTRAINT admin_analytics_day_check 
        CHECK (day IS NULL OR (day >= 1 AND day <= 7));
        
        -- Populate day from date for existing records
        -- PostgreSQL DOW returns: 0=Sunday, 1=Monday, ..., 6=Saturday
        -- We want: 1=Monday, 2=Tuesday, ..., 7=Sunday
        UPDATE admin_analytics
        SET day = CASE 
            WHEN EXTRACT(DOW FROM date::date) = 0 THEN 7  -- Sunday
            ELSE EXTRACT(DOW FROM date::date)::INTEGER      -- Monday-Saturday (1-6)
        END
        WHERE day IS NULL;
        
        -- Make day NOT NULL after populating
        ALTER TABLE admin_analytics 
        ALTER COLUMN day SET NOT NULL;
        
        ALTER TABLE admin_analytics 
        ALTER COLUMN day SET DEFAULT (
            CASE 
                WHEN EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN 7  -- Sunday
                ELSE EXTRACT(DOW FROM CURRENT_DATE)::INTEGER      -- Monday-Saturday (1-6)
            END
        );
        
        RAISE NOTICE 'Added day column to admin_analytics';
    END IF;
END $$;

-- ============================================
-- 2. ADD 'leads' JSONB COLUMN (Consolidated Leads)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admin_analytics' AND column_name = 'leads'
    ) THEN
        ALTER TABLE admin_analytics 
        ADD COLUMN leads JSONB DEFAULT '{}'::jsonb;
        
        -- Migrate existing lead data to new structure
        UPDATE admin_analytics
        SET leads = jsonb_build_object(
            'total_leads', 
            COALESCE((phone_leads->>'total')::INTEGER, 0) +
            COALESCE((message_leads->>'total')::INTEGER, 0) +
            COALESCE((email_leads->>'total')::INTEGER, 0) +
            COALESCE((appointment_leads->>'total')::INTEGER, 0) +
            COALESCE((website_leads->>'total')::INTEGER, 0),
            'total_leads_change', 0,
            'phone_leads', COALESCE(phone_leads, '{}'::jsonb),
            'message_leads', COALESCE(message_leads, '{}'::jsonb),
            'email_leads', COALESCE(email_leads, '{}'::jsonb),
            'appointment_leads', COALESCE(appointment_leads, '{}'::jsonb),
            'website_leads', COALESCE(website_leads, '{}'::jsonb)
        )
        WHERE leads = '{}'::jsonb;
        
        RAISE NOTICE 'Added leads column to admin_analytics and migrated existing data';
    END IF;
END $$;

-- ============================================
-- 3. ADD 'impressions' JSONB COLUMN (Consolidated Impressions)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admin_analytics' AND column_name = 'impressions'
    ) THEN
        ALTER TABLE admin_analytics 
        ADD COLUMN impressions JSONB DEFAULT '{}'::jsonb;
        
        -- Migrate existing platform_impressions data to new structure
        UPDATE admin_analytics
        SET impressions = jsonb_build_object(
            'total_impressions', COALESCE((platform_impressions->>'total')::INTEGER, 0),
            'total_impressions_change', 0,
            'social_media', COALESCE((platform_impressions->>'social_media')::INTEGER, 0),
            'website_visit', COALESCE((platform_impressions->>'website_visit')::INTEGER, 0),
            'share', COALESCE((platform_impressions->>'share')::INTEGER, 0),
            'saved_listing', COALESCE((platform_impressions->>'saved_listing')::INTEGER, 0)
        )
        WHERE impressions = '{}'::jsonb;
        
        RAISE NOTICE 'Added impressions column to admin_analytics and migrated existing data';
    END IF;
END $$;

-- ============================================
-- 4. ADD 'user_signups' JSONB COLUMN (New User Signups Tracking)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admin_analytics' AND column_name = 'user_signups'
    ) THEN
        ALTER TABLE admin_analytics 
        ADD COLUMN user_signups JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE 'Added user_signups column to admin_analytics';
    END IF;
END $$;

-- ============================================
-- 5. ADD 'views' JSONB COLUMN (Enhanced Views Tracking)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admin_analytics' AND column_name = 'views'
    ) THEN
        ALTER TABLE admin_analytics 
        ADD COLUMN views JSONB DEFAULT '{}'::jsonb;
        
        -- Migrate existing platform_engagement data to new structure
        UPDATE admin_analytics
        SET views = jsonb_build_object(
            'total_views', COALESCE((platform_engagement->>'total_views')::INTEGER, 0),
            'total_views_change', 0,
            'unique_views', COALESCE((platform_engagement->>'unique_views')::INTEGER, 0),
            'anonymous_views', COALESCE((platform_engagement->>'anonymous_views')::INTEGER, 0),
            'logged_in_views', COALESCE((platform_engagement->>'logged_in_views')::INTEGER, 0),
            'views_by_source', COALESCE(platform_engagement->'views_by_source', '{}'::jsonb)
        )
        WHERE views = '{}'::jsonb;
        
        RAISE NOTICE 'Added views column to admin_analytics and migrated existing data';
    END IF;
END $$;

-- ============================================
-- 6. CREATE INDEXES FOR BETTER QUERY PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_admin_analytics_day 
ON admin_analytics(day);

CREATE INDEX IF NOT EXISTS idx_admin_analytics_date_hour_day 
ON admin_analytics(date, hour, day);

-- Index for JSONB queries on leads
CREATE INDEX IF NOT EXISTS idx_admin_analytics_leads_total 
ON admin_analytics USING GIN ((leads->'total_leads'));

-- Index for JSONB queries on impressions
CREATE INDEX IF NOT EXISTS idx_admin_analytics_impressions_total 
ON admin_analytics USING GIN ((impressions->'total_impressions'));

-- Index for JSONB queries on views
CREATE INDEX IF NOT EXISTS idx_admin_analytics_views_total 
ON admin_analytics USING GIN ((views->'total_views'));

-- Index for JSONB queries on user_signups
CREATE INDEX IF NOT EXISTS idx_admin_analytics_user_signups_total 
ON admin_analytics USING GIN ((user_signups->'total_signups'));

-- ============================================
-- 7. VERIFY MIGRATION
-- ============================================
DO $$
DECLARE
    day_exists BOOLEAN;
    leads_exists BOOLEAN;
    impressions_exists BOOLEAN;
    user_signups_exists BOOLEAN;
    views_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admin_analytics' AND column_name = 'day'
    ) INTO day_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admin_analytics' AND column_name = 'leads'
    ) INTO leads_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admin_analytics' AND column_name = 'impressions'
    ) INTO impressions_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admin_analytics' AND column_name = 'user_signups'
    ) INTO user_signups_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admin_analytics' AND column_name = 'views'
    ) INTO views_exists;
    
    IF day_exists AND leads_exists AND impressions_exists AND user_signups_exists AND views_exists THEN
        RAISE NOTICE '✅ Migration successful! All new columns added to admin_analytics';
    ELSE
        RAISE WARNING '⚠️ Migration incomplete. Check which columns are missing.';
        RAISE WARNING 'day: %, leads: %, impressions: %, user_signups: %, views: %', 
            day_exists, leads_exists, impressions_exists, user_signups_exists, views_exists;
    END IF;
END $$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Update cron job code to populate new fields
-- 2. Consider creating separate admin analytics cron (see recommendation below)
-- ============================================

