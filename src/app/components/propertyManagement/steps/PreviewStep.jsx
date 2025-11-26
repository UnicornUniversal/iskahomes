"use client"
import React, { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import Model3DViewer from '../modules/Model3DViewer'
import { getAmenityIcon, getAmenityName } from '@/lib/StaticData'

const PreviewStep = ({ formData, accountType, onFinalize, developments = [] }) => {
  const [categoryNames, setCategoryNames] = useState({
    purposes: {},
    types: {},
    categories: {},
    subtypes: {}
  })
  const [developmentInfo, setDevelopmentInfo] = useState(null)

  // Fetch category names
  useEffect(() => {
    const fetchCategoryNames = async () => {
      try {
        const purposes = Array.isArray(formData?.purposes) 
          ? formData.purposes 
          : (typeof formData?.purposes === 'string' ? JSON.parse(formData.purposes || '[]') : [])
        
        const types = Array.isArray(formData?.types)
          ? formData.types
          : (typeof formData?.types === 'string' ? JSON.parse(formData.types || '[]') : [])
        
        const categories = Array.isArray(formData?.categories)
          ? formData.categories
          : (typeof formData?.categories === 'string' ? JSON.parse(formData.categories || '[]') : [])
        
        const subtypes = formData?.listing_types?.database || []

        const purposeIds = purposes.map(p => typeof p === 'object' ? p.id : p).filter(Boolean)
        const typeIds = types.map(t => typeof t === 'object' ? t.id : t).filter(Boolean)
        const categoryIds = categories.map(c => typeof c === 'object' ? c.id : c).filter(Boolean)
        const subtypeIds = subtypes.map(s => typeof s === 'object' ? s.id : s).filter(Boolean)

        const [purposesRes, typesRes, categoriesRes, subtypesRes] = await Promise.all([
          purposeIds.length > 0 
            ? fetch(`/api/cached-data?type=purposes`).then(r => r.json()).then(d => d.data || [])
            : Promise.resolve([]),
          typeIds.length > 0
            ? fetch(`/api/cached-data?type=types`).then(r => r.json()).then(d => d.data || [])
            : Promise.resolve([]),
          categoryIds.length > 0
            ? fetch(`/api/cached-data?type=categories`).then(r => r.json()).then(d => d.data || [])
            : Promise.resolve([]),
          subtypeIds.length > 0
            ? fetch(`/api/cached-data?type=subtypes`).then(r => r.json()).then(d => d.data || [])
            : Promise.resolve([])
        ])

        const purposeMap = {}
        purposesRes.forEach(p => { purposeMap[p.id] = p.name })

        const typeMap = {}
        typesRes.forEach(t => { typeMap[t.id] = t.name })

        const categoryMap = {}
        categoriesRes.forEach(c => { categoryMap[c.id] = c.name })

        const subtypeMap = {}
        subtypesRes.forEach(s => { subtypeMap[s.id] = s.name })

        setCategoryNames({
          purposes: purposeMap,
          types: typeMap,
          categories: categoryMap,
          subtypes: subtypeMap
        })
      } catch (error) {
        console.error('Error fetching category names:', error)
      }
    }

    if (formData) {
      fetchCategoryNames()
    }
  }, [formData])

  // Fetch development information
  useEffect(() => {
    const fetchDevelopmentInfo = async () => {
      if (accountType === 'developer' && formData?.development_id) {
        try {
          const token = localStorage.getItem('developer_token')
          const response = await fetch(`/api/developments/${formData.development_id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (response.ok) {
            const result = await response.json()
            setDevelopmentInfo(result.data)
          }
        } catch (error) {
          console.error('Error fetching development info:', error)
        }
      } else if (developments && developments.length > 0 && formData?.development_id) {
        // Find development from the developments array
        const dev = developments.find(d => d.id === formData.development_id)
        if (dev) {
          setDevelopmentInfo(dev)
        }
      }
    }

    fetchDevelopmentInfo()
  }, [formData?.development_id, accountType, developments])

  // Check if all required fields are filled
  const checkCompleteness = () => {
    const required = {
      'Basic Info': !!(formData?.title && formData?.description),
      'Categories': !!(formData?.purposes?.length > 0 && formData?.types?.length > 0 && formData?.categories?.length > 0),
      'Location': !!(formData?.location?.country && formData?.location?.city),
      'Pricing': !!(formData?.pricing?.price && formData?.pricing?.currency)
    }

    const missing = Object.entries(required).filter(([_, filled]) => !filled).map(([step]) => step)
    return { required, missing, isComplete: missing.length === 0 }
  }

  const { missing, isComplete } = checkCompleteness()

  // Get purposes with names
  const getPurposes = () => {
    const purposes = Array.isArray(formData?.purposes) 
      ? formData.purposes 
      : (typeof formData?.purposes === 'string' ? JSON.parse(formData.purposes || '[]') : [])
    
    return purposes.map(p => {
      const id = typeof p === 'object' ? p.id : p
      return categoryNames.purposes[id] || id
    })
  }

  // Get types with names
  const getTypes = () => {
    const types = Array.isArray(formData?.types)
      ? formData.types
      : (typeof formData?.types === 'string' ? JSON.parse(formData.types || '[]') : [])
    
    return types.map(t => {
      const id = typeof t === 'object' ? t.id : t
      return categoryNames.types[id] || id
    })
  }

  // Get categories with names
  const getCategories = () => {
    const categories = Array.isArray(formData?.categories)
      ? formData.categories
      : (typeof formData?.categories === 'string' ? JSON.parse(formData.categories || '[]') : [])
    
    return categories.map(c => {
      const id = typeof c === 'object' ? c.id : c
      return categoryNames.categories[id] || id
    })
  }

  // Get listing types (subtypes)
  const getListingTypes = () => {
    const types = []
    let listingTypes = formData?.listing_types
    if (typeof listingTypes === 'string') {
      try {
        listingTypes = JSON.parse(listingTypes)
      } catch (e) {
        listingTypes = {}
      }
    }
    
    if (listingTypes?.custom?.length > 0) {
      types.push(...listingTypes.custom)
    }
    if (listingTypes?.inbuilt?.length > 0) {
      types.push(...listingTypes.inbuilt)
    }
    if (listingTypes?.database?.length > 0) {
      listingTypes.database.forEach(subtypeId => {
        const id = typeof subtypeId === 'object' ? subtypeId.id : subtypeId
        const name = categoryNames.subtypes[id] || id
        types.push(name)
      })
    }
    return types
  }

  // Parse media data to get albums
  const getAlbums = () => {
    let mediaData = formData?.media
    if (typeof mediaData === 'string') {
      try {
        mediaData = JSON.parse(mediaData)
      } catch (e) {
        return []
      }
    }
    return mediaData?.albums || []
  }

  const albums = getAlbums()

  // Format price
  const formatPrice = () => {
    const pricingData = formData?.pricing
    const priceValue = pricingData?.price || formData?.price
    const currencyValue = pricingData?.currency || formData?.currency || 'GHS'
    const durationValue = pricingData?.duration || formData?.duration || ''
    const priceType = pricingData?.price_type || formData?.price_type || 'rent'
    
    if (!priceValue) return 'Not set'
    
    const priceNum = parseFloat(priceValue)
    const formattedPrice = priceNum.toLocaleString()
    
    let priceText = `${currencyValue} ${formattedPrice}`
    
    if (priceType === 'rent' && durationValue) {
      priceText += `/${durationValue}`
    }
    
    return priceText
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  // Get specifications display
  const getSpecifications = () => {
    const specs = formData?.specifications || {}
    const displaySpecs = []
    
    if (specs.bedrooms > 0) displaySpecs.push({ label: 'Bedrooms', value: specs.bedrooms })
    if (specs.bathrooms > 0) displaySpecs.push({ label: 'Bathrooms', value: specs.bathrooms })
    if (specs.living_rooms > 0) displaySpecs.push({ label: 'Living Rooms', value: specs.living_rooms })
    if (specs.kitchen > 0) displaySpecs.push({ label: 'Kitchens', value: specs.kitchen })
    if (specs.toilets > 0) displaySpecs.push({ label: 'Toilets', value: specs.toilets })
    if (specs.size || specs.property_size) displaySpecs.push({ label: 'Size', value: `${specs.size || specs.property_size} ${accountType === 'developer' ? 'sq ft' : 'sq m'}` })
    if (specs.floor_level > 0) displaySpecs.push({ label: 'Floor Level', value: specs.floor_level })
    if (specs.number_of_balconies > 0) displaySpecs.push({ label: 'Balconies', value: specs.number_of_balconies })
    if (specs.furnishing) displaySpecs.push({ label: 'Furnishing', value: specs.furnishing })
    if (specs.property_condition || specs.condition) displaySpecs.push({ label: 'Condition', value: specs.property_condition || specs.condition })
    if (specs.property_age) displaySpecs.push({ label: 'Property Age', value: specs.property_age })
    if (specs.building_style) displaySpecs.push({ label: 'Building Style', value: specs.building_style })
    if (specs.compound_type) displaySpecs.push({ label: 'Compound Type', value: specs.compound_type })
    if (specs.kitchen_type) displaySpecs.push({ label: 'Kitchen Type', value: specs.kitchen_type })
    if (specs.shared_electricity_meter) displaySpecs.push({ label: 'Electricity Meter', value: specs.shared_electricity_meter })
    if (specs.guest_room) displaySpecs.push({ label: 'Guest Room', value: specs.guest_room })
    if (specs.guest_washroom) displaySpecs.push({ label: 'Guest Washroom', value: specs.guest_washroom })
    
    return displaySpecs
  }

  return (
    <div className="space-y-8">
      {/* Status Section */}
      <div className="border-b border-white/20 pb-4">
        <div className="flex items-center gap-3 mb-2">
          {isComplete ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <h3>Ready to Publish</h3>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5" />
              <h3>Review Required</h3>
            </>
          )}
        </div>
        {isComplete ? (
          <p>All required information has been provided. You can finalize and publish your listing.</p>
        ) : (
          <div>
            <p className="mb-2">Please complete the following sections before finalizing:</p>
            <ul className="list-disc list-inside space-y-1">
              {missing.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Basic Information */}
      <div className="space-y-4 border-b border-white/20 pb-6">
        <h2>Basic Information</h2>
        
        {formData?.title && (
          <div>
            <p className="font-medium mb-1">Property Title</p>
            <p>{formData.title}</p>
          </div>
        )}

        {formData?.description && (
          <div>
            <p className="font-medium mb-1">Description</p>
            <p className="whitespace-pre-wrap">{formData.description}</p>
          </div>
        )}

        {formData?.size && (
          <div>
            <p className="font-medium mb-1">Size</p>
            <p>{formData.size} {accountType === 'developer' ? 'sq ft' : 'sq m'}</p>
          </div>
        )}

        {formData?.status && (
          <div>
            <p className="font-medium mb-1">Status</p>
            <p>{formData.status}</p>
          </div>
        )}

        {formData?.listing_type && (
          <div>
            <p className="font-medium mb-1">Listing Type</p>
            <p>{formData.listing_type}</p>
          </div>
        )}

        {accountType === 'developer' && developmentInfo && (
          <div>
            <p className="font-medium mb-3">Development</p>
            <div className="space-y-3">
              {/* Banner Image */}
              {(developmentInfo.banner?.url || developmentInfo.banner) && (
                <div className="relative w-full h-48 overflow-hidden">
                  <img
                    src={developmentInfo.banner?.url || developmentInfo.banner}
                    alt={developmentInfo.title || developmentInfo.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <p className="font-semibold">{developmentInfo.title || developmentInfo.name}</p>
                {developmentInfo.description && (
                  <p className="text-sm">{developmentInfo.description}</p>
                )}
                {developmentInfo.full_address && (
                  <p className="text-sm">{developmentInfo.full_address}</p>
                )}
                {(developmentInfo.city || developmentInfo.state || developmentInfo.country) && (
                  <p className="text-sm">
                    {[developmentInfo.city, developmentInfo.state, developmentInfo.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-4 border-b border-white/50 pb-6">
        <h2>Categories</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getPurposes().length > 0 && (
            <div>
              <p className="font-medium mb-1">Property Purpose</p>
              <p>{getPurposes().join(', ')}</p>
            </div>
          )}

          {getTypes().length > 0 && (
            <div>
              <p className="font-medium mb-1">Property Type</p>
              <p>{getTypes().join(', ')}</p>
            </div>
          )}

          {getCategories().length > 0 && (
            <div>
              <p className="font-medium mb-1">Category</p>
              <p>{getCategories().join(', ')}</p>
            </div>
          )}

          {getListingTypes().length > 0 && (
            <div>
              <p className="font-medium mb-1">Subtype</p>
              <p>{getListingTypes().join(', ')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Specifications */}
      {getSpecifications().length > 0 && (
        <div className="space-y-4 border-b border-white/50 pb-6">
          <h2>Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getSpecifications().map((spec, index) => (
              <div key={index}>
                <p className="font-medium mb-1">{spec.label}</p>
                <p>{spec.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Location */}
      {formData?.location && (
        <div className="space-y-4 border-b border-white/50 pb-6">
          <h2>Location</h2>
          
          {formData.location.fullAddress && (
            <div>
              <p className="font-medium mb-1">Full Address</p>
              <p>{formData.location.fullAddress}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {formData.location.country && (
              <div>
                <p className="font-medium mb-1">Country</p>
                <p>{formData.location.country}</p>
              </div>
            )}

            {formData.location.state && (
              <div>
                <p className="font-medium mb-1">State</p>
                <p>{formData.location.state}</p>
              </div>
            )}

            {formData.location.city && (
              <div>
                <p className="font-medium mb-1">City</p>
                <p>{formData.location.city}</p>
              </div>
            )}

            {formData.location.town && (
              <div>
                <p className="font-medium mb-1">Town</p>
                <p>{formData.location.town}</p>
              </div>
            )}
          </div>

          {(formData.location.coordinates?.latitude || formData.location.coordinates?.longitude) && (
            <div className="grid grid-cols-2 gap-4">
              {formData.location.coordinates.latitude && (
                <div>
                  <p className="font-medium mb-1">Latitude</p>
                  <p>{formData.location.coordinates.latitude}</p>
                </div>
              )}
              {formData.location.coordinates.longitude && (
                <div>
                  <p className="font-medium mb-1">Longitude</p>
                  <p>{formData.location.coordinates.longitude}</p>
                </div>
              )}
            </div>
          )}

          {formData.location.additionalInformation && (
            <div>
              <p className="font-medium mb-1">Additional Location Information</p>
              <p>{formData.location.additionalInformation}</p>
            </div>
          )}
        </div>
      )}

      {/* Pricing */}
      {formData?.pricing && (
        <div className="space-y-4 border-b border-white/50 pb-6">
          <h2>Pricing</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formData.pricing.price && (
              <div>
                <p className="font-medium mb-1">Price</p>
                <p>{formatPrice()}</p>
              </div>
            )}

            {formData.pricing.currency && (
              <div>
                <p className="font-medium mb-1">Currency</p>
                <p>{formData.pricing.currency}</p>
              </div>
            )}

            {formData.pricing.price_type && (
              <div>
                <p className="font-medium mb-1">Price Type</p>
                <p className="capitalize">{formData.pricing.price_type}</p>
              </div>
            )}

            {formData.pricing.duration && (
              <div>
                <p className="font-medium mb-1">Duration</p>
                <p className="capitalize">{formData.pricing.duration}</p>
              </div>
            )}

            {formData.pricing.time && (
              <div>
                <p className="font-medium mb-1">Time</p>
                <p>{formData.pricing.time}</p>
              </div>
            )}

            {formData.pricing.ideal_duration && (
              <div>
                <p className="font-medium mb-1">Ideal Duration</p>
                <p>{formData.pricing.ideal_duration} {formData.pricing.time_span || 'months'}</p>
              </div>
            )}

            {formData.pricing.estimated_revenue && (
              <div>
                <p className="font-medium mb-1">Estimated Revenue</p>
                <p>{formData.pricing.currency || 'GHS'} {parseFloat(formData.pricing.estimated_revenue).toLocaleString()}</p>
              </div>
            )}

            <div>
              <p className="font-medium mb-1">Negotiable</p>
              <p>{formData.pricing.is_negotiable ? 'Yes' : 'No'}</p>
            </div>

            <div>
              <p className="font-medium mb-1">Flexible Terms</p>
              <p>{formData.pricing.flexible_terms ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {formData.pricing.cancellation_policy && (
            <div>
              <p className="font-medium mb-1">Cancellation Policy</p>
              <p>{formData.pricing.cancellation_policy}</p>
            </div>
          )}

          {formData.pricing.security_requirements && (
            <div>
              <p className="font-medium mb-1">Security Requirements</p>
              <p>{formData.pricing.security_requirements}</p>
            </div>
          )}
        </div>
      )}

      {/* Availability */}
      {formData?.availability && (
        <div className="space-y-4 border-b border-white/50 pb-6">
          <h2>Availability</h2>
          
          {formData.availability.available_from && (
            <div>
              <p className="font-medium mb-1">Available From</p>
              <p>{formatDate(formData.availability.available_from)}</p>
            </div>
          )}

          {formData.availability.available_until && (
            <div>
              <p className="font-medium mb-1">Available Until</p>
              <p>{formatDate(formData.availability.available_until)}</p>
            </div>
          )}

          {formData.availability.acquisition_rules && (
            <div>
              <p className="font-medium mb-1">Acquisition Rules</p>
              <p>{formData.availability.acquisition_rules}</p>
            </div>
          )}
        </div>
      )}

      {/* Amenities */}
      {formData?.amenities && (
        <div className="space-y-4 border-b border-white/50 pb-6">
          <h2>Amenities</h2>
          
          {formData.amenities.inbuilt && formData.amenities.inbuilt.length > 0 && (
            <div>
              <p className="font-medium mb-3">Inbuilt Amenities</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {formData.amenities.inbuilt.map((amenity, index) => {
                  const icon = getAmenityIcon(amenity)
                  const name = getAmenityName(amenity) || amenity
                  return (
                    <div key={index} className="flex items-center gap-2">
                      {icon && <span className="flex-shrink-0">{icon}</span>}
                      <span>{name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {formData.amenities.custom && formData.amenities.custom.length > 0 && (
            <div>
              <p className="font-medium mb-3">Custom Amenities</p>
              <div className="flex flex-wrap gap-2">
                {formData.amenities.custom.map((amenity, index) => (
                  <span key={index} className="px-3 py-1 border border-white/30">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Social Amenities */}
      {formData?.social_amenities && (
        <div className="space-y-4 border-b border-white/50 pb-6">
          <h2>Social Amenities</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formData.social_amenities.schools && formData.social_amenities.schools.length > 0 && (
              <div className="p-4 border border-white/30">
                <p className="font-medium mb-2">Schools</p>
                <p className="text-sm mb-2">{formData.social_amenities.schools.length} found</p>
                <div className="space-y-1">
                  {formData.social_amenities.schools.slice(0, 3).map((school, index) => (
                    <p key={index} className="text-sm">{school.name || school}</p>
                  ))}
                  {formData.social_amenities.schools.length > 3 && (
                    <p className="text-sm">+{formData.social_amenities.schools.length - 3} more</p>
                  )}
                </div>
              </div>
            )}

            {formData.social_amenities.hospitals && formData.social_amenities.hospitals.length > 0 && (
              <div className="p-4 border border-white/30">
                <p className="font-medium mb-2">Hospitals</p>
                <p className="text-sm mb-2">{formData.social_amenities.hospitals.length} found</p>
                <div className="space-y-1">
                  {formData.social_amenities.hospitals.slice(0, 3).map((hospital, index) => (
                    <p key={index} className="text-sm">{hospital.name || hospital}</p>
                  ))}
                  {formData.social_amenities.hospitals.length > 3 && (
                    <p className="text-sm">+{formData.social_amenities.hospitals.length - 3} more</p>
                  )}
                </div>
              </div>
            )}

            {formData.social_amenities.airports && formData.social_amenities.airports.length > 0 && (
              <div className="p-4 border border-white/30">
                <p className="font-medium mb-2">Airports</p>
                <p className="text-sm mb-2">{formData.social_amenities.airports.length} found</p>
                <div className="space-y-1">
                  {formData.social_amenities.airports.slice(0, 3).map((airport, index) => (
                    <p key={index} className="text-sm">{airport.name || airport}</p>
                  ))}
                  {formData.social_amenities.airports.length > 3 && (
                    <p className="text-sm">+{formData.social_amenities.airports.length - 3} more</p>
                  )}
                </div>
              </div>
            )}

            {formData.social_amenities.parks && formData.social_amenities.parks.length > 0 && (
              <div className="p-4 border border-white/30">
                <p className="font-medium mb-2">Parks</p>
                <p className="text-sm mb-2">{formData.social_amenities.parks.length} found</p>
                <div className="space-y-1">
                  {formData.social_amenities.parks.slice(0, 3).map((park, index) => (
                    <p key={index} className="text-sm">{park.name || park}</p>
                  ))}
                  {formData.social_amenities.parks.length > 3 && (
                    <p className="text-sm">+{formData.social_amenities.parks.length - 3} more</p>
                  )}
                </div>
              </div>
            )}

            {formData.social_amenities.shops && formData.social_amenities.shops.length > 0 && (
              <div className="p-4 border border-white/30">
                <p className="font-medium mb-2">Shops</p>
                <p className="text-sm mb-2">{formData.social_amenities.shops.length} found</p>
                <div className="space-y-1">
                  {formData.social_amenities.shops.slice(0, 3).map((shop, index) => (
                    <p key={index} className="text-sm">{shop.name || shop}</p>
                  ))}
                  {formData.social_amenities.shops.length > 3 && (
                    <p className="text-sm">+{formData.social_amenities.shops.length - 3} more</p>
                  )}
                </div>
              </div>
            )}

            {formData.social_amenities.police && formData.social_amenities.police.length > 0 && (
              <div className="p-4 border border-white/30">
                <p className="font-medium mb-2">Police Stations</p>
                <p className="text-sm mb-2">{formData.social_amenities.police.length} found</p>
                <div className="space-y-1">
                  {formData.social_amenities.police.slice(0, 3).map((police, index) => (
                    <p key={index} className="text-sm">{police.name || police}</p>
                  ))}
                  {formData.social_amenities.police.length > 3 && (
                    <p className="text-sm">+{formData.social_amenities.police.length - 3} more</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Media */}
      <div className="space-y-4 border-b border-white/50 pb-6">
        <h2>Media</h2>
        
        {/* Albums with Images */}
        {albums.length > 0 && (
          <div className="space-y-4">
            {albums.map((album) => (
              <div key={album.id || album.name} className="space-y-3">
                <div>
                  <p className="font-medium mb-1">Album: {album.name}</p>
                  {album.images && album.images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
                      {album.images.map((image, index) => (
                        <div key={image.id || index} className="aspect-square overflow-hidden">
                          <img
                            src={image.url || image}
                            alt={`${album.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No images in this album</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video */}
        {formData?.media?.video && (
          <div>
            <p className="font-medium mb-2">Video</p>
            <video
              src={formData.media.video.url || (typeof formData.media.video === 'string' ? formData.media.video : formData.media.video.url)}
              controls
              className="w-full max-w-2xl"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {/* YouTube URL */}
        {formData?.media?.youtubeUrl && (
          <div>
            <p className="font-medium mb-2">YouTube Video</p>
            <div className="aspect-video max-w-2xl">
              {(() => {
                const url = formData.media.youtubeUrl
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
                const match = url.match(regExp)
                const videoId = (match && match[2].length === 11) ? match[2] : null
                return videoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : (
                  <p>{formData.media.youtubeUrl}</p>
                )
              })()}
            </div>
          </div>
        )}

        {/* Virtual Tour URL */}
        {formData?.media?.virtualTourUrl && (
          <div>
            <p className="font-medium mb-2">Virtual Tour URL</p>
            <p>{formData.media.virtualTourUrl}</p>
          </div>
        )}
      </div>

      {/* Immersive Experience */}
      {(formData?.model_3d || formData?.virtual_tour_link) && (
        <div className="space-y-4 border-b border-white/50 pb-6">
          <h2>Immersive Experience</h2>
          
          {formData.model_3d && (
            <div>
              <p className="font-medium mb-2">3D Model</p>
              {(() => {
                const getModelFormat = () => {
                  if (!formData.model_3d) return 'glb'
                  const fileName = formData.model_3d.originalName || 
                                   formData.model_3d.name || 
                                   formData.model_3d.filename || 
                                   ''
                  if (fileName && fileName.includes('.')) {
                    return fileName.split('.').pop().toLowerCase()
                  }
                  return 'glb'
                }
                return (
                  <Model3DViewer 
                    modelUrl={formData.model_3d.url}
                    modelFormat={getModelFormat()}
                    width="100%"
                    height="400px"
                    showControls={true}
                    autoRotate={true}
                  />
                )
              })()}
            </div>
          )}

          {formData.virtual_tour_link && (
            <div>
              <p className="font-medium mb-1">Virtual Tour Link</p>
              <p>{formData.virtual_tour_link}</p>
            </div>
          )}
        </div>
      )}

      {/* Additional Information */}
      {formData?.additional_information && (
        <div className="space-y-4 border-b border-white/50 pb-6">
          <h2>Additional Information</h2>
          <p className="whitespace-pre-wrap">{formData.additional_information}</p>
        </div>
      )}

      {/* Floor Plan */}
      {formData?.floor_plan && (
        <div className="space-y-4 border-b border-white/50 pb-6">
          <h2>Floor Plan</h2>
          <p>{formData.floor_plan.name || formData.floor_plan.filename || 'Floor plan uploaded'}</p>
        </div>
      )}

      {/* Publish Button */}
      {onFinalize && (
        <div className="pt-6 border-t border-white/20">
          <button
            onClick={onFinalize}
            disabled={!isComplete}
            className={`secondary_button w-full flex items-center justify-center ${!isComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isComplete ? 'Finalize and Publish Listing' : 'Complete Required Sections First'}
          </button>
        </div>
      )}
    </div>
  )
}

export default PreviewStep
