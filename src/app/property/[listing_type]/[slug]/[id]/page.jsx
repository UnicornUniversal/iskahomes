'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Calendar, 
  DollarSign, 
  Users, 
  Phone, 
  Mail, 
  Globe,
  ArrowLeft,
  Share2,
  Heart,
  Eye,
  Star,
  CheckCircle,
  AlertCircle,
  Home,
  Car,
  Wifi,
  Shield,
  Clock,
  FileText,
  MessageCircle,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Map,
  Navigation
} from 'lucide-react'
import Property3DViewer from '@/app/components/propertyManagement/modules/Property3DViewer'
import LoadingSpinner from '@/app/components/ui/LoadingSpinner'
import ScheduleATour from '@/app/components/ScheduleATour'
import NearbyAmenities from '@/app/components/Listing/NearbyAmenities'
import { getAmenityIcon, getAmenityName } from '@/lib/StaticData'

const PropertyDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const { listing_type, slug, id } = params

  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [show3DModel, setShow3DModel] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/get-listing/${id}`)
        const result = await response.json()

        if (result.success) {
          setListing(result.data)
        } else {
          setError(result.error || 'Listing not found')
        }
      } catch (err) {
        console.error('Error fetching listing:', err)
        setError('Failed to fetch listing')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchListing()
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The listing you are looking for does not exist.'}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const {
    title,
    description,
    price,
    currency,
    price_type,
    duration,
    media,
    specifications,
    city,
    state,
    country,
    town,
    full_address,
    latitude,
    longitude,
    location_additional_information,
    amenities,
    available_from,
    available_until,
    is_featured,
    is_verified,
    is_premium,
    developers,
    relatedListings,
    propertySubtypes,
    listing_types,
    '3d_model': model3D,
    cancellation_policy,
    is_negotiable,
    security_requirements,
    flexible_terms,
    acquisition_rules,
    additional_information,
    size,
    status
  } = listing

  // Get all media files
  const mediaFiles = media?.mediaFiles || []
  const mainImage = mediaFiles[selectedImageIndex]?.url || media?.banner?.url

  // Format price
  const formatPrice = (price, currency, priceType, duration) => {
    const priceNum = parseFloat(price)
    const formattedPrice = priceNum.toLocaleString()
    
    let priceText = `${currency} ${formattedPrice}`
    
    if (priceType === 'rent') {
      priceText += `/${duration}`
    }
    
    return priceText
  }

  // Get specifications
  const getSpecifications = () => {
    if (!specifications) return {}
    
    return {
      bedrooms: specifications.bedrooms || 0,
      bathrooms: specifications.bathrooms || 0,
      size: specifications.property_size || specifications.size || size || 0,
      floor: specifications.floor_level || 0,
      furnishing: specifications.furnishing || 'unfurnished',
      condition: specifications.condition || 'good',
      age: specifications.property_age || 'unknown',
      kitchen: specifications.kitchen || 0,
      toilets: specifications.toilets || 0,
      living_rooms: specifications.living_rooms || 0
    }
  }

  const specs = getSpecifications()

  // Get listing types display
  const getListingTypes = () => {
    const types = []
    if (listing_types?.custom?.length > 0) {
      types.push(...listing_types.custom)
    }
    if (listing_types?.inbuilt?.length > 0) {
      types.push(...listing_types.inbuilt)
    }
    if (propertySubtypes?.length > 0) {
      types.push(...propertySubtypes.map(subtype => subtype.name))
    }
    return types
  }

  const listingTypes = getListingTypes()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors bg-white/50 px-4 py-2 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Hero Section */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="relative h-[500px]">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <div className="text-white text-6xl font-bold">
                      {title?.charAt(0) || 'P'}
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

                {/* Price Badge */}
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-xl shadow-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPrice(price, currency, price_type, duration)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {price_type === 'rent' ? 'Rent' : 'Sale'}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="absolute bottom-6 right-6 bg-green-500 text-white px-4 py-2 rounded-lg font-medium">
                  {status || 'Available'}
                </div>
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
                          alt={`${title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>


            {/* Property Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-start justify-between mb-8">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <h1 className="text-4xl font-bold text-gray-900 flex-1">{title}</h1>
                    <div className="flex items-center space-x-3 ml-6">
                      <button className="flex items-center text-gray-600 hover:text-blue-600 transition-colors bg-gray-100 hover:bg-blue-100 px-4 py-2 rounded-lg">
                        <Share2 className="w-5 h-5 mr-2" />
                        Share
                      </button>
                      <button className="flex items-center text-gray-600 hover:text-red-600 transition-colors bg-gray-100 hover:bg-red-100 px-4 py-2 rounded-lg">
                        <Heart className="w-5 h-5 mr-2" />
                        Save
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600 mb-6">
                    <MapPin className="w-6 h-6 mr-3 text-blue-600" />
                    <span className="text-lg">
                      {full_address || `${town}, ${city}, ${state}, ${country}`}
                    </span>
                  </div>
                  
                  {/* Badges */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    {is_featured && (
                      <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium flex items-center">
                        <Star className="w-4 h-4 mr-2" />
                        Featured
                      </span>
                    )}
                    {is_verified && (
                      <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verified
                      </span>
                    )}
                    {is_premium && (
                      <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                        Premium
                      </span>
                    )}
                    {is_negotiable && (
                      <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                        Negotiable
                      </span>
                    )}
                  </div>

                  {/* Listing Types */}
                  {listingTypes.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Property Types</h4>
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
              </div>

              {/* Description */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Description</h3>
                <p className="text-gray-700 leading-relaxed text-lg">{description}</p>
              </div>

              {/* Specifications Grid */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Specifications</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
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
                        {listing_type === 'unit' ? 'sq ft' : 'sq m'}
                      </div>
                    </div>
                  )}
                  {specs.floor > 0 && (
                    <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                      <div className="w-8 h-8 mx-auto mb-3 text-orange-600">🏢</div>
                      <div className="text-2xl font-bold text-gray-900">{specs.floor}</div>
                      <div className="text-sm text-gray-600">
                        {listing_type === 'unit' ? 'Floor' : 'Floors'}
                      </div>
                    </div>
                  )}
                  {specs.kitchen > 0 && (
                    <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                      <div className="w-8 h-8 mx-auto mb-3 text-red-600">🍳</div>
                      <div className="text-2xl font-bold text-gray-900">{specs.kitchen}</div>
                      <div className="text-sm text-gray-600">Kitchens</div>
                    </div>
                  )}
                  {specs.living_rooms > 0 && (
                    <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
                      <Home className="w-8 h-8 mx-auto mb-3 text-indigo-600" />
                      <div className="text-2xl font-bold text-gray-900">{specs.living_rooms}</div>
                      <div className="text-sm text-gray-600">Living Rooms</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Property Details</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Furnishing:</span>
                      <span className="font-medium capitalize">{specs.furnishing}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Condition:</span>
                      <span className="font-medium capitalize">{specs.condition}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age:</span>
                      <span className="font-medium capitalize">{specs.age}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Size:</span>
                      <span className="font-medium">{size || specs.size} {listing_type === 'unit' ? 'sq ft' : 'sq m'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Terms & Conditions</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cancellation:</span>
                      <span className="font-medium">{cancellation_policy || 'Standard'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Negotiable:</span>
                      <span className="font-medium">{is_negotiable ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Flexible Terms:</span>
                      <span className="font-medium">{flexible_terms ? 'Yes' : 'No'}</span>
                    </div>
                    {security_requirements && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Security:</span>
                        <span className="font-medium">{security_requirements}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Availability</h4>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-green-50 rounded-xl">
                      <Calendar className="w-5 h-5 mr-3 text-green-600" />
                      <div>
                        <div className="font-medium text-gray-900">Available From</div>
                        <div className="text-sm text-gray-600">
                          {available_from ? new Date(available_from).toLocaleDateString() : 'Immediately'}
                        </div>
                      </div>
                    </div>
                    {available_until && (
                      <div className="flex items-center p-3 bg-red-50 rounded-xl">
                        <Calendar className="w-5 h-5 mr-3 text-red-600" />
                        <div>
                          <div className="font-medium text-gray-900">Available Until</div>
                          <div className="text-sm text-gray-600">
                            {new Date(available_until).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Amenities */}
              {amenities && (amenities.general?.length > 0 || amenities.database?.length > 0 || amenities.custom?.length > 0) && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-6 text-gray-900">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                     {amenities.general?.map((amenity, index) => (
                       <div key={index} className="flex items-center p-4 bg-blue-50 rounded-xl">
                         <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                           <span className="text-lg">{getAmenityIcon(amenity)}</span>
                         </div>
                         <span className="font-medium text-gray-900">
                           {getAmenityName(amenity)}
                         </span>
                       </div>
                     ))}
                    {amenities.database?.map((amenity, index) => (
                      <div key={index} className="flex items-center p-4 bg-green-50 rounded-xl">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="font-medium text-gray-900">Custom Amenity</span>
                      </div>
                    ))}
                    {amenities.custom?.map((amenity, index) => (
                      <div key={index} className="flex items-center p-4 bg-purple-50 rounded-xl">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                          <Star className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="font-medium text-gray-900">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nearby Amenities */}
              <NearbyAmenities 
                latitude={latitude}
                longitude={longitude}
                town={town}
                city={city}
                state={state}
                country={country}
              />

              {/* Additional Information */}
              {additional_information && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Additional Information</h3>
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <p className="text-gray-700 leading-relaxed">{additional_information}</p>
                  </div>
                </div>
              )}

              {/* Acquisition Rules */}
              {acquisition_rules && acquisition_rules !== 'None' && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Acquisition Rules</h3>
                  <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                    <p className="text-gray-700 leading-relaxed">{acquisition_rules}</p>
                  </div>
                </div>
              )}

              {/* Location Map */}
              {(latitude && longitude) && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-6 text-gray-900">Location</h3>
                  <div className="bg-gray-100 rounded-xl p-6 h-96 flex items-center justify-center">
                    <div className="text-center">
                      <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Interactive map will be displayed here</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Coordinates: {latitude}, {longitude}
                      </p>
                    </div>
                  </div>
                  {location_additional_information && (
                    <div className="mt-4 bg-blue-50 p-4 rounded-xl">
                      <p className="text-gray-700">{location_additional_information}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Related Listings */}
            {relatedListings && relatedListings.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">More from {developers?.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedListings.slice(0, 6).map((related) => (
                    <Link
                      key={related.id}
                      href={`/property/${related.listing_type}/${related.slug}/${related.id}`}
                      className="group block"
                    >
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                        <div className="h-48 bg-gray-200">
                          {related.media?.mediaFiles?.[0]?.url ? (
                            <img
                              src={related.media.mediaFiles[0].url}
                              alt={related.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              {related.title?.charAt(0) || 'P'}
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{related.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {related.city}, {related.state}
                          </p>
                          <p className="text-lg font-bold text-blue-600">
                            {formatPrice(related.price, related.currency, related.price_type, related.duration)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {relatedListings.length > 6 && (
                  <div className="text-center mt-6">
                    <Link
                      href={`/allDevelopers/${developers?.slug}`}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      View All Properties ({relatedListings.length})
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Schedule a Tour */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <ScheduleATour 
                propertyId={id}
                propertyTitle={title}
                propertyType={listing_type}
                developer={developers}
              />
            </div>

            {/* Developer Contact */}
            {listing_type === 'unit' && developers && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Contact Developer</h3>
                <div className="text-center mb-6">
                  {developers.profile_image?.url ? (
                    <img
                      src={developers.profile_image.url}
                      alt={developers.name}
                      className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-blue-100"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center border-4 border-blue-100">
                      <span className="text-white font-bold text-2xl">
                        {developers.name?.charAt(0) || 'D'}
                      </span>
                    </div>
                  )}
                  <h4 className="text-xl font-semibold text-gray-900">{developers.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {developers.total_developments || 0} Developments • {developers.total_units || 0} Units
                  </p>
                  {developers.description && (
                    <p className="text-sm text-gray-600">{developers.description}</p>
                  )}
                </div>
                
                <div className="space-y-3">
                  <button className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center">
                    <Phone className="w-5 h-5 mr-2" />
                    Call {developers.phone}
                  </button>
                  <button className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Send Message
                  </button>
                  {developers.website && (
                    <Link
                      href={developers.website}
                      target="_blank"
                      className="w-full bg-gray-600 text-white py-3 rounded-xl hover:bg-gray-700 transition-colors font-medium flex items-center justify-center"
                    >
                      <Globe className="w-5 h-5 mr-2" />
                      Visit Website
                    </Link>
                  )}
                </div>

                {/* Social Media */}
                {developers.social_media && Object.keys(developers.social_media).length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-900 mb-3">Follow Us</h5>
                    <div className="flex space-x-3">
                      {developers.social_media.facebook && (
                        <a href={developers.social_media.facebook} target="_blank" className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                          <Facebook className="w-5 h-5" />
                        </a>
                      )}
                      {developers.social_media.instagram && (
                        <a href={developers.social_media.instagram} target="_blank" className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center text-white hover:bg-pink-700 transition-colors">
                          <Instagram className="w-5 h-5" />
                        </a>
                      )}
                      {developers.social_media.linkedin && (
                        <a href={developers.social_media.linkedin} target="_blank" className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white hover:bg-blue-800 transition-colors">
                          <Linkedin className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer Care */}
                {developers.customer_care && developers.customer_care.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-900 mb-3">Customer Care</h5>
                    <div className="space-y-2">
                      {developers.customer_care.map((care, index) => (
                        <div key={index} className="text-sm">
                          <div className="font-medium text-gray-900">{care.name}</div>
                          <div className="text-gray-600">{care.phone}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 3D Model Overlay */}
      {show3DModel && model3D?.url && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
          <div className="relative w-full h-full">
            {/* Close Button */}
            <button
              onClick={() => setShow3DModel(false)}
              className="absolute top-6 right-6 z-10 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-900 p-3 rounded-full shadow-lg transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* 3D Model Container */}
            <div className="w-full h-full p-8">
              <div className="w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="h-full">
                  <Property3DViewer 
                    modelData={model3D} 
                    unitTitle={title}
                  />
                </div>
              </div>
            </div>

            {/* Controls Info */}
            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-lg shadow-lg">
              <div className="text-sm font-medium mb-1">3D Viewer Controls</div>
              <div className="text-xs text-gray-600">
                Drag to rotate • Scroll to zoom • Right-click to pan
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertyDetailPage