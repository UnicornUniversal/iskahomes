"use client"
import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Playfair_Display } from 'next/font/google'
import HeaderSearch from './HeaderSearch'

const dummyImage = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700']
})

const loadingImages = [
  "https://images.unsplash.com/photo-1593696140826-c58b021acf8b?q=80&w=1170&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1639851097191-f13149bb05ae?q=80&w=764&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1565402170291-8491f14678db?q=80&w=1117&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1565953522043-baea26b83b7e?q=80&w=687&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1723110994499-df46435aa4b3?q=80&w=1179&auto=format&fit=crop"
]

/* ── Arrow SVG ─────────────────────────────────────────── */
const ArrowCircle = ({ direction = 'right', onClick }) => (
  <button
    onClick={onClick}
    aria-label={direction === 'right' ? 'Next slide' : 'Previous slide'}
    style={{
      width: 48,
      height: 48,
      borderRadius: '50%',
      border: '1.5px solid currentColor',
      background: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: 'inherit',
      flexShrink: 0,
    }}
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {direction === 'right'
        ? <path d="M9 18l6-6-6-6" />
        : <path d="M15 18l-6-6 6-6" />
      }
    </svg>
  </button>
)

/* ── Dot indicators ────────────────────────────────────── */
const DotIndicators = ({ total, activeIndex, onDotClick }) => (
  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
    {Array.from({ length: total }).map((_, i) => (
      <button
        key={i}
        onClick={() => onDotClick(i)}
        aria-label={`Go to slide ${i + 1}`}
        style={{
          width: i === activeIndex ? 10 : 8,
          height: i === activeIndex ? 10 : 8,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          padding: 0,
        }}
        className={i === activeIndex ? 'bg-white' : 'bg-white/40'}
      />
    ))}
  </div>
)

