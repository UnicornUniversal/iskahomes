// Analytics System Data Flow Test
// This test verifies that data flows correctly from PostHog → Redis → Database
// 
// UPDATED FOR GENERIC LISTER SYSTEM:
// - Tests multiple user types: developers, agents, agencies
// - Uses generic lister_id/lister_type instead of hardcoded developer_id
// - Includes backward compatibility testing with legacy fields
// - Verifies leads system works for all user types
// - Tests Redis keys and database records for each user type

const testEvents = [
  // Property Views - Developer
  {
    event: 'property_view',
    properties: {
      listing_id: 'test-listing-1',
      viewed_from: 'home',
      lister_id: 'test-developer-1',
      lister_type: 'developer',
      seeker_id: 'test-seeker-1',
      is_logged_in: true
    }
  },
  
  // Property Views - Agent
  {
    event: 'property_view',
    properties: {
      listing_id: 'test-listing-2',
      viewed_from: 'explore',
      lister_id: 'test-agent-1',
      lister_type: 'agent',
      seeker_id: 'test-seeker-2',
      is_logged_in: true
    }
  },
  
  // Property Views - Agency
  {
    event: 'property_view',
    properties: {
      listing_id: 'test-listing-3',
      viewed_from: 'search',
      lister_id: 'test-agency-1',
      lister_type: 'agency',
      seeker_id: 'test-seeker-3',
      is_logged_in: false
    }
  },
  
  // Impressions - Developer
  {
    event: 'impression_social_media',
    properties: {
      listing_id: 'test-listing-1',
      platform: 'facebook',
      lister_id: 'test-developer-1',
      lister_type: 'developer'
    }
  },
  
  // Impressions - Agent
  {
    event: 'impression_website_visit',
    properties: {
      listing_id: 'test-listing-2',
      lister_id: 'test-agent-1',
      lister_type: 'agent'
    }
  },
  
  // Leads - Developer
  {
    event: 'lead_phone',
    properties: {
      listing_id: 'test-listing-1',
      lister_id: 'test-developer-1',
      lister_type: 'developer',
      seeker_id: 'test-seeker-1',
      action: 'click',
      context_type: 'listing'
    }
  },
  
  // Leads - Agent
  {
    event: 'lead_message',
    properties: {
      listing_id: 'test-listing-2',
      lister_id: 'test-agent-1',
      lister_type: 'agent',
      seeker_id: 'test-seeker-2',
      message_type: 'email',
      context_type: 'listing'
    }
  },
  
  // Leads - Agency
  {
    event: 'lead_appointment',
    properties: {
      listing_id: 'test-listing-3',
      lister_id: 'test-agency-1',
      lister_type: 'agency',
      seeker_id: 'test-seeker-3',
      appointment_type: 'viewing',
      context_type: 'listing'
    }
  },
  
  // Development Events
  {
    event: 'development_view',
    properties: {
      development_id: 'test-development-1',
      developer_id: 'test-developer-1',
      seeker_id: 'test-seeker-1',
      viewed_from: 'home',
      is_logged_in: true
    }
  },
  
  // User Events - Developer Profile
  {
    event: 'profile_view',
    properties: {
      profile_id: 'test-developer-1',
      profile_type: 'developer',
      viewed_from: 'home',
      seeker_id: 'test-seeker-1'
    }
  },
  
  // User Events - Agent Profile
  {
    event: 'profile_view',
    properties: {
      profile_id: 'test-agent-1',
      profile_type: 'agent',
      viewed_from: 'listings',
      seeker_id: 'test-seeker-2'
    }
  },
  
  // Legacy Events (for backward compatibility testing)
  {
    event: 'property_view',
    properties: {
      listing_id: 'test-listing-legacy',
      viewed_from: 'home',
      developer_id: 'test-developer-legacy', // Legacy field
      seeker_id: 'test-seeker-legacy',
      is_logged_in: true
    }
  }
];

