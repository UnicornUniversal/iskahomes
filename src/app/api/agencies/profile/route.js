import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// GET - Fetch agency profile
export async function GET(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded || decoded.user_type !== 'agency') {
      return NextResponse.json({ error: 'Invalid token or user type' }, { status: 401 })
    }

    // Get agency profile
    const { data: agency, error } = await supabaseAdmin
      .from('agencies')
      .select('*')
      .eq('agency_id', decoded.user_id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch agency profile', 
        details: error.message 
      }, { status: 500 })
    }

    // Map company_locations to locations for frontend compatibility
    if (agency.company_locations) {
      agency.locations = Array.isArray(agency.company_locations) 
        ? agency.company_locations 
        : []
    } else {
      agency.locations = []
    }

    return NextResponse.json({ 
      success: true,
      data: agency
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

// PUT - Update agency profile
export async function PUT(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded || decoded.user_type !== 'agency') {
      return NextResponse.json({ error: 'Invalid token or user type' }, { status: 401 })
    }

    // Check if request is multipart/form-data (file uploads)
    const contentType = request.headers.get('content-type')
    let profileData

    // Fetch existing agency data to compare gallery images for deletion
    const { data: existingAgency } = await supabaseAdmin
      .from('agencies')
      .select('company_gallery')
      .eq('agency_id', decoded.user_id)
      .single()

    const existingGallery = existingAgency?.company_gallery || []

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
          const fileName = `profile-${Date.now()}-${profileImageFile.name}`
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('iskaHomes')
            .upload(`profile-images/${fileName}`, profileImageFile)

          if (uploadError) {
            console.error('Profile image upload error:', uploadError)
            return NextResponse.json({ error: 'Failed to upload profile image' }, { status: 500 })
          }

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
          const fileName = `cover-${Date.now()}-${coverImageFile.name}`
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('iskaHomes')
            .upload(`cover-images/${fileName}`, coverImageFile)

          if (uploadError) {
            console.error('Cover image upload error:', uploadError)
            return NextResponse.json({ error: 'Failed to upload cover image' }, { status: 500 })
          }

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
            const existingNonFileObjects = Array.isArray(existingFiles) 
              ? existingFiles.filter(file => !(file instanceof File))
              : []
            profileData.registration_files = [...existingNonFileObjects, ...newFiles]
          } catch (error) {
            console.error('Registration files upload error:', error)
            return NextResponse.json({ error: 'Failed to upload registration files' }, { status: 500 })
          }
        } else {
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
      
      const finalGalleryFromForm = Array.isArray(profileData.company_gallery) 
        ? profileData.company_gallery.filter(img => {
            if (img instanceof File) return false
            return img && typeof img === 'object' && (img.path || img.url)
          })
        : []
      
      const removedImages = existingNonFileImages.filter(existingImg => {
        const existingPath = existingImg.path || existingImg.url
        return !finalGalleryFromForm.some(finalImg => {
          const finalPath = finalImg.path || finalImg.url
          return finalPath === existingPath
        })
      })

      if (removedImages.length > 0) {
        try {
          const deletePromises = removedImages.map(async (img) => {
            if (img.path) {
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

      if (galleryImages && galleryImages.length > 0) {
        const fileUploads = galleryImages.filter(file => file instanceof File)
        const maxImages = 7
        const maxSize = 300 * 1024

        const oversizedFiles = fileUploads.filter(file => file.size > maxSize)
        if (oversizedFiles.length > 0) {
          return NextResponse.json({ 
            error: `Some images exceed 300KB limit: ${oversizedFiles.map(f => f.name).join(', ')}` 
          }, { status: 400 })
        }

        const totalCount = finalGalleryFromForm.length + fileUploads.length
        if (totalCount > maxImages) {
          return NextResponse.json({ 
            error: `Maximum ${maxImages} images allowed in gallery. You currently have ${finalGalleryFromForm.length} images and are trying to add ${fileUploads.length} more.` 
          }, { status: 400 })
        }

        if (fileUploads.length > 0) {
          try {
            const uploadPromises = fileUploads.map(async (file) => {
              const timestamp = Date.now()
              const randomString = Math.random().toString(36).substring(2, 15)
              const fileExtension = file.name.split('.').pop() || 'jpg'
              const fileName = `gallery-${timestamp}-${randomString}.${fileExtension}`
              const filePath = `profile/gallery/${decoded.user_id}/${fileName}`

              const fileBuffer = await file.arrayBuffer()

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
            profileData.company_gallery = [...finalGalleryFromForm, ...newImages]
          } catch (error) {
            console.error('Gallery images upload error:', error)
            return NextResponse.json({ 
              error: 'Failed to upload gallery images', 
              details: error.message 
            }, { status: 500 })
          }
        } else {
          profileData.company_gallery = finalGalleryFromForm
        }
      } else {
        profileData.company_gallery = finalGalleryFromForm
      }
    } else {
      // Handle JSON data
      profileData = await request.json()
      
      const finalGalleryFromForm = Array.isArray(profileData.company_gallery) 
        ? profileData.company_gallery.filter(img => {
            if (img instanceof File) return false
            return img && typeof img === 'object' && (img.path || img.url)
          })
        : []
      
      const existingNonFileImages = Array.isArray(existingGallery) 
        ? existingGallery.filter(img => img && typeof img === 'object' && (img.path || img.url))
        : []
      
      const removedImages = existingNonFileImages.filter(existingImg => {
        const existingPath = existingImg.path || existingImg.url
        return !finalGalleryFromForm.some(finalImg => {
          const finalPath = finalImg.path || finalImg.url
          return finalPath === existingPath
        })
      })

      if (removedImages.length > 0) {
        try {
          const deletePromises = removedImages.map(async (img) => {
            if (img.path) {
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
      
      profileData.company_gallery = finalGalleryFromForm
    }

    // Extract and process locations array
    const locations = profileData.locations || []
    delete profileData.locations

    // Find primary location if it exists
    const primaryLocation = locations.find(loc => loc.primary_location === true)

    // Prepare update data - exclude protected fields
    const { created_at, account_status, agency_id, id, ...restProfileData } = profileData
    const updateData = { ...restProfileData }

    // Store company_locations as JSONB
    if (Array.isArray(locations)) {
      updateData.company_locations = locations
    }

    // Store company_statistics as JSONB
    if (Array.isArray(profileData.company_statistics)) {
      updateData.company_statistics = profileData.company_statistics
    }

    // Store company_gallery as JSONB array
    if (Array.isArray(profileData.company_gallery)) {
      updateData.company_gallery = profileData.company_gallery
    } else if (profileData.company_gallery && typeof profileData.company_gallery === 'object') {
      updateData.company_gallery = Object.values(profileData.company_gallery)
    } else {
      updateData.company_gallery = []
    }

    // If primary location exists, update main location fields
    if (primaryLocation) {
      updateData.country = primaryLocation.country || updateData.country
      updateData.city = primaryLocation.city || updateData.city
      updateData.latitude = primaryLocation.latitude || updateData.latitude
      updateData.longitude = primaryLocation.longitude || updateData.longitude
      updateData.default_location_status = true
      
      // Set default_currency from primary location
      if (primaryLocation.currency) {
        updateData.default_currency = primaryLocation.currency
      }
    } else {
      updateData.default_location_status = false
    }

    // Calculate profile completion percentage (same logic as developers)
    const calculateProfileCompletion = (data, locationsArray) => {
      const sections = 7
      let completedSections = 0

      if (data.name && data.name.trim().length > 0) {
        completedSections++
      }

      if (Array.isArray(locationsArray) && locationsArray.length > 0) {
        completedSections++
      }

      const registrationFiles = data.registration_files || []
      if (Array.isArray(registrationFiles) && registrationFiles.length > 0) {
        completedSections++
      }

      if (data.license_number && data.license_number.trim().length > 0) {
        completedSections++
      }

      const customerCare = data.customer_care || []
      if (Array.isArray(customerCare) && customerCare.length > 0) {
        completedSections++
      }

      const socialMedia = data.social_media || {}
      const hasSocialMedia = socialMedia.facebook || 
                            socialMedia.instagram || 
                            socialMedia.linkedin || 
                            socialMedia.tiktok
      if (hasSocialMedia) {
        completedSections++
      }

      const hasEmail = data.email && data.email.trim().length > 0
      const hasPhone = data.phone && data.phone.trim().length > 0
      const hasWebsite = data.website && data.website.trim().length > 0
      if ((hasEmail && hasPhone) || hasWebsite) {
        completedSections++
      }

      const percentage = Math.round((completedSections / sections) * 100)
      return percentage
    }

    updateData.profile_completion_percentage = calculateProfileCompletion(updateData, locations)

    // Update agency profile
    const { data: updatedAgency, error: updateError } = await supabaseAdmin
      .from('agencies')
      .update(updateData)
      .eq('agency_id', decoded.user_id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update agency profile', 
        details: updateError.message 
      }, { status: 500 })
    }

    // Map company_locations to locations for frontend compatibility
    if (updatedAgency.company_locations) {
      updatedAgency.locations = Array.isArray(updatedAgency.company_locations) 
        ? updatedAgency.company_locations 
        : []
    } else {
      updatedAgency.locations = []
    }

    return NextResponse.json({ 
      success: true,
      data: updatedAgency,
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

