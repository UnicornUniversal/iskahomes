# Analytics Cron Fail-Safe & Monitoring Plan

## Overview
This document outlines fail-safe mechanisms, error tracking, resume points, and monitoring for the PostHog-based analytics cron job.

---

## 🎯 Key Problems to Solve

1. **Server Shutdown/Error**: What if cron crashes mid-execution?
2. **Resume Point**: Where do we continue from after a failure?
3. **Duplicate Prevention**: How to avoid processing same events twice?
4. **Error Tracking**: How to monitor and debug failures?
5. **Data Integrity**: How to ensure no data loss?
6. **PostHog API Issues**: What if PostHog API is down or rate-limited?

---

## 📊 Solution: Status Tracking Table

### **Table: `analytics_cron_status`**

```sql
CREATE TABLE analytics_cron_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Run Identification
  run_id UUID NOT NULL UNIQUE,              -- Unique identifier for each cron run
  run_type VARCHAR(20) DEFAULT 'scheduled',  -- 'scheduled', 'manual', 'recovery'
  
  -- Status Tracking
  status VARCHAR(20) NOT NULL,               -- 'running', 'completed', 'failed', 'partial'
  status_message TEXT,                      -- Human-readable status message
  
  -- Time Range Being Processed
  start_time TIMESTAMP NOT NULL,            -- Start of time range to fetch from PostHog
  end_time TIMESTAMP NOT NULL,              -- End of time range to fetch from PostHog
  target_date DATE NOT NULL,                -- Target date for aggregation (YYYY-MM-DD)
  
  -- Progress Tracking
  last_processed_event_timestamp TIMESTAMP, -- Last event timestamp processed (for resume)
  last_processed_event_id VARCHAR(255),     -- Last PostHog event ID processed (for cursor)
  events_processed INTEGER DEFAULT 0,       -- Count of events processed so far
  events_fetched INTEGER DEFAULT 0,         -- Total events fetched from PostHog
  
  -- Processing Stats
  listings_processed INTEGER DEFAULT 0,
  users_processed INTEGER DEFAULT 0,
  developments_processed INTEGER DEFAULT 0,
  leads_processed INTEGER DEFAULT 0,
  
  -- Database Write Stats
  listings_inserted INTEGER DEFAULT 0,
  users_inserted INTEGER DEFAULT 0,
  developments_inserted INTEGER DEFAULT 0,
  leads_inserted INTEGER DEFAULT 0,
  
  -- Error Tracking
  error_count INTEGER DEFAULT 0,
  last_error TEXT,                          -- Last error message
  error_details JSONB,                     -- Detailed error information
  
  -- Timing
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_seconds INTEGER,                 -- Calculated: completed_at - started_at
  
  -- PostHog API Stats
  posthog_api_calls INTEGER DEFAULT 0,      -- Number of API calls made
  posthog_api_errors INTEGER DEFAULT 0,     -- API errors encountered
  posthog_rate_limit_hit BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',              -- Additional run metadata
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('running', 'completed', 'failed', 'partial', 'cancelled')),
  CONSTRAINT valid_run_type CHECK (run_type IN ('scheduled', 'manual', 'recovery', 'retry'))
);

-- Indexes for efficient querying
CREATE INDEX idx_cron_status_status ON analytics_cron_status(status);
CREATE INDEX idx_cron_status_target_date ON analytics_cron_status(target_date);
CREATE INDEX idx_cron_status_started_at ON analytics_cron_status(started_at DESC);
CREATE INDEX idx_cron_status_run_type ON analytics_cron_status(run_type);

-- Composite index for finding incomplete runs
CREATE INDEX idx_cron_status_incomplete ON analytics_cron_status(status, started_at DESC) 
WHERE status IN ('running', 'failed', 'partial');
```

---

## 🔄 Fail-Safe Mechanisms

### **1. Idempotency & Resume Points**

#### **Strategy A: Time-Based Windows (Recommended)**
- Process events in **1-hour windows**
- Store `last_successful_end_time` in status table
- Next run starts from `last_successful_end_time`
- **Overlap protection**: Only process events once per hour window

#### **Strategy B: Event Cursor (For Large Datasets)**
- Store `last_processed_event_id` from PostHog
- Use PostHog's cursor-based pagination
- Resume from last cursor position

