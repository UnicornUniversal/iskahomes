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
  User
} from 'lucide-react'
import LeadContactForm from '@/app/components/LeadContactForm'
import Nav from '@/app/components/Nav'
import DataRenderer from '@/app/components/developers/DataRenderer'
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
      // First try to fetch from API
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

      // Fallback to dummy data logic if API fails or not found (preserving original behavior for development)
      const foundAgent = allAgents.find(a => a.slug === slug)
      
      if (foundAgent) {
        setAgent(foundAgent)
        // Find agency from dummy data if needed, or mock it
        setListings(foundAgent.properties || []) 
      } else {
         if (!response.ok) setError('Agent not found')
      }

      setLoading(false)

    } catch (err) {
      console.error('Error fetching agent:', err)
      setError('Error loading agent profile')
      setLoading(false)
    }
  }

  // Fallback to dummy data if API fails or for dev/preview
  const allAgents = [
    {
      id: 1,
      slug: 'kwame-mensah',
      name: 'Kwame Mensah',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop&crop=face',
      coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop',
      location: 'Accra, Greater Accra',
      specializations: ['Luxury Homes', 'Commercial'],
      listings: 12,
      rating: 4.8,
      reviewCount: 45,
      verified: true,
      experience: '10+ years',
      languages: ['English', 'Twi', 'Ga'],
      bio: 'Award-winning real estate agent with over 10 years of experience in the Accra luxury market. Dedicated to finding the perfect property for every client.',
      phone: '+233 20 123 4567',
      email: 'kwame.mensah@iskahomes.com',
      licenseNumber: 'REA-2024-001234',
      joinDate: '2015-03-12',
      socialMedia: {
        linkedin: 'kwame-mensah-re',
        twitter: '@kwamemensah',
        instagram: 'kwame.properties'
      },
      achievements: [
        'Top Sales Agent 2023',
        'Luxury Property Specialist',
        'Certified Negotiation Expert'
      ],
      properties: [
        {
          id: 1,
          title: 'Luxury Villa - East Legon',
          price: '$450,000',
          location: 'East Legon, Accra',
          image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=300&h=200&fit=crop',
          bedrooms: 5,
          bathrooms: 4,
          area: '450 sqm',
          type: 'For Sale',
          featured: true
        },
        {
          id: 2,
          title: 'Modern Apartment - Cantonments',
          price: '$2,500/month',
          location: 'Cantonments, Accra',
          image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop',
          bedrooms: 2,
          bathrooms: 2,
          area: '120 sqm',
          type: 'For Rent',
          featured: false
        },
        {
          id: 3,
          title: 'Commercial Office Space - Airport City',
          price: '$3,500/month',
          location: 'Airport City, Accra',
          image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=200&fit=crop',
          bedrooms: 0,
          bathrooms: 2,
          area: '200 sqm',
          type: 'For Rent',
          featured: true
        }
      ],
      reviews: [
        {
          id: 1,
          reviewer: 'John Doe',
          rating: 5,
          date: '2023-12-15',
          comment: 'Kwame was exceptional in helping us find our dream home. Highly recommended!',
          property: 'Luxury Villa - East Legon'
        },
        {
          id: 2,
          reviewer: 'Sarah Smith',
          rating: 5,
          date: '2023-11-20',
          comment: 'Professional, knowledgeable, and patient. Best agent in Accra!',
          property: 'Modern Apartment - Cantonments'
        }
      ]
    },
    {
       id: 2,
       slug: 'amina-yussif',
       name: 'Amina Yussif',
       image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face',
       coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop',
       location: 'Kumasi, Ashanti',
       specializations: ['Residential', 'Land'],
       listings: 8,
       rating: 4.9,
       reviewCount: 32,
       verified: true,
       experience: '5+ years',
       languages: ['English', 'Hausa', 'Twi'],
       bio: 'Specializing in residential properties and land acquisition in the Ashanti region. Passionate about helping first-time homebuyers.',
       phone: '+233 24 987 6543',
       email: 'amina.yussif@iskahomes.com',
       licenseNumber: 'REA-2024-005678',
       joinDate: '2019-06-20',
       socialMedia: {
         linkedin: 'amina-yussif-re',
         twitter: '@aminayussif',
         instagram: 'amina.realtor'
       },
       achievements: [
         'Rising Star 2021',
         'Best Client Service 2023'
       ],
       properties: [],
       reviews: []
     },
     {
       id: 3,
       slug: 'david-asante',
       name: 'David Asante',
       image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
       coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop',
       location: 'Takoradi, Western',
       specializations: ['Industrial', 'Commercial'],
       listings: 15,
       rating: 4.7,
       reviewCount: 28,
       verified: true,
       experience: '8+ years',
       languages: ['English', 'Fante'],
       bio: 'Expert in industrial and commercial properties in the Western Region. Helping businesses find the perfect location for their operations.',
       phone: '+233 50 111 2222',
       email: 'david.asante@iskahomes.com',
       licenseNumber: 'REA-2024-009012',
       joinDate: '2016-01-10',
       socialMedia: {
         linkedin: 'david-asante-commercial',
         twitter: '@davidasante',
         instagram: 'david.properties'
       },
       achievements: [
         'Commercial Agent of the Year 2022',
         'Top Industrial Sales'
       ],
       properties: [],
       reviews: []
     },
     {
        id: 4,
        slug: 'sarah-owusu',
        name: 'Sarah Owusu',
        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=face',
        location: 'Tema, Greater Accra',
        specializations: ['Residential', 'Short Lets'],
        listings: 18,
        rating: 4.9,
        reviewCount: 56,
        verified: true,
        experience: '6+ years',
        languages: ['English', 'Twi'],
        bio: 'Focused on premium residential sales and short-term rentals in Tema and surroundings.',
        phone: '+233 55 444 7777',
        email: 'sarah.owusu@iskahomes.com',
        properties: [],
        reviews: []
      },
      {
        id: 5,
        slug: 'kofi-annor',
        name: 'Kofi Annor',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
        location: 'Koforidua, Eastern',
        specializations: ['Land', 'Agricultural'],
        listings: 25,
        rating: 4.6,
        reviewCount: 38,
        verified: true,
        experience: '12+ years',
        languages: ['English', 'Twi', 'Ewe'],
        bio: 'Specialist in land acquisition and agricultural properties in the Eastern Region.',
        phone: '+233 27 888 9999',
        email: 'kofi.annor@iskahomes.com',
        properties: [],
        reviews: []
      },
     {
       id: 6,
       slug: 'grace-addo',
       name: 'Grace Addo',
       image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face',
       coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop',
       location: 'Tamale, Northern',
       specializations: ['Residential', 'Development'],
       listings: 14,
       rating: 4.8,
       reviewCount: 42,
       verified: true,
       experience: '9+ years',
       languages: ['English', 'Dagbani', 'Twi'],
       bio: 'Dedicated real estate professional serving the Northern Region. Experienced in both residential sales and property development projects.',
       phone: '+233 26 555 4444',
       email: 'grace.addo@iskahomes.com',
       licenseNumber: 'REA-2024-003456',
       joinDate: '2016-09-01',
       socialMedia: {
         linkedin: 'grace-addo-northern',
         twitter: '@graceaddo',
         instagram: 'grace.addo.re'
       },
       achievements: [
         'Northern Region Specialist',
         'Agricultural Property Expert',
         'Community Service Award'
       ],
       properties: [
         {
           id: 1,
           title: 'Family Compound - Tamale Central',
           price: '$180,000',
           location: 'Tamale Central',
           image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop',
           bedrooms: 5,
           bathrooms: 3,
           area: '400 sqm',
           type: 'For Sale',
           featured: true
         },
         {
           id: 2,
           title: 'Agricultural Land - Yendi',
           price: '$50,000',
           location: 'Yendi, Northern Region',
           image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=300&h=200&fit=crop',
           bedrooms: 0,
           bathrooms: 0,
           area: '10 acres',
           type: 'For Sale',
           featured: false
         }
       ],
       reviews: []
     },
     {
       id: 7,
       slug: 'emmanuel-boateng',
       name: 'Emmanuel Boateng',
       image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face',
       coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop',
       location: 'Kumasi, Ashanti',
       specializations: ['Commercial', 'Residential'],
       listings: 21,
       rating: 4.5,
       reviewCount: 78,
       verified: true,
       experience: '6+ years',
       languages: ['English', 'Twi'],
       bio: 'Versatile real estate agent handling both commercial and residential properties in the Ashanti region.',
       phone: '+233 24 345 6789',
       email: 'emmanuel.boateng@iskahomes.com',
       properties: [],
       reviews: []
     },
     {
       id: 8,
       slug: 'fatima-alhassan',
       name: 'Fatima Alhassan',
       image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=300&fit=crop&crop=face',
       coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop',
       location: 'Accra, Greater Accra',
       specializations: ['Residential', 'Rental'],
       listings: 19,
       rating: 4.6,
       reviewCount: 92,
       verified: true,
       experience: '7+ years',
       languages: ['English', 'Hausa', 'Twi'],
       bio: 'Multilingual real estate agent specializing in residential properties and rental management.',
       phone: '+233 20 987 6543',
       email: 'fatima.alhassan@iskahomes.com',
       properties: [],
       reviews: []
     }
  ]

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
    // If price is string and has symbols, return as is (for dummy data)
    if (typeof price === 'string' && (price.includes('$') || price.includes('GHS'))) return price;
    
    // Otherwise format
    const priceNum = parseFloat(price)
    const formattedPrice = priceNum.toLocaleString()
    
    let priceText = `${currency || 'GHS'} ${formattedPrice}`
    
    if (priceType === 'rent' && duration) {
      priceText += `/${duration}`
    }
    
    return priceText
  }

  const getListingImage = (listing) => {
    if (typeof listing.image === 'string') return listing.image; // Handle dummy data
    
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

  if (error || !agent) {
    return (
      <Layout1>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center text-gray-500">
                <p className="text-xl mb-4">{error || 'Agent not found'}</p>
                <Link href="/home/allAgents" className="text-primary_color underline hover:text-secondary_color">Back to Agents</Link>
            </div>
        </div>
      </Layout1>
    )
  }

  return (
    <div className="min-h-screen text-primary_color">
        <Nav />
        {/* Hero Section - Split Layout */}
        <div className="flex flex-col justify-between lg:grid lg:grid-cols-2 min-h-[600px] lg:h-screen">
             {/* Left Side - Cover Image */}
             <div className="relative w-full h-[300px] lg:h-full overflow-hidden">
                {agent.coverImage || agent.cover_image ? (
                    <img
                    src={agent.coverImage || agent.cover_image}
                    alt={`${agent.name} cover`}
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
                            {agent.image || agent.profile_image ? (
                                <img
                                src={agent.image || agent.profile_image}
                                alt={agent.name}
                                className="w-20 h-20 rounded-md object-cover border-2 border-white shadow-md"
                                />
                            ) : (
                                <div className="w-20 h-20 bg-slate-100 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                                    <User className="w-10 h-10 text-gray-400" />
                                </div>
                            )}
                            {agent.verified && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                    <CheckCircle className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>

                         {/* Name and Basic Info */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl lg:text-3xl font-bold mb-2 truncate text-gray-900">{agent.name}</h1>
                            {agency && (
                                <div className="flex items-center gap-2 mb-2 text-gray-600 font-medium text-lg">
                                    <Briefcase className="w-4 h-4 opacity-80" />
                                    <span>{agency.name}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                <MapPin className="w-4 h-4 mr-1.5" />
                                <span>{agent.location}</span>
                            </div>

                             {/* Rating */}
                             <div className="flex items-center gap-2">
                                  <Star className="w-4 h-4 text-orange-400 fill-current" />
                                  <span className="font-bold text-gray-900">{agent.rating || 'New'}</span>
                                  <span className="text-gray-500">({agent.reviewCount || 0} reviews)</span>
                             </div>
                        </div>

                        {/* Share Icon */}
                    </div>
                 </div>

                 {/* Middle Section - Spacer or Slogan */}
                 <div className="py-8">
                     {/* Can put a quote or specialization summary here */}
                     {agent.specializations && (
                         <div className="flex flex-wrap gap-2">
                             {agent.specializations.map((spec, idx) => (
                                 <span key={idx} className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600 font-medium">
                                     {spec}
                                 </span>
                             ))}
                         </div>
                     )}
                 </div>

                 {/* Bottom Section - Contact Info */}
                 <div className="flex flex-col gap-2">
                    {agent.email && (
                        <div className="flex items-center gap-3 border-b border-primary_color pb-2">
                             <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-gray-50 rounded-full">
                                <Mail className="w-5 h-5 text-gray-600" />
                             </div>
                             <button onClick={() => handleEmailClick(agent.email)} className="text-sm hover:text-blue-600 transition-colors cursor-pointer truncate text-gray-700 font-medium">
                                {agent.email}
                             </button>
                        </div>
                    )}
                    {agent.phone && (
                        <div className="flex items-center gap-3 border-b border-primary_color pb-2">
                             <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-gray-50 rounded-full">
                                <Phone className="w-5 h-5 text-gray-600" />
                             </div>
                             <button onClick={() => handlePhoneClick(agent.phone)} className="text-sm hover:text-blue-600 transition-colors cursor-pointer text-gray-700 font-medium">
                                {agent.phone}
                             </button>
                        </div>
                    )}
                 </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto px-6 py-16 bg-white">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Left Content */}
                 <div className="lg:col-span-2 space-y-12">
                     {/* About Me */}
                     <div>
                         <h2 className="font-light text-2xl mb-6 text-gray-900 border-b pb-2">About Me</h2>
                         <p className="text-gray-600 leading-8 text-lg font-light">
                            {agent.bio || 'No biography available.'}
                        </p>
                     </div>

                     {/* Experience & Languages */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {agent.experience && (
                             <div>
                                 <h2 className="font-light text-2xl mb-6 text-gray-900 border-b pb-2">Experience</h2>
                                 <DataRenderer 
                                    title="Years of Experience"
                                    value={agent.experience}
                                    icon={Clock}
                                 />
                             </div>
                         )}
                         {agent.languages && (
                             <div>
                                 <h2 className="font-light text-2xl mb-6 text-gray-900 border-b pb-2">Languages</h2>
                                 <DataRenderer 
                                    title="Spoken Languages"
                                    value={agent.languages.join(', ')}
                                    icon={Languages}
                                 />
                             </div>
                         )}
                     </div>

                     {/* Achievements */}
                     {agent.achievements && agent.achievements.length > 0 && (
                         <div>
                             <h2 className="font-light text-2xl mb-6 text-gray-900 border-b pb-2">Achievements</h2>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {agent.achievements.map((item, idx) => (
                                    <div key={idx} className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="w-8 h-8 rounded-full bg-primary_color text-white flex items-center justify-center mr-3 font-bold text-sm">
                                            {idx + 1}
                                        </div>
                                        <span className="font-medium text-gray-700">{item}</span>
                                    </div>
                                ))}
                            </div>
                         </div>
                     )}

                      {/* Socials */}
                      {agent.socialMedia && Object.keys(agent.socialMedia).length > 0 && (
                         <div>
                            <h2 className="font-light text-2xl mb-6 text-gray-900 border-b pb-2">Socials</h2>
                            <div className="flex flex-wrap gap-4">
                                {agent.socialMedia.instagram && (
                                    <a href={agent.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-primary_color">
                                        <Instagram className="w-5 h-5" />
                                        <span>Instagram</span>
                                    </a>
                                )}
                                {agent.socialMedia.linkedin && (
                                    <a href={agent.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-primary_color">
                                        <Linkedin className="w-5 h-5" />
                                        <span>LinkedIn</span>
                                    </a>
                                )}
                                {agent.socialMedia.twitter && (
                                    <a href={agent.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-primary_color">
                                        <Twitter className="w-5 h-5" />
                                        <span>Twitter</span>
                                    </a>
                                )}
                            </div>
                         </div>
                     )}

                     {/* Listings */}
                     {listings.length > 0 && (
                         <div>
                             <h2 className="font-light text-2xl mb-6 text-gray-900 border-b pb-2">Active Listings</h2>
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
                                                    {listing.type || 'Property'}
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h4 className="font-bold text-gray-900 truncate mb-1">{listing.title}</h4>
                                                <p className="text-primary_color font-bold text-lg mb-2">
                                                    {formatPrice(listing.price, listing.currency, listing.price_type, listing.duration)}
                                                </p>
                                                <div className="flex items-center text-gray-500 text-sm">
                                                    <MapPin className="w-4 h-4 mr-1" />
                                                    <span className="truncate">{listing.location}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                             </div>
                         </div>
                     )}
                 </div>

                 {/* Right Side - Sticky Form */}
                 <div className="lg:col-span-1">
                    <div className="sticky top-8">
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
