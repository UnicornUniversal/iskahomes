'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import HomeSeekerHeader from '@/app/components/homeSeeker/HomeSeekerHeader'
import SavedListingCard from '@/app/components/homeSeeker/SavedListingCard'
import BookingCard from '@/app/components/homeSeeker/BookingCard'
import DataCard from '@/app/components/developers/DataCard'
import { FiHeart, FiCalendar, FiMessageSquare } from 'react-icons/fi'
import Link from 'next/link'

const HomeSeekerDashboard = () => {
  const params = useParams()
  const slug = params?.slug || ''
  const { user, propertySeekerToken } = useAuth()
  
  const [savedListings, setSavedListings] = useState([])
  const [appointments, setAppointments] = useState([])
  const [stats, setStats] = useState({
    savedListings: 0,
    scheduledVisits: 0,
    newMessages: 0
  })
  const [loading, setLoading] = useState(true)

  // Fetch saved listings
  useEffect(() => {
    const fetchSavedListings = async () => {
      if (!user || !propertySeekerToken || user.user_type !== 'property_seeker') {
        return
      }

      try {
        const response = await fetch('/api/saved-listings', {
          headers: {
            'Authorization': `Bearer ${propertySeekerToken}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          const listings = result.data || []
          setSavedListings(listings.slice(0, 3)) // Get first 3 for dashboard
          setStats(prev => ({ ...prev, savedListings: listings.length }))
        }
      } catch (err) {
        console.error('Error fetching saved listings:', err)
      }
    }

    fetchSavedListings()
  }, [user, propertySeekerToken])

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user || !propertySeekerToken || user.user_type !== 'property_seeker') {
        return
      }

      try {
        const response = await fetch('/api/appointments', {
          headers: {
            'Authorization': `Bearer ${propertySeekerToken}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          const appointmentsData = result.data || []
          setAppointments(appointmentsData)
          
          // Count upcoming appointments
          const upcoming = appointmentsData.filter(apt => 
            apt.status === 'confirmed' || apt.status === 'pending'
          )
          setStats(prev => ({ ...prev, scheduledVisits: upcoming.length }))
        }
      } catch (err) {
        console.error('Error fetching appointments:', err)
      }
    }

    fetchAppointments()
  }, [user, propertySeekerToken])

  // Fetch message counts
  useEffect(() => {
    const fetchMessageCounts = async () => {
      if (!user || !propertySeekerToken || user.user_type !== 'property_seeker') {
        return
      }

      try {
        const response = await fetch('/api/conversations', {
          headers: {
            'Authorization': `Bearer ${propertySeekerToken}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          const conversations = result.data || []
          
          // Sum up all unread counts
          const totalUnread = conversations.reduce((sum, conv) => {
            return sum + (conv.my_unread_count || 0)
          }, 0)
          
          setStats(prev => ({ ...prev, newMessages: totalUnread }))
        }
      } catch (err) {
        console.error('Error fetching message counts:', err)
      }
    }

    fetchMessageCounts()
  }, [user, propertySeekerToken])

  // Set loading to false after both fetches
  useEffect(() => {
    if (savedListings.length >= 0 && appointments.length >= 0) {
      setLoading(false)
    }
  }, [savedListings, appointments])

  return (
    <>
      <HomeSeekerHeader />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <DataCard 
          title="Saved Listings"
          value={stats.savedListings.toString()}
          icon={FiHeart}
        />
        <DataCard 
          title="Scheduled Visits"
          value={stats.scheduledVisits.toString()}
          icon={FiCalendar}
        />
        <DataCard 
          title="New Messages"
          value={stats.newMessages.toString()}
          icon={FiMessageSquare}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Saved Listings Section */}
        <div className="lg:col-span-2">
          <div className="default_bg rounded-2xl shadow-lg border border-primary_color/10 p-4 lg:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-primary_color flex items-center gap-2">
                <div className="p-2 bg-primary_color/10 rounded-lg">
                  <FiHeart className="w-5 h-5 text-primary_color" />
                </div>
                Recently Saved Listings
              </h2>
              {slug && (
                <Link 
                  href={`/propertySeeker/${slug}/saved-listings`}
                  className="text-sm text-primary_color hover:text-secondary_color font-medium transition-colors"
                >
                  View All →
                </Link>
              )}
            </div>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary_color/20 border-t-primary_color mx-auto mb-2"></div>
                <p className="text-primary_color/60 text-sm">Loading...</p>
              </div>
            ) : savedListings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-primary_color/60">No saved listings yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {savedListings.map((savedListing) => {
                  const listing = savedListing.listings
                  
                  // Extract image from media - handle both string and object formats
                  const getMainImage = () => {
                    if (!listing?.media) return null
                    
                    try {
                      // Parse if media is a string
                      const media = typeof listing.media === 'string' 
                        ? JSON.parse(listing.media) 
                        : listing.media
                      
                      if (!media || typeof media !== 'object') return null
                      
                      // Check for new albums structure: media.albums[0].images[0].url
                      if (media.albums && Array.isArray(media.albums) && media.albums.length > 0) {
                        for (const album of media.albums) {
                          if (album?.images && Array.isArray(album.images) && album.images.length > 0) {
                            return album.images[0].url
                          }
                        }
                      }
                      
                      // Fallback to mediaFiles (backward compatibility)
                      if (media.mediaFiles && Array.isArray(media.mediaFiles) && media.mediaFiles.length > 0) {
                        return media.mediaFiles[0].url
                      }
                      
                      // Fallback to banner
                      if (media.banner?.url) {
                        return media.banner.url
                      }
                      
                      return null
                    } catch (err) {
                      console.error('Error parsing media:', err)
                      return null
                    }
                  }
                  
                  const mainImage = getMainImage()
                  
                  // Parse specifications if it's a string
                  const specs = typeof listing?.specifications === 'string' 
                    ? JSON.parse(listing.specifications || '{}') 
                    : listing?.specifications || {}
                  
                  return (
                    <SavedListingCard
                      key={savedListing.id}
                      title={listing?.title}
                      price={`${listing?.currency} ${parseFloat(listing?.price || 0).toLocaleString()}${listing?.price_type === 'rent' ? `/${listing?.duration}` : ''}`}
                      location={listing?.full_address || `${listing?.city}, ${listing?.state}`}
                      image={mainImage}
                      bedrooms={specs.bedrooms || 0}
                      bathrooms={specs.bathrooms || 0}
                      area={`${specs.property_size || listing?.size || 0} sq ft`}
                      savedDate={new Date(savedListing.created_at).toLocaleDateString()}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <BookingCard />
        </div>
      </div>
    </>
  )
}

export default HomeSeekerDashboard 