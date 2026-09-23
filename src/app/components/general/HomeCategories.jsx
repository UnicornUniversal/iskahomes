'use client'

import React, { useState, useEffect } from 'react'
import SecondaryListingCard from '../Listing/SecondaryListingCard'
import { filterPublicCatalogListings } from '@/lib/publicListingCatalog'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const HomeCategories = () => {
  const [propertyTypes, setPropertyTypes] = useState([])
  const [selectedType, setSelectedType] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingListings, setLoadingListings] = useState(false)
  const [cache, setCache] = useState({}) // Cache for listings by type

  // Fetch property types on mount
  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const response = await fetch('/api/property-types')
        const result = await response.json()
        
        if (result.data && Array.isArray(result.data) && result.data.length > 0) {
          setPropertyTypes(result.data)
          // Auto-select first property type
          setSelectedType(result.data[0])
        }
      } catch (error) {
        console.error('Error fetching property types:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPropertyTypes()
  }, [])

  // Fetch listings when property type is selected
  useEffect(() => {
    if (!selectedType) return

    const fetchListings = async () => {
      // Check cache first
      if (cache[selectedType.id]) {
        setListings(cache[selectedType.id])
        return
      }

      setLoadingListings(true)
      try {
        const response = await fetch(`/api/listings/by-type?type_id=${selectedType.id}`)
        const result = await response.json()
        
        if (result.success && result.data) {
          const publicListings = filterPublicCatalogListings(result.data)
          setListings(publicListings)
          // Cache the results
          setCache(prev => ({
            ...prev,
            [selectedType.id]: publicListings
          }))
        } else {
          setListings([])
        }
      } catch (error) {
        console.error('Error fetching listings:', error)
        setListings([])
      } finally {
        setLoadingListings(false)
      }
    }

    fetchListings()
  }, [selectedType, cache])

  const handleTypeClick = (type) => {
    setSelectedType(type)
  }

  if (loading) {
    // Pre-launch: loading text hidden; show spinner only
    return (
      <div className="w-full py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary_color"></div>
      </div>
    )
  }

  return (
    <div className="w-full mt-[3em]  py-8 px-4  md:p-[2em]">
     
     <h3 className="heading_title pb-4 mb-6">
            Explore our Property Types
          </h3>
      <div className="flex flex-col gap-8">
        {/* Top - Property Types Row */}
        <div className="w-full">
          <div className="flex flex-row flex-wrap items-center gap-4 md:gap-8">
            {propertyTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeClick(type)}
                className={`text-left text-[0.75em] md:text-[0.85em] transition-all duration-300 ${
                  selectedType?.id === type.id
                    ? 'text-primary_color font-semibold border-b-2 border-primary_color pb-1'
                    : 'text-primary_color/40 hover:text-primary_color'
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom - Listings Swiper (full width) */}
        <div className="w-full">
          {loadingListings ? (
            <div className="w-full py-12 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary_color mx-auto mb-4"></div>
                {/* Pre-launch: loading text hidden; spinner only */}
              </div>
            </div>
          ) : listings.length > 0 ? (
            <Swiper
              modules={[Navigation, Pagination]}
              spaceBetween={24}
              slidesPerView={1}
              navigation={true}
              pagination={{ clickable: true }}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                  spaceBetween: 20,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 24,
                },
                1280: {
                  slidesPerView: 4,
                  spaceBetween: 24,
                },
              }}
              className="property-types-swiper"
            >
              {listings.map((listing) => (
                <SwiperSlide key={listing.id}>
                  <SecondaryListingCard
                    listing={listing}
                    imageClasses="h-[220px] md:h-[240px]"
                    leadAttributionContext="home"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            /* Pre-launch: empty-state message hidden so empty inventory isn't exposed */
            null
          )}
        </div>
      </div>
    </div>
  )
}

export default HomeCategories
