-- =============================================
-- Fix mark_conversation_as_read Function
-- =============================================
-- This script ensures the mark_conversation_as_read function exists
-- with the correct signature and implementation.
-- Run this in your Supabase SQL Editor if you're getting function errors.

-- Step 1: Drop ALL versions of the function (in all schemas)
DROP FUNCTION IF EXISTS public.mark_conversation_as_read(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.mark_conversation_as_read(p_conversation_id UUID, p_user_id UUID, p_user_type TEXT) CASCADE;
DROP FUNCTION IF EXISTS mark_conversation_as_read(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS mark_conversation_as_read(p_conversation_id UUID, p_user_id UUID, p_user_type TEXT) CASCADE;

-- Step 2: Recreate the function in PUBLIC schema explicitly
-- Note: PostgREST requires functions to be in public schema and have proper grants
CREATE OR REPLACE FUNCTION public.mark_conversation_as_read(
  p_conversation_id UUID,
  p_user_id UUID,
  p_user_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update conversation unread count and last_read_at
  UPDATE public.conversations
  SET 
    user1_unread_count = CASE 
      WHEN user1_id = p_user_id AND user1_type = p_user_type THEN 0 
      ELSE user1_unread_count 
    END,
    user2_unread_count = CASE 
      WHEN user2_id = p_user_id AND user2_type = p_user_type THEN 0 
      ELSE user2_unread_count 
    END,
    user1_last_read_at = CASE 
      WHEN user1_id = p_user_id AND user1_type = p_user_type THEN NOW() 
      ELSE user1_last_read_at 
    END,
    user2_last_read_at = CASE 
      WHEN user2_id = p_user_id AND user2_type = p_user_type THEN NOW() 
      ELSE user2_last_read_at 
    END
  WHERE id = p_conversation_id;
  
  -- Mark all messages as read
  UPDATE public.messages
  SET 
    is_read = TRUE,
    read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND receiver_id = p_user_id
    AND receiver_type = p_user_type
    AND is_read = FALSE;
END;
$$;

-- Step 3: Grant execute permission to all roles (required for PostgREST)
GRANT EXECUTE ON FUNCTION public.mark_conversation_as_read(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_as_read(UUID, UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.mark_conversation_as_read(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_conversation_as_read(UUID, UUID, TEXT) TO postgres;

-- Step 4: Comment the function (helps PostgREST identify it)
COMMENT ON FUNCTION public.mark_conversation_as_read(UUID, UUID, TEXT) IS 'Marks a conversation and all its messages as read for a specific user';

-- Step 5: Refresh the schema cache (PostgREST)
-- This tells PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

-- Step 6: Alternative - Restart PostgREST (if NOTIFY doesn't work)
-- You may need to restart your Supabase project in the dashboard
-- Go to Settings → General → Restart Project

-- Verify the function exists
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'mark_conversation_as_read';

