-- ============================================
-- ADD LOGOUT TIMESTAMP FIELDS TO USER TABLES
-- ============================================
-- This script adds last_logout_at fields to user tables for better logout tracking

-- Add last_logout_at to developers table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'developers' 
        AND column_name = 'last_logout_at'
    ) THEN
        ALTER TABLE public.developers 
        ADD COLUMN last_logout_at TIMESTAMP WITH TIME ZONE;
        
        -- Add index for performance
        CREATE INDEX IF NOT EXISTS idx_developers_last_logout_at 
        ON public.developers USING btree (last_logout_at);
        
        RAISE NOTICE 'Added last_logout_at column to developers table';
    ELSE
        RAISE NOTICE 'last_logout_at column already exists in developers table';
    END IF;
END $$;

-- Add last_logout_at to agents table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agents' 
        AND column_name = 'last_logout_at'
    ) THEN
        ALTER TABLE public.agents 
        ADD COLUMN last_logout_at TIMESTAMP WITH TIME ZONE;
        
        -- Add index for performance
        CREATE INDEX IF NOT EXISTS idx_agents_last_logout_at 
        ON public.agents USING btree (last_logout_at);
        
        RAISE NOTICE 'Added last_logout_at column to agents table';
    ELSE
        RAISE NOTICE 'last_logout_at column already exists in agents table';
    END IF;
END $$;

-- Note: property_seekers table already has last_active_at field
-- which serves a similar purpose and will be updated on logout
