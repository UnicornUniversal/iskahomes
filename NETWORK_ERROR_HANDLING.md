# Network Error Handling & Recovery

## 🔍 Current Network Error Scenarios

### **What Happens When Network Issues Occur?**

#### **1. During File Upload (Before Database Save)**

**Scenario**: User uploads files, but network fails during upload

**Current Behavior**:
- ✅ **Files NOT uploaded**: If a file upload fails, the entire request fails immediately
- ✅ **No orphaned files**: Failed uploads don't create files in storage
- ✅ **Error returned**: User gets error message with specific file that failed
- ❌ **No retry**: User must manually retry the entire operation
- ❌ **No partial success**: Even if some files succeed, operation fails

**Code Location**: `src/app/api/listings/route.js` lines 470-519

```javascript
// If any file upload fails, entire operation fails
try {
  const uploadedFile = await uploadFile(mediaFile, 'iskaHomes', 'property-media')
  mediaFiles.push(uploadedFile)
} catch (error) {
  // Returns error immediately - no cleanup needed
  return NextResponse.json(
    { error: `Failed to upload media file: ${error.message}` },
    { status: 500 }
  )
}
```

**Impact**: 
- ✅ **Good**: No orphaned files in storage
- ❌ **Bad**: User loses progress if last file fails after 10 successful uploads

---

#### **2. During Database Insert (After File Uploads)**

**Scenario**: Files upload successfully, but database insert fails

**Current Behavior**:
- ⚠️ **Files uploaded**: Files are already in Supabase Storage
- ❌ **Listing NOT created**: Database insert fails
- ❌ **No cleanup**: Uploaded files remain in storage (orphaned)
- ❌ **No rollback**: No mechanism to delete uploaded files

**Code Location**: `src/app/api/listings/route.js` lines 575-588

**Impact**:
- ❌ **Bad**: Storage costs increase (orphaned files)
- ❌ **Bad**: User must re-upload files on retry
- ❌ **Bad**: No way to recover or clean up

---

#### **3. During Social Amenities Image Download**

**Scenario**: Network fails while downloading images from Google Maps

**Current Behavior**:
- ✅ **Graceful failure**: Continues without image, saves amenity without `database_url`
- ✅ **Operation continues**: Listing is still created successfully
- ✅ **No blocking**: Error is logged but doesn't fail the request

**Code Location**: `src/app/api/listings/route.js` lines 607-626

```javascript
try {
  const databaseUrl = await downloadAndUploadImage(...)
  processedAmenity.database_url = databaseUrl
} catch (imageError) {
  // Continue without database_url if image download fails
  processedAmenity.database_url = null
}
```

**Impact**:
- ✅ **Good**: Listing is created successfully
- ⚠️ **Minor**: Amenity appears without image (can be fixed later)

---

#### **4. During Admin Analytics Update**

**Scenario**: Network fails while updating `admin_analytics` table

**Current Behavior**:
- ✅ **Graceful failure**: Error is caught and logged
- ✅ **Operation continues**: Listing is still created successfully
- ✅ **No blocking**: Analytics update doesn't fail the request

**Code Location**: `src/lib/adminAnalytics.js` lines 1-90

```javascript
try {
  // Update admin analytics
} catch (error) {
  console.error('Error in updateAdminAnalytics:', error)
  // Don't throw - analytics updates shouldn't block listing operations
}
```

**Impact**:
- ✅ **Good**: Listing is created successfully
- ⚠️ **Minor**: Analytics may be slightly out of sync (can be fixed by cron job)

---

#### **5. During Development Stats Update**

**Scenario**: Network fails while updating development stats

**Current Behavior**:
- ✅ **Graceful failure**: Error is caught and logged
- ✅ **Operation continues**: Listing is still created successfully
- ✅ **No blocking**: Stats update doesn't fail the request

**Code Location**: `src/app/api/listings/route.js` lines 94-144

**Impact**:
- ✅ **Good**: Listing is created successfully
- ⚠️ **Minor**: Development stats may be slightly out of sync

---

#### **6. Client-Side Network Error**

**Scenario**: User's browser loses connection during form submission

**Current Behavior**:
- ✅ **Error detected**: Frontend catches network errors
- ✅ **User notified**: Shows detailed error message
- ✅ **Progress reset**: Upload progress resets to 0
- ❌ **No retry mechanism**: User must manually retry
- ❌ **No resume**: If files were partially uploaded, must restart

**Code Location**: `src/app/components/propertyManagement/PropertyManagement.jsx` lines 957-982

**Impact**:
- ✅ **Good**: User knows what went wrong
- ❌ **Bad**: Must start over from beginning

---

## ⚠️ **Critical Issues**

### **1. Orphaned Files in Storage**

**Problem**: If database insert fails after file uploads succeed, files remain in storage forever.

**Current State**: ❌ **No cleanup mechanism**

**Impact**:
- Storage costs increase over time
- No way to identify or clean up orphaned files
- Storage quota may be reached unnecessarily

