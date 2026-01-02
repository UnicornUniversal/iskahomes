'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Layout1 from '@/app/layout/Layout1'
import { 
  FiStar, 
  FiMapPin, 
  FiPhone, 
  FiMail, 
  FiMessageSquare, 
  FiBuilding2, 
  FiCheckCircle, 
  FiCalendar,
  FiAward,
  FiGlobe,
  FiLinkedin,
  FiTwitter,
  FiInstagram,
  FiArrowLeft,
  FiShare2,
  FiHome,
  FiUsers
} from 'react-icons/fi'
import Link from 'next/link'

const AgencyProfile = () => {
  const params = useParams()
  const agencySlug = params.slug
  const [activeTab, setActiveTab] = useState('overview')
  const [agency, setAgency] = useState(null)
  const [agents, setAgents] = useState([])
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (agencySlug) {
      fetchAgencyData()
    }
  }, [agencySlug])

  const fetchAgencyData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/public/agencies/${agencySlug}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch agency')
      }

      const result = await response.json()
      
      if (result.success) {
        setAgency(result.data.agency)
        setAgents(result.data.agents || [])
        setListings(result.data.listings || [])
      } else {
        setError(result.error || 'Agency not found')
      }
    } catch (err) {
      console.error('Error fetching agency:', err)
      setError(err.message || 'Error loading agency')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout1>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading agency...</p>
          </div>
        </div>
      </Layout1>
    )
  }

  if (error || !agency) {
    return (
      <Layout1>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Agency Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The agency you\'re looking for doesn\'t exist.'}</p>
            <Link
              href="/home/allAgencies"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Back to All Agencies
            </Link>
          </div>
        </div>
      </Layout1>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'agents', label: 'Agents' },
    { id: 'listings', label: 'Listings' },
    { id: 'contact', label: 'Contact' }
  ]

  // Format price helper
  const formatPrice = (price, currency, priceType, duration) => {
    if (!price) return 'Price on request'
    const priceNum = parseFloat(price)
    const formattedPrice = priceNum.toLocaleString()
    
    let priceText = `${currency || 'GHS'} ${formattedPrice}`
    
    if (priceType === 'rent' && duration) {
      priceText += `/${duration}`
    }
    
    return priceText
  }

  // Get listing image
  const getListingImage = (listing) => {
    if (listing.media?.albums && Array.isArray(listing.media.albums) && listing.media.albums.length > 0) {
      for (const album of listing.media.albums) {
        if (album?.images && Array.isArray(album.images) && album.images.length > 0) {
          return album.images[0].url
        }
      }
    }
    if (listing.media?.mediaFiles && Array.isArray(listing.media.mediaFiles) && listing.media.mediaFiles.length > 0) {
      return listing.media.mediaFiles[0].url
    }
    if (listing.media?.banner?.url) {
      return listing.media.banner.url
    }
    return null
  }

  return (
    <Layout1>
      <div className="min-h-screen bg-gray-50">
        {/* Back Button */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href="/home/allAgencies"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Back to All Agencies
            </Link>
          </div>
        </div>

        {/* Cover Image */}
        <div className="relative h-64 md:h-80">
          {agency.cover_image ? (
            <img
              src={agency.cover_image}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
          {/* Agency Header */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              {/* Profile Image */}
              <div className="relative">
                {agency.profile_image ? (
                  <img
                    src={agency.profile_image}
                    alt={agency.name}
                    className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-lg">
                    <FiBuilding2 className="w-16 h-16 text-white" />
                  </div>
                )}
                {agency.verified && (
                  <div className="absolute -top-2 -right-2 bg-blue-600 text-white p-2 rounded-full">
                    <FiCheckCircle className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Agency Info */}
              <div className="flex-1">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{agency.name}</h1>
                    <div className="flex items-center text-gray-600 mb-3">
                      <FiMapPin className="w-5 h-5 mr-2" />
                      <span>
                        {agency.city && agency.country ? `${agency.city}, ${agency.country}` : agency.country || agency.city || 'Location not specified'}
                      </span>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-6 mb-4">
                      <div className="flex items-center text-gray-600">
                        <FiUsers className="w-4 h-4 mr-1" />
                        <span>{agency.total_agents || 0} Agents</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FiHome className="w-4 h-4 mr-1" />
                        <span>{agency.total_listings || 0} Listings</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
                      <FiMessageSquare className="w-4 h-4 mr-2" />
                      Send Message
                    </button>
                    <button className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                      <FiShare2 className="w-4 h-4 mr-2" />
                      Share Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Content */}
                  <div className="lg:col-span-2">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">About {agency.name}</h3>
                    {agency.description ? (
                      <p className="text-gray-600 leading-relaxed mb-6">{agency.description}</p>
                    ) : (
                      <p className="text-gray-600 leading-relaxed mb-6">No description available.</p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-bold text-gray-900">{agency.total_listings || 0}</div>
                        <div className="text-sm text-gray-600">Listings</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-bold text-gray-900">{agency.total_agents || 0}</div>
                        <div className="text-sm text-gray-600">Agents</div>
                      </div>
                      {agency.founded_year && (
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                          <div className="text-2xl font-bold text-gray-900">{agency.founded_year}</div>
                          <div className="text-sm text-gray-600">Founded</div>
                        </div>
                      )}
                      {agency.company_size && (
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                          <div className="text-2xl font-bold text-gray-900">{agency.company_size}</div>
                          <div className="text-sm text-gray-600">Size</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Contact Info */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
                      <div className="space-y-3">
                        {agency.phone && (
                          <div className="flex items-center">
                            <FiPhone className="w-4 h-4 text-gray-400 mr-3" />
                            <span className="text-gray-700">{agency.phone}</span>
                          </div>
                        )}
                        {agency.email && (
                          <div className="flex items-center">
                            <FiMail className="w-4 h-4 text-gray-400 mr-3" />
                            <span className="text-gray-700">{agency.email}</span>
                          </div>
                        )}
                        {agency.website && (
                          <div className="flex items-center">
                            <FiGlobe className="w-4 h-4 text-gray-400 mr-3" />
                            <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              Visit Website
                            </a>
                          </div>
                        )}
                        <div className="flex items-center">
                          <FiMapPin className="w-4 h-4 text-gray-400 mr-3" />
                          <span className="text-gray-700">
                            {agency.address || `${agency.city || ''} ${agency.country || ''}`.trim() || 'Address not available'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Social Media */}
                    {agency.social_media && Object.keys(agency.social_media).length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h4>
                        <div className="space-y-3">
                          {agency.social_media.linkedin && (
                            <a href={agency.social_media.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:text-blue-700">
                              <FiLinkedin className="w-4 h-4 mr-3" />
                              LinkedIn
                            </a>
                          )}
                          {agency.social_media.twitter && (
                            <a href={agency.social_media.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-400 hover:text-blue-500">
                              <FiTwitter className="w-4 h-4 mr-3" />
                              Twitter
                            </a>
                          )}
                          {agency.social_media.instagram && (
                            <a href={agency.social_media.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center text-pink-600 hover:text-pink-700">
                              <FiInstagram className="w-4 h-4 mr-3" />
                              Instagram
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Agents Tab */}
              {activeTab === 'agents' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Agents ({agents.length})</h3>
                  </div>

                  {agents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {agents.map(agent => (
                        <Link
                          key={agent.id}
                          href={`/home/allAgents/${agent.slug}`}
                          className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
                            {agent.profile_image ? (
                              <img
                                src={agent.profile_image}
                                alt={agent.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FiUsers className="w-16 h-16 text-white opacity-50" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-1">{agent.name}</h4>
                            {agent.bio && (
                              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{agent.bio}</p>
                            )}
                            <div className="text-sm text-gray-600">
                              {agent.total_listings || 0} listings
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-600">No agents available.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Listings Tab */}
              {activeTab === 'listings' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Listings ({listings.length})</h3>
                  </div>

                  {listings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {listings.map(listing => {
                        const listingImage = getListingImage(listing)
                        return (
                          <div key={listing.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
                              {listingImage ? (
                                <img
                                  src={listingImage}
                                  alt={listing.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FiHome className="w-16 h-16 text-white opacity-50" />
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900 mb-2 line-clamp-1">{listing.title}</h4>
                              <div className="flex items-center text-gray-600 text-sm mb-2">
                                <FiMapPin className="w-4 h-4 mr-1" />
                                <span className="line-clamp-1">
                                  {listing.city && listing.state ? `${listing.city}, ${listing.state}` : listing.country || 'Location not specified'}
                                </span>
                              </div>
                              <div className="text-lg font-bold text-blue-600 mb-2">
                                {formatPrice(listing.price, listing.currency, listing.price_type, listing.duration)}
                              </div>
                              {listing.specifications && (
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  {listing.specifications.bedrooms > 0 && (
                                    <span>{listing.specifications.bedrooms} beds</span>
                                  )}
                                  {listing.specifications.bathrooms > 0 && (
                                    <span>{listing.specifications.bathrooms} baths</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-600">No listings available.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Contact Tab */}
              {activeTab === 'contact' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Get in Touch</h3>
                    <p className="text-gray-600 mb-6">
                      Ready to work with {agency.name}? Send a message or contact them directly.
                    </p>

                    <div className="space-y-4">
                      {agency.phone && (
                        <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                          <FiPhone className="w-5 h-5 text-blue-600 mr-3" />
                          <div>
                            <div className="font-medium text-gray-900">Call</div>
                            <div className="text-gray-600">{agency.phone}</div>
                          </div>
                        </div>
                      )}

                      {agency.email && (
                        <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                          <FiMail className="w-5 h-5 text-blue-600 mr-3" />
                          <div>
                            <div className="font-medium text-gray-900">Email</div>
                            <div className="text-gray-600">{agency.email}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                        <FiMapPin className="w-5 h-5 text-blue-600 mr-3" />
                        <div>
                          <div className="font-medium text-gray-900">Location</div>
                          <div className="text-gray-600">
                            {agency.address || `${agency.city || ''} ${agency.country || ''}`.trim() || 'Address not available'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Send Message</h3>
                    <form className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="your.email@example.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your phone number"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                        <textarea
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Tell us about your property needs..."
                        ></textarea>
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                      >
                        Send Message
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout1>
  )
}

export default AgencyProfile

