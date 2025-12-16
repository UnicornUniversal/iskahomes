'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { iskaServices } from '../Data/StaticData'

const SimpleServices = () => {
  return (
    <div className="w-full   ">
      <div className="bg-white/40 rouded-t-lg p-4 ">
        <h5 className="text-[1em]">Get In Touch With Our Services</h5>
      </div>
      <Swiper
        modules={[Autoplay, Pagination /* Navigation */]}
        spaceBetween={30}
        slidesPerView={1}
        loop={true}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        // navigation={true}
        className="simple-services-swiper"
      >
        {iskaServices.map((service) => {
          const IconComponent = service.icon
          return (
            <SwiperSlide key={service.id}>
              <div className="relative w-full h-96 md:h-[450px] overflow-hidden">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 100vw"
                />
                
                {/* content - absolutely positioned at bottom with blur backdrop */}
                <div className="absolute bottom-0 left-0 right-0 w-full bg-primary_color/20 backdrop-blur-md p-6">
                  <div className="flex flex-col items-start justify-center">
                    <div className="flex items-center flex-row-reverse w-full  w-full justify-between gap-2">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-colors duration-300">
                        <IconComponent className="text-white text-md" />
                      </div>
                      <h5 className="text-white mb-4">
                        {service.title}
                      </h5>
                    </div>

                    <p className="text-sm text-start text-white/90 line-clamp-2">
                      {service.excerpt}
                    </p>
                    <Link 
                      href="/iska-services"
                      className="secondary_button !text-white inline-block"
                    >
                      Get this Service
                    </Link>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          )
        })}
      </Swiper>
    </div>
  )
}

export default SimpleServices