**Recommendation**: Implement cleanup mechanism:
```javascript
// After successful database insert
const uploadedFiles = [...mediaFiles, ...additionalFiles, model3dData]

// If database insert fails, clean up uploaded files
try {
  await supabase.from('listings').insert([listingData])
} catch (error) {
  // Clean up uploaded files
  for (const file of uploadedFiles) {
    await supabaseAdmin.storage
      .from('iskaHomes')
      .remove([file.path])
  }
  throw error
}
```

---

### **2. No Partial Success Handling**

**Problem**: If 9 out of 10 files upload successfully, but the 10th fails, all progress is lost.

**Current State**: ❌ **All-or-nothing approach**

**Impact**:
- User frustration (must re-upload all files)
- Wasted bandwidth
- Poor user experience

**Recommendation**: Implement partial success handling:
- Upload files individually
- Track which files succeeded
- Allow user to retry only failed files
- Or save partial progress and allow resume

---

### **3. No Retry Mechanism**

**Problem**: Network errors are transient, but there's no automatic retry.

**Current State**: ❌ **No retry logic**

**Impact**:
- User must manually retry
- Temporary network issues cause permanent failures
- Poor user experience

**Recommendation**: Implement exponential backoff retry:
```javascript
async function uploadWithRetry(file, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await uploadFile(file, folder, subfolder)
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }
}
```

---

### **4. No Transaction Safety**

**Problem**: Multiple operations (files, database, analytics) are not atomic.

**Current State**: ❌ **No transactions**

**Impact**:
- Partial success scenarios
- Data inconsistency
- Difficult to rollback

**Recommendation**: 
- Use database transactions where possible
- Implement two-phase commit pattern
- Or implement comprehensive cleanup on failure

---

## ✅ **What's Working Well**

1. **File Upload Failures**: Properly caught and reported
2. **Social Amenities**: Graceful degradation (continues without images)
3. **Admin Analytics**: Non-blocking (doesn't fail listing creation)
4. **Development Stats**: Non-blocking (doesn't fail listing creation)
5. **Client-Side Errors**: User-friendly error messages
6. **Currency Conversions**: Non-blocking (continues without conversions)

---

## 🔧 **Recommended Improvements**

### **Priority 1: Cleanup Orphaned Files**

Implement cleanup when database operations fail:

```javascript
// Track uploaded files
const uploadedFiles = []

try {
  // Upload files
  for (const file of files) {
    const uploaded = await uploadFile(file)
    uploadedFiles.push(uploaded)
  }
  
  // Insert into database
  const { data, error } = await supabase.from('listings').insert([listingData])
  
  if (error) {
    // Cleanup uploaded files
    await cleanupFiles(uploadedFiles)
    throw error
  }
} catch (error) {
  // Ensure cleanup even if error occurs
  await cleanupFiles(uploadedFiles)
  throw error
}
```

### **Priority 2: Retry Mechanism**

Add retry logic for transient network errors:

```javascript
async function uploadWithRetry(file, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await uploadFile(file)
    } catch (error) {
      if (attempt === retries) throw error
      await delay(Math.pow(2, attempt) * 1000) // Exponential backoff
    }
  }
}
```

### **Priority 3: Progress Persistence**

Save upload progress to localStorage:

```javascript
// Save progress
localStorage.setItem('upload_progress', JSON.stringify({
  files: uploadedFiles,
  listingData: propertyData,
  timestamp: Date.now()
}))

// On page reload, check for saved progress
const savedProgress = localStorage.getItem('upload_progress')
if (savedProgress) {
  // Offer to resume upload
}
```

### **Priority 4: Better Error Messages**

Provide actionable error messages:

```javascript
if (error.code === 'NETWORK_ERROR') {
  return 'Network connection lost. Please check your internet and try again.'
} else if (error.code === 'STORAGE_ERROR') {
  return 'File upload failed. Please try uploading smaller files or check your connection.'
} else if (error.code === 'DATABASE_ERROR') {
  return 'Failed to save listing. Your files were uploaded successfully. Please try again.'
}
```

---

## 📊 **Error Recovery Flow**

### **Current Flow (On Error)**:
```
1. Error occurs
2. Error returned to client
3. User sees error message
4. User must restart from beginning
```

### **Recommended Flow**:
```
1. Error occurs
2. Cleanup partial uploads (if any)
3. Save progress to localStorage
4. Return error with recovery options
5. User can:
   - Retry immediately
   - Resume from saved progress
   - Cancel and start over
```

---

## 🎯 **Summary**

**Current State**: Basic error handling, but no recovery mechanisms

**Key Issues**:
1. ❌ Orphaned files in storage
2. ❌ No retry mechanism
3. ❌ No partial success handling
4. ❌ No transaction safety

**What Works**:
1. ✅ Errors are caught and reported
2. ✅ Non-critical operations don't block listing creation
3. ✅ User-friendly error messages
4. ✅ No orphaned files if upload fails before database save

**Next Steps**:
1. Implement cleanup for orphaned files
2. Add retry mechanism for transient errors
3. Implement progress persistence
4. Add better error categorization

