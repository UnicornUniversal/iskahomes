import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// GET - Fetch agent's own profile
export async function GET(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded || decoded.user_type !== 'agent') {
      return NextResponse.json({ error: 'Invalid token or user type' }, { status: 401 })
    }

    // Fetch agent profile
    const { data: agent, error } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('agent_id', decoded.user_id)
      .single()

    if (error || !agent) {
      console.error('Error fetching agent profile:', error)
      return NextResponse.json(
        { error: 'Agent profile not found' },
        { status: 404 }
      )
    }

    // Fetch agency to get company_locations
    const { data: agency, error: agencyError } = await supabaseAdmin
      .from('agencies')
      .select('company_locations, name, slug')
      .eq('agency_id', agent.agency_id)
      .single()

    // If agent has location_id, find the location in agency's company_locations
    if (agent.location_id && agency?.company_locations) {
      const location = Array.isArray(agency.company_locations)
        ? agency.company_locations.find(loc => loc.id === agent.location_id)
        : null
      
      if (location) {
        agent.location_data = location
      }
    }

    // Add agency info
    if (agency) {
      agent.agency_name = agency.name
      agent.agency_slug = agency.slug
    }

    return NextResponse.json({
      success: true,
      data: agent
    })
  } catch (error) {
    console.error('Error in GET /api/agents/profile:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update agent's own profile
export async function PUT(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded || decoded.user_type !== 'agent') {
      return NextResponse.json({ error: 'Invalid token or user type' }, { status: 401 })
    }

    // Check if request is multipart/form-data (file uploads)
    const contentType = request.headers.get('content-type')
    let profileData

    if (contentType && contentType.includes('multipart/form-data')) {
      // Handle file uploads
      const formData = await request.formData()
      const jsonData = formData.get('data')
      
      if (!jsonData) {
        return NextResponse.json({ error: 'Profile data is required' }, { status: 400 })
      }

      profileData = JSON.parse(jsonData)

      // Handle profile image upload
      const profileImageFile = formData.get('profileImage')
      if (profileImageFile && profileImageFile instanceof File) {
        try {
          const fileName = `agent-profile-${Date.now()}-${profileImageFile.name}`
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('iskaHomes')
            .upload(`agent-profiles/${fileName}`, profileImageFile)

          if (uploadError) {
            console.error('Profile image upload error:', uploadError)
            return NextResponse.json({ error: 'Failed to upload profile image' }, { status: 500 })
          }

          const { data: urlData } = supabaseAdmin.storage
            .from('iskaHomes')
            .getPublicUrl(`agent-profiles/${fileName}`)

          profileData.profile_image = {
            id: uploadData.id,
            url: urlData.publicUrl,
            name: profileImageFile.name,
            path: uploadData.path,
            size: profileImageFile.size,
            type: profileImageFile.type,
            uploaded_at: new Date().toISOString()
          }
        } catch (error) {
          console.error('Profile image upload error:', error)
          return NextResponse.json({ error: 'Failed to upload profile image' }, { status: 500 })
        }
      }

      // Handle cover image upload
      const coverImageFile = formData.get('coverImage')
      if (coverImageFile && coverImageFile instanceof File) {
        try {
          const fileName = `agent-cover-${Date.now()}-${coverImageFile.name}`
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('iskaHomes')
            .upload(`agent-covers/${fileName}`, coverImageFile)

          if (uploadError) {
            console.error('Cover image upload error:', uploadError)
            return NextResponse.json({ error: 'Failed to upload cover image' }, { status: 500 })
          }

          const { data: urlData } = supabaseAdmin.storage
            .from('iskaHomes')
            .getPublicUrl(`agent-covers/${fileName}`)

          profileData.cover_image = {
            id: uploadData.id,
            url: urlData.publicUrl,
            name: coverImageFile.name,
            path: uploadData.path,
            size: coverImageFile.size,
            type: coverImageFile.type,
            uploaded_at: new Date().toISOString()
          }
        } catch (error) {
          console.error('Cover image upload error:', error)
          return NextResponse.json({ error: 'Failed to upload cover image' }, { status: 500 })
        }
      }
    } else {
      // Regular JSON request
      profileData = await request.json()
    }

    // Parse JSONB fields if they're strings
    if (profileData.achievements && typeof profileData.achievements === 'string') {
      try {
        profileData.achievements = JSON.parse(profileData.achievements)
      } catch (e) {
        profileData.achievements = []
      }
    }

    if (profileData.languages && typeof profileData.languages === 'string') {
      try {
        profileData.languages = JSON.parse(profileData.languages)
      } catch (e) {
        profileData.languages = []
      }
    }

    if (profileData.social_media && typeof profileData.social_media === 'string') {
      try {
        profileData.social_media = JSON.parse(profileData.social_media)
      } catch (e) {
        profileData.social_media = {}
      }
    }

    // Update updated_at timestamp
    profileData.updated_at = new Date().toISOString()

    // Update agent profile
    const { data: updatedAgent, error: updateError } = await supabaseAdmin
      .from('agents')
      .update(profileData)
      .eq('agent_id', decoded.user_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating agent profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedAgent
    })
  } catch (error) {
    console.error('Error in PUT /api/agents/profile:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

