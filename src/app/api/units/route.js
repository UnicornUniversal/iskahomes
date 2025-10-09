import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const developer_id = searchParams.get('developer_id')
    const development_id = searchParams.get('development_id')
    const property_type = searchParams.get('property_type')
    const status = searchParams.get('status')

    let query = supabase
      .from('units')
      .select(`
        *,
        developments (
          id,
          title,
          slug
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (developer_id) {
      query = query.eq('developer_id', developer_id)
    }
    if (development_id) {
      query = query.eq('development_id', development_id)
    }
    if (property_type) {
      query = query.eq('property_type', property_type)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching units:', error)
      return NextResponse.json(
        { error: 'Failed to fetch units' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in units GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    console.log('Creating unit with data:', body)

    // Verify token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded || !decoded.developer_id) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Verify developer_id matches token
    if (decoded.developer_id !== body.developer_id) {
      return NextResponse.json(
        { error: 'Unauthorized: developer_id mismatch' },
        { status: 403 }
      )
    }

    // Generate slug from title
    const slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim()

    // Prepare unit data
    const unitData = {
      developer_id: body.developer_id,
      development_id: body.development_id,
      title: body.title,
      slug: slug,
      description: body.description,
      property_type: body.property_type,
      unit_type: body.unit_type,
      city: body.city,
      neighborhood: body.neighborhood,
      latitude: body.latitude,
      longitude: body.longitude,
      address: body.address,
      bedrooms: body.bedrooms || null,
      bathrooms: body.bathrooms || null,
      living_space: body.living_space,
      total_area: body.total_area || null,
      ceiling_height: body.ceiling_height || null,
      capacity: body.capacity || null,
      kitchen_type: body.kitchen_type || null,
      balcony: body.balcony || false,
      garden: body.garden || false,
      security: body.security || false,
      gated_community: body.gated_community || false,
      internet: body.internet || false,
      parking: body.parking || false,
      conference_rooms: body.conference_rooms || false,
      washrooms: body.washrooms || false,
      loading_docks: body.loading_docks || false,
      forklift_access: body.forklift_access || false,
      power_backup: body.power_backup || false,
      water_supply: body.water_supply || false,
      stage: body.stage || false,
      lighting: body.lighting || false,
      sound_system: body.sound_system || false,
      chairs_tables: body.chairs_tables || false,
      catering_services: body.catering_services || false,
      road_access: body.road_access || false,
      proximity_to_utilities: body.proximity_to_utilities || false,
      electricity: body.electricity || false,
      drainage: body.drainage || false,
      status: body.status,
      rent_price: body.rent_price,
      deposit: body.deposit,
      duration: body.duration,
      flexible_terms: body.flexible_terms || false,
      cancellation_policy: body.cancellation_policy || null,
      security_requirements: body.security_requirements || null,
      title_deed: body.title_deed || null,
      land_certificate: body.land_certificate || null,
      lease_status: body.lease_status || null,
      topography: body.topography || null,
      virtual_tour_url: body.virtual_tour_url || null,
      owner_name: body.owner_name,
      owner_phone: body.owner_phone,
      owner_email: body.owner_email,
      owner_type: body.owner_type,
      availability_status: body.availability_status,
      available_from: body.available_from || null,
      booking_rules: body.booking_rules || null,
      amenities: body.amenities || { database: [], general: [], custom: [] },
      images: body.images || [],
      videos: body.videos || [],
      model_3d: body.model_3d || null,
      unit_status: body.unit_status || 'active',
      views: 0,
      favorites: 0,
      inquiries: 0
    }

    console.log('Unit data to insert:', unitData)

    const { data, error } = await supabase
      .from('units')
      .insert([unitData])
      .select()
      .single()

    if (error) {
      console.error('Error creating unit:', error)
      return NextResponse.json(
        { error: 'Failed to create unit', details: error.message },
        { status: 500 }
      )
    }

    console.log('Unit created successfully:', data)
    return NextResponse.json({ 
      success: true, 
      message: 'Unit created successfully',
      data 
    })
  } catch (error) {
    console.error('Error in units POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
