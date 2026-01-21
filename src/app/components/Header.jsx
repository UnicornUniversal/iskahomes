"use client"
import React, { useState, useEffect } from 'react'
import DataCard from '../components/Data/DataCard'
import SimplePropertyCard from '../components/Data/SimplePropertyCard'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectCoverflow } from 'swiper/modules';
import HeaderSearch from './HeaderSearch';
import Link from 'next/link';
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Bed, Bath, Square } from 'lucide-react';
import { getSpecificationDataByTypeId, getFieldDataByKey } from '@/app/components/Data/StaticData';

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // 5 real estate images from Unsplash
  const loadingImages = [
    "https://images.unsplash.com/photo-1593696140826-c58b021acf8b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1639851097191-f13149bb05ae?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1565402170291-8491f14678db?q=80&w=1117&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1565953522043-baea26b83b7e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1723110994499-df46435aa4b3?q=80&w=1179&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  ]

  // Cross-fade through images while loading
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % loadingImages.length)
      }, 2000) // Change image every 2 seconds

      return () => clearInterval(interval)
    }
  }, [loading, loadingImages.length])

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

            // Extract and format specifications - get first 3 with icons from StaticData
            const getSpecifications = () => {
              if (!listing.specifications) return []
              
              // Parse specifications JSON if it's a string
              let parsedSpecs = {}
              try {
                parsedSpecs = typeof listing.specifications === 'string' 
                ? JSON.parse(listing.specifications) 
                : listing.specifications
              } catch (e) {
                console.error('Error parsing specifications:', e)
                return []
              }

              // Get property type ID from types array
              let typeId = null
              try {
                const typesArray = typeof listing.types === 'string' 
                  ? JSON.parse(listing.types) 
                  : listing.types
                if (Array.isArray(typesArray) && typesArray.length > 0) {
                  typeId = typesArray[0]
                }
              } catch (e) {
                console.error('Error parsing types:', e)
              }

              // Get specification fields from StaticData based on type ID
              const specFields = typeId ? getSpecificationDataByTypeId(typeId) : null
              const fieldsToShow = []

              if (specFields && specFields.fields) {
                // Get common fields that are likely to be displayed (first 3)
                const commonFields = ['bedrooms', 'bathrooms', 'property_size', 'size', 'floor_level', 'living_rooms']
                
                specFields.fields.forEach(field => {
                  if (fieldsToShow.length >= 3) return
                  
                  if (commonFields.includes(field.key) && parsedSpecs[field.key] !== undefined && parsedSpecs[field.key] !== null) {
                    const value = parsedSpecs[field.key]
                  // Check if it's a number > 0 or a non-empty string
                  if ((typeof value === 'number' && value > 0) || (typeof value === 'string' && value.trim() !== '')) {
                      const fieldData = getFieldDataByKey(typeId, field.key)
                      if (fieldData) {
                        // Format the value based on field type
                        const listingType = listing.listing_type || 'unit'
                        let formattedLabel = ''
                        if (field.type === 'number') {
                          if (field.key === 'property_size' || field.key === 'size') {
                            formattedLabel = `${value} ${listingType === 'unit' ? 'sq ft' : 'sq m'}`
                          } else if (field.key === 'bedrooms') {
                            formattedLabel = `${value} Bed${value > 1 ? 's' : ''}`
                          } else if (field.key === 'bathrooms') {
                            formattedLabel = `${value} Bath${value > 1 ? 's' : ''}`
                          } else if (field.key === 'floor_level') {
                            formattedLabel = `Floor ${value}`
                          } else if (field.key === 'living_rooms') {
                            formattedLabel = `${value} Living Room${value > 1 ? 's' : ''}`
                          } else {
                            formattedLabel = value.toString()
                          }
                        } else if (field.type === 'select' && fieldData.options) {
                          const option = fieldData.options.find(opt => opt.value === value)
                          formattedLabel = option ? option.label : value
                        } else {
                          formattedLabel = typeof value === 'string' 
                            ? value.charAt(0).toUpperCase() + value.slice(1)
                            : value.toString()
                        }
                        
                        fieldsToShow.push({
                          icon: field.icon,
                          label: formattedLabel
                        })
                      }
                    }
                  }
                })
              }

              // Fallback to basic specs if no type-specific fields found
              const listingType = listing.listing_type || 'unit'
              if (fieldsToShow.length === 0) {
                if (parsedSpecs.bedrooms !== undefined && parsedSpecs.bedrooms > 0) {
                  fieldsToShow.push({
                    icon: Bed,
                    label: `${parsedSpecs.bedrooms} Bed${parsedSpecs.bedrooms > 1 ? 's' : ''}`
                  })
                }
                if (fieldsToShow.length < 3 && parsedSpecs.bathrooms !== undefined && parsedSpecs.bathrooms > 0) {
                  fieldsToShow.push({
                    icon: Bath,
                    label: `${parsedSpecs.bathrooms} Bath${parsedSpecs.bathrooms > 1 ? 's' : ''}`
                  })
                }
                if (fieldsToShow.length < 3 && (parsedSpecs.property_size !== undefined || parsedSpecs.size !== undefined)) {
                  const sizeValue = parsedSpecs.property_size || parsedSpecs.size
                  if (sizeValue > 0) {
                    fieldsToShow.push({
                      icon: Square,
                      label: `${sizeValue} ${listingType === 'unit' ? 'sq ft' : 'sq m'}`
                    })
                  }
                }
              }
              
              return fieldsToShow
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
    <div 
    
    
    className='flex flex-col md:flex-row gap-4 items-center justify-center px-[2em]   h-[80vh] w-full '>
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
            ISKA Homes
          </motion.h1>
          <motion.div variants={itemVariants}>
            <h4 className=''>Your Dream Property Awaits You</h4>
          </motion.div>
          {/* <p className='text-sm text-gray-500 leading-relaxed max-w-2xl'>
            Iska Homes is your trusted partner in finding the perfect property. We connect property seekers with verified developers and experienced agents across Ghana and beyond. 
            <br className="hidden sm:block" />
            Explore thousands of verified listings, from cozy apartments to grand developments, all in one place. 
            <br className="hidden sm:block" />
            Whether you're buying, renting, or investing, we make your property journey seamless and successful.
          </p> */}
          <motion.div variants={itemVariants} className='w-full'>
            <HeaderSearch />
          </motion.div>
          {/* 
          <motion.div variants={itemVariants} className='grid grid-cols-3 gap-4 w-full'>
            <DataCard title="Total Properties" data="1000" />
            <DataCard title="Total Agents" data="60+" />
            <DataCard title="Happy Customers   " data="60K+" />
          </motion.div> */}


       <div className='flex items-center gap-4'>
       <motion.div variants={itemVariants}>
            <Link href="/home/signup">
            <button className="secondary_button">Get Started </button>
            </Link>
          </motion.div>
       <motion.div variants={itemVariants}>
            <Link href="/home/exploreProperties">
            <button className="secondary_button">Explore Properties</button>
            </Link>
          </motion.div>
       
       </div>

        </motion.div>

        {/* right side - Swiper carousel */}
        <div className="w-full md:w-1/2 h-[500px] md:h-[500px] relative">
          {loading ? (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 0.7, opacity: 1 }}
              exit={{ scale: 1, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="h-[450px] sm:h-[550px] md:h-[650px] lg:h-[700px] w-full relative rounded-t-full overflow-hidden shadow-lg border-t-4"
              style={{
                borderTopColor: 'var(--color-primary_color)',
              }}
            >
              {/* Background with blur and primary color overlay */}
              <div className="absolute inset-0 bg-primary_color/50 backdrop-blur-sm z-0" />
              
              {/* Cross-fading images */}
              <div className="relative h-full w-full">
                {loadingImages.map((image, idx) => (
                  <motion.div
                    key={idx}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: idx === currentImageIndex ? 1 : 0,
                    }}
                    transition={{
                      duration: 1,
                      ease: "easeInOut"
                    }}
                  >
                    <Image
                      src={image}
                      alt={`Real estate ${idx + 1}`}
                      fill
                      className="object-cover"
                      priority={idx === 0}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : headerProperties.length > 0 ? (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full w-full"
            >
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
            </motion.div>
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
