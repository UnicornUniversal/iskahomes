"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import ListingList from './Listing/ListingList'
import Filter from './Filters/Filter'
import LoadingSpinner from './ui/LoadingSpinner'
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion'
import { Playfair_Display } from 'next/font/google'

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
  const [galleryUpright, setGalleryUpright] = useState(false)
  const heroFadeRef = useRef(null)
  const galleryScrollRef = useRef(null)

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

  // 3D gallery scroll animations
  const { scrollYProgress: galleryProgress } = useScroll({
    target: galleryScrollRef,
    offset: ['start end', 'end start']
  })

  // Phase 1: Entry — rotateX 75° → 0° (progress 0 → 0.35)
  const rotateX = useTransform(galleryProgress, [0, 0.35], [75, 0])
  // Phase 2: Zoom settles — scale 1.2 → 1 (progress 0.2 → 0.45)
  const scale = useTransform(galleryProgress, [0.2, 0.45], [1.2, 1])
  // Opacity fade-in during entry
  const galleryOpacity = useTransform(galleryProgress, [0, 0.15], [0, 1])

  // Phase 3: Vertical pan — translate gallery upward to reveal all rows (0.45 → 1)
  const galleryTranslateY = useTransform(galleryProgress, [0.45, 1], ['0%', '-55%'])

  // Column parallax — during Phase 3 pan (0.45 → 1) to add depth while browsing
  const col1Y = useTransform(galleryProgress, [0.45, 1], ['-8%', '2%'])
  const col2Y = useTransform(galleryProgress, [0.45, 1], ['12%', '3%'])
  const col3Y = useTransform(galleryProgress, [0.45, 1], ['-8%', '2%'])

  // Per-column opacity fades — clear and visible, light fade-in only
  const col1Opacity = useTransform(galleryProgress, [0.1, 0.3], [0.6, 1])
  const col2Opacity = useTransform(galleryProgress, [0.12, 0.32], [0.6, 1])
  const col3Opacity = useTransform(galleryProgress, [0.14, 0.34], [0.6, 1])

  // Detect when gallery is upright — trigger card shuffle
  useMotionValueEvent(galleryProgress, 'change', (v) => {
    if (v >= 0.35 && !galleryUpright) setGalleryUpright(true)
    if (v < 0.3 && galleryUpright) setGalleryUpright(false)
  })

  return (
    <div className='w-full h-full relative'>
      {/* Hero section — fades out as you scroll */}
      <div ref={heroFadeRef} className="relative" style={{ minHeight: '100vh' }}>
        <motion.div
          className="sticky top-[100px] z-0 flex flex-col items-center justify-center max-h-[1200px] w-full h-[70vh] min-h-[600px] px-4 transition-opacity duration-300"
          style={{ opacity: heroOpacity }}
        >
          <motion.h2
            className={`${playfairDisplay.className} text-center max-w-5xl text-[2.5em] md:text-[3.2em] w-full text-primary_color leading-[1.2]`}
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

      {/* 3D Gallery scroll container — 350vh for 3-phase animation */}
      <div
        ref={galleryScrollRef}
        style={{ height: '350vh', position: 'relative' }}
      >
        {/* Sticky inner — pins the gallery while scroll drives transforms */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: '100svh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            perspective: '1000px',
          }}
        >
          <motion.div
            style={{
              rotateX,
              scale,
              opacity: galleryOpacity,
              y: galleryTranslateY,
              transformOrigin: 'center center',
              width: '100%',
              maxWidth: 1400,
              padding: '0 24px',
            }}
          >
            <ListingList
              listings={listings}
              loading={loading}
              error={error}
              col1Y={col1Y}
              col2Y={col2Y}
              col3Y={col3Y}
              col1Opacity={col1Opacity}
              col2Opacity={col2Opacity}
              col3Opacity={col3Opacity}
              shuffleActive={galleryUpright}
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default HomeProperties
