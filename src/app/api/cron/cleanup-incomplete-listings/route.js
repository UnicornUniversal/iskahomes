import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/cron/cleanup-incomplete-listings
 * Cleanup incomplete draft listings older than 48 hours
 * 
 * This endpoint should be called by a cron job service (e.g., Vercel Cron, GitHub Actions, etc.)
 * 
 * Security: Add a secret token check in production
 */
export async function POST(request) {
  try {
    // Optional: Add secret token check for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Calculate timestamp for 48 hours ago
    const fortyEightHoursAgo = new Date()
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48)

    // Find incomplete listings older than 48 hours
    const { data: incompleteListings, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select('id, media, "3d_model", floor_plan, additional_files')
      .eq('listing_status', 'draft')
      .in('listing_condition', ['adding', 'updating'])
      .eq('upload_status', 'incomplete')
      .lt('created_at', fortyEightHoursAgo.toISOString())

    if (fetchError) {
      console.error('Error fetching incomplete listings:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch incomplete listings' },
        { status: 500 }
      )
    }

    if (!incompleteListings || incompleteListings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No incomplete listings to cleanup',
        deletedCount: 0
      })
    }

    // Extract all file paths to delete from storage
    const filesToDelete = []
    
    incompleteListings.forEach(listing => {
      // Extract from media.albums
      if (listing.media?.albums) {
        listing.media.albums.forEach(album => {
          if (album.images) {
            album.images.forEach(image => {
              if (image.path) filesToDelete.push(image.path)
            })
          }
        })
      }
      
      // Extract from 3d_model
      if (listing['3d_model']?.path) {
        filesToDelete.push(listing['3d_model'].path)
      }
      
      // Extract from floor_plan
      if (listing.floor_plan?.path) {
        filesToDelete.push(listing.floor_plan.path)
      }
      
      // Extract from additional_files
      if (listing.additional_files && Array.isArray(listing.additional_files)) {
        listing.additional_files.forEach(file => {
          if (file.path) filesToDelete.push(file.path)
        })
      }
    })

    // Delete files from storage
    if (filesToDelete.length > 0) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('iskaHomes')
        .remove(filesToDelete)
      
      if (storageError) {
        console.error('Error deleting files from storage:', storageError)
        // Continue with listing deletion even if file deletion fails
      }
    }

    // Delete social amenities associated with these listings
    const listingIds = incompleteListings.map(l => l.id)
    
    if (listingIds.length > 0) {
      const { error: amenitiesError } = await supabaseAdmin
        .from('social_amenities')
        .delete()
        .in('listing_id', listingIds)
      
      if (amenitiesError) {
        console.error('Error deleting social amenities:', amenitiesError)
        // Continue with listing deletion
      }
    }

    // Delete the incomplete listings
    const { error: deleteError } = await supabaseAdmin
      .from('listings')
      .delete()
      .in('id', listingIds)

    if (deleteError) {
      console.error('Error deleting incomplete listings:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete incomplete listings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${incompleteListings.length} incomplete listing(s)`,
      deletedCount: incompleteListings.length,
      filesDeleted: filesToDelete.length
    })

  } catch (error) {
    console.error('Cleanup incomplete listings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/cleanup-incomplete-listings
 * Manual trigger for testing (remove in production or add auth)
 */
export async function GET(request) {
  // For testing purposes only
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'GET method not allowed in production' },
      { status: 405 }
    )
  }

  return POST(request)
}

