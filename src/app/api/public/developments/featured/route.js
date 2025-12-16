import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit')) || 5

    // First, get all active packages and filter for platinum/infinity
    const { data: allPackages, error: packageError } = await supabase
      .from('subscriptions_package')
      .select('id, name')
      .eq('is_active', true)

    if (packageError) {
      console.error('Error fetching packages:', packageError)
      return NextResponse.json(
        { error: 'Failed to fetch packages' },
        { status: 500 }
      )
    }

    // Filter for platinum or infinity (case-insensitive)
    const packages = allPackages?.filter(pkg => {
      const name = pkg.name?.toLowerCase()
      return name === 'platinum' || name === 'infinity'
    }) || []

    if (packageError) {
      console.error('Error fetching packages:', packageError)
      return NextResponse.json(
        { error: 'Failed to fetch packages' },
        { status: 500 }
      )
    }

    const packageIds = packages?.map(pkg => pkg.id) || []

    if (packageIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Get developers with platinum or infinity subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('user_type', 'developer')
      .in('status', ['active', 'grace_period'])
      .in('package_id', packageIds)

    if (subError) {
      console.error('Error fetching subscriptions:', subError)
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      )
    }

    // Extract developer IDs
    const developerIds = subscriptions?.map(sub => sub.user_id) || []

    if (developerIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Fetch developments from these developers
    const { data: developments, error: devError } = await supabase
      .from('developments')
      .select('*')
      .in('developer_id', developerIds)
      .eq('development_status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (devError) {
      console.error('Error fetching developments:', devError)
      return NextResponse.json(
        { error: 'Failed to fetch developments' },
        { status: 500 }
      )
    }

    // Enrich developments with developer info and property types
    const enrichedDevelopments = await Promise.all(
      (developments || []).map(async (development) => {
        // Fetch developer
        const { data: developer } = await supabase
          .from('developers')
          .select('id, name, slug, profile_image')
          .eq('id', development.developer_id)
          .maybeSingle()

        // Parse and fetch property types
        let propertyTypes = []
        if (development.types) {
          try {
            const typeIds = typeof development.types === 'string' 
              ? JSON.parse(development.types) 
              : development.types
            
            if (Array.isArray(typeIds) && typeIds.length > 0) {
              const { data: types } = await supabase
                .from('property_types')
                .select('id, name')
                .in('id', typeIds)
              propertyTypes = types || []
            }
          } catch (e) {
            console.error('Error parsing types:', e)
          }
        }

        // Parse banner image
        let bannerUrl = null
        if (development.banner) {
          try {
            if (typeof development.banner === 'string') {
              const parsed = JSON.parse(development.banner)
              bannerUrl = parsed?.url || parsed || null
            } else if (typeof development.banner === 'object') {
              bannerUrl = development.banner?.url || development.banner || null
            }
            if (bannerUrl && !bannerUrl.startsWith('http')) {
              bannerUrl = null
            }
          } catch (e) {
            if (development.banner.startsWith('http')) {
              bannerUrl = development.banner
            }
          }
        }

        return {
          ...development,
          developer: developer || null,
          property_types: propertyTypes,
          banner_url: bannerUrl
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: enrichedDevelopments
    })

  } catch (error) {
    console.error('Error in featured developments API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

