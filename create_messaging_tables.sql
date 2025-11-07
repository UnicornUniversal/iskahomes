-- =============================================
-- SIMPLIFIED MESSAGING SYSTEM FOR ISKA HOMES
-- =============================================
-- Two tables: conversations and messages
-- Supports: Property Seekers, Developers, Agents, Admins
-- =============================================

-- =============================================
-- 1. CONVERSATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Participants (exactly 2 users in a conversation)
  user1_id UUID NOT NULL,
  user1_type TEXT NOT NULL CHECK (user1_type IN (
    'property_seeker',
    'developer',
    'agent',
    'admin',
    'homeowner'
  )),
  
  user2_id UUID NOT NULL,
  user2_type TEXT NOT NULL CHECK (user2_type IN (
    'property_seeker',
    'developer',
    'agent',
    'admin',
    'homeowner'
  )),
  
  -- Context Information (what is this conversation about?)
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
  
  -- Conversation Type
  conversation_type TEXT NOT NULL DEFAULT 'general_inquiry' CHECK (conversation_type IN (
    'listing_inquiry',      -- About a specific listing
    'general_inquiry',      -- General question
    'appointment_related',  -- Related to an appointment
    'support',             -- Customer support
    'business'             -- Business-to-business
  )),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
  
  -- Last Activity (for sorting conversations)
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_text TEXT, -- Preview of last message
  last_message_sender_id UUID, -- Who sent the last message
  last_message_sender_type TEXT,
  
  -- Unread Counts (per user)
  user1_unread_count INTEGER DEFAULT 0,
  user2_unread_count INTEGER DEFAULT 0,
  
  -- Last Read Timestamps
  user1_last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user2_last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Subject/Title
  subject TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique conversation per user pair (prevents duplicates)
  CONSTRAINT unique_conversation UNIQUE (user1_id, user1_type, user2_id, user2_type)
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id, user1_type);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id, user2_type);
CREATE INDEX IF NOT EXISTS idx_conversations_listing ON conversations(listing_id);
CREATE INDEX IF NOT EXISTS idx_conversations_development ON conversations(development_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

-- Composite index for finding conversations by user
CREATE INDEX IF NOT EXISTS idx_conversations_by_user ON conversations(user1_id, user1_type, user2_id, user2_type);

-- =============================================
-- 2. MESSAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Sender Info
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN (
    'property_seeker',
    'developer',
    'agent',
    'admin',
    'homeowner',
    'system' -- For automated messages
  )),
  
  -- Receiver Info (for quick queries)
  receiver_id UUID NOT NULL,
  receiver_type TEXT NOT NULL,
  
  -- Message Content
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN (
    'text',
    'image',
    'file',
    'audio',
    'video',
    'location',
    'system' -- System notifications
  )),
  
  -- Attachments
  attachments JSONB DEFAULT '[]',
  -- Example: [{"url": "https://...", "type": "image", "name": "file.jpg", "size": 1024}]
  
  -- Message Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Reply Support
  reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id, receiver_type);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_messages_reply ON messages(reply_to_message_id);

-- =============================================
-- 3. TRIGGERS
-- =============================================

-- Update conversation.updated_at on any change
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- Update conversation when new message is added
CREATE OR REPLACE FUNCTION update_conversation_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_text = LEFT(NEW.message_text, 100),
    last_message_sender_id = NEW.sender_id,
    last_message_sender_type = NEW.sender_type,
    updated_at = NOW(),
    -- Increment unread count for receiver
    user1_unread_count = CASE 
      WHEN user1_id = NEW.receiver_id AND user1_type = NEW.receiver_type 
      THEN user1_unread_count + 1 
      ELSE user1_unread_count 
    END,
    user2_unread_count = CASE 
      WHEN user2_id = NEW.receiver_id AND user2_type = NEW.receiver_type 
      THEN user2_unread_count + 1 
      ELSE user2_unread_count 
    END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_new_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_on_new_message();

-- Update message timestamp on edit
CREATE OR REPLACE FUNCTION update_message_on_edit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_edited = TRUE AND OLD.is_edited = FALSE THEN
    NEW.edited_at = NOW();
  END IF;
  IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
    NEW.deleted_at = NOW();
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_message_on_edit
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_message_on_edit();

-- =============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can only see their own conversations
CREATE POLICY "Users can view their own conversations"
ON conversations FOR SELECT
USING (
  (user1_id = auth.uid()) OR (user2_id = auth.uid())
);

CREATE POLICY "Users can create conversations they're part of"
ON conversations FOR INSERT
WITH CHECK (
  (user1_id = auth.uid()) OR (user2_id = auth.uid())
);

CREATE POLICY "Users can update their own conversations"
ON conversations FOR UPDATE
USING (
  (user1_id = auth.uid()) OR (user2_id = auth.uid())
);

-- Messages: Users can only see messages in their conversations
CREATE POLICY "Users can view their own messages"
ON messages FOR SELECT
USING (
  sender_id = auth.uid() OR receiver_id = auth.uid()
);

CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
);

CREATE POLICY "Users can update their own messages"
ON messages FOR UPDATE
USING (
  sender_id = auth.uid()
);

CREATE POLICY "Users can delete their own messages"
ON messages FOR DELETE
USING (
  sender_id = auth.uid()
);

-- =============================================
-- 5. HELPER FUNCTIONS
-- =============================================

-- Function to find or create a conversation between two users
CREATE OR REPLACE FUNCTION find_or_create_conversation(
  p_user1_id UUID,
  p_user1_type TEXT,
  p_user2_id UUID,
  p_user2_type TEXT,
  p_listing_id UUID DEFAULT NULL,
  p_development_id UUID DEFAULT NULL,
  p_conversation_type TEXT DEFAULT 'general_inquiry',
  p_subject TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Try to find existing conversation (check both directions)
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE (
    (user1_id = p_user1_id AND user1_type = p_user1_type AND 
     user2_id = p_user2_id AND user2_type = p_user2_type)
    OR
    (user1_id = p_user2_id AND user1_type = p_user2_type AND 
     user2_id = p_user1_id AND user2_type = p_user1_type)
  )
  AND status != 'closed'
  LIMIT 1;
  
  -- If not found, create new conversation
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (
      user1_id,
      user1_type,
      user2_id,
      user2_type,
      listing_id,
      development_id,
      conversation_type,
      subject
    ) VALUES (
      p_user1_id,
      p_user1_type,
      p_user2_id,
      p_user2_type,
      p_listing_id,
      p_development_id,
      p_conversation_type,
      p_subject
    )
    RETURNING id INTO v_conversation_id;
  END IF;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_as_read(
  p_conversation_id UUID,
  p_user_id UUID,
  p_user_type TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Update conversation unread count and last_read_at
  UPDATE conversations
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
  UPDATE messages
  SET 
    is_read = TRUE,
    read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND receiver_id = p_user_id
    AND receiver_type = p_user_type
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get total unread count for a user
CREATE OR REPLACE FUNCTION get_total_unread_count(
  p_user_id UUID,
  p_user_type TEXT
)
RETURNS INTEGER AS $$
DECLARE
  total_unread INTEGER;
BEGIN
  SELECT COALESCE(
    SUM(
      CASE 
        WHEN user1_id = p_user_id AND user1_type = p_user_type THEN user1_unread_count
        WHEN user2_id = p_user_id AND user2_type = p_user_type THEN user2_unread_count
        ELSE 0
      END
    ), 0
  )
  INTO total_unread
  FROM conversations
  WHERE (user1_id = p_user_id AND user1_type = p_user_type)
     OR (user2_id = p_user_id AND user2_type = p_user_type);
  
  RETURN total_unread;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6. SAMPLE QUERIES (FOR REFERENCE)
-- =============================================

-- Get all conversations for a user
/*
SELECT 
  c.*,
  CASE 
    WHEN c.user1_id = 'current-user-id' THEN c.user2_unread_count
    WHEN c.user2_id = 'current-user-id' THEN c.user1_unread_count
  END as my_unread_count,
  CASE 
    WHEN c.user1_id = 'current-user-id' THEN c.user2_id
    WHEN c.user2_id = 'current-user-id' THEN c.user1_id
  END as other_user_id,
  CASE 
    WHEN c.user1_id = 'current-user-id' THEN c.user2_type
    WHEN c.user2_id = 'current-user-id' THEN c.user1_type
  END as other_user_type
FROM conversations c
WHERE (c.user1_id = 'current-user-id' AND c.user1_type = 'property_seeker')
   OR (c.user2_id = 'current-user-id' AND c.user2_type = 'property_seeker')
ORDER BY c.last_message_at DESC;
*/

-- Get all messages in a conversation
/*
SELECT 
  m.*
FROM messages m
WHERE m.conversation_id = 'conversation-id'
  AND m.is_deleted = FALSE
ORDER BY m.created_at ASC;
*/

-- Send a message
/*
INSERT INTO messages (
  conversation_id,
  sender_id,
  sender_type,
  receiver_id,
  receiver_type,
  message_text,
  message_type
) VALUES (
  'conversation-id',
  'sender-id',
  'property_seeker',
  'receiver-id',
  'developer',
  'Hello, I am interested in this property',
  'text'
);
*/

-- Mark conversation as read
/*
SELECT mark_conversation_as_read('conversation-id', 'user-id', 'property_seeker');
*/

-- Get total unread count
/*
SELECT get_total_unread_count('user-id', 'property_seeker');
*/

-- Find or create conversation
/*
SELECT find_or_create_conversation(
  'user1-id'::UUID,
  'property_seeker',
  'user2-id'::UUID,
  'developer',
  'listing-id'::UUID,
  NULL,
  'listing_inquiry',
  'Inquiry about Modern Villa'
);
*/

-- =============================================
-- END OF SCHEMA
-- =============================================