#### **Implementation:**
```javascript
// Get last successful run
const lastRun = await getLastSuccessfulRun()

// Calculate start time (with overlap protection)
const startTime = lastRun 
  ? new Date(lastRun.end_time)  // Continue from last successful end
  : new Date(Date.now() - 60 * 60 * 1000) // Default: 1 hour ago

const endTime = new Date() // Current time

// Create new run record
const runId = crypto.randomUUID()
await createRunRecord({
  run_id: runId,
  status: 'running',
  start_time: startTime,
  end_time: endTime,
  target_date: formatDate(endTime)
})
```

---

### **2. Checkpoint System**

#### **Checkpoint During Long Runs**
For runs that process many events, save progress periodically:

```javascript
// Process events in batches
let processedCount = 0
let lastProcessedTimestamp = null
let lastProcessedEventId = null

for (const event of events) {
  // Process event
  await processEvent(event)
  
  processedCount++
  lastProcessedTimestamp = event.timestamp
  lastProcessedEventId = event.id
  
  // Checkpoint every 1000 events
  if (processedCount % 1000 === 0) {
    await updateRunProgress(runId, {
      events_processed: processedCount,
      last_processed_event_timestamp: lastProcessedTimestamp,
      last_processed_event_id: lastProcessedEventId
    })
  }
}
```

---

### **3. Error Handling & Retry Logic**

#### **Error Categories:**
1. **Transient Errors** (retry):
   - PostHog API rate limit
   - Network timeouts
   - Database connection errors

2. **Permanent Errors** (log & skip):
   - Invalid event data
   - Missing required properties
   - Database constraint violations

#### **Retry Strategy:**
```javascript
async function fetchEventsWithRetry(startTime, endTime, maxRetries = 3) {
  let attempts = 0
  let lastError = null
  
  while (attempts < maxRetries) {
    try {
      const events = await fetchPostHogEvents(startTime, endTime)
      return { success: true, events }
    } catch (error) {
      lastError = error
      attempts++
      
      // Log error
      await logError(runId, error, attempts)
      
      // Exponential backoff
      const delay = Math.pow(2, attempts) * 1000 // 2s, 4s, 8s
      await sleep(delay)
    }
  }
  
  return { success: false, error: lastError }
}
```

---

### **4. Transaction Safety**

#### **Database Writes in Transactions**
- Use database transactions for atomic writes
- If transaction fails, rollback entire batch
- Retry failed transactions

```javascript
// Wrap database writes in transaction
await supabaseAdmin.rpc('process_analytics_batch', {
  listing_rows: listingRows,
  user_rows: userRows,
  development_rows: developmentRows,
  lead_rows: leadRows
})
```

---

### **5. Duplicate Prevention**

#### **Idempotency Keys**
- Use `(listing_id, date)` composite key for listings
- Use `(user_id, user_type, date)` for users
- Use `(listing_id, seeker_id)` for leads
- Database `ON CONFLICT` handles duplicates automatically

#### **Event Deduplication**
- Track processed event IDs in current run
- Skip events already processed in this run
- PostHog events have unique IDs/timestamps

```javascript
const processedEventIds = new Set()

for (const event of events) {
  // Skip if already processed in this run
  if (processedEventIds.has(event.id)) {
    continue
  }
  
  await processEvent(event)
  processedEventIds.add(event.id)
}
```

---

### **6. Recovery Mechanism**

#### **Automatic Recovery on Next Run**
```javascript
export async function POST(request) {
  // 1. Check for incomplete runs
  const incompleteRuns = await getIncompleteRuns()
  
  // 2. If found, resume from last checkpoint
  if (incompleteRuns.length > 0) {
    const latestIncomplete = incompleteRuns[0]
    
    // Resume from last processed point
    return await resumeRun(latestIncomplete.run_id, {
      start_time: latestIncomplete.last_processed_event_timestamp || latestIncomplete.start_time,
      end_time: new Date()
    })
  }
  
  // 3. Otherwise, start new run
  return await startNewRun()
}
```

---

## 📋 Status Tracking Implementation

### **Helper Functions**