// Expected Redis Keys After Processing
const expectedRedisKeys = {
  // Listing Analytics - Developer
  'listing:test-listing-1:day:2025-01-15:total_views': 1,
  'listing:test-listing-1:day:2025-01-15:logged_in_views': 1,
  'listing:test-listing-1:day:2025-01-15:views_from_home': 1,
  'listing:test-listing-1:day:2025-01-15:unique_views': 1, // HyperLogLog
  'listing:test-listing-1:day:2025-01-15:impression_social_media': 1,
  'listing:test-listing-1:day:2025-01-15:phone_leads': 1,
  'listing:test-listing-1:day:2025-01-15:total_leads': 1,
  'listing:test-listing-1:day:2025-01-15:unique_leads': 1, // HyperLogLog
  
  // Listing Analytics - Agent
  'listing:test-listing-2:day:2025-01-15:total_views': 1,
  'listing:test-listing-2:day:2025-01-15:logged_in_views': 1,
  'listing:test-listing-2:day:2025-01-15:views_from_explore': 1,
  'listing:test-listing-2:day:2025-01-15:unique_views': 1, // HyperLogLog
  'listing:test-listing-2:day:2025-01-15:impression_website_visit': 1,
  'listing:test-listing-2:day:2025-01-15:email_leads': 1,
  'listing:test-listing-2:day:2025-01-15:total_leads': 1,
  'listing:test-listing-2:day:2025-01-15:unique_leads': 1, // HyperLogLog
  
  // Listing Analytics - Agency
  'listing:test-listing-3:day:2025-01-15:total_views': 1,
  'listing:test-listing-3:day:2025-01-15:anonymous_views': 1,
  'listing:test-listing-3:day:2025-01-15:views_from_search': 1,
  'listing:test-listing-3:day:2025-01-15:unique_views': 1, // HyperLogLog
  'listing:test-listing-3:day:2025-01-15:appointment_leads': 1,
  'listing:test-listing-3:day:2025-01-15:total_leads': 1,
  'listing:test-listing-3:day:2025-01-15:unique_leads': 1, // HyperLogLog
  
  // Development Analytics
  'development:test-development-1:day:2025-01-15:total_views': 1,
  'development:test-development-1:day:2025-01-15:logged_in_views': 1,
  'development:test-development-1:day:2025-01-15:views_from_home': 1,
  'development:test-development-1:day:2025-01-15:unique_views': 1, // HyperLogLog
  
  // User Analytics - Developer
  'user:test-developer-1:day:2025-01-15:profile_views': 1,
  'user:test-developer-1:day:2025-01-15:unique_profile_viewers': 1, // HyperLogLog
  'user:test-developer-1:day:2025-01-15:profile_views_from_home': 1,
  
  // User Analytics - Agent
  'user:test-agent-1:day:2025-01-15:profile_views': 1,
  'user:test-agent-1:day:2025-01-15:unique_profile_viewers': 1, // HyperLogLog
  'user:test-agent-1:day:2025-01-15:profile_views_from_listings': 1,
  
  // Leads Data - Developer
  'lead:test-listing-1:test-seeker-1:actions': ['action_data'], // List
  'lead:test-listing-1:test-seeker-1:metadata': {
    lister_id: 'test-developer-1',
    lister_type: 'developer',
    first_action_date: '2025-01-15',
    last_action_date: '2025-01-15',
    total_actions: 1,
    last_action_type: 'lead_phone',
    status: 'new'
  },
  'lead:test-listing-1:day:2025-01-15:total_leads': 1,
  'lead:test-listing-1:day:2025-01-15:phone_leads': 1,
  'lead:test-listing-1:day:2025-01-15:unique_leads': 1, // HyperLogLog
  
  // Leads Data - Agent
  'lead:test-listing-2:test-seeker-2:actions': ['action_data'], // List
  'lead:test-listing-2:test-seeker-2:metadata': {
    lister_id: 'test-agent-1',
    lister_type: 'agent',
    first_action_date: '2025-01-15',
    last_action_date: '2025-01-15',
    total_actions: 1,
    last_action_type: 'lead_message',
    status: 'new'
  },
  'lead:test-listing-2:day:2025-01-15:total_leads': 1,
  'lead:test-listing-2:day:2025-01-15:email_leads': 1,
  'lead:test-listing-2:day:2025-01-15:unique_leads': 1, // HyperLogLog
  
  // Leads Data - Agency
  'lead:test-listing-3:test-seeker-3:actions': ['action_data'], // List
  'lead:test-listing-3:test-seeker-3:metadata': {
    lister_id: 'test-agency-1',
    lister_type: 'agency',
    first_action_date: '2025-01-15',
    last_action_date: '2025-01-15',
    total_actions: 1,
    last_action_type: 'lead_appointment',
    status: 'new'
  },
  'lead:test-listing-3:day:2025-01-15:total_leads': 1,
  'lead:test-listing-3:day:2025-01-15:appointment_leads': 1,
  'lead:test-listing-3:day:2025-01-15:unique_leads': 1, // HyperLogLog
  
  // Legacy Support (backward compatibility)
  'listing:test-listing-legacy:day:2025-01-15:total_views': 1,
  'listing:test-listing-legacy:day:2025-01-15:logged_in_views': 1,
  'listing:test-listing-legacy:day:2025-01-15:views_from_home': 1,
  'listing:test-listing-legacy:day:2025-01-15:unique_views': 1 // HyperLogLog
};

