import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request, { params }) {
  try {
    const { developerslug } = params
    
    console.log('🔍 Public API - Fetching developer with slug:', developerslug)

    if (!developerslug) {
      console.log('❌ No slug provided')
      return NextResponse.json(
        { error: 'Developer slug is required' },
        { status: 400 }
      )
    }

    // 1. Fetch developer details by slug (PUBLIC - no auth required)
    const { data: developer, error: developerError } = await supabase
      .from('developers')
      .select(`
        id,
        developer_id,
        name,
        email,
        phone,
        website,
        address,
        city,
        region,
        country,
        description,
        profile_image,
        cover_image,
        social_media,
        customer_care,
        account_status,
        slug,
      
        total_units,
        total_developments,
        specialization,
        company_size,
        founded_year,
        
        verified,
        state,
        latitude,
        longitude,
      
        created_at
      `)
      .eq('slug', developerslug)
      .eq('account_status', 'active')
      .single()

    if (developerError) {
      console.error('❌ Error fetching developer:', developerError)
      return NextResponse.json(
        { error: 'Developer not found', details: developerError.message },
        { status: 404 }
      )
    }

    if (!developer) {
      console.log('❌ No developer found for slug:', developerslug)
      return NextResponse.json(
        { error: 'Developer not found' },
        { status: 404 }
      )
    }

    console.log('✅ Developer found:', developer.name)

    // 2. Fetch developer's developments (PUBLIC - no auth required)
    const { data: developments, error: developmentsError } = await supabase
      .from('developments')
      .select(`
        id,
        slug,
        title,
        description,
        size,
        status,
        number_of_buildings,
        purposes,
        types,
        categories,
        country,
        state,
        city,
        town,
        full_address,
        latitude,
        longitude,
        banner,
        video,
        youtube_url,
        virtual_tour_url,
        media_files,
        development_status,
        views,
        favorites,
        inquiries,
        total_units,
        created_at,
        updated_at
      `)
      .eq('developer_id', developer.developer_id)
      .eq('development_status', 'active')
      .order('created_at', { ascending: false })

    if (developmentsError) {
      console.error('Error fetching developments:', developmentsError)
      // Don't fail the request, just return empty developments
    }

    // 3. Return combined data
    return NextResponse.json({
      success: true,
      data: {
        developer: {
          id: developer.id,
          developer_id: developer.developer_id,
          name: developer.name,
          email: developer.email,
          phone: developer.phone,
          website: developer.website,
          address: developer.address,
          city: developer.city,
          region: developer.region,
          country: developer.country,
          description: developer.description,
          profile_image: developer.profile_image,
          cover_image: developer.cover_image,
          social_media: developer.social_media,
          customer_care: developer.customer_care,
          account_status: developer.account_status,
          slug: developer.slug,
          profile_completion_percentage: developer.profile_completion_percentage,
          total_units: developer.total_units,
          total_developments: developer.total_developments,
          specialization: developer.specialization,
          company_size: developer.company_size,
          founded_year: developer.founded_year,
          license_number: developer.license_number,
          verified: developer.verified,
          state: developer.state,
          latitude: developer.latitude,
          longitude: developer.longitude,
          total_appointments: developer.total_appointments,
          created_at: developer.created_at
        },
        developments: developments || []
      }
    })

  } catch (error) {
    console.error('Public developer fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