```javascript
// Create new run record
async function createRunRecord(data) {
  const { data: run, error } = await supabaseAdmin
    .from('analytics_cron_status')
    .insert({
      run_id: data.run_id || crypto.randomUUID(),
      status: 'running',
      start_time: data.start_time,
      end_time: data.end_time,
      target_date: data.target_date,
      started_at: new Date().toISOString(),
      ...data
    })
    .select()
    .single()
  
  if (error) throw error
  return run
}

// Update run progress
async function updateRunProgress(runId, updates) {
  const { error } = await supabaseAdmin
    .from('analytics_cron_status')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('run_id', runId)
  
  if (error) throw error
}

// Mark run as completed
async function completeRun(runId, stats) {
  const { error } = await supabaseAdmin
    .from('analytics_cron_status')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      duration_seconds: Math.floor((new Date() - new Date(stats.started_at)) / 1000),
      ...stats
    })
    .eq('run_id', runId)
  
  if (error) throw error
}

// Mark run as failed
async function failRun(runId, error) {
  const { error: updateError } = await supabaseAdmin
    .from('analytics_cron_status')
    .update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      last_error: error.message,
      error_details: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      },
      error_count: supabaseAdmin.raw('error_count + 1')
    })
    .eq('run_id', runId)
  
  if (updateError) throw updateError
}

// Get last successful run
async function getLastSuccessfulRun() {
  const { data, error } = await supabaseAdmin
    .from('analytics_cron_status')
    .select('*')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
  return data
}

// Get incomplete runs
async function getIncompleteRuns() {
  const { data, error } = await supabaseAdmin
    .from('analytics_cron_status')
    .select('*')
    .in('status', ['running', 'failed', 'partial'])
    .order('started_at', { ascending: false })
  
  if (error) throw error
  return data || []
}
```

---

## 🚨 Monitoring & Alerts

### **Health Checks**

#### **1. Check for Stuck Runs**
```sql
-- Find runs that have been "running" for more than 2 hours
SELECT * FROM analytics_cron_status
WHERE status = 'running'
  AND started_at < NOW() - INTERVAL '2 hours';
```

#### **2. Check for Failed Runs**
```sql
-- Find recent failed runs
SELECT * FROM analytics_cron_status
WHERE status = 'failed'
  AND started_at > NOW() - INTERVAL '24 hours'
ORDER BY started_at DESC;
```

#### **3. Check for Missing Runs**
```sql
-- Check if cron hasn't run in last 2 hours
SELECT 
  MAX(completed_at) as last_successful_run,
  NOW() - MAX(completed_at) as time_since_last_run
FROM analytics_cron_status
WHERE status = 'completed';
```

### **Alert Conditions**

1. **Stuck Run**: Run in "running" status for > 2 hours
2. **Failed Run**: Status = "failed"
3. **Missing Run**: No successful run in last 2 hours
4. **High Error Rate**: Error count > threshold
5. **PostHog API Issues**: Rate limit hit or high API errors

---

## 🔍 Error Logging Table (Optional)

### **Table: `analytics_cron_errors`**

```sql
CREATE TABLE analytics_cron_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES analytics_cron_status(run_id),
  error_type VARCHAR(50),              -- 'api_error', 'processing_error', 'database_error'
  error_message TEXT,
  error_details JSONB,
  event_id VARCHAR(255),               -- PostHog event ID if error during event processing
  event_data JSONB,                    -- Event data that caused error
  occurred_at TIMESTAMP DEFAULT NOW(),
  
  -- Index for querying
  INDEX idx_cron_errors_run_id ON analytics_cron_errors(run_id),
  INDEX idx_cron_errors_occurred_at ON analytics_cron_errors(occurred_at DESC)
);
```

---

## 📊 Cron Job Flow with Fail-Safes

