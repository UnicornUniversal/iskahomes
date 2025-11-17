"use client"
import React, { useState, useEffect } from 'react'
import DataCard from '../components/Data/DataCard'
import SimplePropertyCard from '../components/Data/SimplePropertyCard'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectCoverflow } from 'swiper/modules';
import SearchGeneral from './SearchGeneral';
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import Image from 'next/image';
import { motion } from 'framer-motion';

const dummyImage = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const containerVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
      duration: 0.7,
      ease: 'easeOut',
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

const titleVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 120, damping: 8, duration: 0.7 } },
};

const Header = () => {
  const [headerProperties, setHeaderProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedListings = async () => {
      try {
        const response = await fetch('/api/listings/featured')
        const result = await response.json()
        
        if (response.ok && result.data && Array.isArray(result.data)) {
          // Transform API data to match component structure
          // Limit to 5 listings
          const transformed = result.data.slice(0, 5).map(listing => {
            // Extract first image from media
            let firstImage = dummyImage
            if (listing.media) {
              try {
                const media = typeof listing.media === 'string' 
                  ? JSON.parse(listing.media) 
                  : listing.media
                
                if (media?.albums && Array.isArray(media.albums) && media.albums.length > 0) {
                  const generalAlbum = media.albums.find(a => a.isDefault) || media.albums[0]
                  if (generalAlbum?.images && generalAlbum.images.length > 0) {
                    firstImage = generalAlbum.images[0].url
                  }
                }
              } catch (e) {
                console.error('Error parsing media:', e)
                // Use fallback image
              }
            }

            // Format price based on price_type and duration
            const price = parseFloat(listing.price || 0)
            const currency = listing.currency || 'GHS'
            const priceType = listing.price_type || 'sale'
            const duration = listing.duration || null
            
            let formattedPrice = `${currency} ${price.toLocaleString()}`
            
            if (priceType === 'rent') {
              if (duration) {
                // Format duration (e.g., "monthly", "yearly", "weekly")
                const durationText = duration.charAt(0).toUpperCase() + duration.slice(1).toLowerCase()
                formattedPrice = `${currency} ${price.toLocaleString()} / ${durationText}`
              } else {
                formattedPrice = `${currency} ${price.toLocaleString()} / month`
              }
            } else if (priceType === 'sale') {
              formattedPrice = `${currency} ${price.toLocaleString()}`
            } else if (priceType === 'lease') {
              if (duration) {
                const durationText = duration.charAt(0).toUpperCase() + duration.slice(1).toLowerCase()
                formattedPrice = `${currency} ${price.toLocaleString()} / ${durationText}`
              } else {
                formattedPrice = `${currency} ${price.toLocaleString()} / month`
              }
            }

            // Format location
            const locationParts = []
            if (listing.town) locationParts.push(listing.town)
            if (listing.city) locationParts.push(listing.city)
            if (listing.state) locationParts.push(listing.state)
            if (listing.country) locationParts.push(listing.country)
            
            let propertyLocation = locationParts.length > 0 
              ? locationParts.join(', ') 
              : listing.full_address || 'Ghana'

            // Extract and format specifications - get first 3 with appropriate emojis
            const getSpecifications = () => {
              if (!listing.specifications) return []
              
              const specs = typeof listing.specifications === 'string' 
                ? JSON.parse(listing.specifications) 
                : listing.specifications
              
              const listingType = listing.listing_type || 'unit'
              const specArray = []
              
              // Emoji mapping for different specification types
              const specEmojiMap = {
                bedrooms: { emoji: '🛏️', format: (v) => `${v} Bed${v > 1 ? 's' : ''}` },
                bathrooms: { emoji: '🚿', format: (v) => `${v} Bath${v > 1 ? 's' : ''}` },
                property_size: { emoji: '📐', format: (v) => `${v} ${listingType === 'unit' ? 'sq ft' : 'sq m'}` },
                size: { emoji: '📐', format: (v) => `${v} ${listingType === 'unit' ? 'sq ft' : 'sq m'}` },
                floor_level: { emoji: '🏢', format: (v) => `Floor ${v}` },
                floors: { emoji: '🏢', format: (v) => `${v} Floor${v > 1 ? 's' : ''}` },
                living_rooms: { emoji: '🛋️', format: (v) => `${v} Living Room${v > 1 ? 's' : ''}` },
                kitchen: { emoji: '🍳', format: (v) => `${v} Kitchen${v > 1 ? 's' : ''}` },
                furnishing: { emoji: '🪑', format: (v) => v.charAt(0).toUpperCase() + v.slice(1) },
                property_age: { emoji: '🏗️', format: (v) => `${v} years` },
                number_of_balconies: { emoji: '🏡', format: (v) => `${v} Balcony${v > 1 ? 'ies' : ''}` },
                toilets: { emoji: '🚽', format: (v) => `${v} Toilet${v > 1 ? 's' : ''}` },
                compound_type: { emoji: '🏘️', format: (v) => v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) },
                building_style: { emoji: '🏛️', format: (v) => v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) },
                property_condition: { emoji: '✅', format: (v) => v.charAt(0).toUpperCase() + v.slice(1) }
              }
              
              // Priority order for specifications (first 3 will be selected)
              const priorityOrder = [
                'bedrooms', 'bathrooms', 'property_size', 'size', 
                'floor_level', 'floors', 'living_rooms', 'kitchen',
                'furnishing', 'number_of_balconies', 'toilets',
                'property_age', 'compound_type', 'building_style', 'property_condition'
              ]
              
              // Extract first 3 valid specifications
              for (const key of priorityOrder) {
                if (specArray.length >= 3) break
                
                const value = specs[key]
                if (value !== null && value !== undefined && value !== '') {
                  // Check if it's a number > 0 or a non-empty string
                  if ((typeof value === 'number' && value > 0) || (typeof value === 'string' && value.trim() !== '')) {
                    const emojiConfig = specEmojiMap[key]
                    if (emojiConfig) {
                      specArray.push({
                        emoji: emojiConfig.emoji,
                        label: emojiConfig.format(value)
                      })
                    }
                  }
                }
              }
              
              return specArray
            }

            const specifications = getSpecifications()

            return {
              id: listing.id,
              propertyType: listing.purpose || 'Property',
              propertyName: listing.name || 'Unnamed Property',
              propertyPrice: formattedPrice,
              propertyLocation: propertyLocation,
              propertyBedrooms: null, // Not included in API response
              Availability: "Available",
              property_images: [firstImage],
              specifications: specifications
            }
          })
          setHeaderProperties(transformed)
        } else {
          console.warn('No featured listings data received')
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

  return (
    <div className='flex flex-col md:flex-row gap-4 items-center justify-center px-[2em]   h-[80vh] w-full '>
        {/* left side */}
        <motion.div
          className='flex flex-col items-start gap-4 w-full md:w-1/2 '
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <h5 className='text-sm'>Welcome to</h5>
          </motion.div>
          <motion.h1
            className='text-primary_color md:text-[5em] font-bold'
            variants={titleVariants}
          >
            Iska Home
          </motion.h1>
          <motion.div variants={itemVariants}>
            <h4 className=''>Your Dream Property Awaits You</h4>
          </motion.div>
          <motion.div variants={itemVariants} className='w-full'>
            <SearchGeneral />
          </motion.div>
          <motion.div variants={itemVariants} className='grid grid-cols-3 gap-4 w-full'>
            <DataCard title="Total Properties" data="1000" />
            <DataCard title="Total Agents" data="60+" />
            <DataCard title="Happy Customers   " data="60K+" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <button>Explore Now</button>
          </motion.div>
        </motion.div>

        {/* right side - Swiper carousel */}
        <div className="w-full md:w-1/2 h-96 md:h-[500px] relative">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-gray-500">Loading featured properties...</div>
            </div>
          ) : headerProperties.length > 0 ? (
            <Swiper
              modules={[Autoplay, Pagination, EffectCoverflow]}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              loop={true}
              spaceBetween={0}
              slidesPerView={1}
              effect="coverflow"
              coverflowEffect={{
                rotate: 30,
                stretch: 0,
                depth: 100,
                modifier: 1,
                slideShadows: true,
              }}
              pagination={{ clickable: true }}
              className="h-full w-full rounded-xl overflow-hidden shadow-lg"
            >
              {headerProperties.map((property, idx) => (
                <SwiperSlide key={property.id || idx} className='relative h-full w-full'>
                  <div className='relative h-full w-full'>
                    <Image 
                      src={property.property_images[0]} 
                      alt={property.propertyName} 
                      fill 
                      className='object-cover'
                      priority={idx === 0}
                    />
                    <div className="absolute bottom-8 left-8  min-w-[320px] max-w-[90vw] flex flex-col gap-3 z-10">
                      <SimplePropertyCard
                        propertyType={property.propertyType}
                        propertyName={property.propertyName}
                        propertyPrice={property.propertyPrice}
                        propertyLocation={property.propertyLocation}
                        propertyBedrooms={property.propertyBedrooms}
                        Availability={property.Availability}
                        specifications={property.specifications}
                      />
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-gray-500">No featured properties available</div>
            </div>
          )}
        </div>
      
    </div>
  )
}

export default Header