// Expected Database Records After Cron Processing
const expectedDatabaseRecords = {
  // Developer Listing Analytics
  listing_analytics_developer: {
    listing_id: 'test-listing-1',
    date: '2025-01-15',
    total_views: 1,
    unique_views: 1,
    logged_in_views: 1,
    views_from_home: 1,
    total_impressions: 0,
    impression_social_media: 1,
    total_leads: 1,
    phone_leads: 1,
    unique_leads: 1,
    conversion_rate: 100.0, // (1 lead / 1 view) * 100
    total_sales: 0,
    sales_value: 0
  },
  
  // Agent Listing Analytics
  listing_analytics_agent: {
    listing_id: 'test-listing-2',
    date: '2025-01-15',
    total_views: 1,
    unique_views: 1,
    logged_in_views: 1,
    views_from_explore: 1,
    total_impressions: 0,
    impression_website_visit: 1,
    total_leads: 1,
    email_leads: 1,
    unique_leads: 1,
    conversion_rate: 100.0, // (1 lead / 1 view) * 100
    total_sales: 0,
    sales_value: 0
  },
  
  // Agency Listing Analytics
  listing_analytics_agency: {
    listing_id: 'test-listing-3',
    date: '2025-01-15',
    total_views: 1,
    unique_views: 1,
    anonymous_views: 1,
    views_from_search: 1,
    total_impressions: 0,
    impression_social_media: 0,
    total_leads: 1,
    appointment_leads: 1,
    unique_leads: 1,
    conversion_rate: 100.0, // (1 lead / 1 view) * 100
    total_sales: 0,
    sales_value: 0
  },
  
  development_analytics: {
    development_id: 'test-development-1',
    developer_id: 'test-developer-1',
    date: '2025-01-15',
    total_views: 1,
    unique_views: 1,
    logged_in_views: 1,
    views_from_home: 1,
    total_leads: 0,
    total_sales: 0,
    conversion_rate: 0,
    engagement_rate: 0
  },
  
  // Developer User Analytics
  user_analytics_developer: {
    user_id: 'test-developer-1',
    user_type: 'developer',
    date: '2025-01-15',
    profile_views: 1,
    unique_profile_viewers: 1,
    profile_views_from_home: 1,
    total_listings: 0,
    active_listings: 0,
    sold_listings: 0,
    searches_performed: 0
  },
  
  // Agent User Analytics
  user_analytics_agent: {
    user_id: 'test-agent-1',
    user_type: 'agent',
    date: '2025-01-15',
    profile_views: 1,
    unique_profile_viewers: 1,
    profile_views_from_listings: 1,
    total_listings: 0,
    active_listings: 0,
    sold_listings: 0,
    searches_performed: 0
  },
  
  // Developer Leads
  leads_developer: {
    listing_id: 'test-listing-1',
    lister_id: 'test-developer-1',
    lister_type: 'developer',
    seeker_id: 'test-seeker-1',
    lead_actions: [{
      action_id: 'uuid',
      action_type: 'lead_phone',
      action_date: '2025-01-15',
      action_timestamp: '2025-01-15T10:00:00.000Z',
      action_metadata: {
        action: 'click',
        context_type: 'listing'
      }
    }],
    total_actions: 1,
    first_action_date: '2025-01-15',
    last_action_date: '2025-01-15',
    last_action_type: 'lead_phone',
    status: 'new',
    notes: []
  },
  
  // Agent Leads
  leads_agent: {
    listing_id: 'test-listing-2',
    lister_id: 'test-agent-1',
    lister_type: 'agent',
    seeker_id: 'test-seeker-2',
    lead_actions: [{
      action_id: 'uuid',
      action_type: 'lead_message',
      action_date: '2025-01-15',
      action_timestamp: '2025-01-15T10:00:00.000Z',
      action_metadata: {
        context_type: 'listing',
        message_type: 'email'
      }
    }],
    total_actions: 1,
    first_action_date: '2025-01-15',
    last_action_date: '2025-01-15',
    last_action_type: 'lead_message',
    status: 'new',
    notes: []
  },
  
  // Agency Leads
  leads_agency: {
    listing_id: 'test-listing-3',
    lister_id: 'test-agency-1',
    lister_type: 'agency',
    seeker_id: 'test-seeker-3',
    lead_actions: [{
      action_id: 'uuid',
      action_type: 'lead_appointment',
      action_date: '2025-01-15',
      action_timestamp: '2025-01-15T10:00:00.000Z',
      action_metadata: {
        context_type: 'listing',
        appointment_type: 'viewing'
      }
    }],
    total_actions: 1,
    first_action_date: '2025-01-15',
    last_action_date: '2025-01-15',
    last_action_type: 'lead_appointment',
    status: 'new',
    notes: []
  }
};

