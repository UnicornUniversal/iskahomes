"use client"
import React from 'react'
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

const header_properties = [
  {
    propertyType: "Apartment",
    propertyName: "Skyline Heights",
    propertyPrice: "$250,000",
    propertyLocation: "Accra, Ghana",
    propertyBedrooms: 3,
    Availability: "Available",
    property_images: [dummyImage, dummyImage]
  },
  {
    propertyType: "Townhouse",
    propertyName: "Palm Grove",
    propertyPrice: "$180,000",
    propertyLocation: "Tema, Ghana",
    propertyBedrooms: 4,
    Availability: "Available",
    property_images: [dummyImage, dummyImage]
  },
  {
    propertyType: "Villa",
    propertyName: "Ocean View",
    propertyPrice: "$500,000",
    propertyLocation: "Takoradi, Ghana",
    propertyBedrooms: 5,
    Availability: "Sold",
    property_images: [dummyImage, dummyImage]
  },
  {
    propertyType: "Studio",
    propertyName: "Urban Nest",
    propertyPrice: "$90,000",
    propertyLocation: "Kumasi, Ghana",
    propertyBedrooms: 1,
    Availability: "Available",
    property_images: [dummyImage, dummyImage]
  },
  {
    propertyType: "Duplex",
    propertyName: "Garden Estate",
    propertyPrice: "$320,000",
    propertyLocation: "East Legon, Ghana",
    propertyBedrooms: 4,
    Availability: "Available",
    property_images: [dummyImage, dummyImage]
  }
];

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
            {header_properties.map((property, idx) => (
              <SwiperSlide key={idx} className='relative h-full w-full'>
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
                    />
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      
    </div>
  )
}

export default Header
