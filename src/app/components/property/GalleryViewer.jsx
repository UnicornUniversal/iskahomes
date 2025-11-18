"use client"
import React, { useState, useMemo } from 'react'
import { FaChevronLeft, FaChevronRight, FaImages } from 'react-icons/fa'

const GalleryViewer = ({ media }) => {
  const [selectedAlbum, setSelectedAlbum] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Extract albums from media structure
  const albums = useMemo(() => {
    if (!media) return []
    
    const albumList = []
    
    // Check for new albums structure
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
    
    // Fallback to mediaFiles (backward compatibility)
    if (albumList.length === 0 && media.mediaFiles && Array.isArray(media.mediaFiles)) {
      albumList.push({
        id: 'all',
        name: 'All Images',
        images: media.mediaFiles
      })
    }
    
    return albumList
  }, [media])

  // Get all images for selected album
  const displayedImages = useMemo(() => {
    if (selectedAlbum === 'all') {
      // Combine all images from all albums
      return albums.flatMap(album => album.images)
    }
    
    const album = albums.find(a => a.id === selectedAlbum)
    return album ? album.images : []
  }, [selectedAlbum, albums])

  // Pagination logic:
  // First page: 8 images (1 large 2x1 = 2 cells + 7 small 1x1 = 7 cells = 9 cells total)
  // Subsequent pages: 10 images (all small 1x1 = 10 cells)
  const getPaginatedImages = () => {
    if (currentPage === 1) {
      // First page: return first 8 images (1 large + 7 small)
      return displayedImages.slice(0, 8)
    } else {
      // Subsequent pages: skip first 8, then take 10 per page
      const startIndex = 8 + (currentPage - 2) * 10
      return displayedImages.slice(startIndex, startIndex + 10)
    }
  }

  const paginatedImages = getPaginatedImages()

  // Calculate total pages
  const totalPages = useMemo(() => {
    if (displayedImages.length <= 8) return 1
    const remainingImages = displayedImages.length - 8
    return 1 + Math.ceil(remainingImages / 10)
  }, [displayedImages.length])

  const handleAlbumChange = (albumId) => {
    setSelectedAlbum(albumId)
    setCurrentPage(1) // Reset to first page when changing album
  }

  const handleImageClick = (image, index) => {
    // Open image in fullscreen/modal view
    // You can implement a lightbox here if needed
    window.open(image?.url || image, '_blank')
  }

  if (albums.length === 0) {
    return (
      <div className="text-center py-12">
        <FaImages className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No images available</p>
      </div>
    )
  }

  // Get total count for "General" (all images)
  const totalImagesCount = albums.reduce((sum, album) => sum + album.images.length, 0)

  return (
    <div className="space-y-6">
      {/* Image Grid - Above Albums Heading */}
      {paginatedImages.length > 0 ? (
        <>
          <div 
            className="grid gap-4"
            style={{
              gridTemplateColumns: 'repeat(5, 1fr)',
              gridTemplateRows: 'repeat(2, 1fr)',
              height: '400px',
              maxHeight: '400px'
            }}
          >
            {paginatedImages.map((image, index) => {
              const imageSrc = image?.url || image
              const isFirstPage = currentPage === 1
              const isLargeImage = isFirstPage && index === 0
              
              // Grid: 5 columns × 2 rows = 10 cells total
              // First page: Large (2 cols × 1 row = 2 cells) + 7 small (1×1 = 7 cells) = 9 cells
              
              let gridRowStart, gridRowEnd, gridColStart, gridColEnd
              
              if (isFirstPage && isLargeImage) {
                // Large image: spans columns 1-2, row 1 (2 columns × 1 row = 2 cells)
                gridRowStart = 1
                gridRowEnd = 2
                gridColStart = 1
                gridColEnd = 3
              } else if (isFirstPage) {
                // Small images: fill remaining 7 cells
                // Row 1: cols 3, 4, 5 (3 images: indices 0, 1, 2)
                // Row 2: cols 1, 2, 3, 4 (4 images: indices 3, 4, 5, 6)
                const smallIndex = index - 1
                
                if (smallIndex < 3) {
                  // Row 1, columns 3, 4, 5
                  gridRowStart = 1
                  gridRowEnd = 2
                  gridColStart = smallIndex + 3
                  gridColEnd = smallIndex + 4
                } else {
                  // Row 2, columns 1, 2, 3, 4
                  gridRowStart = 2
                  gridRowEnd = 3
                  gridColStart = smallIndex - 3
                  gridColEnd = smallIndex - 2
                }
              } else {
                // Subsequent pages: all 1×1, fill 5 cols × 2 rows = 10 images
                const row = Math.floor(index / 5) + 1
                const col = (index % 5) + 1
                gridRowStart = row
                gridRowEnd = row + 1
                gridColStart = col
                gridColEnd = col + 1
              }
              
              return (
                <div
                  key={image?.id || index}
                  className="group relative bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
                  style={{
                    gridRowStart,
                    gridRowEnd,
                    gridColumnStart: gridColStart,
                    gridColumnEnd: gridColEnd
                  }}
                  onClick={() => handleImageClick(image, index)}
                >
                  <img
                    src={imageSrc}
                    alt={`Gallery image ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FaChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>Next</span>
                <FaChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="p-12 text-center">
          <FaImages className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No images in this album</p>
        </div>
      )}

      {/* Albums Heading - Below Gallery */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Albums</h2>
        
        {/* Album Filter Buttons */}
        <div className="flex flex-wrap gap-3">
          {/* General/All Button */}
          <button
            onClick={() => handleAlbumChange('all')}
            className={`px-6 py-3 rounded-full font-medium text-sm transition-all flex items-center gap-2 border-2 ${
              selectedAlbum === 'all'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            General
            <span className={`text-xs px-2 py-1 rounded-full ${
              selectedAlbum === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-blue-100 text-blue-600'
            }`}>
              {totalImagesCount}
            </span>
          </button>
          
          {/* Individual Album Buttons */}
          {albums.map((album) => (
            <button
              key={album.id}
              onClick={() => handleAlbumChange(album.id)}
              className={`px-6 py-3 rounded-full font-medium text-sm transition-all flex items-center gap-2 border-2 ${
                selectedAlbum === album.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              {album.name}
              <span className={`text-xs px-2 py-1 rounded-full ${
                selectedAlbum === album.id
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-100 text-blue-600'
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

