"use client"
import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/pagination';
import Image from 'next/image';

const banners = [
  { url: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=1296&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', link: 'https://example.com/1' },
  { url: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=1296&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', link: 'https://example.com/2' },
  { url: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=1296&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', link: 'https://example.com/3' },
  { url: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=1296&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', link: 'https://example.com/4' },
  { url: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=1296&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', link: 'https://example.com/5' },
];

const Banner = () => {
  return (
    <div className="w-full h-64 md:h-96">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        loop={true}
        spaceBetween={0}
        slidesPerView={1}
        pagination={{ clickable: true }}
        className="h-full w-full rounded-xl overflow-hidden shadow-lg"
      >
        {banners.map((banner, idx) => (
          <SwiperSlide key={idx} className="relative h-full w-full">
            <a href={banner.link} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
              <Image 
                src={banner.url} 
                alt={`Banner ${idx + 1}`} 
                fill 
                className="object-cover"
                priority={idx === 0}
              />
            </a>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default Banner
