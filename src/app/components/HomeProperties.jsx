"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Playfair_Display } from 'next/font/google'
import { MapPin, Bed, Bath, Square } from 'lucide-react'

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
})

const headingElementVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: index * 0.08, ease: 'easeOut' }
  })
}

const heroHeadingElements = [
  { id: 'word-1', type: 'word', content: 'Explore' },
  { id: 'word-2', type: 'word', content: 'our' },
  { id: 'word-3', type: 'word', content: 'select' },
  { id: 'word-4', type: 'word', content: 'properties,' },
  { id: 'break-1', type: 'break' },
  { id: 'word-5', type: 'word', content: 'offering' },
  { id: 'word-6', type: 'word', content: 'premium' },
  { id: 'word-7', type: 'word', content: 'standards' },
  { id: 'word-8', type: 'word', content: 'of' },
  { id: 'word-9', type: 'word', content: 'comfort' },
  { id: 'word-10', type: 'word', content: '&' },
  { id: 'break-2', type: 'break' },
  { id: 'word-11', type: 'word', content: 'quality.' },
  { id: 'word-12', type: 'word', content: 'An' },
  { id: 'word-13', type: 'word', content: 'ideal' },
  { id: 'word-14', type: 'word', content: 'place' },
  { id: 'word-15', type: 'word', content: 'to' },
  { id: 'word-16', type: 'word', content: 'call' },
  { id: 'word-17', type: 'word', content: 'your' },
  { id: 'word-18', type: 'word', content: 'own' },
]