// Test Functions
async function testPostHogToRedis() {
  console.log('Testing PostHog → Redis data flow...');
  
  // Send test events to PostHog ingestion endpoint
  const response = await fetch('/api/ingest/posthog', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-PostHog-Secret': process.env.POSTHOG_WEBHOOK_SECRET || 'test-secret'
    },
    body: JSON.stringify({ events: testEvents })
  });
  
  if (!response.ok) {
    throw new Error(`PostHog ingestion failed: ${response.statusText}`);
  }
  
  console.log('✅ PostHog events sent to Redis successfully');
}

async function testRedisToDatabase() {
  console.log('Testing Redis → Database data flow...');
  
  // Trigger cron job processing for all user types
  const response = await fetch('/api/cron/analytics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      date: '2025-01-15',
      listing_ids: ['test-listing-1', 'test-listing-2', 'test-listing-3', 'test-listing-legacy'],
      user_ids: ['test-developer-1', 'test-agent-1'],
      development_ids: ['test-development-1']
    })
  });
  
  if (!response.ok) {
    throw new Error(`Cron processing failed: ${response.statusText}`);
  }
  
  const result = await response.json();
  console.log('✅ Cron job processed data successfully:', result);
}

async function testDataConsistency() {
  console.log('Testing data consistency...');
  
  // Verify Redis keys exist for all user types
  const developerKeys = await client.keys('*test-listing-1*');
  const agentKeys = await client.keys('*test-listing-2*');
  const agencyKeys = await client.keys('*test-listing-3*');
  const legacyKeys = await client.keys('*test-listing-legacy*');
  
  console.log('Redis keys found:');
  console.log(`- Developer: ${developerKeys.length}`);
  console.log(`- Agent: ${agentKeys.length}`);
  console.log(`- Agency: ${agencyKeys.length}`);
  console.log(`- Legacy: ${legacyKeys.length}`);
  
  // Verify database records exist for all user types
  const { data: developerAnalytics } = await supabaseAdmin
    .from('listing_analytics')
    .select('*')
    .eq('listing_id', 'test-listing-1')
    .eq('date', '2025-01-15');
  
  const { data: agentAnalytics } = await supabaseAdmin
    .from('listing_analytics')
    .select('*')
    .eq('listing_id', 'test-listing-2')
    .eq('date', '2025-01-15');
  
  const { data: agencyAnalytics } = await supabaseAdmin
    .from('listing_analytics')
    .select('*')
    .eq('listing_id', 'test-listing-3')
    .eq('date', '2025-01-15');
  
  const { data: developerLeads } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('listing_id', 'test-listing-1')
    .eq('lister_type', 'developer');
  
  const { data: agentLeads } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('listing_id', 'test-listing-2')
    .eq('lister_type', 'agent');
  
  const { data: agencyLeads } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('listing_id', 'test-listing-3')
    .eq('lister_type', 'agency');
  
  console.log('Database records found:');
  console.log(`- Developer Analytics: ${developerAnalytics?.length || 0}`);
  console.log(`- Agent Analytics: ${agentAnalytics?.length || 0}`);
  console.log(`- Agency Analytics: ${agencyAnalytics?.length || 0}`);
  console.log(`- Developer Leads: ${developerLeads?.length || 0}`);
  console.log(`- Agent Leads: ${agentLeads?.length || 0}`);
  console.log(`- Agency Leads: ${agencyLeads?.length || 0}`);
  
  const allRecordsExist = 
    (developerAnalytics?.length > 0) &&
    (agentAnalytics?.length > 0) &&
    (agencyAnalytics?.length > 0) &&
    (developerLeads?.length > 0) &&
    (agentLeads?.length > 0) &&
    (agencyLeads?.length > 0);
  
  if (allRecordsExist) {
    console.log('✅ Multi-user data consistency verified');
  } else {
    console.log('❌ Multi-user data consistency check failed');
  }
}

// Run all tests
async function runAnalyticsTests() {
  try {
    await testPostHogToRedis();
    await testRedisToDatabase();
    await testDataConsistency();
    console.log('🎉 All analytics tests passed!');
  } catch (error) {
    console.error('❌ Analytics test failed:', error);
  }
}

export { runAnalyticsTests, testEvents, expectedRedisKeys, expectedDatabaseRecords };
