'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Layout1 from '@/app/layout/Layout1'
import { 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase, 
  Linkedin, 
  Twitter, 
  Instagram, 
  Star, 
  Home, 
  CheckCircle, 
  MessageSquare, 
  Share2, 
  ArrowLeft,
  Globe,
  Award,
  Languages,
  Clock,
  User,
  ExternalLink,
  Bed,
  Bath,
  Square,
  Calendar,
  Users
} from 'lucide-react'
import LeadContactForm from '@/app/components/LeadContactForm'
import Nav from '@/app/components/Nav'
import { toast } from 'react-toastify'

const AgentProfile = () => {
  const params = useParams()
  const slug = params.slug
  const [agent, setAgent] = useState(null)
  const [agency, setAgency] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (slug) {
      fetchAgentData()
    }
  }, [slug])

  const fetchAgentData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/public/agents/${slug}`)
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
            setAgent(result.data.agent)
            setAgency(result.data.agency)
            setListings(result.data.listings || [])
            setLoading(false)
            return
        }
      }

      setError('Agent not found')
      setLoading(false)

    } catch (err) {
      console.error('Error fetching agent:', err)
      setError('Error loading agent profile')
      setLoading(false)
    }
  }

  // Helper to parse JSON images
  const getImage = (img) => {
    if (!img) return null;
    try {
        const parsed = JSON.parse(img);
        return parsed.url || parsed.path;
    } catch {
        return img;
    }
  }

  // Helper to safely get listing image
  const getListingImage = (listing) => {
    try {
        // Try to access various image paths based on seen data structures
        if (listing.media && listing.media.mediaFiles && listing.media.mediaFiles.length > 0) {
            return listing.media.mediaFiles[0].url;
        }
        if (listing.media && listing.media.banner) {
            return listing.media.banner.url;
        }
        // Fallback for different structures
        if (listing.images && listing.images.length > 0) return listing.images[0];
        
        return null;
    } catch (e) {
        return null;
    }
  }

  if (loading) {
    return (
      <Layout1>
         <div className="min-h-screen bg-white flex items-center justify-center">
             <div className="relative">
                 <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary_color"></div>
             </div>
         </div>
      </Layout1>
    )
  }

  if (error || !agent) {
    return (
      <Layout1>
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{error || 'Agent not found'}</h2>
            <Link href="/home/allAgents" className="px-6 py-3 bg-primary_color text-white rounded-full hover:bg-opacity-90 transition-all">
                Back to Agents
            </Link>
        </div>
      </Layout1>
    )
  }

  const agentImage = getImage(agent.profile_image)
  // Use /bg.jpg if no cover image is available
  const coverImage = getImage(agent.cover_image) || '/bg.jpg'
  const agencyImage = agency ? getImage(agency.profile_image) : null

  return (
    <div className="min-h-screen  font-sans text-slate-800">
        <Nav />
        
        {/* Modern Hero Section */}
        <div className="relative h-[40vh] md:h-[50vh] min-h-[400px]">
            {/* Cover Image Background */}
            <div className="absolute inset-0">
                <img 
                    src={coverImage} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = '/bg.jpg' }} // Fallback if image fails load
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            </div>

            {/* Content Container */}
            <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-end pb-12">
                <div className="flex flex-col md:flex-row gap-8 items-end w-full">
                    {/* Profile Image */}
                    <div className="relative shrink-0">
                         <div className="w-40 h-40 md:w-48 md:h-48 rounded-3xl border-4 border-white shadow-2xl overflow-hidden bg-white">
                            {agentImage ? (
                                <img src={agentImage} alt={agent.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                    <User className="w-20 h-20 text-gray-300" />
                                </div>
                            )}
                         </div>
                         {agent.verified && (
                             <div className="absolute -bottom-3 -right-3 bg-white rounded-full p-2 shadow-lg">
                                 <CheckCircle className="w-6 h-6 text-secondary_color fill-current" />
                             </div>
                         )}
                    </div>

                    {/* Agent Details - Text */}
                    <div className="flex-1 text-white mb-2">
                         <div className="flex items-center gap-3 mb-2">
                             <h1 className="text-4xl md:text-5xl text-white tracking-tight">{agent.name}</h1>
                         </div>
                         
                         {agency && (
                             <Link href={`/home/allAgencies/${agency.slug}`} className="group flex items-center gap-3 mb-4 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full w-fit border border-white/20 hover:bg-white/20 transition-all">
                                 {agencyImage ? (
                                    <img src={agencyImage} alt={agency.name} className="w-6 h-6 rounded-full object-cover" />
                                 ) : (
                                    <Briefcase className="w-5 h-5 text-white/80" />
                                 )}
                                 <span className="font-medium text-lg">{agency.name}</span>
                             </Link>
                         )}

                         <div className="flex flex-wrap gap-4 text-white/90 text-sm md:text-base">
                             <div className="flex items-center gap-1.5">
                                 <MapPin className="w-4 h-4 text-secondary_color" />
                                 {agent.location_id || agency?.city || 'Accra, Ghana'}
                             </div>
                             <div className="flex items-center gap-1.5">
                                 <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                 <span className="font-bold">4.9</span> (Professional Rating)
                             </div>
                         </div>
                    </div>

                    {/* Quick Stats / Action */}
                    <div className="flex gap-4 mb-2">
                         <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 text-center">
                             <div className="text-2xl font-bold text-white">{agent.total_listings || 0}</div>
                             <div className="text-xs text-white/70 uppercase tracking-wider">Properties</div>
                         </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Main Content Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Column - Details */}
                <div className="lg:col-span-2 space-y-12">
                    
                    {/* Bio Section */}
                    <section>
                        <h2 className="text-2xl font-bold text-primary_color mb-6 flex items-center gap-3">
                            <span className="w-8 h-1 bg-secondary_color rounded-full"></span>
                            About {agent.name.split(' ')[0]}
                        </h2>
                        <div className="prose prose-lg text-gray-600 leading-relaxed font-light">
                             {agent.bio ? (
                                 <p>{agent.bio}</p>
                             ) : (
                                 <p className="italic text-gray-400">No biography provided.</p>
                             )}
                        </div>

                         {/* Specializations Tags */}
                         {agent.specializations && ( 
                             <div className="mt-8 flex flex-wrap gap-2">
                                 {(Array.isArray(agent.specializations) ? agent.specializations : ['Residential', 'Luxury', 'Consultancy']).map((spec, i) => (
                                     <span key={i} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">
                                         {spec}
                                     </span>
                                 ))}
                             </div>
                         )}
                    </section>
                
                    {/* Listings Divider */}
                    <div className="h-px bg-gray-100 w-full my-12"></div>

                    {/* Active Listings */}
                    <section>
                         <h2 className="text-3xl font-bold text-primary_color mb-8 flex items-center justify-between">
                            <span>Active Listings</span>
                            <span className="text-lg font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                {listings.length}
                            </span>
                        </h2>
                        
                        {listings.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {listings.map(listing => {
                                    const image = getListingImage(listing) || '/bg.jpg'; // Fallback for listing image too
                                    const title = listing.title || 'Untitled Property';
                                    const price = listing.price ? Number(listing.price).toLocaleString() : 'POA';
                                    const currency = listing.currency?.symbol || 'GHS';
                                    const location = listing.city && listing.state ? `${listing.city}, ${listing.state}` : (listing.country || 'Location not specified');
                                    const specs = listing.specifications || {};
                                    const availableFrom = listing.available_from ? new Date(listing.available_from).toLocaleDateString() : 'Now';

                                    return (
                                    <Link href={`/home/property/${listing.listing_type || 'for-sale'}/${listing.slug}/${listing.id}`} key={listing.id}>
                                         <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group h-full flex flex-col">
                                             {/* Image Section - Matching ListingCard height */}
                                             <div className="relative h-64 w-full overflow-hidden">
                                                    <img 
                                                        src={image} 
                                                        alt={title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => { e.target.src = '/bg.jpg' }}
                                                    />
                                                 
                                                 {/* Status Badges */}
                                                 <div className="absolute top-4 left-4 flex flex-col gap-2">
                                                    {listing.is_featured && (
                                                        <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">Featured</span>
                                                    )}
                                                    {listing.is_verified && (
                                                        <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">Verified</span>
                                                    )}
                                                    {listing.is_premium && (
                                                        <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium">Premium</span>
                                                    )}
                                                 </div>
                                                 
                                                 {/* Price Badge */}
                                                 <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                                                     <span className="text-sm font-bold text-gray-900">
                                                        {currency} {price}{listing.price_type === 'rent' ? `/${listing.duration || 'mo'}` : ''}
                                                     </span>
                                                 </div>
                                             </div>
                                             
                                             <div className="p-6 flex-1 flex flex-col">
                                                 {/* Title & Location */}
                                                 <div className="mb-4">
                                                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                        {title}
                                                    </h3>
                                                    <div className="flex items-center text-gray-600 text-sm">
                                                        <MapPin className="w-4 h-4 mr-1 shrink-0" />
                                                        <span className="line-clamp-1">{location}</span>
                                                    </div>
                                                 </div>
                                                 
                                                 {/* Description if needed, or Specs directly */}
                                                 
                                                 {/* Specs */}
                                                 <div className="flex items-center justify-between text-sm text-gray-600 mb-4 mt-auto">
                                                     <div className="flex items-center space-x-4">
                                                         {specs.bedrooms > 0 && (
                                                             <div className="flex items-center">
                                                                 <Bed className="w-4 h-4 mr-1" />
                                                                 <span>{specs.bedrooms}</span>
                                                             </div>
                                                         )}
                                                         {specs.bathrooms > 0 && (
                                                             <div className="flex items-center">
                                                                 <Bath className="w-4 h-4 mr-1" />
                                                                 <span>{specs.bathrooms}</span>
                                                             </div>
                                                         )}
                                                         {specs.size > 0 && (
                                                             <div className="flex items-center">
                                                                 <Square className="w-4 h-4 mr-1" />
                                                                 <span>{specs.size} {listing.listing_type === 'unit' ? 'sq ft' : 'sq m'}</span>
                                                             </div>
                                                         )}
                                                     </div>
                                                 </div>

                                                 {/* Footer Info */}
                                                 <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-4">
                                                    <div className="flex items-center">
                                                        <Calendar className="w-4 h-4 mr-1" />
                                                        <span>Available {availableFrom}</span>
                                                    </div>
                                                    
                                                     <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                                        listing.listing_type === 'unit' 
                                                            ? 'bg-blue-100 text-blue-800' 
                                                            : 'bg-green-100 text-green-800'
                                                        }`}>
                                                        {listing.listing_type === 'unit' ? 'Unit' : 'Property'}
                                                    </span>
                                                 </div>
                                             </div>
                                         </div>
                                    </Link>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">No active properties</h3>
                                <p className="text-gray-500">This agent doesn't have any listings at the moment.</p>
                            </div>
                        )}
                    </section>
                </div>

                {/* Right Column - Sticky Contact */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-8">
                        <LeadContactForm 
                            contextType="profile"
                            profileId={agent.id}
                            profile={agent}
                            agent={agent}
                            developer={null}
                            propertyTitle={`Consultation with ${agent.name}`}
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default AgentProfile
