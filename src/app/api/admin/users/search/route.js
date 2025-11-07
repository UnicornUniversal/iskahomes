import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// GET - Search for users (developers, agents, agencies) by ID or name
export async function GET(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const userType = searchParams.get('user_type') || 'all' // 'developer', 'agent', 'agency', or 'all'

    if (!search || search.length < 2) {
      return NextResponse.json({ 
        success: true,
        data: [] 
      })
    }

    const results = []

    // Search developers
    // Searches by developer_id (auth user ID) or name (company name field)
    if (userType === 'all' || userType === 'developer') {
      // Check if search looks like a UUID (contains hyphens and is long enough)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search.trim())
      
      let developers = []
      let devError = null
      
      if (isUUID) {
        // For UUID, search by exact match on developer_id
        const { data, error } = await supabaseAdmin
          .from('developers')
          .select('id, developer_id, name, email, slug')
          .eq('developer_id', search.trim())
          .limit(10)
        developers = data || []
        devError = error
      } else {
        // For text search, search by name only (can't use ilike on UUID without casting)
        const { data, error } = await supabaseAdmin
          .from('developers')
          .select('id, developer_id, name, email, slug')
          .ilike('name', `%${search}%`)
          .limit(10)
        developers = data || []
        devError = error
      }

      if (devError) {
        console.error('Error searching developers:', devError)
      }

      if (!devError && developers) {
        developers.forEach(dev => {
          results.push({
            id: dev.developer_id, // Use developer_id (auth user ID) for subscriptions
            name: dev.name,
            email: dev.email,
            user_type: 'developer',
            slug: dev.slug
          })
        })
      }
    }

    // Search agents
    if (userType === 'all' || userType === 'agent') {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search.trim())
      
      let agents = []
      let agentError = null
      
      if (isUUID) {
        const { data, error } = await supabaseAdmin
          .from('agents')
          .select('id, developer_id, name, email, slug')
          .eq('developer_id', search.trim())
          .limit(10)
        agents = data || []
        agentError = error
      } else {
        const { data, error } = await supabaseAdmin
          .from('agents')
          .select('id, developer_id, name, email, slug')
          .ilike('name', `%${search}%`)
          .limit(10)
        agents = data || []
        agentError = error
      }

      if (!agentError && agents) {
        agents.forEach(agent => {
          results.push({
            id: agent.developer_id, // Use developer_id (auth user ID) for subscriptions
            name: agent.name,
            email: agent.email,
            user_type: 'agent',
            slug: agent.slug
          })
        })
      }
    }

    // Search agencies
    if (userType === 'all' || userType === 'agency') {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search.trim())
      
      let agencies = []
      let agencyError = null
      
      if (isUUID) {
        const { data, error } = await supabaseAdmin
          .from('agencies')
          .select('id, developer_id, name, email, slug')
          .eq('developer_id', search.trim())
          .limit(10)
        agencies = data || []
        agencyError = error
      } else {
        const { data, error } = await supabaseAdmin
          .from('agencies')
          .select('id, developer_id, name, email, slug')
          .ilike('name', `%${search}%`)
          .limit(10)
        agencies = data || []
        agencyError = error
      }

      if (!agencyError && agencies) {
        agencies.forEach(agency => {
          results.push({
            id: agency.developer_id, // Use developer_id (auth user ID) for subscriptions
            name: agency.name,
            email: agency.email,
            user_type: 'agency',
            slug: agency.slug
          })
        })
      }
    }

    return NextResponse.json({ 
      success: true,
      data: results 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

