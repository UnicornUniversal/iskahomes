'use client'
import React from 'react'
import AlbumGallery from '../components/propertyManagement/modules/AlbumGallery'

const page = () => {
  const container1 = 'bg-white w-full h-[20em]  mx-auto lg:w-[30em] lg:h-[30em] break-inside-avoid border border-primary_color/10 p-4'
  const container2 = 'bg-white w-full h-[30em] mx-auto md:w-[15em] md:h-[20em] break-inside-avoid border border-secondary_color/20 p-4'
  const container3 = 'bg-white w-full h-[25em] mx-auto md:w-[25em] md:h-[15em] break-inside-avoid border border-secondary_color/20 p-4'
  const container4 = 'bg-white w-full h-[15em] mx-auto md:w-[20em] md:h-[20em] break-inside-avoid border border-secondary_color/20 p-4'

  return (
    <div className='w-full min-h-screen p-4'>
      {/* Truly automatic grid - browser decides everything */}
      <div className='flex flex-wrap gap-4  items-center justify-center'>
        <div className={container1}>
          <p>Container 1</p>
        </div>
        <div className={container2}>
          <p>Container 2</p>
        </div>
        <div className={container3}>
          <p>Container 3</p>
        </div>
        <div className={container4}>
          <p>Container 4</p>
        </div>
        <div className={container3}>
          <p>Container 3</p>
        </div>
        <div className={container4}>
          <p>Container 4</p>
        </div>
        <div className={container1}>
          <p>Container 1</p>
        </div>
        <div className={container2}>
          <p>Container 2</p>
        </div>
        <div className={container1}>
          <p>Container 1</p>
        </div>
        <div className={container2}>
          <p>Container 2</p>
        </div>
        <div className={container3}>
          <p>Container 3</p>
        </div>
        <div className={container4}>
          <p>Container 4</p>
        </div>
        <div className={container3}>
          <p>Container 3</p>
        </div>
        <div className={container4}>
          <p>Container 4</p>
        </div>
        <div className={container1}>
          <p>Container 1</p>
        </div>
        <div className={container2}>
          <p>Container 2</p>
        </div>

      </div>
    </div>
  )
}

export default page