const HomeProperties = () => {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const heroFadeRef = useRef(null)

  // Fetch listings from API
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true)
        console.log('Fetching listings from /api/get-listings...')
        
        const response = await fetch('/api/get-listings')
        const result = await response.json()
        
        console.log('API Response:', result)
        
        if (result.success) {
          const parsedListings = result.data.map(listing => {
            const parsed = { ...listing }
            if (typeof parsed.media === 'string') {
              try {
                parsed.media = JSON.parse(parsed.media)
              } catch (e) {
                console.error('Error parsing media:', e)
              }
            }
            return parsed
          })
          
          setListings(parsedListings)
          console.log('Listings set:', parsedListings.length)
        } else {
          setError(result.error || 'Failed to fetch listings')
        }
      } catch (err) {
        console.error('Error fetching listings:', err)
        setError('Failed to fetch listings')
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [])

  // Hero fade on scroll
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroFadeRef,
    offset: ['start start', 'end start']
  })
  const heroOpacity = useTransform(heroScrollProgress, [0, 0.5], [1, 0])

  // Pagination helpers
  const totalPages = listings.length
  const currentListing = listings[currentPage] || null

  const goNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))
  }, [totalPages])

  const goPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 0))
  }, [])

  // Get all images for a listing from its media albums
  const getListingImages = (listing) => {
    if (!listing) return []
    const images = []
    if (listing.media?.albums && Array.isArray(listing.media.albums)) {
      for (const album of listing.media.albums) {
        if (album?.images && Array.isArray(album.images)) {
          for (const img of album.images) {
            images.push(img.url)
          }
        }
      }
    }
    if (images.length === 0 && listing.media?.mediaFiles && Array.isArray(listing.media.mediaFiles)) {
      for (const file of listing.media.mediaFiles) {
        images.push(file.url)
      }
    }
    if (images.length === 0 && listing.media?.banner?.url) {
      images.push(listing.media.banner.url)
    }
    return images
  }

  // Format price
  const formatPrice = (listing) => {
    const p = parseFloat(listing.price || 0)
    const cur = listing.currency || 'GHS'
    const pt = listing.price_type || 'sale'
    const dur = listing.duration || null
    let text = `${cur} ${p.toLocaleString()}`
    if (pt === 'rent' || pt === 'lease') {
      text += `/${dur || 'month'}`
    }
    return text
  }

  // Parse specs
  const getSpecs = (listing) => {
    if (!listing.specifications) return {}
    try {
      return typeof listing.specifications === 'string' ? JSON.parse(listing.specifications) : listing.specifications
    } catch { return {} }
  }

  // Get listing type label
  const getTypeLabel = (listing) => {
    if (listing.listing_type) return listing.listing_type.charAt(0).toUpperCase() + listing.listing_type.slice(1)
    if (listing.purpose_name) return listing.purpose_name
    return 'Property'
  }

  // Get location string
  const getLocation = (listing) => {
    const parts = [listing.city, listing.state].filter(Boolean)
    return parts.join(', ') || listing.country || ''
  }

  return (
    <div className='w-full h-full relative'>
      {/* Hero section — fades out as you scroll */}
      <div ref={heroFadeRef} className="relative" style={{ minHeight: '100vh' }}>
        <motion.div
          className="sticky top-[100px] z-0 flex flex-col items-center justify-center max-h-[1200px] w-full h-[70vh] min-h-[400px] md:min-h-[600px] px-4 transition-opacity duration-300"
          style={{ opacity: heroOpacity }}
        >
          <motion.h2
            className={`${playfairDisplay.className} text-center max-w-5xl text-[1.6em] sm:text-[2.2em] md:text-[3.2em] w-full text-primary_color leading-[1.2]`}
          >
            {heroHeadingElements.map((element, index) => {
              if (element.type === 'break') {
                return <br key={element.id} className="hidden md:block" />
              }

              if (element.type === 'image') {
                const imageClassName = element.variant === 'inline'
                  ? 'inline-block mx-3 align-middle overflow-hidden rounded-xl w-32 h-16 md:w-44 md:h-24'
                  : 'block mt-8 mb-10 mx-auto overflow-hidden rounded-xl w-32 h-16 md:w-44 md:h-24'

                return (
                  <motion.span
                    key={element.id}
                    custom={index}
                    variants={headingElementVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    className={imageClassName}
                  >
                    <img src={element.src} alt={element.alt} className="object-cover w-full h-full" />
                  </motion.span>
                )
              }

              return (
                <motion.span
                  key={element.id}
                  custom={index}
                  variants={headingElementVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  className="inline-block mr-2"
                >
                  {element.content}
                </motion.span>
              )
            })}
          </motion.h2>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center mt-10">
            <Link href="/home/signup">
              <button className="px-6 py-3 rounded-[30px] border border-primary_color text-primary_color hover:bg-primary_color hover:text-white transition flex items-center gap-3">
                Sign Up to List Properties 
                <svg className="w-5 h-5 font-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l4-4-4-4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h7" />
                </svg>
              </button>
            </Link>
            <Link href="/home/exploreProperties">
              <button className="px-6 py-3 rounded-[30px] border border-primary_color text-primary_color hover:bg-primary_color hover:text-white transition flex items-center gap-3">
                Explore Properties
                <svg className="w-5 h-5 font-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l4-4-4-4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h7" />
                </svg>
              </button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ── Paginated Property Grid ──────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>
        {loading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary_color" />
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {!loading && !error && listings.length > 0 && (() => {
          const images = getListingImages(currentListing)
          const heroImg = images[0] || null
          const thumb1 = images[1] || images[0] || null
          const thumb2 = images[2] || images[0] || null
          const specs = getSpecs(currentListing)
          const priceText = formatPrice(currentListing)
          const typeLabel = getTypeLabel(currentListing)
          const location = getLocation(currentListing)

          return (
            <>
              {/* Header row — page counter & arrows */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginBottom: 16 }}>
                <span className="text-primary_color" style={{ fontSize: 15, fontWeight: 500 }}>
                  {totalPages} {totalPages === 1 ? 'Page' : 'Pages'}
                </span>
                <button
                  onClick={goPrevPage}
                  disabled={currentPage === 0}
                  className="text-primary_color disabled:opacity-30"
                  style={{
                    width: 36, height: 36, borderRadius: '50%', border: '1.5px solid currentColor',
                    background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: currentPage === 0 ? 'default' : 'pointer', transition: 'opacity 0.2s',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <span className="text-primary_color" style={{ fontSize: 14, fontWeight: 500, minWidth: 36, textAlign: 'center' }}>
                  {currentPage + 1}/{totalPages}
                </span>
                <button
                  onClick={goNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="text-primary_color disabled:opacity-30"
                  style={{
                    width: 36, height: 36, borderRadius: '50%', border: '1.5px solid currentColor',
                    background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: currentPage === totalPages - 1 ? 'default' : 'pointer', transition: 'opacity 0.2s',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              </div>

              {/* Image grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Hero image */}
                {heroImg && (
                  <Link href={`/home/property/${currentListing.listing_type}/${currentListing.slug}/${currentListing.id}`}>
                    <div
                      style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }}
                      className="group"
                    >
                      <img
                        src={heroImg}
                        alt={currentListing.title || currentListing.name || 'Property'}
                        style={{ width: '100%', height: 480, objectFit: 'cover', display: 'block', transition: 'transform 0.3s ease' }}
                        className="group-hover:scale-[1.03]"
                      />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                        {currentListing.is_featured && (
                          <span className="bg-yellow-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">Featured</span>
                        )}
                        {currentListing.is_verified && (
                          <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">Verified</span>
                        )}
                        {currentListing.is_premium && (
                          <span className="bg-purple-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">Premium</span>
                        )}
                      </div>

                      {/* Slide-up hover overlay */}
                      <div
                        className="absolute inset-x-0 bottom-0 z-10 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 ease-out"
                        style={{
                          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 55%, transparent 100%)',
                          padding: '48px 16px 16px',
                        }}
                      >
                        {/* Price + purpose */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-white text-sm font-bold">{priceText}</span>
                          {currentListing.purpose_name && (
                            <span className="px-1.5 py-0.5 bg-white/20 backdrop-blur-sm text-white text-[10px] font-medium rounded-full">
                              {currentListing.purpose_name}
                            </span>
                          )}
                        </div>
                        {/* Title */}
                        <h6 className="text-white text-sm font-medium line-clamp-1 mb-1">
                          {currentListing.title || currentListing.name}
                        </h6>
                        {/* Location */}
                        <div className="flex items-center text-white/80 text-xs mb-1.5">
                          <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                          <p className="line-clamp-1 m-0">{location || 'Ghana'}</p>
                        </div>
                        {/* Specs */}
                        <div className="flex items-center gap-3 text-white/80 text-xs">
                          {specs.bedrooms && (
                            <div className="flex items-center gap-0.5"><Bed className="w-3 h-3" /><span>{specs.bedrooms}</span></div>
                          )}
                          {specs.bathrooms && (
                            <div className="flex items-center gap-0.5"><Bath className="w-3 h-3" /><span>{specs.bathrooms}</span></div>
                          )}
                          {(specs.property_size || specs.size) && (
                            <div className="flex items-center gap-0.5"><Square className="w-3 h-3" /><span>{specs.property_size || specs.size} sqft</span></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Two thumbnail images */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[thumb1, thumb2].map((src, idx) => src && (
                    <Link key={idx} href={`/home/property/${currentListing.listing_type}/${currentListing.slug}/${currentListing.id}`}>
                      <div
                        style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }}
                        className="group"
                      >
                        <img
                          src={src}
                          alt={`${currentListing.title || 'Property'} view ${idx + 2}`}
                          style={{ width: '100%', height: 300, objectFit: 'cover', display: 'block', transition: 'transform 0.3s ease' }}
                          className="group-hover:scale-[1.03]"
                        />
                        {/* Slide-up hover overlay */}
                        <div
                          className="absolute inset-x-0 bottom-0 z-10 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 ease-out"
                          style={{
                            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 55%, transparent 100%)',
                            padding: '48px 14px 14px',
                          }}
                        >
                          {/* Price + purpose */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-white text-sm font-bold">{priceText}</span>
                            {currentListing.purpose_name && (
                              <span className="px-1.5 py-0.5 bg-white/20 backdrop-blur-sm text-white text-[10px] font-medium rounded-full">
                                {currentListing.purpose_name}
                              </span>
                            )}
                          </div>
                          {/* Title */}
                          <h6 className="text-white text-sm font-medium line-clamp-1 mb-1">
                            {currentListing.title || currentListing.name}
                          </h6>
                          {/* Location */}
                          <div className="flex items-center text-white/80 text-xs mb-1.5">
                            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                            <p className="line-clamp-1 m-0">{location || 'Ghana'}</p>
                          </div>
                          {/* Specs */}
                          <div className="flex items-center gap-3 text-white/80 text-xs">
                            {specs.bedrooms && (
                              <div className="flex items-center gap-0.5"><Bed className="w-3 h-3" /><span>{specs.bedrooms}</span></div>
                            )}
                            {specs.bathrooms && (
                              <div className="flex items-center gap-0.5"><Bath className="w-3 h-3" /><span>{specs.bathrooms}</span></div>
                            )}
                            {(specs.property_size || specs.size) && (
                              <div className="flex items-center gap-0.5"><Square className="w-3 h-3" /><span>{specs.property_size || specs.size} sqft</span></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )
        })()}

        {!loading && !error && listings.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p>No properties available yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default HomeProperties
