-- Add 'agency' to messaging user-type check constraints.
-- Without this, property seekers cannot message agencies (error 23514:
-- conversations_user2_type_check).

-- Conversations: user1_type
ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_user1_type_check;

ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_user1_type_check
  CHECK (user1_type IN (
    'property_seeker',
    'developer',
    'agent',
    'agency',
    'admin',
    'homeowner'
  ));

-- Conversations: user2_type
ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_user2_type_check;

ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_user2_type_check
  CHECK (user2_type IN (
    'property_seeker',
    'developer',
    'agent',
    'agency',
    'admin',
    'homeowner'
  ));

-- Messages: sender_type
ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_sender_type_check;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_sender_type_check
  CHECK (sender_type IN (
    'property_seeker',
    'developer',
    'agent',
    'agency',
    'admin',
    'homeowner',
    'system'
  ));

-- Verify constraints (run after migration):
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.conversations'::regclass
--   AND contype = 'c'
--   AND conname LIKE '%user%_type_check';
