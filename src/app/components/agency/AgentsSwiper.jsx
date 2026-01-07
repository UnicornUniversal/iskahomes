'use client'

import React from 'react'
import Link from 'next/link'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import { User } from 'lucide-react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const AgentsSwiper = ({ agents = [] }) => {
  if (!agents || agents.length === 0) {
    return null
  }

  return (
    <div className="w-full">
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
          768: {
            slidesPerView: 3,
            spaceBetween: 24,
          },
          1024: {
            slidesPerView: 4,
            spaceBetween: 24,
          },
        }}
        className="agents-swiper"
      >
        {agents.map((agent) => (
          <SwiperSlide key={agent.id}>
            <Link 
              href={`/home/allAgents/${agent.slug}`} 
              className="bg-white rounded-xl p-4 flex flex-col items-center gap-4 hover:shadow-lg transition-all border border-gray-100 group h-full"
            >
              <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-gray-200 group-hover:border-primary_color transition-colors">
                {agent.profile_image ? (
                  <img 
                    src={agent.profile_image} 
                    alt={agent.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 group-hover:text-primary_color transition-colors">
                    <User className="w-10 h-10" />
                  </div>
                )}
              </div>
              <div className="text-center flex-1 flex flex-col justify-center">
                <h4 className="font-bold text-primary_color group-hover:text-primary_color/80 transition-colors mb-1">
                  {agent.name}
                </h4>
                <p className="text-sm text-primary_color/70">
                  {agent.total_listings || 0} {agent.total_listings === 1 ? 'listing' : 'listings'}
                </p>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
      
      <style jsx>{`
        .agents-swiper .swiper-button-next,
        .agents-swiper .swiper-button-prev {
          color: var(--primary-color, #2563eb);
          background: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .agents-swiper .swiper-button-next:after,
        .agents-swiper .swiper-button-prev:after {
          font-size: 18px;
        }
        
        .agents-swiper .swiper-button-disabled {
          opacity: 0.35;
        }
        
        .agents-swiper .swiper-pagination-bullet {
          background: var(--primary-color, #2563eb);
        }
      `}</style>
    </div>
  )
}

export default AgentsSwiper

