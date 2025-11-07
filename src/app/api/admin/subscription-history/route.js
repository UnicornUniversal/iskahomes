import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// GET - Fetch all subscription history (admin only)
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const userType = searchParams.get('user_type')
    const userId = searchParams.get('user_id')
    const eventType = searchParams.get('event_type')

    // Build query
    let query = supabaseAdmin
      .from('subscription_history')
      .select(`
        *,
        from_package:from_package_id (
          id,
          name
        ),
        to_package:to_package_id (
          id,
          name
        )
      `)

    // Apply filters
    if (userType) {
      query = query.eq('user_type', userType)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    // Order and execute
    const { data: history, error } = await query
      .order('event_date', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch subscription history', 
        details: error.message 
      }, { status: 500 })
    }

    // Fetch user information based on user_type and merge
    if (history && history.length > 0) {
      const historyWithUsers = await Promise.all(
        history.map(async (record) => {
          let userInfo = null

          try {
            if (record.user_type === 'developer') {
              const { data: developer } = await supabaseAdmin
                .from('developers')
                .select('id, name, profile_image, developer_id')
                .eq('developer_id', record.user_id)
                .single()
              
              if (developer) {
                userInfo = {
                  id: developer.id,
                  name: developer.name,
                  profile_image: developer.profile_image,
                  user_id: developer.developer_id
                }
              }
            } else if (record.user_type === 'agent') {
              const { data: agent } = await supabaseAdmin
                .from('agents')
                .select('id, name, profile_image, developer_id')
                .eq('developer_id', record.user_id)
                .single()
              
              if (agent) {
                userInfo = {
                  id: agent.id,
                  name: agent.name,
                  profile_image: agent.profile_image,
                  user_id: agent.developer_id
                }
              }
            } else if (record.user_type === 'agency') {
              const { data: agency } = await supabaseAdmin
                .from('agencies')
                .select('id, name, profile_image, developer_id')
                .eq('developer_id', record.user_id)
                .single()
              
              if (agency) {
                userInfo = {
                  id: agency.id,
                  name: agency.name,
                  profile_image: agency.profile_image,
                  user_id: agency.developer_id
                }
              }
            }
          } catch (err) {
            console.error(`Error fetching user info for ${record.user_type}:`, err)
          }

          return {
            ...record,
            user: userInfo
          }
        })
      )

      return NextResponse.json({ 
        success: true,
        data: historyWithUsers
      })
    }

    return NextResponse.json({ 
      success: true,
      data: history || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

