# Messaging System - Overview

## 📋 **Simple Two-Table Design**

### **1. `conversations` table**
- Stores conversation between **two users** (one-to-one)
- Tracks both users with their `id` and `user_type`
- Keeps unread counts per user
- Stores last message preview
- Links to listings/developments/units

### **2. `messages` table**
- Individual messages within conversations
- Has sender and receiver info (both `id` and `user_type`)
- Supports text, images, files, etc.
- Tracks read status per message

---

## 🎯 **Key Features**

✅ **One-to-One Conversations** - Each conversation has exactly 2 participants  
✅ **User Type Flexibility** - Supports property_seeker, developer, agent, admin  
✅ **Unread Counts** - Per-user unread message tracking  
✅ **Context Aware** - Links to specific listings/developments/units  
✅ **Read Receipts** - Tracks when messages are read  
✅ **Real-time Ready** - Optimized for live updates  
✅ **Message Types** - Text, images, files, audio, video, location  

---

## 📊 **Table Structure**

### **conversations**
```
- id (UUID)
- user1_id, user1_type
- user2_id, user2_type
- listing_id, development_id, unit_id (optional context)
- conversation_type (listing_inquiry, general, etc.)
- status (active, archived, closed)
- last_message_at, last_message_text
- user1_unread_count, user2_unread_count
- user1_last_read_at, user2_last_read_at
- subject, metadata
- created_at, updated_at
```

### **messages**
```
- id (UUID)
- conversation_id
- sender_id, sender_type
- receiver_id, receiver_type
- message_text, message_type
- attachments (JSONB array)
- is_read, read_at
- is_edited, edited_at
- is_deleted, deleted_at
- reply_to_message_id
- metadata
- created_at, updated_at
```

---

## 🔧 **Helper Functions**

### 1. **find_or_create_conversation()**
Finds existing conversation or creates a new one between two users.

```sql
SELECT find_or_create_conversation(
  'property-seeker-id'::UUID,
  'property_seeker',
  'developer-id'::UUID,
  'developer',
  'listing-id'::UUID,  -- optional
  NULL,                 -- development_id
  NULL,                 -- unit_id
  'listing_inquiry',
  'Inquiry about Modern Villa'
);
```

### 2. **mark_conversation_as_read()**
Marks all messages in a conversation as read for a specific user.

```sql
SELECT mark_conversation_as_read(
  'conversation-id'::UUID,
  'user-id'::UUID,
  'property_seeker'
);
```

### 3. **get_total_unread_count()**
Gets total unread message count across all conversations for a user.

```sql
SELECT get_total_unread_count(
  'user-id'::UUID,
  'property_seeker'
);
```

---

## 💬 **Common Use Cases**

### **1. Property Seeker Messages Developer about Listing**
```javascript
// Frontend flow:
1. Property seeker clicks "Message Developer" on listing
2. Call API: POST /api/conversations
   Body: {
     user1_id: seeker_id,
     user1_type: 'property_seeker',
     user2_id: developer_id,
     user2_type: 'developer',
     listing_id: listing_id,
     conversation_type: 'listing_inquiry',
     first_message: "I'm interested in this property"
   }
3. Backend: find_or_create_conversation() → returns conversation_id
4. Backend: Insert first message
5. Return conversation_id to frontend
6. Redirect to /messages/{conversation_id}
```

### **2. Get All Conversations for a User**
```javascript
// API: GET /api/conversations?user_id={id}&user_type={type}

// Returns list of conversations with:
// - Other user's info
// - Last message preview
// - Unread count
// - Listing/development context
```

### **3. Get Messages in a Conversation**
```javascript
// API: GET /api/messages?conversation_id={id}

// Returns all messages with:
// - Sender info
// - Message content
// - Read status
// - Timestamps
```

### **4. Send a Message**
```javascript
// API: POST /api/messages
Body: {
  conversation_id: '...',
  sender_id: '...',
  sender_type: 'property_seeker',
  receiver_id: '...',
  receiver_type: 'developer',
  message_text: 'Hello!',
  message_type: 'text'
}

// Trigger automatically:
// - Updates conversation.last_message_at
// - Increments receiver's unread count
// - Updates last_message_text preview
```

---

## 🚀 **Integration with PostHog Analytics**

Track these events:

```javascript
// When user sends a message
analytics.trackLead('message', {
  conversation_id,
  listing_id,
  developer_id,
  message_type: 'text'
})

// When user clicks phone number
analytics.trackLead('phone', {
  clicked_from: 'conversation',
  recipient_type: 'developer'
})

// When appointment booked from conversation
analytics.trackLead('appointment', {
  conversation_id,
  listing_id
})
```

---

## 🎨 **Frontend Components Needed**

### 1. **Conversations List** (`/messages`)
- Shows all conversations for logged-in user
- Displays other user's name, avatar
- Shows last message preview
- Shows unread count badge
- Sorts by last_message_at

### 2. **Conversation View** (`/messages/{conversation_id}`)
- Shows all messages in conversation
- Displays listing/development context at top
- Input field for new messages
- File upload for attachments
- Real-time message updates

### 3. **Message Composer**
- Text input with emoji support
- File/image attachment
- Send button
- Character count (optional)

### 4. **Unread Badge**
- Shows in navigation
- Updates in real-time
- Fetches from get_total_unread_count()

---

## 🔔 **Real-time Updates (Optional)**

Use Supabase Realtime to listen for new messages:

```javascript
// Subscribe to new messages in a conversation
const channel = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    },
    (payload) => {
      // Add new message to UI
      addMessageToChat(payload.new)
    }
  )
  .subscribe()
```

---

## 📝 **API Endpoints to Create**

1. **POST /api/conversations** - Create/find conversation
2. **GET /api/conversations** - List user's conversations
3. **GET /api/conversations/[id]** - Get conversation details
4. **PUT /api/conversations/[id]/read** - Mark as read
5. **POST /api/messages** - Send message
6. **GET /api/messages** - Get messages in conversation
7. **PUT /api/messages/[id]** - Edit message
8. **DELETE /api/messages/[id]** - Delete message
9. **GET /api/conversations/unread-count** - Get total unread

---

## ✅ **Next Steps**

1. ✅ Run the SQL schema (`create_messaging_tables.sql`)
2. ⏳ Create API routes for conversations
3. ⏳ Create API routes for messages
4. ⏳ Build frontend components
5. ⏳ Integrate with existing pages (listing details, profiles)
6. ⏳ Add real-time updates (optional)
7. ⏳ Add notifications (email/push)

---

**Ready to implement! The schema is clean, simple, and scalable.** 🚀

