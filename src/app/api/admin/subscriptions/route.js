import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// GET - Fetch all subscriptions (admin only)
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
    const status = searchParams.get('status')
    const userType = searchParams.get('user_type')
    const userId = searchParams.get('user_id')

    // Build query
    let query = supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        subscriptions_package:package_id (
          id,
          name,
          description,
          local_currency_price,
          international_currency_price,
          duration,
          span,
          ideal_duration
        )
      `)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (userType) {
      query = query.eq('user_type', userType)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }

    // Order and execute
    const { data: subscriptions, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch subscriptions', 
        details: error.message 
      }, { status: 500 })
    }

    // Fetch user information based on user_type and merge
    if (subscriptions && subscriptions.length > 0) {
      const subscriptionsWithUsers = await Promise.all(
        subscriptions.map(async (subscription) => {
          let userInfo = null

          try {
            if (subscription.user_type === 'developer') {
              const { data: developer } = await supabaseAdmin
                .from('developers')
                .select('id, name, profile_image, developer_id')
                .eq('developer_id', subscription.user_id)
                .single()
              
              if (developer) {
                userInfo = {
                  id: developer.id,
                  name: developer.name,
                  profile_image: developer.profile_image,
                  user_id: developer.developer_id
                }
              }
            } else if (subscription.user_type === 'agent') {
              // For agents, user_id matches developer_id (auth user ID)
              const { data: agent } = await supabaseAdmin
                .from('agents')
                .select('id, name, profile_image, developer_id')
                .eq('developer_id', subscription.user_id)
                .single()
              
              if (agent) {
                userInfo = {
                  id: agent.id,
                  name: agent.name,
                  profile_image: agent.profile_image,
                  user_id: agent.developer_id
                }
              }
            } else if (subscription.user_type === 'agency') {
              // For agencies, user_id matches developer_id (auth user ID)
              const { data: agency } = await supabaseAdmin
                .from('agencies')
                .select('id, name, profile_image, developer_id')
                .eq('developer_id', subscription.user_id)
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
            console.error(`Error fetching user info for ${subscription.user_type}:`, err)
          }

          return {
            ...subscription,
            user: userInfo
          }
        })
      )

      return NextResponse.json({ 
        success: true,
        data: subscriptionsWithUsers
      })
    }

    return NextResponse.json({ 
      success: true,
      data: subscriptions || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

