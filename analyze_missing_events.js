// Analysis script for missing events CSV
// Run with: node analyze_missing_events.js

const fs = require('fs');
const path = require('path');

// Read CSV file
const csvPath = path.join(__dirname, '../Downloads/export (3).csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV (simple parser - assumes no commas in quoted fields)
const lines = csvContent.split('\n');
const headers = lines[0].split(',');

console.log('📊 ANALYZING MISSING EVENTS CSV\n');
console.log('='.repeat(80));

// Parse data rows
const events = [];
for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  
  const values = lines[i].split(',');
  const event = {};
  headers.forEach((header, idx) => {
    event[header.trim()] = values[idx]?.trim() || '';
  });
  events.push(event);
}

console.log(`Total events in CSV: ${events.length}\n`);

// Analysis 1: Events by date and hour
console.log('1️⃣ EVENTS BY DATE AND HOUR');
console.log('-'.repeat(80));
const eventsByDateHour = {};
events.forEach(event => {
  const date = event.date;
  const hour = event.hour;
  const key = `${date}_${hour}`;
  if (!eventsByDateHour[key]) {
    eventsByDateHour[key] = {
      date,
      hour: parseInt(hour),
      count: 0,
      eventTypes: {},
      hasListerId: 0,
      hasListingId: 0,
      listerIds: new Set(),
      listingIds: new Set()
    };
  }
  eventsByDateHour[key].count++;
  eventsByDateHour[key].eventTypes[event.event] = (eventsByDateHour[key].eventTypes[event.event] || 0) + 1;
  
  if (event.lister_id || event.listerId || event.developer_id || event.developerId) {
    eventsByDateHour[key].hasListerId++;
  }
  if (event.listing_id || event.listingId) {
    eventsByDateHour[key].hasListingId++;
  }
  if (event.lister_id) eventsByDateHour[key].listerIds.add(event.lister_id);
  if (event.listing_id) eventsByDateHour[key].listingIds.add(event.listing_id);
});

// Sort by date and hour
const sortedKeys = Object.keys(eventsByDateHour).sort();
sortedKeys.forEach(key => {
  const data = eventsByDateHour[key];
  console.log(`${data.date} hour ${data.hour}: ${data.count} events`);
  console.log(`  - Has lister_id: ${data.hasListerId}/${data.count}`);
  console.log(`  - Has listing_id: ${data.hasListingId}/${data.count}`);
  console.log(`  - Unique lister_ids: ${Array.from(data.listerIds).join(', ') || 'NONE'}`);
  console.log(`  - Event types: ${Object.keys(data.eventTypes).join(', ')}`);
  console.log('');
});

// Analysis 2: User identification
console.log('\n2️⃣ USER IDENTIFICATION ANALYSIS');
console.log('-'.repeat(80));
const targetUserId = '2110cf0f-11c5-40a9-9a00-97bc581d2cee';
const eventsWithUserId = events.filter(e => 
  e.lister_id === targetUserId ||
  e.listerId === targetUserId ||
  e.developer_id === targetUserId ||
  e.developerId === targetUserId ||
  e.user_id === targetUserId ||
  e.userId === targetUserId ||
  e.distinct_id === targetUserId ||
  e.person_id === targetUserId
);

console.log(`Events matching user ID ${targetUserId}: ${eventsWithUserId.length}/${events.length}`);
console.log(`Events NOT matching user ID: ${events.length - eventsWithUserId.length}`);

// Check how events identify the user
const userIdentificationMethods = {
  lister_id: 0,
  listerId: 0,
  developer_id: 0,
  developerId: 0,
  user_id: 0,
  userId: 0,
  distinct_id: 0,
  person_id: 0
};

eventsWithUserId.forEach(event => {
  if (event.lister_id === targetUserId) userIdentificationMethods.lister_id++;
  if (event.listerId === targetUserId) userIdentificationMethods.listerId++;
  if (event.developer_id === targetUserId) userIdentificationMethods.developer_id++;
  if (event.developerId === targetUserId) userIdentificationMethods.developerId++;
  if (event.user_id === targetUserId) userIdentificationMethods.user_id++;
  if (event.userId === targetUserId) userIdentificationMethods.userId++;
  if (event.distinct_id === targetUserId) userIdentificationMethods.distinct_id++;
  if (event.person_id === targetUserId) userIdentificationMethods.person_id++;
});

console.log('\nUser identification methods:');
Object.entries(userIdentificationMethods).forEach(([method, count]) => {
  if (count > 0) {
    console.log(`  - ${method}: ${count} events`);
  }
});

