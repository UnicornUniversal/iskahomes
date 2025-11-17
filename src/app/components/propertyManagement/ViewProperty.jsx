"use client"
import React, { useState, useEffect } from 'react'
import { 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  DollarSign,
  Home,
  Car,
  Wifi,
  Shield,
  Clock,
  FileText,
  CheckCircle,
  X,
  Image as ImageIcon,
  Video,
  Globe,
  Calendar,
  Star,
  Eye
} from 'lucide-react'
import { getAmenityIcon, getAmenityName } from '@/lib/StaticData'

const ViewProperty = ({ formData, accountType }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [show3DModel, setShow3DModel] = useState(false)
  const [categoryNames, setCategoryNames] = useState({
    purposes: {},
    types: {},
    categories: {},
    subtypes: {}
  })

  // Fetch category names from database
  useEffect(() => {
    const fetchCategoryNames = async () => {
      try {
        // Parse purposes, types, categories from formData (they might be strings or arrays)
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

        // Extract IDs (handle both string IDs and objects)
        const purposeIds = purposes.map(p => typeof p === 'object' ? p.id : p).filter(Boolean)
        const typeIds = types.map(t => typeof t === 'object' ? t.id : t).filter(Boolean)
        const categoryIds = categories.map(c => typeof c === 'object' ? c.id : c).filter(Boolean)
        const subtypeIds = subtypes.map(s => typeof s === 'object' ? s.id : s).filter(Boolean)

        // Fetch all in parallel
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

        // Create lookup maps
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

  // Get all media files from albums
  const getAllMediaFiles = () => {
    const files = []
    
    // Handle media as object or string
    let mediaData = formData?.media
    if (typeof mediaData === 'string') {
      try {
        mediaData = JSON.parse(mediaData)
      } catch (e) {
        console.error('Error parsing media:', e)
        return files
      }
    }
    
    if (mediaData?.albums && Array.isArray(mediaData.albums)) {
      mediaData.albums.forEach(album => {
        if (album?.images && Array.isArray(album.images)) {
          files.push(...album.images)
        }
      })
    }
    
    // Fallback to mediaFiles for backward compatibility
    if (files.length === 0 && mediaData?.mediaFiles && Array.isArray(mediaData.mediaFiles)) {
      files.push(...mediaData.mediaFiles)
    }
    
    return files
  }

  const mediaFiles = getAllMediaFiles()
  const mainImage = mediaFiles[selectedImageIndex]?.url || mediaFiles[0]?.url

  // Parse media data
  let mediaData = formData?.media
  if (typeof mediaData === 'string') {
    try {
      mediaData = JSON.parse(mediaData)
    } catch (e) {
      mediaData = {}
    }
  }
  const video = mediaData?.video || null
  const youtubeUrl = mediaData?.youtubeUrl || ''
  const virtualTourUrl = mediaData?.virtualTourUrl || ''
  
  // Parse 3D model
  let model3D = formData?.model_3d
  if (typeof model3D === 'string') {
    try {
      model3D = JSON.parse(model3D)
    } catch (e) {
      model3D = null
    }
  }
  
  // Parse floor plan
  let floorPlan = formData?.floor_plan
  if (typeof floorPlan === 'string') {
    try {
      floorPlan = JSON.parse(floorPlan)
    } catch (e) {
      floorPlan = null
    }
  }

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

  // Get specifications - handle both object and string
  const getSpecifications = () => {
    let specs = formData?.specifications
    if (typeof specs === 'string') {
      try {
        specs = JSON.parse(specs)
      } catch (e) {
        specs = {}
      }
    }
    
    if (!specs) return {}
    
    return {
      bedrooms: specs.bedrooms || 0,
      bathrooms: specs.bathrooms || 0,
      living_rooms: specs.living_rooms || 0,
      kitchen: specs.kitchen || 0,
      toilets: specs.toilets || 0,
      size: specs.property_size || specs.size || formData?.size || 0,
      floor_level: specs.floor_level || 0,
      furnishing: specs.furnishing || null,
      property_age: specs.property_age || null,
      property_condition: specs.property_condition || specs.condition || null,
      building_style: specs.building_style || null,
      compound_type: specs.compound_type || null,
      kitchen_type: specs.kitchen_type || null,
      number_of_balconies: specs.number_of_balconies || 0,
      shared_electricity_meter: specs.shared_electricity_meter || null,
      guest_room: specs.guest_room || null,
      guest_washroom: specs.guest_washroom || null,
      ...specs
    }
  }

  const specs = getSpecifications()

  // Format specification labels
  const formatSpecLabel = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  // Check if a spec value should be displayed
  const shouldDisplaySpec = (key, value) => {
    if (value === null || value === undefined || value === '') return false
    if (typeof value === 'number' && value === 0 && !['floor_level', 'number_of_balconies'].includes(key)) return false
    return true
  }

  // Get listing types with names
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
      // Map database subtypes to names
      listingTypes.database.forEach(subtypeId => {
        const id = typeof subtypeId === 'object' ? subtypeId.id : subtypeId
        const name = categoryNames.subtypes[id] || id
        types.push(name)
      })
    }
    return types
  }

  const listingTypes = getListingTypes()

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

  // Get location string - use flat fields from formData or location object
  const getLocationString = () => {
    const parts = []
    const town = formData?.location?.town || formData?.town
    const city = formData?.location?.city || formData?.city
    const state = formData?.location?.state || formData?.state
    const country = formData?.location?.country || formData?.country
    
    if (town) parts.push(town)
    if (city) parts.push(city)
    if (state) parts.push(state)
    if (country) parts.push(country)
    
    return parts.length > 0 ? parts.join(', ') : 'Location not set'
  }

  // Get full address
  const getFullAddress = () => {
    return formData?.location?.fullAddress || formData?.full_address || getLocationString()
  }

  // Parse amenities - handle both object and string, and use 'general' instead of 'inbuilt'
  const getAmenities = () => {
    let amenities = formData?.amenities
    if (typeof amenities === 'string') {
      try {
        amenities = JSON.parse(amenities)
      } catch (e) {
        amenities = {}
      }
    }
    
    return {
      general: amenities?.general || amenities?.inbuilt || [],
      custom: amenities?.custom || [],
      database: amenities?.database || []
    }
  }

  const amenities = getAmenities()

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="relative h-[400px]">
          {mainImage ? (
            <img
              src={mainImage}
              alt={formData?.title || 'Property'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <div className="text-white text-6xl font-bold">
                {formData?.title?.charAt(0) || 'P'}
              </div>
            </div>
          )}
          
          {/* Image Navigation */}
          {mediaFiles.length > 1 && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
              {mediaFiles.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    index === selectedImageIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Price Badge */}
          {formData?.pricing?.price && (
            <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-xl shadow-lg">
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice()}
              </div>
              <div className="text-sm text-gray-600">
                {formData.pricing.price_type === 'rent' ? 'Rent' : 'Sale'}
              </div>
            </div>
          )}

          {/* 3D Model Button */}
          {model3D?.url && (
            <button
              onClick={() => setShow3DModel(!show3DModel)}
              className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-xl hover:bg-white transition-all duration-300 shadow-lg"
            >
              <Eye className="w-5 h-5 mr-2 inline" />
              {show3DModel ? 'Hide 3D' : 'View 3D'}
            </button>
          )}

          {/* Status Badge */}
          {formData?.status && (
            <div className="absolute bottom-6 right-6 bg-green-500 text-white px-4 py-2 rounded-lg font-medium">
              {formData.status}
            </div>
          )}
        </div>

        {/* Thumbnail Gallery */}
        {mediaFiles.length > 1 && (
          <div className="p-6 bg-gray-50">
            <div className="flex space-x-3 overflow-x-auto">
              {mediaFiles.map((file, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-3 transition-all duration-300 ${
                    index === selectedImageIndex ? 'border-blue-500 scale-105' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={file.url}
                    alt={`${formData?.title || 'Property'} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Video Section */}
        {(video?.url || youtubeUrl) && (
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Video</h3>
            {video?.url ? (
              <div className="rounded-xl overflow-hidden">
                <video
                  src={video.url}
                  controls
                  className="w-full h-auto max-h-[500px]"
                  poster={mainImage}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : youtubeUrl ? (
              <div className="rounded-xl overflow-hidden">
                <iframe
                  src={youtubeUrl.replace('watch?v=', 'embed/').split('&')[0]}
                  className="w-full aspect-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : null}
          </div>
        )}

        {/* Floor Plan Section */}
        {floorPlan?.url && (
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Floor Plan</h3>
            <div className="rounded-xl overflow-hidden bg-white p-4">
              <img
                src={floorPlan.url}
                alt="Floor Plan"
                className="w-full h-auto max-h-[600px] object-contain"
              />
            </div>
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {formData?.title || 'Untitled Property'}
            </h1>
            
            <div className="flex items-center text-gray-600 mb-6">
              <MapPin className="w-6 h-6 mr-3 text-blue-600" />
              <span className="text-lg">
                {getFullAddress() || getLocationString()}
              </span>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-3 mb-6">
              {formData?.is_featured && (
                <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium flex items-center">
                  <Star className="w-4 h-4 mr-2" />
                  Featured
                </span>
              )}
              {formData?.is_verified && (
                <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verified
                </span>
              )}
              {formData?.is_premium && (
                <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                  Premium
                </span>
              )}
              {formData?.pricing?.is_negotiable && (
                <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                  Negotiable
                </span>
              )}
            </div>

            {/* Purposes, Types, Categories */}
            {(getPurposes().length > 0 || getTypes().length > 0 || getCategories().length > 0) && (
              <div className="mb-6 space-y-4">
                {getPurposes().length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Property Purposes</h4>
                    <div className="flex flex-wrap gap-2">
                      {getPurposes().map((purpose, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {purpose}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {getTypes().length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Property Types</h4>
                    <div className="flex flex-wrap gap-2">
                      {getTypes().map((type, index) => (
                        <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {getCategories().length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Property Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {getCategories().map((category, index) => (
                        <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {listingTypes.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Listing Types</h4>
                    <div className="flex flex-wrap gap-2">
                      {listingTypes.map((type, index) => (
                        <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Key Specifications Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 pt-6 border-t border-gray-200">
          {specs.bedrooms > 0 && (
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <Bed className="w-8 h-8 mx-auto mb-3 text-blue-600" />
              <div className="text-2xl font-bold text-gray-900">{specs.bedrooms}</div>
              <div className="text-sm text-gray-600">Bedrooms</div>
            </div>
          )}
          {specs.bathrooms > 0 && (
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <Bath className="w-8 h-8 mx-auto mb-3 text-green-600" />
              <div className="text-2xl font-bold text-gray-900">{specs.bathrooms}</div>
              <div className="text-sm text-gray-600">Bathrooms</div>
            </div>
          )}
          {specs.size > 0 && (
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <Square className="w-8 h-8 mx-auto mb-3 text-purple-600" />
              <div className="text-2xl font-bold text-gray-900">{specs.size}</div>
              <div className="text-sm text-gray-600">
                {accountType === 'developer' ? 'sq ft' : 'sq m'}
              </div>
            </div>
          )}
          {specs.floor_level > 0 && (
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
              <div className="w-8 h-8 mx-auto mb-3 text-orange-600">🏢</div>
              <div className="text-2xl font-bold text-gray-900">{specs.floor_level}</div>
              <div className="text-sm text-gray-600">Floor Level</div>
            </div>
          )}
          {specs.living_rooms > 0 && (
            <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
              <Home className="w-8 h-8 mx-auto mb-3 text-indigo-600" />
              <div className="text-2xl font-bold text-gray-900">{specs.living_rooms}</div>
              <div className="text-sm text-gray-600">Living Rooms</div>
            </div>
          )}
          {specs.number_of_balconies > 0 && (
            <div className="text-center p-6 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl">
              <div className="w-8 h-8 mx-auto mb-3 text-teal-600">🌿</div>
              <div className="text-2xl font-bold text-gray-900">{specs.number_of_balconies}</div>
              <div className="text-sm text-gray-600">Balconies</div>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {formData?.description && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Description</h2>
          <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
            {formData.description}
          </p>
        </div>
      )}

      {/* Pricing Information */}
      {(formData?.pricing || formData?.price) && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold mb-6 text-gray-900">Pricing</h3>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Price</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatPrice()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Price Type</div>
                <div className="text-lg font-semibold text-gray-900 capitalize">
                  {formData?.pricing?.price_type || formData?.price_type || 'N/A'}
                </div>
              </div>
              {(formData?.pricing?.duration || formData?.duration) && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Duration</div>
                  <div className="text-lg font-semibold text-gray-900 capitalize">
                    {formData?.pricing?.duration || formData?.duration}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-600 mb-1">Negotiable</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formData?.pricing?.is_negotiable || formData?.is_negotiable ? 'Yes' : 'No'}
                </div>
              </div>
              {(formData?.pricing?.security_requirements || formData?.security_requirements) && (
                <div className="md:col-span-2">
                  <div className="text-sm text-gray-600 mb-1">Security Requirements</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formData?.pricing?.security_requirements || formData?.security_requirements}
                  </div>
                </div>
              )}
            </div>
            {(formData?.pricing?.cancellation_policy || formData?.cancellation_policy) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Cancellation Policy</div>
                <div className="text-gray-900">
                  {formData?.pricing?.cancellation_policy || formData?.cancellation_policy}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Complete Specifications Details */}
      {Object.keys(specs).length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold mb-6 text-gray-900">Complete Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Property Details Column */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h4>
              <div className="space-y-3">
                {shouldDisplaySpec('furnishing', specs.furnishing) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Furnishing:</span>
                    <span className="font-medium capitalize">{specs.furnishing}</span>
                  </div>
                )}
                {shouldDisplaySpec('property_condition', specs.property_condition) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Condition:</span>
                    <span className="font-medium capitalize">{specs.property_condition}</span>
                  </div>
                )}
                {shouldDisplaySpec('property_age', specs.property_age) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property Age:</span>
                    <span className="font-medium capitalize">{specs.property_age}</span>
                  </div>
                )}
                {shouldDisplaySpec('building_style', specs.building_style) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Building Style:</span>
                    <span className="font-medium capitalize">{specs.building_style}</span>
                  </div>
                )}
                {shouldDisplaySpec('compound_type', specs.compound_type) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Compound Type:</span>
                    <span className="font-medium capitalize">{specs.compound_type}</span>
                  </div>
                )}
                {shouldDisplaySpec('size', specs.size) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium">
                      {specs.size} {accountType === 'developer' ? 'sq ft' : 'sq m'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Kitchen & Interior Column */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Kitchen & Interior</h4>
              <div className="space-y-3">
                {shouldDisplaySpec('kitchen_type', specs.kitchen_type) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kitchen Type:</span>
                    <span className="font-medium capitalize">{specs.kitchen_type.replace(/_/g, ' ')}</span>
                  </div>
                )}
                {shouldDisplaySpec('kitchen', specs.kitchen) && specs.kitchen > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kitchens:</span>
                    <span className="font-medium">{specs.kitchen}</span>
                  </div>
                )}
                {shouldDisplaySpec('toilets', specs.toilets) && specs.toilets > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Toilets:</span>
                    <span className="font-medium">{specs.toilets}</span>
                  </div>
                )}
                {shouldDisplaySpec('guest_room', specs.guest_room) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guest Room:</span>
                    <span className="font-medium capitalize">{specs.guest_room}</span>
                  </div>
                )}
                {shouldDisplaySpec('guest_washroom', specs.guest_washroom) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guest Washroom:</span>
                    <span className="font-medium capitalize">{specs.guest_washroom}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Utilities & Features Column */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Utilities & Features</h4>
              <div className="space-y-3">
                {shouldDisplaySpec('shared_electricity_meter', specs.shared_electricity_meter) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Electricity Meter:</span>
                    <span className="font-medium capitalize">{specs.shared_electricity_meter}</span>
                  </div>
                )}
                {/* Display any other specification fields that exist */}
                {Object.entries(specs).map(([key, value]) => {
                  // Skip already displayed fields
                  const displayedFields = [
                    'bedrooms', 'bathrooms', 'size', 'floor_level', 'living_rooms', 
                    'number_of_balconies', 'furnishing', 'property_condition', 'property_age',
                    'building_style', 'compound_type', 'kitchen_type', 'kitchen', 'toilets',
                    'guest_room', 'guest_washroom', 'shared_electricity_meter'
                  ]
                  if (displayedFields.includes(key) || !shouldDisplaySpec(key, value)) return null
                  
                  return (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600">{formatSpecLabel(key)}:</span>
                      <span className="font-medium">
                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : 
                         typeof value === 'string' ? value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) :
                         value}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Amenities */}
      {(amenities.general?.length > 0 || amenities.database?.length > 0 || amenities.custom?.length > 0) && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold mb-6 text-gray-900">Amenities</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {amenities.general?.map((amenity, index) => {
              const iconElement = getAmenityIcon(amenity)
              return (
                <div key={index} className="flex items-center p-4 bg-blue-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    {iconElement || <Home className="w-5 h-5 text-blue-600" />}
                  </div>
                  <span className="font-medium text-gray-900">
                    {getAmenityName(amenity) || amenity}
                  </span>
                </div>
              )
            })}
            {amenities.database?.map((amenity, index) => (
              <div key={`database-${index}`} className="flex items-center p-4 bg-green-50 rounded-xl">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-medium text-gray-900">Custom Amenity</span>
              </div>
            ))}
            {amenities.custom?.map((amenity, index) => (
              <div key={`custom-${index}`} className="flex items-center p-4 bg-purple-50 rounded-xl">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Star className="w-5 h-5 text-purple-600" />
                </div>
                <span className="font-medium text-gray-900">{amenity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Location Map */}
      {(formData?.location?.coordinates?.latitude || formData?.latitude) && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold mb-6 text-gray-900">Location</h3>
          <div className="bg-gray-100 rounded-xl p-6 h-96 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Interactive map will be displayed here</p>
              <p className="text-sm text-gray-500 mt-2">
                Coordinates: {formData?.location?.coordinates?.latitude || formData?.latitude}, {formData?.location?.coordinates?.longitude || formData?.longitude}
              </p>
            </div>
          </div>
          {(formData?.location?.additionalInformation || formData?.location_additional_information) && (
            <div className="mt-4 bg-blue-50 p-4 rounded-xl">
              <p className="text-gray-700">
                {formData?.location?.additionalInformation || formData?.location_additional_information}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Additional Details */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Terms & Conditions</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Cancellation:</span>
                <span className="font-medium">
                  {formData?.pricing?.cancellation_policy || formData?.cancellation_policy || 'Standard'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Negotiable:</span>
                <span className="font-medium">
                  {formData?.pricing?.is_negotiable || formData?.is_negotiable ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Flexible Terms:</span>
                <span className="font-medium">
                  {formData?.flexible_terms ? 'Yes' : 'No'}
                </span>
              </div>
              {(formData?.pricing?.security_requirements || formData?.security_requirements) && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Security:</span>
                  <span className="font-medium">
                    {formData?.pricing?.security_requirements || formData?.security_requirements}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Availability</h4>
            <div className="space-y-3">
              {(formData?.availability?.available_from || formData?.available_from) && (
                <div className="flex items-center p-3 bg-green-50 rounded-xl">
                  <Calendar className="w-5 h-5 mr-3 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">Available From</div>
                    <div className="text-sm text-gray-600">
                      {formData?.availability?.available_from || formData?.available_from 
                        ? new Date(formData?.availability?.available_from || formData?.available_from).toLocaleDateString()
                        : 'Immediately'}
                    </div>
                  </div>
                </div>
              )}
              {(formData?.availability?.available_until || formData?.available_until) && (
                <div className="flex items-center p-3 bg-red-50 rounded-xl">
                  <Calendar className="w-5 h-5 mr-3 text-red-600" />
                  <div>
                    <div className="font-medium text-gray-900">Available Until</div>
                    <div className="text-sm text-gray-600">
                      {new Date(formData?.availability?.available_until || formData?.available_until).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      {formData?.additional_information && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">Additional Information</h3>
          <div className="bg-gray-50 p-6 rounded-xl">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {formData.additional_information}
            </p>
          </div>
        </div>
      )}

      {/* Acquisition Rules */}
      {(formData?.availability?.acquisition_rules || formData?.acquisition_rules) && 
       (formData?.availability?.acquisition_rules !== 'None' && formData?.acquisition_rules !== 'None') && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">Acquisition Rules</h3>
          <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {formData?.availability?.acquisition_rules || formData?.acquisition_rules}
            </p>
          </div>
        </div>
      )}

      {/* Social Amenities */}
      {formData?.social_amenities && (
        (formData.social_amenities.schools?.length > 0 ||
         formData.social_amenities.hospitals?.length > 0 ||
         formData.social_amenities.airports?.length > 0 ||
         formData.social_amenities.parks?.length > 0 ||
         formData.social_amenities.shops?.length > 0 ||
         formData.social_amenities.police?.length > 0) && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Nearby Amenities</h2>
            <div className="space-y-6">
              {formData.social_amenities.schools?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Schools ({formData.social_amenities.schools.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {formData.social_amenities.schools.slice(0, 4).map((school, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium text-gray-900">{school.name}</div>
                        {school.distance && (
                          <div className="text-sm text-gray-600">{school.distance.toFixed(2)} km away</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {formData.social_amenities.hospitals?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Hospitals ({formData.social_amenities.hospitals.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {formData.social_amenities.hospitals.slice(0, 4).map((hospital, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium text-gray-900">{hospital.name}</div>
                        {hospital.distance && (
                          <div className="text-sm text-gray-600">{hospital.distance.toFixed(2)} km away</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  )
}

export default ViewProperty