```javascript
export async function POST(request) {
  const runId = crypto.randomUUID()
  let runRecord = null
  
  try {
    // 1. Check for incomplete runs and recover if needed
    const incompleteRuns = await getIncompleteRuns()
    if (incompleteRuns.length > 0) {
      console.log(`⚠️ Found ${incompleteRuns.length} incomplete runs. Recovering...`)
      await recoverIncompleteRuns(incompleteRuns)
    }
    
    // 2. Get last successful run to determine start time
    const lastRun = await getLastSuccessfulRun()
    const startTime = lastRun 
      ? new Date(lastRun.end_time)
      : new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
    
    const endTime = new Date()
    const targetDate = formatDate(endTime)
    
    // 3. Create run record
    runRecord = await createRunRecord({
      run_id: runId,
      start_time: startTime,
      end_time: endTime,
      target_date: targetDate,
      run_type: 'scheduled'
    })
    
    // 4. Fetch events from PostHog with retry
    const { success, events, error } = await fetchEventsWithRetry(startTime, endTime)
    
    if (!success) {
      throw new Error(`Failed to fetch events: ${error.message}`)
    }
    
    // Update progress
    await updateRunProgress(runId, {
      events_fetched: events.length,
      posthog_api_calls: 1
    })
    
    // 5. Process events in batches with checkpointing
    const processedStats = await processEventsWithCheckpoints(runId, events, {
      checkpointInterval: 1000 // Checkpoint every 1000 events
    })
    
    // 6. Write to database
    const writeStats = await writeAnalyticsToDatabase(processedStats)
    
    // 7. Mark run as completed
    await completeRun(runId, {
      ...runRecord,
      events_processed: processedStats.eventsProcessed,
      listings_processed: processedStats.listingsCount,
      users_processed: processedStats.usersCount,
      developments_processed: processedStats.developmentsCount,
      leads_processed: processedStats.leadsCount,
      listings_inserted: writeStats.listings,
      users_inserted: writeStats.users,
      developments_inserted: writeStats.developments,
      leads_inserted: writeStats.leads
    })
    
    return NextResponse.json({
      success: true,
      run_id: runId,
      stats: writeStats
    })
    
  } catch (error) {
    console.error('Cron job failed:', error)
    
    // Mark run as failed
    if (runRecord) {
      await failRun(runId, error)
    }
    
    // Log error details
    await logError(runId, error)
    
    // Return error response
    return NextResponse.json({
      success: false,
      error: error.message,
      run_id: runId
    }, { status: 500 })
  }
}
```

---

## 🛡️ Additional Fail-Safes

### **1. Time Window Overlap Protection**
- Process events in fixed 1-hour windows
- Prevent processing same events multiple times
- Use `target_date` to group events

### **2. PostHog API Rate Limiting**
- Track API calls per run
- Implement exponential backoff
- Store rate limit status in run record

### **3. Database Connection Pooling**
- Use connection pooling for Supabase
- Handle connection errors gracefully
- Retry database operations

### **4. Data Validation**
- Validate event structure before processing
- Skip invalid events (log them)
- Ensure required properties exist

### **5. Dead Letter Queue (Optional)**
- Store events that failed to process
- Allow manual review/retry
- Separate table: `analytics_failed_events`

---

## 📈 Monitoring Dashboard Queries

### **Recent Run Status**
```sql
SELECT 
  run_id,
  status,
  target_date,
  events_processed,
  listings_inserted,
  started_at,
  completed_at,
  duration_seconds
FROM analytics_cron_status
ORDER BY started_at DESC
LIMIT 10;
```

### **Error Rate**
```sql
SELECT 
  DATE(started_at) as date,
  COUNT(*) as total_runs,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_runs,
  ROUND(100.0 * SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) / COUNT(*), 2) as error_rate_percent
FROM analytics_cron_status
WHERE started_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(started_at)
ORDER BY date DESC;
```

### **Processing Performance**
```sql
SELECT 
  AVG(duration_seconds) as avg_duration_seconds,
  AVG(events_processed) as avg_events_per_run,
  AVG(listings_inserted) as avg_listings_per_run
FROM analytics_cron_status
WHERE status = 'completed'
  AND started_at > NOW() - INTERVAL '7 days';
```

---

## ✅ Implementation Checklist

- [ ] Create `analytics_cron_status` table
- [ ] Create helper functions (createRunRecord, updateRunProgress, etc.)
- [ ] Implement resume point logic (getLastSuccessfulRun)
- [ ] Add checkpoint system for long runs
- [ ] Implement retry logic with exponential backoff
- [ ] Add error logging
- [ ] Add duplicate prevention
- [ ] Create monitoring queries
- [ ] Add health check endpoint
- [ ] Set up alerts for stuck/failed runs
- [ ] Test recovery mechanism
- [ ] Document run types and statuses

---

## 🎯 Summary

**Key Fail-Safes:**
1. ✅ **Status Table** - Track every run with full details
2. ✅ **Resume Points** - Continue from last successful end time
3. ✅ **Checkpointing** - Save progress during long runs
4. ✅ **Retry Logic** - Handle transient errors
5. ✅ **Idempotency** - Database constraints prevent duplicates
6. ✅ **Error Tracking** - Log all errors for debugging
7. ✅ **Recovery** - Auto-resume incomplete runs
8. ✅ **Monitoring** - Query status and health checks

This ensures **no data loss**, **automatic recovery**, and **full visibility** into cron job health.

