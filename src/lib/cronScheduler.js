// Cron scheduler configuration for analytics processing
// This file contains the scheduling logic and helper functions

export const CRON_CONFIG = {
  // Run every hour at minute 0 (e.g., 1:00, 2:00, 3:00)
  ANALYTICS_HOURLY: '0 * * * *',
  
  // Alternative schedules you can use:
  ANALYTICS_DAILY: '0 0 * * *',      // Daily at midnight
  ANALYTICS_EVERY_30MIN: '0,30 * * * *', // Every 30 minutes
  ANALYTICS_EVERY_15MIN: '0,15,30,45 * * * *', // Every 15 minutes
}

// Helper function to get all active listings, users, and developments
export async function getAllActiveEntities() {
  const { supabaseAdmin } = await import('@/lib/supabase')
  
  try {
    // Get all active listings
    const { data: listings } = await supabaseAdmin
      .from('listings')
      .select('id')
      .eq('status', 'active')
    
    // Get all users from separate tables (developers, agents, property seekers)
    const user_ids = new Set()
    
    // Get developers
    const { data: developers } = await supabaseAdmin
      .from('developers')
      .select('developer_id')
    if (developers) {
      developers.forEach(dev => user_ids.add(dev.developer_id))
    }
    
    // Get agents
    const { data: agents } = await supabaseAdmin
      .from('agents')
      .select('agent_id, user_id')
    if (agents) {
      agents.forEach(agent => {
        if (agent.agent_id) user_ids.add(agent.agent_id)
        if (agent.user_id) user_ids.add(agent.user_id)
      })
    }
    
    // Get property seekers
    const { data: propertySeekers } = await supabaseAdmin
      .from('property_seekers')
      .select('user_id')
    if (propertySeekers) {
      propertySeekers.forEach(seeker => {
        if (seeker.user_id) user_ids.add(seeker.user_id)
      })
    }
    
    // Get all active developments
    const { data: developments } = await supabaseAdmin
      .from('developments')
      .select('id')
      .eq('development_status', 'active')
    
    return {
      listing_ids: listings?.map(l => l.id) || [],
      user_ids: Array.from(user_ids),
      development_ids: developments?.map(d => d.id) || []
    }
  } catch (error) {
    console.error('Error fetching active entities:', error)
    return {
      listing_ids: [],
      user_ids: [],
      development_ids: []
    }
  }
}

// Function to trigger analytics processing
export async function triggerAnalyticsProcessing(date = null) {
  try {
    const entities = await getAllActiveEntities()
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://iskapromos.vercel.app'}/api/cron/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'your-secret-key'}`
      },
      body: JSON.stringify({
        date: date || new Date().toISOString(),
        ...entities
      })
    })
    
    if (!response.ok) {
      throw new Error(`Analytics processing failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log('Analytics processing completed:', result)
    return result
  } catch (error) {
    console.error('Failed to trigger analytics processing:', error)
    throw error
  }
}

// Manual trigger function for testing
export async function manualAnalyticsTrigger() {
  console.log('Manually triggering analytics processing...')
  return await triggerAnalyticsProcessing()
}
