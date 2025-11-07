import { supabaseAdmin } from './supabase'

/**
 * Downloads an image from a URL and uploads it to Supabase Storage
 * @param {string} imageUrl - The URL of the image to download
 * @param {string} folder - Folder path in storage (e.g., 'social-amenities')
 * @param {string} filename - Optional custom filename, otherwise auto-generated
 * @returns {Promise<Object>} - Returns { url, filename, path, size } on success
 */
export async function downloadAndUploadImage(imageUrl, folder = 'social-amenities', filename = null) {
  try {
    if (!imageUrl) {
      throw new Error('Image URL is required')
    }

    // Step 1: Fetch the image from the URL
    console.log(`📥 Downloading image from: ${imageUrl}`)
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IskaHomes/1.0)'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
    }

    // Step 2: Get the image as a buffer (binary data)
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    // Step 3: Generate filename if not provided
    if (!filename) {
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      
      // Determine extension from content type
      const extensionMap = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp'
      }
      const extension = extensionMap[contentType] || 'jpg'
      filename = `amenity-${timestamp}-${randomString}.${extension}`
    }

    const filePath = `${folder}/${filename}`

    // Step 4: Upload buffer to Supabase Storage
    console.log(`📤 Uploading to Supabase: ${filePath}`)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('iskaHomes')
      .upload(filePath, imageBuffer, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError)
      throw new Error(`Failed to upload to Supabase: ${uploadError.message}`)
    }

    // Step 5: Get public URL from Supabase
    const { data: urlData } = supabaseAdmin.storage
      .from('iskaHomes')
      .getPublicUrl(filePath)

    console.log(`✅ Image uploaded successfully: ${urlData.publicUrl}`)

    return {
      url: urlData.publicUrl,
      filename: filename,
      path: filePath,
      size: imageBuffer.byteLength,
      type: contentType
    }
  } catch (error) {
    console.error('❌ Error downloading/uploading image:', error)
    throw error
  }
}

/**
 * Processes social amenities photos - downloads from Google Maps and uploads to Supabase
 * @param {Array} amenities - Array of amenity objects with photos array
 * @returns {Promise<Array>} - Returns amenities with updated photo URLs
 */
export async function processAmenityPhotos(amenities) {
  if (!Array.isArray(amenities)) {
    return amenities
  }

  const processedAmenities = await Promise.all(
    amenities.map(async (amenity) => {
      if (!amenity.photos || !Array.isArray(amenity.photos) || amenity.photos.length === 0) {
        return amenity
      }

      // Process each photo
      const processedPhotos = await Promise.allSettled(
        amenity.photos.map(async (photo, index) => {
          try {
            // If it's already a Supabase URL, skip
            if (photo.url && photo.url.includes('supabase.co')) {
              return photo
            }

            // If it's a Google Maps URL, download and upload
            if (photo.url && photo.url.includes('maps.googleapis.com')) {
              const downloaded = await downloadAndUploadImage(
                photo.url,
                'social-amenities',
                `${amenity.id || 'amenity'}-${index + 1}.jpg`
              )

              return {
                ...photo,
                url: downloaded.url,
                supabase_url: downloaded.url,
                google_url: photo.url, // Keep original for reference
                path: downloaded.path,
                uploaded_at: new Date().toISOString()
              }
            }

            // If it has photo_reference, construct Google Maps URL and download
            if (photo.photo_reference) {
              const googleUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API}`
              
              const downloaded = await downloadAndUploadImage(
                googleUrl,
                'social-amenities',
                `${amenity.id || 'amenity'}-${index + 1}.jpg`
              )

              return {
                ...photo,
                url: downloaded.url,
                supabase_url: downloaded.url,
                photo_reference: photo.photo_reference, // Keep reference
                path: downloaded.path,
                uploaded_at: new Date().toISOString()
              }
            }

            return photo
          } catch (error) {
            console.error(`Error processing photo ${index + 1} for amenity ${amenity.name}:`, error)
            // Return original photo if download/upload fails
            return photo
          }
        })
      )

      // Extract successful results
      const successfulPhotos = processedPhotos
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)

      return {
        ...amenity,
        photos: successfulPhotos.length > 0 ? successfulPhotos : amenity.photos
      }
    })
  )

  return processedAmenities
}

