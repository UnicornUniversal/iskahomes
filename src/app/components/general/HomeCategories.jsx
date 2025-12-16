'use client'

import React, { useState, useEffect } from 'react'
import SecondaryListingCard from '../Listing/SecondaryListingCard'
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
          setListings(result.data)
          // Cache the results
          setCache(prev => ({
            ...prev,
            [selectedType.id]: result.data
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
    return (
      <div className="w-full py-12 flex items-center justify-center">
        <div className="text-gray-500">Loading property types...</div>
      </div>
    )
  }

  return (
    <div className="w-full mt-[3em] shadow-lg shadow-primary_color/20  py-8 px-4  md:p-[2em]">
     
     <h3 className=" text-[3em]  border-b-2 border-primary_color pb-4  text-primary_color mb-6">
            Explore our Property Types
          </h3>
      <div className="md:mt-[5em]  flex flex-col md:grid md:grid-cols-3 gap-8 md:gap-12">
        {/* Left Side - Property Types Stack */}
        <div className="w-full md:col-span-1">
         
          <div className="flex flex-col gap-1">
            {propertyTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeClick(type)}
                className={`text-left text-[1.3em] py-3 transition-all duration-300 ${
                  selectedType?.id === type.id
                    ? 'text-primary_color text-[2em] font-semibold border-b-2 border-primary_color'
                    : 'text-primary_color/40 hover:text-primary_color'
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side - Listings Swiper */}
        <div className="w-full md:col-span-2">
          {loadingListings ? (
            <div className="w-full py-12 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary_color mx-auto mb-4"></div>
                <p className="text-gray-500">Loading listings...</p>
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
              }}
              className="property-types-swiper"
            >
              {listings.map((listing) => (
                <SwiperSlide key={listing.id}>
                  <SecondaryListingCard
                    listing={listing}
                    imageClasses="h-[220px] md:h-[240px]"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="w-full py-12 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 text-lg mb-2">
                  No listings found for {selectedType?.name}
                </p>
                <p className="text-gray-400 text-sm">
                  Try selecting another property type
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HomeCategories