// Analysis 3: Missing lister_id
console.log('\n3️⃣ EVENTS MISSING LISTER_ID');
console.log('-'.repeat(80));
const eventsWithoutListerId = events.filter(e => 
  !e.lister_id && 
  !e.listerId && 
  !e.developer_id && 
  !e.developerId && 
  !e.agent_id && 
  !e.agentId
);

console.log(`Events without lister_id/developer_id/agent_id: ${eventsWithoutListerId.length}/${events.length}`);

if (eventsWithoutListerId.length > 0) {
  console.log('\nSample events without lister_id:');
  eventsWithoutListerId.slice(0, 5).forEach((event, idx) => {
    console.log(`  ${idx + 1}. ${event.event} at ${event.date} ${event.hour}:00`);
    console.log(`     - listing_id: ${event.listing_id || 'NONE'}`);
    console.log(`     - distinct_id: ${event.distinct_id || 'NONE'}`);
  });
}

// Analysis 4: User type determination
console.log('\n4️⃣ USER TYPE ANALYSIS');
console.log('-'.repeat(80));
const userTypes = {};
eventsWithUserId.forEach(event => {
  const userType = event.lister_type || event.listerType || 'unknown';
  userTypes[userType] = (userTypes[userType] || 0) + 1;
});

console.log('User types found:');
Object.entries(userTypes).forEach(([type, count]) => {
  console.log(`  - ${type}: ${count} events`);
});

// Analysis 5: Expected user_analytics rows
console.log('\n5️⃣ EXPECTED USER_ANALYTICS ROWS');
console.log('-'.repeat(80));
console.log('Based on PRIMARY KEY constraint: (user_id, user_type, date, hour)');
console.log('Expected rows that SHOULD exist in database:\n');

const expectedRows = new Set();
eventsWithUserId.forEach(event => {
  const userId = event.lister_id || event.listerId || event.developer_id || event.developerId || targetUserId;
  const userType = event.lister_type || event.listerType || 'developer';
  const date = event.date;
  const hour = event.hour;
  
  const rowKey = `${userId}_${userType}_${date}_${hour}`;
  expectedRows.add(rowKey);
});

console.log(`Total unique (user_id, user_type, date, hour) combinations: ${expectedRows.size}`);
console.log('\nBreakdown by date:');
const rowsByDate = {};
Array.from(expectedRows).forEach(key => {
  const parts = key.split('_');
  const date = parts[2];
  if (!rowsByDate[date]) rowsByDate[date] = [];
  rowsByDate[date].push(key);
});

Object.keys(rowsByDate).sort().forEach(date => {
  console.log(`  ${date}: ${rowsByDate[date].length} unique hour combinations`);
  const hours = rowsByDate[date].map(key => {
    const parts = key.split('_');
    return parseInt(parts[3]);
  }).sort((a, b) => a - b);
  console.log(`    Hours: ${hours.join(', ')}`);
});

// Analysis 6: Potential issues
console.log('\n6️⃣ POTENTIAL ISSUES IDENTIFIED');
console.log('-'.repeat(80));

const issues = [];

if (eventsWithoutListerId.length > 0) {
  issues.push({
    severity: 'HIGH',
    issue: 'Events missing lister_id',
    count: eventsWithoutListerId.length,
    description: 'These events cannot be attributed to a user and will be skipped',
    solution: 'Cron should fetch lister_id from listings table using listing_id'
  });
}

if (eventsWithUserId.length < events.length) {
  issues.push({
    severity: 'MEDIUM',
    issue: 'Some events do not match target user',
    count: events.length - eventsWithUserId.length,
    description: 'These events might be for other users or have incorrect user identification',
    solution: 'Verify user matching logic in cron'
  });
}

const datesWithEvents = new Set(events.map(e => e.date));
if (datesWithEvents.size > 0) {
  issues.push({
    severity: 'HIGH',
    issue: 'Dates with events but no database entries',
    count: datesWithEvents.size,
    description: `These dates have events but no user_analytics rows: ${Array.from(datesWithEvents).sort().join(', ')}`,
    solution: 'Cron needs to process these dates - check if cron ran on these dates'
  });
}

issues.forEach((issue, idx) => {
  console.log(`\n${idx + 1}. [${issue.severity}] ${issue.issue}`);
  console.log(`   Count: ${issue.count}`);
  console.log(`   Description: ${issue.description}`);
  console.log(`   Solution: ${issue.solution}`);
});

console.log('\n' + '='.repeat(80));
console.log('✅ Analysis complete!');

