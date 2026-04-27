"use client"
import React, { useState, useEffect, useRef } from 'react'
import ListingList from './Listing/ListingList'
import Filter from './Filters/Filter'
import LoadingSpinner from './ui/LoadingSpinner'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Playfair_Display } from 'next/font/google'
// import { listings as dummyListings } from './Data/StaticData'

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
  {
    id: 'image-1',
    type: 'image',
    variant: 'inline',
    src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400',
    alt: 'modern building facade'
  },
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
  {
    id: 'image-2',
    type: 'image',
    variant: 'block',
    src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600',
    alt: 'property'
  }
]

const HomeProperties = () => {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const listingSectionRef = useRef(null)
  const [filters, setFilters] = useState({
    purpose: '',
    sector: '',
    category: '',
    location: ''
  });

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
          // Parse JSON fields if they come as strings
          const parsedListings = result.data.map(listing => {
            const parsed = { ...listing }
            
            // Parse media if it's a string
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
  }, []); // Remove filters dependency since we're not using them

  const { scrollYProgress } = useScroll({
    target: listingSectionRef,
    offset: ['start end', 'start start']
  })

  // Fade starts immediately when listing enters viewport.
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0.05])

  return (
    <div className='w-full h-full relative'>
      <div className="relative">
          <motion.div
            className="sticky top-[100px] z-0 flex flex-col items-center justify-center max-h-[1200px] w-full h-[70vh] min-h-[600px] px-4 transition-opacity duration-300 md:mb-[10em]"
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

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
              <button className="px-6 py-3 rounded-[30px] border border-primary_color text-primary_color hover:bg-primary_color hover:text-white transition flex items-center gap-3">
                Sign Up to List Properties 
                <svg className="w-5 h-5 font-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l4-4-4-4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h7" />
                </svg>
              </button>
              <button className="px-6 py-3 rounded-[30px] border border-primary_color text-primary_color hover:bg-primary_color hover:text-white transition flex items-center gap-3">
                Explore Properties
                <svg className="w-5 h-5 font-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l4-4-4-4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h7" />
                </svg>
              </button>
            </div>
          </motion.div>
          {/* Sticky Filter */}
          {/* <div className="mb-6 sticky top-20 z-10 flex flex-col items-start">
            <div className="rounded-md p-4 inline-block">
              <Filter filters={filters} setFilters={setFilters} totalProperties={listings.length} />
            </div>
          </div> */}

          {/* Properties List */}
          <div ref={listingSectionRef} className="relative backdrop-blur-sm z-20 mt-[8vh]">
            <ListingList listings={listings} loading={loading} error={error} leadAttributionContext="home" />
          </div>
      </div>
   
    </div>
  )
}

export default HomeProperties
