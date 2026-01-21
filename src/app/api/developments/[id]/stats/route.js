import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/apiPermissionMiddleware'

export async function GET(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    // Authenticate request
    const { userInfo, error: authError, status } = await authenticateRequest(request)
    
    if (authError) {
      return NextResponse.json({ error: authError }, { status })
    }

    // Must be developer organization
    if (userInfo.organization_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid organization type' }, { status: 403 })
    }

    // Get the actual developer's user_id from organization
    let actualDeveloperId = null
    
    if (userInfo.user_type === 'team_member') {
      const { data: developer } = await supabaseAdmin
        .from('developers')
        .select('developer_id')
        .eq('id', userInfo.organization_id)
        .single()
      
      if (!developer?.developer_id) {
        return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
      }
      
      actualDeveloperId = developer.developer_id
    } else {
      actualDeveloperId = userInfo.user_id
    }

    // Fetch the development to verify ownership
    const { data: development, error: devError } = await supabaseAdmin
      .from('developments')
      .select('developer_id, total_units')
      .eq('id', id)
      .single()

    if (devError) {
      return NextResponse.json(
        { error: 'Development not found' },
        { status: 404 }
      )
    }

    if (development.developer_id !== actualDeveloperId) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      )
    }

    // Count listings associated with this development
    const { count: listingsCount, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('development_id', id)
      .eq('account_type', 'developer')

    if (listingsError) {
      console.error('Error counting listings:', listingsError)
    }

    return NextResponse.json({
      success: true,
      data: {
        listingsCount: listingsCount || 0,
        totalUnits: development.total_units || 0
      }
    })

  } catch (error) {
    console.error('Get development stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
