'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Layout1 from '@/app/layout/Layout1'
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Building2, 
  Calendar, 
  Users, 
  CheckCircle, 
  Instagram, 
  Linkedin, 
  Twitter,
  Share2,
  Home,
  User
} from 'lucide-react'
import LeadContactForm from '@/app/components/LeadContactForm'
import Nav from '@/app/components/Nav'
import DataRenderer from '@/app/components/developers/DataRenderer'
import { toast } from 'react-toastify'

const AgencyProfile = () => {
  const params = useParams()
  const agencySlug = params.slug
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

  // Helper functions
  const handlePhoneClick = (phone) => {
    navigator.clipboard.writeText(phone)
    toast.success('Phone number copied!')
  }

  const handleEmailClick = (email) => {
    navigator.clipboard.writeText(email)
    toast.success('Email copied!')
  }
  
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

  if (loading) {
    return (
      <Layout1>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary_color"></div>
        </div>
      </Layout1>
    )
  }

  if (error || !agency) {
    return (
      <Layout1>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
           <div className="text-center">
            <h1 className="font-bold text-gray-600 mb-4">Agency Not Found</h1>
            <p className="text-gray-500">{error || "The agency you're looking for doesn't exist."}</p>
             <Link href="/home/allAgencies" className="text-primary_color hover:underline mt-4 block">Back to All Agencies</Link>
          </div>
        </div>
      </Layout1>
    )
  }

  // Parse location
  const locationString = [agency.city, agency.region, agency.country].filter(Boolean).join(', ') || agency.address || 'Location not specified'

  return (
    <div className="min-h-screen text-primary_color">
        <Nav />
        {/* Hero Section - Split Layout */}
        <div className="flex flex-col justify-between lg:grid lg:grid-cols-2 min-h-[600px] lg:h-screen">
            {/* Left Side - Cover Image */}
            <div className="relative w-full h-[300px] lg:h-full overflow-hidden">
                {agency.cover_image ? (
                    <img
                        src={agency.cover_image}
                        alt={`${agency.name} cover`}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
                )}
            </div>

            {/* Right Side - Profile Info */}
            <div className="w-full p-8 flex flex-col justify-between bg-white">
                 {/* Top Section */}
                 <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        {/* Profile Image */}
                        <div className="relative flex-shrink-0">
                            {agency.profile_image ? (
                                <img
                                    src={agency.profile_image}
                                    alt={agency.name}
                                    className="w-20 h-20 rounded-md object-cover border-2 border-white shadow-md"
                                />
                            ) : (
                                <div className="w-20 h-20 bg-slate-100 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                                    <Building2 className="w-10 h-10 text-gray-400" />
                                </div>
                            )}
                            {agency.verified && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                    <CheckCircle className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Name and Location */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl lg:text-3xl font-bold mb-2 truncate text-gray-900">
                                {agency.name}
                            </h1>
                            <div className="flex items-center gap-2 text-sm mb-3 text-gray-600">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">
                                    {locationString}
                                </span>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-primary_color">
                                 <div className="flex items-center gap-1">
                                    <Home className="w-7 h-7 bg-primary_color rounded-md p-1 text-white" />
                                    <span className="font-medium">{agency.total_listings || 0} Listings</span>
                                 </div>
                                 <div className="flex items-center gap-1">
                                    <Users className="w-7 h-7 bg-primary_color rounded-md p-1 text-white" />
                                    <span className="font-medium">{agency.total_agents || 0} Agents</span>
                                 </div>
                            </div>
                        </div>

                         {/* Share Icon usually goes here */}
                    </div>
                 </div>

                 {/* Middle Section - Slogan (Optional) */}
                 <div className="py-8">
                    {/* Placeholder for slogan if agency had one, fitting the design pattern */}
                 </div>

                 {/* Bottom Section - Contact Info */}
                 <div className="flex flex-col gap-2">
                    {agency.email && (
                        <div className="flex items-center gap-3 border-b border-primary_color pb-2">
                             <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-gray-50 rounded-full">
                                <Mail className="w-5 h-5 text-gray-600" />
                             </div>
                             <button onClick={() => handleEmailClick(agency.email)} className="text-sm hover:text-blue-600 transition-colors cursor-pointer truncate text-gray-700 font-medium">
                                {agency.email}
                             </button>
                        </div>
                    )}
                    {agency.phone && (
                        <div className="flex items-center gap-3 border-b border-primary_color pb-2">
                             <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-gray-50 rounded-full">
                                <Phone className="w-5 h-5 text-gray-600" />
                             </div>
                             <button onClick={() => handlePhoneClick(agency.phone)} className="text-sm hover:text-blue-600 transition-colors cursor-pointer text-gray-700 font-medium">
                                {agency.phone}
                             </button>
                        </div>
                    )}
                    {agency.website && (
                         <div className="flex items-center gap-3 border-b border-primary_color pb-2">
                             <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-gray-50 rounded-full">
                                <Globe className="w-5 h-5 text-gray-600" />
                             </div>
                             <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-blue-600 transition-colors truncate text-gray-700 font-medium">
                                {agency.website}
                             </a>
                         </div>
                    )}
                 </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto px-6 py-16 bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side - All Information */}
                <div className="lg:col-span-2 space-y-12">
                     {/* About Us */}
                     {agency.description && (
                         <div>
                             <h2 className="font-light text-2xl mb-6 text-gray-900 border-b pb-2">About Us</h2>
                             <div className="prose prose-lg text-gray-600 leading-relaxed">
                                <p className="whitespace-pre-line">{agency.description}</p>
                             </div>
                         </div>
                     )}

                     {/* Company Overview */}
                     {agency.founded_year && (
                         <div>
                             <h2 className="font-light text-2xl mb-6 text-gray-900 border-b pb-2">Company Overview</h2>
                             <div className="space-y-2">
                                <DataRenderer 
                                    title="Founded In"
                                    value={agency.founded_year}
                                    icon={Calendar}
                                />
                             </div>
                         </div>
                     )}

                     {/* Agents Section */}
                     {agents.length > 0 && (
                         <div>
                             <h2 className="font-light text-2xl mb-6 text-gray-900 border-b pb-2">Our Team</h2>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {agents.map(agent => (
                                    <Link key={agent.id} href={`/home/allAgents/${agent.slug}`} className="bg-white rounded-xl p-4 flex items-center gap-4 hover:shadow-lg transition-all border border-gray-100 group">
                                         <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                                            {agent.profile_image ? (
                                                <img src={agent.profile_image} alt={agent.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <User />
                                                </div>
                                            )}
                                         </div>
                                         <div>
                                             <h4 className="font-bold text-gray-900 group-hover:text-primary_color transition-colors">{agent.name}</h4>
                                             <p className="text-sm text-gray-500">{agent.total_listings || 0} listings</p>
                                         </div>
                                    </Link>
                                ))}
                             </div>
                         </div>
                     )}

                     {/* Socials */}
                     {agency.social_media && Object.keys(agency.social_media).length > 0 && (
                         <div>
                            <h2 className="font-light text-2xl mb-6 text-gray-900 border-b pb-2">Socials</h2>
                            <div className="flex flex-wrap gap-4">
                                {agency.social_media.instagram && (
                                    <a href={agency.social_media.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-primary_color">
                                        <Instagram className="w-5 h-5" />
                                        <span>Instagram</span>
                                    </a>
                                )}
                                {agency.social_media.linkedin && (
                                    <a href={agency.social_media.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-primary_color">
                                        <Linkedin className="w-5 h-5" />
                                        <span>LinkedIn</span>
                                    </a>
                                )}
                                {agency.social_media.twitter && (
                                    <a href={agency.social_media.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-primary_color">
                                        <Twitter className="w-5 h-5" />
                                        <span>Twitter</span>
                                    </a>
                                )}
                            </div>
                         </div>
                     )}

                     {/* Listings Section */}
                     {listings.length > 0 && (
                         <div>
                             <h2 className="font-light text-2xl mb-6 text-gray-900 border-b pb-2">Our Listings</h2>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {listings.map(listing => {
                                    const listingImage = getListingImage(listing)
                                    return (
                                        <div key={listing.id} className="group border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl transition-shadow bg-white">
                                            <div className="relative h-48 bg-gray-200 overflow-hidden">
                                                {listingImage ? (
                                                    <img src={listingImage} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <Home />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-gray-900">
                                                    {listing.category?.name || 'Property'}
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h4 className="font-bold text-gray-900 truncate mb-1">{listing.title}</h4>
                                                <p className="text-primary_color font-bold text-lg mb-2">
                                                    {formatPrice(listing.price, listing.currency, listing.price_type, listing.duration)}
                                                </p>
                                                <div className="flex items-center text-gray-500 text-sm">
                                                    <MapPin className="w-4 h-4 mr-1" />
                                                    <span className="truncate">{listing.city}, {listing.country}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                             </div>
                         </div>
                     )}
                </div>

                {/* Right Side - Sticky Lead Form */}
                <div className="lg:col-span-1">
                    <div className="sticky top-8">
                        {agency.id && (
                             <LeadContactForm 
                                contextType="profile"
                                profileId={agency.id} // Assuming agency has an ID
                                profile={agency}
                                agency={agency} // Pass as agency
                                developer={null}
                                propertyTitle={`Consultation with ${agency.name}`}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default AgencyProfile
