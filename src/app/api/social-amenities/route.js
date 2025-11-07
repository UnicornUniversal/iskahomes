import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { latitude, longitude, radius = 10000 } = await request.json()

    // Validate required parameters
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Check if Google Maps API key is available
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      )
    }

    const amenities = {
      schools: [],
      hospitals: [],
      airports: [],
      parks: [],
      shops: [],
      police: []
    }

    const amenityTypes = [
      { key: 'schools', type: 'school', name: 'Schools' },
      { key: 'hospitals', type: 'hospital', name: 'Hospitals' },
      { key: 'airports', type: 'airport', name: 'Airports' },
      { key: 'parks', type: 'park', name: 'Parks' },
      { key: 'shops', type: 'shopping_mall', name: 'Shops & Markets' },
      { key: 'police', type: 'police', name: 'Police Stations' }
    ]

    // Fetch amenities sequentially to prevent API overload
    for (const amenityType of amenityTypes) {
      try {

        // console.log(`🔍 Fetching ${amenityType.name}...`)
        
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${amenityType.type}&key=${apiKey}`
        
        const response = await fetch(url)
        const data = await response.json()

        if (data.status === 'OK' && data.results) {
          // console.log(`✅ Found ${data.results.length} ${amenityType.name}`)
          
          // Process only the first 5 results - FOCUS ON LOCATION DATA ONLY
          const amenityList = await Promise.all(data.results.slice(0, 5).map(async (place) => {
            // Calculate distance using Haversine formula
            const distance = calculateDistance(
              parseFloat(latitude),
              parseFloat(longitude),
              place.geometry.location.lat,
              place.geometry.location.lng
            )

            // Fetch images for each amenity
            let photos = []
            if (place.photos && place.photos.length > 0) {
              photos = place.photos.slice(0, 3).map(photo => ({
                photo_reference: photo.photo_reference,
                width: photo.width,
                height: photo.height,
                url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API}`
              }))
            }

            return {
              id: place.place_id,
              name: place.name,
              address: place.vicinity,
              rating: place.rating || 0,
              distance: Math.round(distance * 100) / 100,
              location: {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng
              },
              types: place.types,
              priceLevel: place.price_level,
              openNow: place.opening_hours?.open_now || null,
              photos: photos // Array of photo objects with photo_reference
            }
          }))

          amenities[amenityType.key] = amenityList
          // console.log(`✅ ${amenityType.name} processed: ${amenityList.length} items`)
        } else {
          // console.log(`❌ No ${amenityType.name} found: ${data.status}`)
          amenities[amenityType.key] = []
        }

        // Add small delay between requests to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (error) {
        console.error(`Error fetching ${amenityType.name}:`, error)
        amenities[amenityType.key] = []
      }
    }

    // console.log('✅ Server-side social amenities search completed!')
    
    return NextResponse.json({
      success: true,
      data: amenities,
      message: 'Social amenities fetched successfully'
    })

  } catch (error) {
    console.error('Error in social amenities API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch social amenities' },
      { status: 500 }
    )
  }
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c
  return distance
}
