# 🔧 Real-Time Messaging Troubleshooting Guide

## 🚨 **Issue: Developer Not Receiving Messages in Real-Time**

### **Symptoms:**
- Property seeker sends message
- Developer doesn't see it until page refresh
- Messages work but not in real-time
- Console shows subscription errors

---

## 🔍 **Step 1: Check Browser Console**

Open Developer Tools (F12) and look for these logs:

### ✅ **Good Signs:**
```
✅ Successfully subscribed to messages channel
✅ Successfully subscribed to conversations channel
💬 Realtime message event: {eventType: "INSERT", new: {...}}
📨 New message received: {...}
```

### ❌ **Bad Signs:**
```
❌ Channel subscription error
⏰ Channel subscription timed out
🔒 Channel subscription closed
```

---

## 🔍 **Step 2: Check Supabase Dashboard**

1. **Go to Supabase Dashboard** → **Database** → **Replication**
2. **Verify these tables are enabled:**
   - ✅ `conversations` table
   - ✅ `messages` table

3. **If not enabled, run this SQL:**
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
   ALTER PUBLICATION supabase_realtime ADD TABLE messages;
   ```

---

## 🔍 **Step 3: Check Authentication**

### **Verify JWT Tokens:**
1. Open browser console
2. Check if tokens exist:
   ```javascript
   console.log('Developer Token:', localStorage.getItem('developer_token'));
   console.log('Property Seeker Token:', localStorage.getItem('property_seeker_token'));
   ```

### **Check Token Validity:**
- Tokens should not be expired
- Tokens should contain correct user information
- User should be properly authenticated

---

## 🔍 **Step 4: Test Real-Time Connection**

### **Manual Test:**
1. **Open two browser windows**
2. **Window 1:** Login as Developer
3. **Window 2:** Login as Property Seeker
4. **Send message from Property Seeker**
5. **Check if Developer sees it instantly**

### **Expected Behavior:**
- Message appears instantly in Developer's chat
- No page refresh needed
- Console shows real-time events

---

## 🔧 **Common Fixes**

### **Fix 1: Enable Real-Time Tables**
```sql
-- Run in Supabase SQL Editor
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### **Fix 2: Check Row Level Security (RLS)**
```sql
-- Check if RLS is blocking real-time
SELECT * FROM pg_policies 
WHERE tablename IN ('conversations', 'messages');
```

### **Fix 3: Verify Supabase Configuration**
Check your `.env` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### **Fix 4: Clear Browser Cache**
1. **Hard refresh:** `Ctrl + Shift + R`
2. **Clear localStorage:** 
   ```javascript
   localStorage.clear();
   ```
3. **Re-login** and test again

---

## 🚨 **Emergency Fallback**

If real-time continues to fail, temporarily add polling:

```javascript
// Add to Conversation.jsx as emergency fallback
const [realtimeFailed, setRealtimeFailed] = useState(false);

useEffect(() => {
  if (realtimeFailed) {
    console.log('🔄 Real-time failed, using polling fallback');
    const interval = setInterval(fetchMessages, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }
}, [realtimeFailed]);

// Modify subscription callback
.subscribe((status) => {
  if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
    console.error('❌ Real-time failed, falling back to polling');
    setRealtimeFailed(true);
  }
});
```

---

## 📊 **Debug Information to Collect**

When reporting issues, include:

1. **Browser Console Logs:**
   - Subscription status messages
   - Any error messages
   - Real-time event logs

2. **Supabase Dashboard:**
   - Replication settings screenshot
   - Any error logs

3. **Network Tab:**
   - Failed requests
   - Authentication errors

4. **Environment:**
   - Browser type and version
   - Supabase project URL
   - User types involved

---

## 🎯 **Quick Diagnostic Commands**

### **Check Real-Time Status:**
```javascript
// Run in browser console
console.log('Supabase Client:', supabase);
console.log('Current User:', supabase.auth.getUser());
```

### **Test Channel Subscription:**
```javascript
// Test subscription manually
const testChannel = supabase
  .channel('test-channel')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'messages'
  }, (payload) => {
    console.log('Test payload:', payload);
  })
  .subscribe((status) => {
    console.log('Test subscription status:', status);
  });
```

---

## ✅ **Success Indicators**

When real-time is working correctly, you should see:

1. **Console Logs:**
   ```
   ✅ Successfully subscribed to messages channel
   💬 Realtime message event: {eventType: "INSERT"}
   📨 New message received: {...}
   ```

2. **User Experience:**
   - Messages appear instantly
   - No page refresh needed
   - Smooth real-time updates

3. **Performance:**
   - No unnecessary API calls
   - Low database load
   - Fast message delivery

---

## 🆘 **Still Not Working?**

If real-time messaging still doesn't work:

1. **Check Supabase Status:** [status.supabase.com](https://status.supabase.com)
2. **Review Documentation:** [supabase.com/docs/guides/realtime](https://supabase.com/docs/guides/realtime)
3. **Contact Support:** Include debug information from above

**Remember:** Real-time messaging requires proper Supabase configuration and authentication. The enhanced debugging logs will help identify the exact issue.
