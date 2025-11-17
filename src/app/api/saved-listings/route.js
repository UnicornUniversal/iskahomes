import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

export async function POST(request) {
  try {
    const { listingId, notes } = await request.json()
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    
    // Verify JWT token instead of Supabase auth
    const decoded = verifyToken(token)
    console.log('🔍 Decoded token:', decoded)
    
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Get property seeker profile using the decoded user ID
    const { data: propertySeeker, error: seekerError } = await supabase
      .from('property_seekers')
      .select('id, user_id, total_saved_listings')
      .eq('id', decoded.id)
      .single()

    console.log('🔍 Property seeker data:', propertySeeker)
    console.log('🔍 Seeker error:', seekerError)

    if (seekerError || !propertySeeker) {
      return NextResponse.json(
        { error: 'Property seeker profile not found' },
        { status: 404 }
      )
    }

    // Check if listing is already saved
    const { data: existingSave, error: checkError } = await supabase
      .from('saved_listings')
      .select('id')
      .eq('user_id', propertySeeker.id)
      .eq('listing_id', listingId)
      .single()

    if (existingSave) {
      return NextResponse.json(
        { error: 'Listing already saved' },
        { status: 400 }
      )
    }

    // Save the listing
    console.log('🔍 Attempting to save listing with data:', {
      user_id: propertySeeker.id,
      listing_id: listingId,
      notes: notes || null,
      user_type: 'propertySeeker'
    })
    
    // Try a simple insert first to test
    const { data: savedListing, error: saveError } = await supabase
      .from('saved_listings')
      .insert({
        user_id: propertySeeker.id,
        listing_id: listingId,
        notes: notes || null,
        user_type: 'propertySeeker'
      })
      .select()
      .single()

    console.log('🔍 Save result:', { savedListing, saveError })

    if (saveError) {
      console.error('Error saving listing:', saveError)
      return NextResponse.json(
        { error: 'Failed to save listing' },
        { status: 500 }
      )
    }

    // Update total_saved_listings count for property seeker
    const { error: updateError } = await supabase
      .from('property_seekers')
      .update({ 
        total_saved_listings: propertySeeker.total_saved_listings + 1 
      })
      .eq('id', propertySeeker.id)

    if (updateError) {
      console.error('Error updating saved count:', updateError)
      // Don't fail the request, just log the error
    }

    // Update total_saved in listings table - increment by 1
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id, account_type, total_saved')
      .eq('id', listingId)
      .single()

    if (!listingError && listing) {
      const newSavedCount = (listing.total_saved || 0) + 1
      const { error: updateListingError } = await supabase
        .from('listings')
        .update({ 
          total_saved: newSavedCount
        })
        .eq('id', listingId)

      if (updateListingError) {
        console.error('Error updating listing saved count:', updateListingError)
        // Don't fail the request, just log the error
      } else {
        // If listing belongs to a developer, also update developers table
        if (listing.account_type === 'developer' && listing.user_id) {
          const { data: developer, error: devError } = await supabase
            .from('developers')
            .select('developer_id, total_saved')
            .eq('developer_id', listing.user_id)
            .single()

          if (!devError && developer) {
            const newDevSavedCount = (developer.total_saved || 0) + 1
            const { error: updateDevError } = await supabase
              .from('developers')
              .update({ 
                total_saved: newDevSavedCount
              })
              .eq('developer_id', listing.user_id)

            if (updateDevError) {
              console.error('Error updating developer saved count:', updateDevError)
              // Don't fail the request, just log the error
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: savedListing,
      message: 'Listing saved successfully'
    })

  } catch (error) {
    console.error('Error in save listing API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    
    // Verify JWT token instead of Supabase auth
    const decoded = verifyToken(token)
    console.log('🔍 DELETE - Decoded token:', decoded)
    
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Get property seeker profile using the decoded user ID
    const { data: propertySeeker, error: seekerError } = await supabase
      .from('property_seekers')
      .select('id, user_id, total_saved_listings')
      .eq('id', decoded.id)
      .single()

    console.log('🔍 DELETE - Property seeker data:', propertySeeker)

    if (seekerError || !propertySeeker) {
      return NextResponse.json(
        { error: 'Property seeker profile not found' },
        { status: 404 }
      )
    }

    // Check if listing is saved
    const { data: existingSave, error: checkError } = await supabase
      .from('saved_listings')
      .select('id')
      .eq('user_id', propertySeeker.id)
      .eq('listing_id', listingId)
      .single()

    if (!existingSave) {
      return NextResponse.json(
        { error: 'Listing not saved' },
        { status: 400 }
      )
    }

    // Remove the saved listing
    const { error: deleteError } = await supabase
      .from('saved_listings')
      .delete()
      .eq('user_id', propertySeeker.id)
      .eq('listing_id', listingId)

    if (deleteError) {
      console.error('Error removing saved listing:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove saved listing' },
        { status: 500 }
      )
    }

    // Update total_saved_listings count for property seeker
    const newCount = Math.max(0, propertySeeker.total_saved_listings - 1)
    const { error: updateError } = await supabase
      .from('property_seekers')
      .update({ 
        total_saved_listings: newCount 
      })
      .eq('id', propertySeeker.id)

    if (updateError) {
      console.error('Error updating saved count:', updateError)
      // Don't fail the request, just log the error
    }

    // Update total_saved in listings table - decrement by 1 (but not below 0)
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id, account_type, total_saved')
      .eq('id', listingId)
      .single()

    if (!listingError && listing) {
      const newSavedCount = Math.max(0, (listing.total_saved || 0) - 1)
      const { error: updateListingError } = await supabase
        .from('listings')
        .update({ 
          total_saved: newSavedCount
        })
        .eq('id', listingId)

      if (updateListingError) {
        console.error('Error updating listing saved count:', updateListingError)
        // Don't fail the request, just log the error
      } else {
        // If listing belongs to a developer, also update developers table
        if (listing.account_type === 'developer' && listing.user_id) {
          const { data: developer, error: devError } = await supabase
            .from('developers')
            .select('developer_id, total_saved')
            .eq('developer_id', listing.user_id)
            .single()

          if (!devError && developer) {
            const newDevSavedCount = Math.max(0, (developer.total_saved || 0) - 1)
            const { error: updateDevError } = await supabase
              .from('developers')
              .update({ 
                total_saved: newDevSavedCount
              })
              .eq('developer_id', listing.user_id)

            if (updateDevError) {
              console.error('Error updating developer saved count:', updateDevError)
              // Don't fail the request, just log the error
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Listing removed from saved'
    })

  } catch (error) {
    console.error('Error in remove saved listing API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    
    // Verify JWT token instead of Supabase auth
    const decoded = verifyToken(token)
    console.log('🔍 GET - Decoded token:', decoded)
    
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Get property seeker profile using the decoded user ID
    const { data: propertySeeker, error: seekerError } = await supabase
      .from('property_seekers')
      .select('id, user_id')
      .eq('id', decoded.id)
      .single()

    console.log('🔍 GET - Property seeker data:', propertySeeker)

    if (seekerError || !propertySeeker) {
      return NextResponse.json(
        { error: 'Property seeker profile not found' },
        { status: 404 }
      )
    }

    if (listingId) {
      // Check if specific listing is saved
      const { data: savedListing, error: checkError } = await supabase
        .from('saved_listings')
        .select('id, notes, created_at')
        .eq('user_id', propertySeeker.id)
        .eq('listing_id', listingId)
        .single()

      return NextResponse.json({
        success: true,
        data: {
          isSaved: !!savedListing,
          savedListing: savedListing || null
        }
      })
    } else {
      // Get all saved listings with listing data
      const { data: savedListings, error: fetchError } = await supabase
        .from('saved_listings')
        .select(`
          id,
          user_id,
          listing_id,
          notes,
          created_at,
          user_type,
          listings (
            id,
            title,
            description,
            price,
            currency,
            price_type,
            duration,
            size,
            status,
            country,
            state,
            city,
            town,
            full_address,
            latitude,
            longitude,
            specifications,
            amenities,
            media,
            available_from,
            available_until,
            is_featured,
            is_verified,
            is_premium,
            cancellation_policy,
            is_negotiable,
            security_requirements,
            flexible_terms,
            acquisition_rules,
            additional_information,
            slug,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', propertySeeker.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Error fetching saved listings:', fetchError)
        return NextResponse.json(
          { error: 'Failed to fetch saved listings' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: savedListings || []
      })
    }

  } catch (error) {
    console.error('Error in check saved listing API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
