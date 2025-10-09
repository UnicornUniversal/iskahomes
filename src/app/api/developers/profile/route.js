import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// GET - Fetch developer profile
export async function GET(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded || decoded.user_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid token or user type' }, { status: 401 })
    }

    // Get developer profile
    const { data: developer, error } = await supabaseAdmin
      .from('developers')
      .select('*')
      .eq('developer_id', decoded.user_id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch developer profile', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: developer
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

// PUT - Update developer profile
export async function PUT(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded || decoded.user_type !== 'developer') {
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
          // Upload directly to Supabase storage
          const fileName = `profile-${Date.now()}-${profileImageFile.name}`
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('iskaHomes')
            .upload(`profile-images/${fileName}`, profileImageFile)

          if (uploadError) {
            console.error('Profile image upload error:', uploadError)
            return NextResponse.json({ error: 'Failed to upload profile image' }, { status: 500 })
          }

          // Get public URL
          const { data: urlData } = supabaseAdmin.storage
            .from('iskaHomes')
            .getPublicUrl(`profile-images/${fileName}`)

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
          // Upload directly to Supabase storage
          const fileName = `cover-${Date.now()}-${coverImageFile.name}`
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('iskaHomes')
            .upload(`cover-images/${fileName}`, coverImageFile)

          if (uploadError) {
            console.error('Cover image upload error:', uploadError)
            return NextResponse.json({ error: 'Failed to upload cover image' }, { status: 500 })
          }

          // Get public URL
          const { data: urlData } = supabaseAdmin.storage
            .from('iskaHomes')
            .getPublicUrl(`cover-images/${fileName}`)

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

      // Handle registration files upload
      const registrationFiles = formData.getAll('registrationFiles')
      if (registrationFiles && registrationFiles.length > 0) {
        const fileUploads = registrationFiles.filter(file => file instanceof File)
        if (fileUploads.length > 0) {
          try {
            const uploadPromises = fileUploads.map(async (file) => {
              const fileName = `doc-${Date.now()}-${file.name}`
              const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                .from('iskaHomes')
                .upload(`registration-documents/${fileName}`, file)

              if (uploadError) {
                throw uploadError
              }

              const { data: urlData } = supabaseAdmin.storage
                .from('iskaHomes')
                .getPublicUrl(`registration-documents/${fileName}`)

              return {
                id: uploadData.id,
                url: urlData.publicUrl,
                name: file.name,
                path: uploadData.path,
                size: file.size,
                type: file.type,
                uploaded_at: new Date().toISOString()
              }
            })

            profileData.registration_files = await Promise.all(uploadPromises)
          } catch (error) {
            console.error('Registration files upload error:', error)
            return NextResponse.json({ error: 'Failed to upload registration files' }, { status: 500 })
          }
        }
      }
    } else {
      // Handle JSON data
      profileData = await request.json()
    }

    // Update developer profile
    const { data: updatedDeveloper, error: updateError } = await supabaseAdmin
      .from('developers')
      .update(profileData)
      .eq('developer_id', decoded.user_id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update developer profile', 
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: updatedDeveloper,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}
