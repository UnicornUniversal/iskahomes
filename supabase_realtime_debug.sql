-- ============================================
-- SUPABASE REALTIME DEBUGGING SCRIPT
-- ============================================
-- Run this script in your Supabase SQL editor to check and fix real-time issues

-- 1. Check if real-time is enabled for messaging tables
SELECT 
  schemaname,
  tablename,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE tablename IN ('conversations', 'messages')
AND schemaname = 'public';

-- 2. Check publication status for real-time
SELECT 
  pubname,
  puballtables,
  pubinsert,
  pubupdate,
  pubdelete
FROM pg_publication 
WHERE pubname = 'supabase_realtime';

-- 3. Check which tables are included in the publication
SELECT 
  p.pubname,
  c.relname as table_name
FROM pg_publication p
JOIN pg_publication_rel pr ON p.oid = pr.prpubid
JOIN pg_class c ON pr.prrelid = c.oid
WHERE p.pubname = 'supabase_realtime'
AND c.relname IN ('conversations', 'messages');

-- 4. Enable real-time for conversations table (if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- 5. Enable real-time for messages table (if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 6. Check Row Level Security (RLS) policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('conversations', 'messages')
AND schemaname = 'public';

-- 7. Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('conversations', 'messages')
AND schemaname = 'public';

-- 8. Test real-time by inserting a test message (replace with actual IDs)
-- INSERT INTO messages (conversation_id, sender_id, sender_type, receiver_id, receiver_type, message_text, message_type)
-- VALUES ('your-conversation-id', 'your-user-id', 'developer', 'other-user-id', 'property_seeker', 'Test real-time message', 'text');

-- 9. Check for any triggers that might interfere
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('conversations', 'messages')
AND event_object_schema = 'public';

-- ============================================
-- COMMON ISSUES AND SOLUTIONS
-- ============================================

-- Issue 1: Real-time not enabled for tables
-- Solution: Run the ALTER PUBLICATION commands above

-- Issue 2: RLS blocking real-time events
-- Solution: Ensure RLS policies allow SELECT for authenticated users

-- Issue 3: Missing triggers
-- Solution: Supabase should automatically create triggers, but check if they exist

-- Issue 4: Authentication issues
-- Solution: Ensure JWT tokens are valid and user has proper permissions

-- ============================================
-- DEBUGGING STEPS FOR DEVELOPERS
-- ============================================

-- Step 1: Check browser console for these logs:
-- ✅ "Successfully subscribed to messages channel"
-- ✅ "Successfully subscribed to conversations channel"
-- ❌ "Channel subscription error" or "Channel subscription timed out"

-- Step 2: Check for real-time events in console:
-- ✅ "💬 Realtime message event:" when messages are sent
-- ❌ No real-time events appearing

-- Step 3: Test with two browser windows:
-- 1. Login as developer in Window 1
-- 2. Login as property seeker in Window 2
-- 3. Send message from property seeker
-- 4. Check if developer sees it instantly

-- Step 4: Check Supabase Dashboard:
-- 1. Go to Database → Replication
-- 2. Verify conversations and messages tables are enabled
-- 3. Check for any errors in the logs

-- ============================================
-- EMERGENCY FALLBACK (if real-time fails)
-- ============================================

-- If real-time continues to fail, you can temporarily add polling:
-- (This is NOT recommended for production, but can help debug)

-- Add this to Conversation.jsx as a fallback:
-- const [realtimeFailed, setRealtimeFailed] = useState(false);
-- 
-- useEffect(() => {
--   if (realtimeFailed) {
--     const interval = setInterval(fetchMessages, 2000); // Poll every 2 seconds
--     return () => clearInterval(interval);
--   }
-- }, [realtimeFailed]);

-- And modify the subscription callback:
-- .subscribe((status) => {
--   if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
--     console.error('Real-time failed, falling back to polling');
--     setRealtimeFailed(true);
--   }
-- });
