export const parseNominatimResult = (result) => {
  const address = result?.address || {}

  const country = address.country || ''
  const countryCode = (address.country_code || '').toUpperCase()
  const state = address.state || address.region || address.state_district || ''
  const city = address.city || address.town || address.municipality || address.county || ''
  const town = address.suburb || address.neighbourhood || address.neighborhood || address.quarter || address.village || address.hamlet || ''

  return {
    country,
    countryCode,
    state,
    city,
    town,
    fullAddress: result?.display_name || '',
    coordinates: {
      latitude: (result?.lat ?? '').toString(),
      longitude: (result?.lon ?? '').toString()
    }
  }
}

export const parseNominatimForCompanyLocation = (result) => {
  const address = result?.address || {}
  const country = address.country || ''
  const countryCode = (address.country_code || '').toUpperCase()
  const region = address.state || address.region || address.state_district || ''
  const city = address.city || address.town || address.municipality || address.county || ''
  const lat = parseFloat(result?.lat)
  const lng = parseFloat(result?.lon)

  return {
    place_id: String(result?.place_id || ''),
    description: result?.display_name || '',
    address: result?.display_name || '',
    country,
    countryCode,
    region,
    city,
    latitude: Number.isNaN(lat) ? 0 : lat,
    longitude: Number.isNaN(lng) ? 0 : lng,
  }
}

export const searchNominatim = async (query) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
    { headers: { 'Accept-Language': 'en' } }
  )

  if (!response.ok) return []
  const data = await response.json()
  return Array.isArray(data) ? data : []
}

export const reverseGeocodeNominatim = async (lat, lng) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
    { headers: { 'Accept-Language': 'en' } }
  )

  if (!response.ok) return null
  const data = await response.json()
  return data ? parseNominatimResult(data) : null
}

export const reverseGeocodeNominatimForCompanyLocation = async (lat, lng) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
    { headers: { 'Accept-Language': 'en' } }
  )

  if (!response.ok) return null
  const data = await response.json()
  return data ? parseNominatimForCompanyLocation(data) : null
}
