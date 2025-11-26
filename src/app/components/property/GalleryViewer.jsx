"use client"
import React, { useState, useMemo, useRef, useEffect } from 'react'
import { FaImages, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

// Force style to prevent default CSS override issues
const swiperStyle = {
  width: '100%',
  height: '100%',
  "--swiper-pagination-color": "#2563eb",
}

const GalleryViewer = ({ media }) => {
  const [selectedAlbum, setSelectedAlbum] = useState('all')
  const swiperRef = useRef(null)

  // --- Data Logic ---
  const albums = useMemo(() => {
    if (!media) return []
    const albumList = []
    
    if (media.albums && Array.isArray(media.albums)) {
      media.albums.forEach(album => {
        if (album?.images && Array.isArray(album.images) && album.images.length > 0) {
          albumList.push({
            id: album.id || album.name?.toLowerCase().replace(/\s+/g, '-') || 'general',
            name: album.name || 'General',
            images: album.images
          })
        }
      })
    }
    
    if (albumList.length === 0 && media.mediaFiles && Array.isArray(media.mediaFiles)) {
      albumList.push({
        id: 'all',
        name: 'All Images',
        images: media.mediaFiles
      })
    }
    return albumList
  }, [media])

  const displayedImages = useMemo(() => {
    if (selectedAlbum === 'all') {
      return albums.flatMap(album => album.images)
    }
    const album = albums.find(a => a.id === selectedAlbum)
    return album ? album.images : []
  }, [selectedAlbum, albums])

  const handleAlbumChange = (albumId) => {
    setSelectedAlbum(albumId)
    if (swiperRef.current) {
      swiperRef.current.slideTo(0)
    }
  }

  useEffect(() => {
    if (swiperRef.current) {
      swiperRef.current.update()
    }
  }, [displayedImages])
  // ------------------

  if (albums.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <FaImages className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No images available</p>
      </div>
    )
  }

  const totalImagesCount = albums.reduce((sum, album) => sum + album.images.length, 0)

  return (
    <div className="space-y-8 w-full max-w-full">
      
      {/* CRITICAL FIX: 
        1. grid grid-cols-1: Forces the child (swiper) to respect the track width.
        2. min-w-0: Prevents flex/grid children from expanding infinitely.
        3. w-full: Takes available space.
      */}
      <div className="grid grid-cols-1 min-w-0 w-full">
        
        {displayedImages.length > 0 ? (
          <div className="relative w-full group">
            <Swiper
              onSwiper={(swiper) => (swiperRef.current = swiper)}
              modules={[Autoplay, Navigation, Pagination]}
              spaceBetween={20}
              slidesPerView={1}
              loop={displayedImages.length > 1}
              speed={800}
              style={swiperStyle} // Applied explicit style
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              navigation={{
                nextEl: '.custom-next',
                prevEl: '.custom-prev',
              }}
              pagination={{ 
                clickable: true, 
                dynamicBullets: true 
              }}
              // !pb-12 gives room for the dots at the bottom
              className="w-full !pb-12"
              breakpoints={{
                640: { slidesPerView: 2, spaceBetween: 20 },
                1024: { slidesPerView: 3, spaceBetween: 24 },
                1280: { slidesPerView: 4, spaceBetween: 24 },
              }}
            >
              {displayedImages.map((image, index) => {
                const imageSrc = image?.url || image
                return (
                  // Width is handled by Swiper/breakpoints. Height is handled by aspect ratio.
                  <SwiperSlide key={image?.id || index}>
                    <div className="block w-full">
                      <div className="relative w-full aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                        <img
                          src={imageSrc}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </SwiperSlide>
                )
              })}
            </Swiper>

            {/* Controls - Positioned strictly inside */}
            {displayedImages.length > 1 && (
              <>
                <button className="custom-prev absolute left-2 top-[calc(50%-24px)] -translate-y-1/2 z-20 bg-white/90 text-gray-800 p-2 md:p-3 rounded-full shadow-md border border-gray-100 hover:bg-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex">
                  <FaChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button className="custom-next absolute right-2 top-[calc(50%-24px)] -translate-y-1/2 z-20 bg-white/90 text-gray-800 p-2 md:p-3 rounded-full shadow-md border border-gray-100 hover:bg-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex">
                  <FaChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="p-12 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <FaImages className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No images in this album</p>
          </div>
        )}
      </div>

      {/* --- Filters --- */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Albums</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleAlbumChange('all')}
            className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all flex items-center gap-2 border ${
              selectedAlbum === 'all'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            All Images
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              selectedAlbum === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {totalImagesCount}
            </span>
          </button>
          
          {albums.map((album) => (
            <button
              key={album.id}
              onClick={() => handleAlbumChange(album.id)}
              className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all flex items-center gap-2 border ${
                selectedAlbum === album.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              {album.name}
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                selectedAlbum === album.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {album.images.length}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GalleryViewer