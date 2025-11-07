import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeSubtypes = searchParams.get('include_subtypes') === 'true'

    // Fetch all property purposes from database
    const { data: purposes, error: purposesError } = await supabase
      .from('property_purposes')
      .select('id, name, description, active')
      .eq('active', true)
      .order('name')

    if (purposesError) {
      console.error('Error fetching purposes:', purposesError)
      return NextResponse.json(
        { error: 'Failed to fetch property purposes', details: purposesError.message },
        { status: 500 }
      )
    }

    // Fetch all property types from database
    const { data: propertyTypes, error: typesError } = await supabase
      .from('property_types')
      .select('id, name, description, active')
      .eq('active', true)
      .order('name')

    if (typesError) {
      console.error('Error fetching property types:', typesError)
      return NextResponse.json(
        { error: 'Failed to fetch property types', details: typesError.message },
        { status: 500 }
      )
    }

    // Fetch property subtypes from database
    const { data: subtypes, error: subtypesError } = await supabase
      .from('property_subtypes')
      .select('id, name, description, property_type, active')
      .eq('active', true)
      .order('name')

    if (subtypesError) {
      console.error('Error fetching subtypes:', subtypesError)
      return NextResponse.json(
        { error: 'Failed to fetch property subtypes', details: subtypesError.message },
        { status: 500 }
      )
    }

    // Fetch all unique locations from listings
    const { data: locations, error: locationsError } = await supabase
      .from('listings')
      .select('country, state, city, town')
      .eq('listing_status', 'active')
      .not('country', 'is', null)

    if (locationsError) {
      console.error('Error fetching locations:', locationsError)
      return NextResponse.json(
        { error: 'Failed to fetch locations', details: locationsError.message },
        { status: 500 }
      )
    }

    // Process locations to get unique values
    const uniqueLocations = {
      countries: [...new Set(locations?.map(l => l.country).filter(Boolean))].sort(),
      states: [...new Set(locations?.map(l => l.state).filter(Boolean))].sort(),
      cities: [...new Set(locations?.map(l => l.city).filter(Boolean))].sort(),
      towns: [...new Set(locations?.map(l => l.town).filter(Boolean))].sort()
    }

    return NextResponse.json({
      success: true,
      data: {
        purposes: purposes || [],
        propertyTypes: propertyTypes || [],
        subtypes: subtypes || [],
        locations: uniqueLocations
      }
    })

  } catch (error) {
    console.error('Property taxonomy fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
