import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('account_id')

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    // 1. Fetch all listings for the developer
    const { data: listings, error } = await supabase
      .from('listings')
      .select('purposes, types, listing_types')
      .eq('user_id', accountId)

    if (error) {
      console.error('Error fetching listings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch listings', details: error.message },
        { status: 500 }
      )
    }

    // 2. Count purpose, type, and subtype occurrences
    const purposeCounts = {}
    const typeCounts = {}
    const subtypeCounts = {}

    listings?.forEach(listing => {
      // Count purposes
      if (listing.purposes && Array.isArray(listing.purposes)) {
        listing.purposes.forEach(purposeId => {
          purposeCounts[purposeId] = (purposeCounts[purposeId] || 0) + 1
        })
      }

      // Count types
      if (listing.types && Array.isArray(listing.types)) {
        listing.types.forEach(typeId => {
          typeCounts[typeId] = (typeCounts[typeId] || 0) + 1
        })
      }

      // Count subtypes from listing_types.database
      if (listing.listing_types?.database && Array.isArray(listing.listing_types.database)) {
        listing.listing_types.database.forEach(subtypeId => {
          subtypeCounts[subtypeId] = (subtypeCounts[subtypeId] || 0) + 1
        })
      }
    })

    // 3. Get purpose names
    const purposeIds = Object.keys(purposeCounts)
    let purposeNames = {}
    if (purposeIds.length > 0) {
      const { data: purposes } = await supabase
        .from('property_purposes')
        .select('id, name')
        .in('id', purposeIds)

      if (purposes) {
        purposeNames = purposes.reduce((acc, purpose) => {
          acc[purpose.id] = purpose.name
          return acc
        }, {})
      }
    }

    // 4. Get type names
    const typeIds = Object.keys(typeCounts)
    let typeNames = {}
    if (typeIds.length > 0) {
      const { data: types } = await supabase
        .from('property_types')
        .select('id, name')
        .in('id', typeIds)

      if (types) {
        typeNames = types.reduce((acc, type) => {
          acc[type.id] = type.name
          return acc
        }, {})
      }
    }

    // 5. Get subtype names
    const subtypeIds = Object.keys(subtypeCounts)
    let subtypeNames = {}
    if (subtypeIds.length > 0) {
      const { data: subtypes } = await supabase
        .from('property_subtypes')
        .select('id, name')
        .in('id', subtypeIds)

      if (subtypes) {
        subtypeNames = subtypes.reduce((acc, subtype) => {
          acc[subtype.id] = subtype.name
          return acc
        }, {})
      }
    }

    // 6. Return: purpose name + count + total listings
    const purposesData = Object.entries(purposeCounts).map(([id, count]) => ({
      name: purposeNames[id] || 'Unknown Purpose',
      count
    }))

    const typesData = Object.entries(typeCounts).map(([id, count]) => ({
      name: typeNames[id] || 'Unknown Type',
      count
    }))

    const subtypesData = Object.entries(subtypeCounts).map(([id, count]) => ({
      name: subtypeNames[id] || 'Unknown Subtype',
      count
    }))

    return NextResponse.json({
      success: true,
      data: {
        purposes: purposesData,
        types: typesData,
        subtypes: subtypesData,
        total: listings?.length || 0
      }
    })

  } catch (error) {
    console.error('Properties stats fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
