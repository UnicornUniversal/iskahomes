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

    // Map company_locations to locations for frontend compatibility
    if (developer.company_locations) {
      developer.locations = Array.isArray(developer.company_locations) 
        ? developer.company_locations 
        : []
    } else {
      developer.locations = []
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
        const existingFiles = profileData.registration_files || []
        
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

            const newFiles = await Promise.all(uploadPromises)
            // Merge existing files (non-File objects) with newly uploaded files
            const existingNonFileObjects = Array.isArray(existingFiles) 
              ? existingFiles.filter(file => !(file instanceof File))
              : []
            profileData.registration_files = [...existingNonFileObjects, ...newFiles]
          } catch (error) {
            console.error('Registration files upload error:', error)
            return NextResponse.json({ error: 'Failed to upload registration files' }, { status: 500 })
          }
        } else {
          // No new file uploads, but ensure existing files are preserved
          if (Array.isArray(existingFiles)) {
            profileData.registration_files = existingFiles.filter(file => !(file instanceof File))
          }
        }
      }
    } else {
      // Handle JSON data
      profileData = await request.json()
    }

    // Extract and process locations array
    const locations = profileData.locations || []
    delete profileData.locations // Remove from profileData as we'll store it separately

    // Find primary location if it exists
    const primaryLocation = locations.find(loc => loc.primary_location === true)

    // Prepare update data - exclude protected fields that shouldn't be updated by user
    const { created_at, account_status, developer_id, id, ...restProfileData } = profileData
    const updateData = { ...restProfileData }

    // Store company_locations as JSONB
    if (Array.isArray(locations)) {
      updateData.company_locations = locations
    }

    // Store company_statistics as JSONB
    if (Array.isArray(profileData.company_statistics)) {
      updateData.company_statistics = profileData.company_statistics
    }

    // If primary location exists, update main location fields
    if (primaryLocation) {
      updateData.country = primaryLocation.country || updateData.country
      updateData.city = primaryLocation.city || updateData.city
      updateData.latitude = primaryLocation.latitude || updateData.latitude
      updateData.longitude = primaryLocation.longitude || updateData.longitude
      updateData.default_location_status = true // Set default location status
      
      // Set default_currency from primary location
      if (primaryLocation.currency) {
        updateData.default_currency = {
          code: primaryLocation.currency,
          name: primaryLocation.currency_name || primaryLocation.currency
        }
      }
    } else {
      // No primary location exists - set default_location_status to false
      // This handles the case where user removes the primary location
      updateData.default_location_status = false
    }

    // Calculate profile completion percentage
    const calculateProfileCompletion = (data, locationsArray) => {
      const sections = 7 // Total number of sections
      let completedSections = 0

      // 1. Company Name (check if name exists and is not empty)
      if (data.name && data.name.trim().length > 0) {
        completedSections++
      }

      // 2. Location (check if at least one location exists)
      if (Array.isArray(locationsArray) && locationsArray.length > 0) {
        completedSections++
      }

      // 3. Registration Documents (check if at least one file exists)
      const registrationFiles = data.registration_files || []
      if (Array.isArray(registrationFiles) && registrationFiles.length > 0) {
        completedSections++
      }

      // 4. License Number (check if license_number exists and is not empty)
      if (data.license_number && data.license_number.trim().length > 0) {
        completedSections++
      }

      // 5. Customer Care Team (check if at least one rep exists)
      const customerCare = data.customer_care || []
      if (Array.isArray(customerCare) && customerCare.length > 0) {
        completedSections++
      }

      // 6. Social Media (check if at least one social media platform is filled)
      const socialMedia = data.social_media || {}
      const hasSocialMedia = socialMedia.facebook || 
                            socialMedia.instagram || 
                            socialMedia.linkedin || 
                            socialMedia.tiktok
      if (hasSocialMedia) {
        completedSections++
      }

      // 7. Email, Phone Numbers, and Website
      const hasEmail = data.email && data.email.trim().length > 0
      const hasPhone = data.phone && data.phone.trim().length > 0
      const hasWebsite = data.website && data.website.trim().length > 0
      // At least email AND phone, OR website
      if ((hasEmail && hasPhone) || hasWebsite) {
        completedSections++
      }

      // Calculate percentage (round to integer)
      const percentage = Math.round((completedSections / sections) * 100)
      return percentage
    }

    // Calculate and set profile completion percentage
    updateData.profile_completion_percentage = calculateProfileCompletion(updateData, locations)

    // Map field names if needed (founded_year, company_size, license_number are already correct)
    // These fields are already in the correct format, so no mapping needed

    // Update developer profile
    const { data: updatedDeveloper, error: updateError } = await supabaseAdmin
      .from('developers')
      .update(updateData)
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

    // Map company_locations to locations for frontend compatibility in response
    if (updatedDeveloper.company_locations) {
      updatedDeveloper.locations = Array.isArray(updatedDeveloper.company_locations) 
        ? updatedDeveloper.company_locations 
        : []
    } else {
      updatedDeveloper.locations = []
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
