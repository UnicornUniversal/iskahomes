'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Building2, Calendar, Users, CheckCircle, Phone, Mail, Globe, ArrowRight, Play, ExternalLink, Star, Heart, Share2 } from 'lucide-react'
import ScheduleATour from '@/app/components/ScheduleATour'
import ListingCard from '@/app/components/Listing/ListingCard'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useAuth } from '@/contexts/AuthContext'
import ShareModal from '@/app/components/ui/ShareModal'
import { toast } from 'react-toastify'

const DevelopmentPage = () => {
  const params = useParams()
  const analytics = useAnalytics()
  const { user } = useAuth()
  const [development, setDevelopment] = useState(null)
  const [developer, setDeveloper] = useState(null)
  const [units, setUnits] = useState([])
  const [relatedDevelopments, setRelatedDevelopments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [showShareModal, setShowShareModal] = useState(false)

  useEffect(() => {
    const fetchDevelopment = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/public/developments/${params.slug}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch development')
        }

        if (data.success && data.data) {
          setDevelopment(data.data.development)
          setDeveloper(data.data.development.developers)
          setUnits(data.data.units || [])
          setRelatedDevelopments(data.data.relatedDevelopments || [])
          
          // Track development view
          if (data.data.development) {
            analytics.trackDevelopmentView(data.data.development.id, {
              viewedFrom: 'development_page',
              lister_id: data.data.development.developers?.developer_id,
              lister_type: 'developer',
              location: {
                city: data.data.development.city,
                state: data.data.development.state
              }
            })
          }
        } else {
          throw new Error('Invalid response format')
        }
      } catch (err) {
        console.error('Error fetching development:', err)
        setError(err.message)
        setDevelopment(null)
        setDeveloper(null)
        setUnits([])
        setRelatedDevelopments([])
      } finally {
        setLoading(false)
      }
    }

    if (params.slug) {
      fetchDevelopment()
    }
  }, [params.slug])

  // Analytics tracking functions
  const handlePhoneClick = async (phoneNumber, context = 'development') => {
    try {
      await navigator.clipboard.writeText(phoneNumber)
      // Track as development lead (not listing lead)
      analytics.trackDevelopmentLead(development?.id, 'phone', {
        lister_id: developer?.developer_id,
        lister_type: 'developer',
        contactMethod: 'phone',
        phoneNumber: phoneNumber
      })
      toast.success('Phone number copied!')
    } catch (error) {
      console.error('Failed to copy phone number:', error)
      toast.error('Failed to copy phone number')
    }
  }

  const handleEmailClick = async (email, context = 'development') => {
    try {
      await navigator.clipboard.writeText(email)
      // Track as development lead (not listing lead)
      analytics.trackDevelopmentLead(development?.id, 'email', {
        lister_id: developer?.developer_id,
        lister_type: 'developer',
        contactMethod: 'email'
      })
      toast.success('Email copied!')
    } catch (error) {
      console.error('Failed to copy email:', error)
      toast.error('Failed to copy email')
    }
  }

  const handleWebsiteClick = (websiteUrl, context = 'development') => {
    // Track as development interaction (website visit)
    analytics.trackDevelopmentInteraction(development?.id, 'website_visit', {
      lister_id: developer?.developer_id,
      lister_type: 'developer',
      websiteUrl: websiteUrl
    })
  }

  const handleSocialMediaClick = (platform, url, context = 'development') => {
    // Track as development interaction (social media click)
    analytics.trackDevelopmentInteraction(development?.id, 'social_media_click', {
      lister_id: developer?.developer_id,
      lister_type: 'developer',
      platform: platform,
      url: url
    })
  }

  const handleMessageClick = () => {
    // Track as development lead (message)
    analytics.trackDevelopmentLead(development?.id, 'message', {
      lister_id: developer?.developer_id,
      lister_type: 'developer',
      contactMethod: 'direct_message'
    })
  }

  const handleRelatedDevelopmentClick = (relatedDevelopment) => {
    analytics.trackDevelopmentView(relatedDevelopment.id, {
      viewedFrom: 'development_page',
      lister_id: developer?.developer_id,
      lister_type: 'developer',
      location: {
        city: relatedDevelopment.city,
        state: relatedDevelopment.state
      }
    })
  }

  const handleUnitClick = (unit) => {
    analytics.trackPropertyView(unit.id, {
      viewedFrom: 'development_page',
      listing: unit, // Pass full listing object so lister_id can be extracted
      listingType: unit.listing_type
    })
  }

  const handleShareClick = (platform) => {
    analytics.trackShare('development', platform, {
      listingId: development?.id,
      lister_id: developer?.developer_id,
      lister_type: 'developer'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!development) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Development Not Found</h1>
          <p className="text-gray-500">The development you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const allImages = [
    development.banner,
    ...(development.media_files || [])
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Banner Image Only */}
      <div className="relative">
        <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
          {development.banner ? (
            <Image
              src={development.banner.url}
              alt={development.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-black/20" />
          
          {/* Status Badge */}
          <div className="absolute top-6 right-6">
            <span className="px-4 py-2 bg-white/90 backdrop-blur-sm text-slate-700 rounded-full text-sm font-medium">
              {development.status}
            </span>
          </div>
        </div>
      </div>

      {/* Development Details - RIGHT UNDER BANNER */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-slate-900 mb-6">
              {development.title}
            </h1>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed mb-8">
              {development.description}
            </p>
            
            {/* Location */}
            <div className="flex items-center justify-center space-x-4 text-slate-600 mb-8">
              <MapPin className="w-5 h-5" />
              <span className="text-lg">{development.city}, {development.country}</span>
            </div>

            {/* Key Stats */}
            <div className="flex flex-wrap justify-center gap-12 text-slate-600 mb-12">
              <div className="text-center">
                <div className="text-3xl font-light text-slate-900">{development.number_of_buildings}</div>
                <div className="text-sm uppercase tracking-wider">Buildings</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-light text-slate-900">{development.total_units}</div>
                <div className="text-sm uppercase tracking-wider">Units</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-light text-slate-900">{development.size}</div>
                <div className="text-sm uppercase tracking-wider">Size</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Image Gallery */}
            {allImages.length > 0 && (
              <div>
                <h2 className="text-2xl font-light text-slate-900 mb-6">Gallery</h2>
                <div className="space-y-4">
                  {/* Main Image */}
                  <div className="relative h-96 rounded-2xl overflow-hidden">
                    <Image
                      src={allImages[activeImageIndex]?.url}
                      alt={development.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  {/* Thumbnail Grid */}
                  {allImages.length > 1 && (
                    <div className="grid grid-cols-4 gap-4">
                      {allImages.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveImageIndex(index)}
                          className={`relative h-24 rounded-lg overflow-hidden ${
                            activeImageIndex === index ? 'ring-2 ring-blue-500' : ''
                          }`}
                        >
                          <Image
                            src={image.url}
                            alt={`${development.title} ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Development Details */}
            <div>
              <h2 className="text-2xl font-light text-slate-900 mb-6">Development Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Status</h3>
                    <p className="text-lg text-slate-900">{development.status}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Size</h3>
                    <p className="text-lg text-slate-900">{development.size}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Buildings</h3>
                    <p className="text-lg text-slate-900">{development.number_of_buildings}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Units</h3>
                    <p className="text-lg text-slate-900">{development.total_units}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Location</h3>
                    <p className="text-lg text-slate-900">{development.full_address || `${development.city}, ${development.country}`}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Purposes & Types */}
            {(development.purposes?.length > 0 || development.types?.length > 0 || development.categories?.length > 0) && (
              <div>
                <h2 className="text-2xl font-light text-slate-900 mb-6">Categories</h2>
                <div className="space-y-6">
                  {development.purposes?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-slate-900 mb-3">Purposes</h3>
                      <div className="flex flex-wrap gap-2">
                        {development.purposes.map((purpose, index) => (
                          <span key={index} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                            {typeof purpose === 'string' ? purpose : purpose.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {development.types?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-slate-900 mb-3">Types</h3>
                      <div className="flex flex-wrap gap-2">
                        {development.types.map((type, index) => (
                          <span key={index} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {typeof type === 'string' ? type : type.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {development.categories?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-slate-900 mb-3">Categories</h3>
                      <div className="flex flex-wrap gap-2">
                        {development.categories.map((category, index) => (
                          <span key={index} className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            {typeof category === 'string' ? category : category.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Unit Types */}
            {development.unit_types?.database?.length > 0 && (
              <div>
                <h2 className="text-2xl font-light text-slate-900 mb-6">Available Unit Types</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {development.unit_types.database.map((unitType, index) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-lg">
                      <h3 className="font-medium text-slate-900">{unitType.name}</h3>
                      {unitType.description && (
                        <p className="text-sm text-slate-600 mt-1">{unitType.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Units/Listings - USING LISTING CARD COMPONENT */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-light text-slate-900 mb-4">Available Units</h2>
                <p className="text-lg text-slate-600">
                  {units.length > 0 
                    ? `Explore ${units.length} unit${units.length !== 1 ? 's' : ''} available in this development`
                    : 'No units available yet'
                  }
                </p>
              </div>
              
              {units.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {units.map((unit) => (
                    <div key={unit.id} onClick={() => handleUnitClick(unit)}>
                      <ListingCard listing={unit} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No Units Available Yet</h3>
                  <p className="text-slate-500">Units will be added to this development soon.</p>
                </div>
              )}
            </div>

            {/* Supporting Files */}
            {development.additional_files && development.additional_files.length > 0 && (
              <div>
                <h2 className="text-2xl font-light text-slate-900 mb-6">Supporting Documents</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {development.additional_files.map((file, index) => (
                    <div key={index} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                          {file.type?.includes('pdf') ? (
                            <ExternalLink className="w-6 h-6 text-red-600" />
                          ) : file.type?.includes('image') ? (
                            <Image className="w-6 h-6 text-blue-600" />
                          ) : (
                            <ExternalLink className="w-6 h-6 text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-900 truncate">{file.name || file.filename}</h3>
                          <p className="text-sm text-slate-500">
                            {file.type} • {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                          </p>
                        </div>
                      </div>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 w-full bg-slate-900 text-white py-2 px-4 rounded-lg hover:bg-slate-800 transition-colors duration-200 text-sm font-medium text-center block"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location Map */}
            {development.latitude && development.longitude && (
              <div>
                <h2 className="text-2xl font-light text-slate-900 mb-6">Location</h2>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="h-96 w-full">
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${development.longitude - 0.01},${development.latitude - 0.01},${development.longitude + 0.01},${development.latitude + 0.01}&layer=mapnik&marker=${development.latitude},${development.longitude}`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`${development.title} Location`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Other Developments by Same Developer - PROMINENT DISPLAY */}
            {relatedDevelopments.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-light text-slate-900 mb-4">Other Developments by {developer?.name}</h2>
                  <p className="text-lg text-slate-600">
                    Explore more projects from this developer
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {relatedDevelopments.map((related) => (
                    <Link 
                      key={related.id} 
                      href={`/allDevelopments/${related.slug}`}
                      onClick={() => handleRelatedDevelopmentClick(related)}
                    >
                      <div className="group cursor-pointer">
                        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 hover:shadow-xl transition-all duration-300">
                          {related.banner ? (
                            <div className="relative h-64 overflow-hidden">
                              <Image
                                src={related.banner.url}
                                alt={related.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-4 right-4">
                                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-700 rounded-full text-xs font-medium">
                                  {related.status}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-64 bg-slate-100 flex items-center justify-center">
                              <Building2 className="w-16 h-16 text-slate-400" />
                            </div>
                          )}
                          
                          <div className="p-6">
                            <h3 className="text-xl font-medium text-slate-900 mb-3 group-hover:text-slate-700 transition-colors">
                              {related.title}
                            </h3>
                            <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                              {related.description}
                            </p>
                            
                            {/* Location */}
                            <div className="flex items-center text-sm text-slate-500 mb-4">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span>{related.city}, {related.country}</span>
                            </div>

                            {/* Development Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                              <div className="text-center py-2 bg-slate-50 rounded-lg">
                                <div className="text-lg font-semibold text-slate-900">{related.number_of_buildings}</div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider">Buildings</div>
                              </div>
                              <div className="text-center py-2 bg-slate-50 rounded-lg">
                                <div className="text-lg font-semibold text-slate-900">{related.total_units}</div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider">Units</div>
                              </div>
                            </div>

                            {/* Purposes */}
                            {related.purposes && related.purposes.length > 0 && (
                              <div className="mb-6">
                                <div className="flex flex-wrap gap-2">
                                  {related.purposes.slice(0, 2).map((purpose, index) => (
                                    <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                                      {typeof purpose === 'string' ? purpose : purpose.name}
                                    </span>
                                  ))}
                                  {related.purposes.length > 2 && (
                                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                                      +{related.purposes.length - 2} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Action Button */}
                            <div className="flex items-center justify-center space-x-2 text-slate-600 group-hover:text-slate-900 transition-colors">
                              <span className="text-sm font-medium">View Details</span>
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Developer Info */}
            {developer && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Developer</h3>
                <div className="flex items-center space-x-3 mb-4">
                  {developer.profile_image ? (
                    <Image
                      src={developer.profile_image.url}
                      alt={developer.name}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-slate-500" />
                    </div>
                  )}
    <div>
                    <h4 className="font-medium text-slate-900">{developer.name}</h4>
                    {developer.verified && (
                      <span className="text-xs text-green-600">Verified</span>
                    )}
                  </div>
                </div>
                
                {developer.description && (
                  <p className="text-sm text-slate-600 mb-4">{developer.description}</p>
                )}

                <div className="space-y-2 mb-6">
                  {developer.phone && (
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4" />
                      <button
                        onClick={() => handlePhoneClick(developer.phone, 'development')}
                        className="hover:text-blue-600 transition-colors cursor-pointer"
                        title="Click to copy phone number"
                      >
                        {developer.phone}
                      </button>
                    </div>
                  )}
                  {developer.email && (
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4" />
                      <button
                        onClick={() => handleEmailClick(developer.email, 'development')}
                        className="hover:text-blue-600 transition-colors cursor-pointer"
                        title="Click to copy email"
                      >
                        {developer.email}
                      </button>
                    </div>
                  )}
                  {developer.website && (
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span>Website</span>
                      </div>
                      <a 
                        href={developer.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={() => handleWebsiteClick(developer.website, 'development')}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Visit
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <ScheduleATour 
                    propertyId={development.id}
                    propertyTitle={`Consultation for ${development.title}`}
                    propertyType="development"
                    developer={developer}
                  />
                  <button 
                    onClick={() => {
                      setShowShareModal(true)
                      handleShareClick('modal')
                    }}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-full hover:bg-blue-700 transition-colors duration-200 text-sm font-medium text-center"
                  >
                    <Share2 className="w-4 h-4 mr-2 inline" />
                    Share Development
                  </button>
                  <Link 
                    href={`/allDevelopers/${developer.slug}`}
                    className="w-full bg-slate-100 text-slate-900 py-3 px-4 rounded-full hover:bg-slate-200 transition-colors duration-200 text-sm font-medium text-center block"
                  >
                    View Developer Profile
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Video Section - At Bottom */}
      {development.video && (
        <div className="bg-slate-50 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light text-slate-900 mb-4">Project Video</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Watch our video to get a better understanding of this development
              </p>
            </div>
            
            <div className="relative max-w-5xl mx-auto">
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
                <video
                  src={development.video.url}
                  className="w-full h-full object-cover"
                  controls
                  poster={development.banner?.url}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        property={development}
        propertyType="development"
      />
    </div>
  )
}

export default DevelopmentPage
