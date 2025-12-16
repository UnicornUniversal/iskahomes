import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const type = searchParams.get('type')

    // Supabase automatically confirms emails when the link is clicked
    // We just need to find recently confirmed users and update their profiles
    // Get all users and find ones that were just confirmed (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('Error listing users:', listError)
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 500 }
      )
    }

    // Find users that were just confirmed (email_confirmed_at is recent)
    const recentlyConfirmedUsers = users.filter(user => {
      if (!user.email_confirmed_at) return false
      const confirmedAt = new Date(user.email_confirmed_at)
      const fiveMinAgo = new Date(fiveMinutesAgo)
      return confirmedAt > fiveMinAgo && !user.user_metadata?.profile_updated_after_verification
    })

    // If we have a token, try to find the specific user
    let targetUser = null
    if (token) {
      // Try to find user by checking if token matches (Supabase uses hash tokens)
      // For now, we'll update the most recently confirmed user
      targetUser = recentlyConfirmedUsers[0]
    } else {
      // No token, update the most recently confirmed user
      targetUser = recentlyConfirmedUsers[0]
    }

    if (!targetUser) {
      // If no recently confirmed user, check if user is already verified
      // This handles the case where user clicks the link again
      const verifiedUsers = users.filter(user => 
        user.email_confirmed_at && user.user_metadata?.user_type
      )
      
      if (verifiedUsers.length > 0) {
        // Update profile for already verified users
        for (const user of verifiedUsers) {
          await updateProfileStatus(user.id, user.user_metadata?.user_type, true)
        }
        return NextResponse.json({
          success: true,
          message: 'Email already verified. You can sign in.',
          alreadyVerified: true
        })
      }

      return NextResponse.json(
        { error: 'No recently confirmed user found. Please try clicking the verification link again.' },
        { status: 400 }
      )
    }

    // Update the profile status
    const userType = targetUser.user_metadata?.user_type
    await updateProfileStatus(targetUser.id, userType)

    // Mark that we've updated the profile
    await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      {
        user_metadata: {
          ...targetUser.user_metadata,
          profile_updated_after_verification: true
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now sign in.'
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Helper function to update profile status
async function updateProfileStatus(userId, userType, skipIfAlreadyVerified = false) {
  if (!userType) return

  let tableName = ''
  let idField = ''

  switch (userType) {
    case 'property_seeker':
      tableName = 'property_seekers'
      idField = 'user_id'
      break
    case 'developer':
      tableName = 'developers'
      idField = 'developer_id'
      break
    case 'agent':
      tableName = 'agents'
      idField = 'user_id'
      break
    default:
      return
  }

  // Check if already verified (if skipIfAlreadyVerified is true)
  if (skipIfAlreadyVerified) {
    const { data: existingProfile } = await supabaseAdmin
      .from(tableName)
      .select('is_verified, signup_status')
      .eq(idField, userId)
      .single()
    
    if (existingProfile?.is_verified && existingProfile?.signup_status === 'verified') {
      return // Already verified, skip update
    }
  }

  const updateData = {
    is_verified: true,
    email_verified_at: new Date().toISOString(),
    is_active: true,
    signup_status: 'verified',
    invitation_status: 'sent'
  }

  // Use account_status for developers, status for others
  if (tableName === 'developers') {
    updateData.account_status = 'active'
  } else {
    updateData.status = 'active'
  }

  const { error: profileUpdateError } = await supabaseAdmin
    .from(tableName)
    .update(updateData)
    .eq(idField, userId)

  if (profileUpdateError) {
    console.error('Error updating profile:', profileUpdateError)
    // Don't fail verification if profile update fails
  }
}

