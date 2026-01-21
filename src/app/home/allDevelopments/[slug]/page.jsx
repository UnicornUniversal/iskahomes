'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Building2, Calendar, Users, CheckCircle, Phone, Mail, Globe, ArrowRight, Play, ExternalLink, Star, Heart, Share2 } from 'lucide-react'
import { motion, AnimatePresence, useScroll } from 'framer-motion'

import UnitCard from '@/app/components/developers/units/UnitCard'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useAuth } from '@/contexts/AuthContext'
import ShareModal from '@/app/components/ui/ShareModal'
import { toast } from 'react-toastify'
import Nav from '@/app/components/Nav'  

const DevelopmentPage = () => {
  const params = useParams()
  const analytics = useAnalytics()
  const { user } = useAuth()
  const { scrollYProgress } = useScroll()
  const [development, setDevelopment] = useState(null)
  const [developer, setDeveloper] = useState(null)
  const [units, setUnits] = useState([])
  const [relatedDevelopments, setRelatedDevelopments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

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
          
          // Enrich units with development location data
          const unitsWithLocation = (data.data.units || []).map(unit => ({
            ...unit,
            city: unit.city || data.data.development.city,
            state: unit.state || data.data.development.state,
            town: unit.town || data.data.development.town
          }))
          setUnits(unitsWithLocation)
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="h-1 w-24 bg-gray-100 overflow-hidden rounded-full">
            <motion.div
              className="h-full bg-primary_color"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                repeat: Infinity,
                duration: 1,
                ease: "easeInOut"
              }}
            />
          </div>
          <motion.p 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-xs font-medium tracking-[0.2em] text-gray-400 uppercase"
          >
            Loading Experience
          </motion.p>
        </motion.div>
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

  const handleFavoriteClick = () => {
    // TODO: Implement favorite functionality for developments
    setIsFavorite(!isFavorite)
    toast.info('Favorite functionality coming soon')
  }



  return (
    <div className="min-h-screen bg-white text-primary_color selection:bg-primary_color selection:text-white">
      <Nav />
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary_color origin-left z-50"
        style={{ scaleX: scrollYProgress }}
      />
      
      {/* Immersive Hero Section */}
      <div className="relative h-[90vh] w-full overflow-hidden">
        {development.banner ? (
          <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <Image
              src={development.banner.url}
              alt={development.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/20" /> {/* Subtle Overlay */}
          </motion.div>
        ) : (
          <div className="absolute inset-0 bg-primary_color/10" />
        )}

        <div className="absolute inset-0 flex flex-col justify-end pb-20 px-6 md:px-12 max-w-[1920px] mx-auto">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl"
          >
            <div className="flex items-center space-x-4 mb-6">
              <span className="px-4 py-1 bg-white/90 backdrop-blur-md text-primary_color text-xs font-medium tracking-widest uppercase rounded-full">
                {development.status}
              </span>
              {developer && (
                <span className="text-white/90 text-sm font-medium tracking-wide flex items-center">
                  By {developer.name}
                  {developer.verified && <CheckCircle className="w-4 h-4 ml-1 text-white" />}
                </span>
              )}
            </div>
            
            <h1 className="text-6xl md:text-8xl font-light text-white leading-[0.9] tracking-tight mb-8">
              {development.title}
            </h1>

            <div className="flex items-center text-white/80 space-x-6 text-sm md:text-base font-light">
              <span className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                {development.town ? `${development.town}, ` : ''}{development.city}
              </span>
              <span className="h-4 w-px bg-white/30" />
              <span>{development.country}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating Stats Strip */}
      <div className="relative z-10 -mt-20 px-6 md:px-12 max-w-[1920px] mx-auto mb-24">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-white p-8 md:p-12 shadow-2xl max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Buildings</p>
            <p className="text-4xl font-light text-primary_color">{development.number_of_buildings}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Total Units</p>
            <p className="text-4xl font-light text-primary_color">{development.total_units}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Size</p>
            <p className="text-4xl font-light text-primary_color">{development.size}</p>
          </div>
          <div className="flex items-center justify-end space-x-2">
             <button
                onClick={handleFavoriteClick}
                className="p-4 hover:bg-gray-50 rounded-full transition-colors group"
              >
                <Heart className={`w-6 h-6 ${isFavorite ? 'fill-primary_color text-primary_color' : 'text-gray-400 group-hover:text-primary_color'}`} />
              </button>
              <button
                onClick={() => {
                  setShowShareModal(true)
                  handleShareClick('modal')
                }}
                className="p-4 hover:bg-gray-50 rounded-full transition-colors group"
              >
                <Share2 className="w-6 h-6 text-gray-400 group-hover:text-primary_color" />
              </button>
          </div>
        </motion.div>
      </div>

      <div className="max-w-[1920px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-32">
          {/* Sticky Intro / About */}
          <div className="lg:col-span-4">
            <div className="sticky top-12">
              <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-4">The Development</h2>
              <h3 className="text-3xl font-light leading-tight mb-8 text-primary_color">
                Stunning architecture meets modern living in the heart of {development.city}.
              </h3>
               {/* Categories */}
               {(development.purposes?.length > 0 || development.types?.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {development.purposes?.map((p, i) => (
                    <span key={i} className="px-3 py-1 border border-gray-200 rounded-full text-xs uppercase tracking-wider text-gray-600">
                      {typeof p === 'string' ? p : p.name}
                    </span>
                  ))}
                   {development.types?.map((t, i) => (
                    <span key={i} className="px-3 py-1 border border-primary_color/20 bg-primary_color/5 rounded-full text-xs uppercase tracking-wider text-primary_color">
                      {typeof t === 'string' ? t : t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Scrolling Details */}
          <div className="lg:col-span-8">
            <div className="prose prose-lg prose-slate max-w-none mb-12">
              <p className="lead text-xl text-gray-600 font-light leading-relaxed">
                {development.description}
              </p>
            </div>

             {/* Dynamic Details Grid */}
             <div className="grid grid-cols-2 gap-x-12 gap-y-8 border-t border-gray-100 pt-8">
                <div>
                   <h4 className="text-xs uppercase tracking-widest text-gray-400 mb-2">Location</h4>
                   <p className="text-lg font-medium text-primary_color">{development.full_address || `${development.city}, ${development.country}`}</p>
                </div>
                {developer && (
                   <div>
                    <h4 className="text-xs uppercase tracking-widest text-gray-400 mb-2">Developer</h4>
                    <Link href={`/home/allDevelopers/${developer.slug}`} className="text-lg font-medium text-primary_color hover:underline decoration-1 underline-offset-4">
                      {developer.name}
                    </Link>
                  </div>
                )}
             </div>
             
             {/* Downloads */}
             {development.additional_files?.length > 0 && (
               <div className="mt-12 pt-12 border-t border-gray-100">
                 <h4 className="text-xs uppercase tracking-widest text-gray-400 mb-6">Documents</h4>
                 <div className="flex flex-wrap gap-4">
                    {development.additional_files.map((file, idx) => (
                      <a 
                        key={idx}
                        href={file.url}
                        target="_blank"
                        className="flex items-center space-x-3 px-6 py-4 bg-gray-50 hover:bg-primary_color hover:text-white transition-all duration-300 group min-w-[200px]"
                      >
                         <div className="p-2 bg-white rounded-full group-hover:bg-white/20">
                            <ExternalLink className="w-4 h-4" />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-sm font-medium">{file.name || 'Document'}</span>
                            <span className="text-xs opacity-60">Download PDF</span>
                         </div>
                      </a>
                    ))}
                 </div>
               </div>
             )}
          </div>
        </div>

        {/* Gallery - Masonry / Grid */}
        {allImages.length > 0 && (
          <div className="mb-32">
            <h2 className="text-4xl md:text-5xl font-light text-primary_color mb-16 text-center">Gallery</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
              {allImages.slice(0, 6).map((img, idx) => (
                 <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`relative overflow-hidden group aspect-[4/3] ${idx === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                 >
                    <Image 
                      src={img.url} 
                      alt={`Gallery ${idx}`}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
                 </motion.div>
              ))}
            </div>
             {allImages.length > 6 && (
                <div className="text-center mt-12">
                   <button className="px-8 py-3 border border-primary_color text-primary_color hover:bg-primary_color hover:text-white transition-colors duration-300 uppercase tracking-widest text-xs font-medium">
                      View All Photos
                   </button>
                </div>
             )}
          </div>
        )}

        {/* Available Units */}
        <div className="mb-32">
           <div className="flex items-end justify-between mb-16">
              <div>
                <h2 className="text-4xl md:text-5xl font-light text-primary_color mb-4">Available Units</h2>
                <p className="text-gray-500 font-light">Select from our exclusive inventory</p>
              </div>
              <div className="hidden md:block h-px flex-1 bg-gray-200 mx-12 mb-4" />
           </div>

           {units.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {units.map((unit, idx) => (
                 <motion.div
                   key={unit.id}
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ delay: idx * 0.1 }}
                 >
                   <UnitCard unit={unit} developerSlug={developer?.slug} />
                 </motion.div>
               ))}
             </div>
           ) : (
             <div className="py-24 text-center bg-gray-50">
               <span className="text-gray-400 font-light text-xl">Inventory coming soon</span>
             </div>
           )}
        </div>

        {/* Location Map */}
        {development.latitude && development.longitude && (
           <div className="mb-32">
              <h2 className="text-4xl md:text-5xl font-light text-primary_color mb-12 text-center">Location</h2>
              <div className="h-[600px] w-full grayscale hover:grayscale-0 transition-all duration-700 ease-in-out">
                  <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${development.longitude - 0.01},${development.latitude - 0.01},${development.longitude + 0.01},${development.latitude + 0.01}&layer=mapnik&marker=${development.latitude},${development.longitude}`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      className="w-full h-full"
                    />
              </div>
           </div>
        )}

        {/* Video Section - Premium Cinema Mode */}
        {development.video && (
          <div className="mb-32">
             <div className="relative aspect-video w-full overflow-hidden group cursor-pointer">
                <video
                  src={development.video.url}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  controls
                  poster={development.banner?.url}
                />
             </div>
             <p className="text-center mt-4 text-xs tracking-widest uppercase opacity-60">Development Video Tour</p>
          </div>
        )}

        {/* Related Developments - Dark Mode Contrast */}
        {relatedDevelopments.length > 0 && (
          <div className="mb-32">
             <h2 className="text-4xl md:text-5xl font-light text-primary_color mb-16 text-center">More from {developer?.name}</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {relatedDevelopments.map((related, idx) => (
                 <motion.div 
                    key={related.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                 >
                   <Link href={`/home/allDevelopments/${related.slug}`}>
                     <div className="group cursor-pointer">
                       <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 mb-6">
                         {related.banner ? (
                            <Image
                              src={related.banner.url}
                              alt={related.title}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                         ) : (
                            <div className="absolute inset-0 bg-primary_color/5" />
                         )}
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                       </div>
                       
                       <div className="flex justify-between items-baseline">
                          <h3 className="text-xl font-light text-primary_color group-hover:underline decoration-1 underline-offset-4 decoration-primary_color/30">
                            {related.title}
                          </h3>
                          <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                             {related.city}
                          </span>
                       </div>
                     </div>
                   </Link>
                 </motion.div>
               ))}
             </div>
          </div>
        )}

        {/* Developer / Contact Minimal Footer */}
        {developer && (
           <div className="bg-primary_color text-white p-12 md:p-24 text-center mb-12">
              <div className="max-w-2xl mx-auto">
                 <span className="text-xs uppercase tracking-widest opacity-60 mb-4 block">Interested?</span>
                 <h2 className="text-4xl md:text-5xl font-light mb-12">Contact {developer.name}</h2>
                 
                 <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                    {developer.phone && (
                       <button onClick={() => handlePhoneClick(developer.phone)} className="px-8 py-4 bg-white text-primary_color hover:bg-gray-100 w-full md:w-auto transition-colors font-medium">
                          Call Now
                       </button>
                    )}
                    {developer.email && (
                       <button onClick={() => handleEmailClick(developer.email)} className="px-8 py-4 border border-white/30 hover:bg-white/10 w-full md:w-auto transition-colors font-medium">
                          Email Developer
                       </button>
                    )}
                 </div>
              </div>
           </div>
        )}

      </div>

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
