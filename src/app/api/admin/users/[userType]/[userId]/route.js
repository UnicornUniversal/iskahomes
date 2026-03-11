import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/admin/users/[userType]/[userId]
 * Get single user - public info only
 * userType: developer | agent | agency | property_seeker
 * userId: developer_id | agent_id | agency_id | id (for property_seeker)
 */
export async function GET(request, { params }) {
  try {
    const { userType, userId } = await params

    const validTypes = ['developer', 'agent', 'agency', 'property_seeker']
    if (!validTypes.includes(userType)) {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const { tableName, idColumn } = getTableConfig(userType)
    const publicFields = getPublicFields(userType)

    const { data: user, error } = await supabaseAdmin
      .from(tableName)
      .select(publicFields)
      .eq(idColumn, userId)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User not found', details: error?.message }, { status: 404 })
    }

    // For agents, fetch agency name if they have agency_id
    if (userType === 'agent' && user.agency_id) {
      const { data: agency } = await supabaseAdmin
        .from('agencies')
        .select('name, slug')
        .eq('agency_id', user.agency_id)
        .single()
      if (agency) {
        user.agency = agency
      }
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('Admin user detail error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/users/[userType]/[userId]
 * Update user status and verification
 */
export async function PATCH(request, { params }) {
  try {
    const { userType, userId } = await params

    const validTypes = ['developer', 'agent', 'agency', 'property_seeker']
    if (!validTypes.includes(userType)) {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 })
    }

    const body = await request.json()
    const { account_status, verified, status, admin_status } = body

    const { tableName, idColumn } = getTableConfig(userType)

    const updateData = {}

    // When admin changes admin_status to 'approved', also set account_status/status to active
    if (admin_status !== undefined) {
      updateData.admin_status = admin_status
      if (admin_status === 'approved') {
        if (userType === 'property_seeker') {
          updateData.status = 'active'
        } else {
          updateData.account_status = 'active'
          updateData.verified = true
          if (userType === 'agent') updateData.agent_status = 'active'
        }
      } else if (admin_status === 'pending') {
        if (userType === 'property_seeker') {
          updateData.status = 'active' // property seekers stay active when pending
        } else {
          updateData.account_status = 'pending'
          updateData.verified = false
        }
      } else if (admin_status === 'suspended' || admin_status === 'unapproved') {
        if (userType === 'property_seeker') updateData.status = 'inactive'
        else {
          updateData.account_status = 'suspended'
          updateData.verified = false
        }
      } else if (admin_status === 'inactive') {
        if (userType === 'property_seeker') updateData.status = 'inactive'
        else updateData.account_status = 'inactive'
      }
    }

    // Legacy: still support direct account_status, status, verified updates
    if (userType === 'property_seeker') {
      if (status !== undefined) updateData.status = status
    } else {
      if (account_status !== undefined) updateData.account_status = account_status
      if (verified !== undefined) updateData.verified = verified
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from(tableName)
      .update(updateData)
      .eq(idColumn, userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

function getTableConfig(userType) {
  const configs = {
    developer: { tableName: 'developers', idColumn: 'developer_id' },
    agent: { tableName: 'agents', idColumn: 'agent_id' },
    agency: { tableName: 'agencies', idColumn: 'agency_id' },
    property_seeker: { tableName: 'property_seekers', idColumn: 'id' }
  }
  return configs[userType] || configs.developer
}

function getPublicFields(userType) {
  // Return all fields - use * for full profile data (registration_files, company_gallery, etc.)
  return '*'
}
