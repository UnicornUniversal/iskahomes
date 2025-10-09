'use client'

import React, { useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import Link from 'next/link'

const DevelopmentHeaders = () => {
  const [featuredDevelopers, setFeaturedDevelopers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedDevelopers = async () => {
      try {
        const response = await fetch('/api/developers?limit=5&featured=true')
        const result = await response.json()
        
        if (result.success) {
          setFeaturedDevelopers(result.data)
        }
      } catch (error) {
        console.error('Error fetching featured developers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedDevelopers()
  }, [])

  if (loading) {
    return (
      <div className="w-full h-96 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading featured developers...</div>
      </div>
    )
  }

  if (featuredDevelopers.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">No featured developers available</div>
      </div>
    )
  }

  return (
    <div className="w-full mb-8">
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Featured Developers
        </h2>
      </div>
      
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        className="featured-developers-swiper w-full"
      >
        {featuredDevelopers.map((developer) => {
          return (
            <SwiperSlide key={developer.id}>
              <Link href={`/allDevelopers/${developer.slug}`}>
                <div className="relative h-96 w-full overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer">
                  <img
                    src={developer.cover_image.url}
                    alt={developer.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 hover:bg-black/20 transition-colors duration-300"></div>
                  <div className="absolute bottom-8 left-8 text-white">
                    <h3 className="text-3xl font-bold">{developer.name}</h3>
                    <p className="text-lg opacity-90">Professional Developer</p>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          )
        })}
      </Swiper>
    </div>
  )
}

export default DevelopmentHeaders
