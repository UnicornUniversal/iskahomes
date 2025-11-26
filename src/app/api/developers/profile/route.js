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

    // Fetch existing developer data to compare gallery images for deletion
    const { data: existingDeveloper } = await supabaseAdmin
      .from('developers')
      .select('company_gallery')
      .eq('developer_id', decoded.user_id)
      .single()

    const existingGallery = existingDeveloper?.company_gallery || []

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

      // Handle company gallery images upload
      const galleryImages = formData.getAll('galleryImages')
      const existingNonFileImages = Array.isArray(existingGallery) 
        ? existingGallery.filter(img => img && typeof img === 'object' && (img.path || img.url))
        : []
      
      // Get the final gallery array from formData (after user removals)
      // Only count actual image objects (with path or url), exclude File objects and any invalid entries
      const finalGalleryFromForm = Array.isArray(profileData.company_gallery) 
        ? profileData.company_gallery.filter(img => {
            // Exclude File objects
            if (img instanceof File) return false
            // Only include objects with path or url (actual saved images)
            return img && typeof img === 'object' && (img.path || img.url)
          })
        : []
      
      // Find images that were removed (exist in existingNonFileImages but not in finalGalleryFromForm)
      const removedImages = existingNonFileImages.filter(existingImg => {
        const existingPath = existingImg.path || existingImg.url
        return !finalGalleryFromForm.some(finalImg => {
          const finalPath = finalImg.path || finalImg.url
          return finalPath === existingPath
        })
      })

      // Delete removed images from Supabase storage
      if (removedImages.length > 0) {
        try {
          const deletePromises = removedImages.map(async (img) => {
            if (img.path) {
              // Extract just the path part if it's a full path
              const pathToDelete = img.path.startsWith('profile/gallery/') || img.path.startsWith('company-gallery/') 
                ? img.path 
                : `profile/gallery/${decoded.user_id}/${img.path.split('/').pop()}`
              
              const { error: deleteError } = await supabaseAdmin.storage
                .from('iskaHomes')
                .remove([pathToDelete])
              
              if (deleteError) {
                console.error('Error deleting gallery image:', deleteError, 'Path:', pathToDelete)
                // Don't fail the request if deletion fails, just log it
              }
            }
          })
          await Promise.all(deletePromises)
        } catch (error) {
          console.error('Error deleting removed gallery images:', error)
          // Continue with the update even if deletion fails
        }
      }

      if (galleryImages && galleryImages.length > 0) {
        const fileUploads = galleryImages.filter(file => file instanceof File)
        const maxImages = 7
        const maxSize = 300 * 1024 // 300 KB

        // Validate file sizes
        const oversizedFiles = fileUploads.filter(file => file.size > maxSize)
        if (oversizedFiles.length > 0) {
          return NextResponse.json({ 
            error: `Some images exceed 300KB limit: ${oversizedFiles.map(f => f.name).join(', ')}` 
          }, { status: 400 })
        }

        // Check total count (only count actual saved images + new uploads)
        // finalGalleryFromForm already excludes File objects and only includes saved images
        const totalCount = finalGalleryFromForm.length + fileUploads.length
        if (totalCount > maxImages) {
          return NextResponse.json({ 
            error: `Maximum ${maxImages} images allowed in gallery. You currently have ${finalGalleryFromForm.length} images and are trying to add ${fileUploads.length} more.` 
          }, { status: 400 })
        }

        if (fileUploads.length > 0) {
          try {
            const uploadPromises = fileUploads.map(async (file) => {
              // Sanitize filename - remove special characters and use only safe characters
              const timestamp = Date.now()
              const randomString = Math.random().toString(36).substring(2, 15)
              const fileExtension = file.name.split('.').pop() || 'jpg'
              // Use only timestamp and random string, not original filename to avoid special characters
              const fileName = `gallery-${timestamp}-${randomString}.${fileExtension}`
              const filePath = `profile/gallery/${decoded.user_id}/${fileName}`

              // Convert file to buffer (required for Supabase storage)
              const fileBuffer = await file.arrayBuffer()

              // Upload to Supabase Storage
              const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                .from('iskaHomes')
                .upload(filePath, fileBuffer, {
                  contentType: file.type,
                  cacheControl: '3600',
                  upsert: false
                })

              if (uploadError) {
                console.error('Gallery image upload error:', uploadError)
                throw uploadError
              }

              // Get public URL
              const { data: urlData } = supabaseAdmin.storage
                .from('iskaHomes')
                .getPublicUrl(filePath)

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

            const newImages = await Promise.all(uploadPromises)
            // Merge final gallery (after removals) with newly uploaded images
            profileData.company_gallery = [...finalGalleryFromForm, ...newImages]
          } catch (error) {
            console.error('Gallery images upload error:', error)
            return NextResponse.json({ 
              error: 'Failed to upload gallery images', 
              details: error.message 
            }, { status: 500 })
          }
        } else {
          // No new file uploads, use the final gallery array (after removals)
          profileData.company_gallery = finalGalleryFromForm
        }
      } else {
        // No new uploads, use the final gallery array (after removals)
        profileData.company_gallery = finalGalleryFromForm
      }
    } else {
      // Handle JSON data
      profileData = await request.json()
      
      // For JSON requests, also handle gallery deletions
      // Only count actual image objects (with path or url), exclude File objects and any invalid entries
      const finalGalleryFromForm = Array.isArray(profileData.company_gallery) 
        ? profileData.company_gallery.filter(img => {
            // Exclude File objects (shouldn't be in JSON, but just in case)
            if (img instanceof File) return false
            // Only include objects with path or url (actual saved images)
            return img && typeof img === 'object' && (img.path || img.url)
          })
        : []
      
      const existingNonFileImages = Array.isArray(existingGallery) 
        ? existingGallery.filter(img => img && typeof img === 'object' && (img.path || img.url))
        : []
      
      // Find images that were removed
      const removedImages = existingNonFileImages.filter(existingImg => {
        const existingPath = existingImg.path || existingImg.url
        return !finalGalleryFromForm.some(finalImg => {
          const finalPath = finalImg.path || finalImg.url
          return finalPath === existingPath
        })
      })

      // Delete removed images from Supabase storage
      if (removedImages.length > 0) {
        try {
          const deletePromises = removedImages.map(async (img) => {
            if (img.path) {
              // Extract just the path part if it's a full path
              const pathToDelete = img.path.startsWith('profile/gallery/') || img.path.startsWith('company-gallery/') 
                ? img.path 
                : `profile/gallery/${decoded.user_id}/${img.path.split('/').pop()}`
              
              const { error: deleteError } = await supabaseAdmin.storage
                .from('iskaHomes')
                .remove([pathToDelete])
              
              if (deleteError) {
                console.error('Error deleting gallery image:', deleteError, 'Path:', pathToDelete)
              }
            }
          })
          await Promise.all(deletePromises)
        } catch (error) {
          console.error('Error deleting removed gallery images:', error)
        }
      }
      
      // Update gallery to final array
      profileData.company_gallery = finalGalleryFromForm
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

    // Store company_gallery as JSONB array (ensure it's always an array, not an object)
    if (Array.isArray(profileData.company_gallery)) {
      updateData.company_gallery = profileData.company_gallery
    } else if (profileData.company_gallery && typeof profileData.company_gallery === 'object') {
      // If it's an object, convert to array
      updateData.company_gallery = Object.values(profileData.company_gallery)
    } else {
      updateData.company_gallery = []
    }

    // Store specialization as JSONB - normalize to store actual values (strings) instead of IDs
    if (profileData.specialization) {
      const normalizedSpecialization = {
        database: Array.isArray(profileData.specialization.database)
          ? profileData.specialization.database.map(s => typeof s === 'string' ? s : (s.name || s))
          : [],
        custom: Array.isArray(profileData.specialization.custom)
          ? profileData.specialization.custom.map(s => typeof s === 'string' ? s : (s.name || s))
          : []
      }
      updateData.specialization = normalizedSpecialization
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