const Header = () => {
  const [headerProperties, setHeaderProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [currentLoadingIdx, setCurrentLoadingIdx] = useState(0)

  // Cross-fade placeholder images while loading
  useEffect(() => {
    if (loading || headerProperties.length === 0) {
      const interval = setInterval(() => {
        setCurrentLoadingIdx((prev) => (prev + 1) % loadingImages.length)
      }, 2500)
      return () => clearInterval(interval)
    }
  }, [loading, headerProperties.length])

  /* ── Fetch featured listings ─────────────────────────── */
  useEffect(() => {
    const fetchFeaturedListings = async () => {
      try {
        const response = await fetch('/api/listings/featured')
        const result = await response.json()

        if (response.ok && result.data && Array.isArray(result.data)) {
          const transformed = result.data.slice(0, 5).map(listing => {
            let firstImage = dummyImage
            if (listing.media) {
              try {
                const media = typeof listing.media === 'string' ? JSON.parse(listing.media) : listing.media
                if (media?.albums && Array.isArray(media.albums) && media.albums.length > 0) {
                  const generalAlbum = media.albums.find(a => a.isDefault) || media.albums[0]
                  if (generalAlbum?.images && generalAlbum.images.length > 0) {
                    firstImage = generalAlbum.images[0].url
                  }
                }
              } catch (e) { console.error('Error parsing media:', e) }
            }

            const price = parseFloat(listing.price || 0)
            const currency = listing.currency || 'GHS'
            const priceType = listing.price_type || 'sale'
            const duration = listing.duration || null
            let formattedPrice = `${currency} ${price.toLocaleString()}`
            if (priceType === 'rent' || priceType === 'lease') {
              const durationText = duration ? duration.charAt(0).toUpperCase() + duration.slice(1).toLowerCase() : 'month'
              formattedPrice = `${currency} ${price.toLocaleString()}/${durationText}`
            }

            const locationParts = []
            if (listing.town) locationParts.push(listing.town)
            if (listing.city) locationParts.push(listing.city)
            if (listing.state) locationParts.push(listing.state)
            if (listing.country) locationParts.push(listing.country)
            const propertyLocation = locationParts.length > 0 ? locationParts.join(', ') : listing.full_address || 'Ghana'

            return {
              id: listing.id,
              propertyName: listing.name || 'Unnamed Property',
              propertyPrice: formattedPrice,
              propertyLocation,
              property_images: [firstImage],
            }
          })
          setHeaderProperties(transformed)
        } else {
          setHeaderProperties([])
        }
      } catch (error) {
        console.error('Error fetching featured listings:', error)
        setHeaderProperties([])
      } finally {
        setLoading(false)
      }
    }
    fetchFeaturedListings()
  }, [])

  const totalSlides = headerProperties.length || loadingImages.length

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % totalSlides)
  }, [totalSlides])

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides)
  }, [totalSlides])

  const goToSlide = useCallback((idx) => {
    setActiveIndex(idx)
  }, [])

  // Auto-advance every 6 s (matches Ken Burns duration), pause on hover
  useEffect(() => {
    if (isHovered || totalSlides === 0) return
    const timer = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides)
    }, 6000)
    return () => clearTimeout(timer)
  }, [activeIndex, isHovered, totalSlides])

  const currentProperty = headerProperties[activeIndex] || null
  const currentImage = currentProperty
    ? currentProperty.property_images[0]
    : loadingImages[currentLoadingIdx]

  /* ════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════ */
  return (
    <section
      style={{ width: '100%', position: 'relative', overflow: 'hidden' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          width: '100%',
          height: 'calc(100vh - 80px)',
          minHeight: 520,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* ── Background images — zoom-inward transition ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.5, ease: 'easeInOut' } }}
            exit={{ opacity: 0, scale: 0.52, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } }}
            style={{ position: 'absolute', inset: 0, zIndex: 0 }}
          >
            {/* Ken Burns zoom+pan restarts fresh for every new slide */}
            <motion.div
              initial={{ scale: 1, x: '0%', y: '0%' }}
              animate={{ scale: 1.15, x: '-3%', y: '-2%' }}
              transition={{ duration: 6, ease: 'easeInOut' }}
              style={{ position: 'absolute', inset: '-5%' }}
            >
              <Image
                src={currentImage}
                alt={currentProperty?.propertyName || 'Featured property'}
                fill
                style={{ objectFit: 'cover' }}
                priority
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Left ~56% dark gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            background: 'linear-gradient(to right, rgba(23,99,124,0.90) 0%, rgba(23,99,124,0.75) 35%, rgba(23,99,124,0.50) 55%, rgba(23,99,124,0.22) 68%, transparent 82%)',
            pointerEvents: 'none',
          }}
        />

        {/* Text content — positioned over left overlay */}
        <div
          className="w-full md:w-[65%]"
          style={{
            position: 'relative',
            zIndex: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 5%',
          }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className={playfairDisplay.className}
            style={{
              color: '#fff',
              fontSize: 'clamp(2.2rem, 5vw, 4.5rem)',
              fontWeight: 400,
              lineHeight: 1.15,
              margin: 0,
              maxWidth: 600,
            }}
          >
            Your Realty Quests Concludes Here
          </motion.h1>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ marginTop: 28, maxWidth: 620 }}
          >
            <HeaderSearch />
          </motion.div>

        </div>

        {/* Listing info overlay — bottom right */}
        {currentProperty && (
          <div
            className="hidden md:block"
            style={{
              position: 'absolute',
              bottom: 64,
              right: 80,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(6px)',
              padding: '20px 28px',
              maxWidth: 400,
              borderRadius: 10,
              zIndex: 4,
            }}
          >
            <h3
              className={playfairDisplay.className}
              style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 600, margin: 0, lineHeight: 1.3 }}
            >
              {currentProperty.propertyName}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', margin: '4px 0 0' }}>
              {currentProperty.propertyPrice}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', margin: '2px 0 0' }}>
              {currentProperty.propertyLocation}
            </p>
          </div>
        )}

        {/* ← arrow */}
        <div
          style={{
            position: 'absolute',
            left: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 5,
            color: '#fff',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.35s ease',
            pointerEvents: isHovered ? 'auto' : 'none',
          }}
        >
          <ArrowCircle direction="left" onClick={goPrev} />
        </div>

        {/* → arrow */}
        <div
          style={{
            position: 'absolute',
            right: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 5,
            color: '#fff',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.35s ease',
            pointerEvents: isHovered ? 'auto' : 'none',
          }}
        >
          <ArrowCircle direction="right" onClick={goNext} />
        </div>

        {/* Dot indicators — bottom centre */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 5,
          }}
        >
          <DotIndicators total={totalSlides} activeIndex={activeIndex} onDotClick={goToSlide} />
        </div>
      </div>
    </section>
  )
}

export default Header
