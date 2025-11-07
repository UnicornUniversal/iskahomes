'use client'
import React, { useState, useCallback, useRef } from 'react'
import { toast } from 'react-toastify'
import ConfirmModal from '@/app/components/ui/ConfirmModal'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const PREDEFINED_ALBUM_NAMES = [
  'Living Room',
  'Bedroom',
  'Kitchen',
  'Bathroom',
  'Dining Room',
  'Outdoor',
  'Balcony',
  'Garage',
  'Other'
]

const GENERAL_ALBUM_NAME = 'General'

// Stable ID generator using a counter (deterministic for hydration)
const createIdGenerator = () => {
  let counter = 0
  return (prefix = 'id') => `${prefix}_${++counter}`
}

const AlbumGallery = ({ 
  albums = [], 
  onAlbumsChange,
  mode = 'edit' // 'edit' only (view mode removed)
}) => {
  // Initialize with General album if no albums provided - ensures stable initial state
  const getInitialAlbums = () => {
    if (albums && albums.length > 0) {
      const hasGeneral = albums.some(album => album.name === GENERAL_ALBUM_NAME)
      if (hasGeneral) {
        // Sort to ensure General is first
        return [...albums].sort((a, b) => {
          if (a.name === GENERAL_ALBUM_NAME) return -1
          if (b.name === GENERAL_ALBUM_NAME) return 1
          return 0
        })
      }
      // Add General album if missing - use stable timestamp
      return [{
        id: 'album_general_default',
        name: GENERAL_ALBUM_NAME,
        images: [],
        created_at: albums[0]?.created_at || '2024-01-01T00:00:00.000Z', // Use existing album's timestamp or stable default
        isDefault: true
      }, ...albums]
    }
    // No albums - create General album - use stable timestamp
    return [{
      id: 'album_general_default',
      name: GENERAL_ALBUM_NAME,
      images: [],
      created_at: '2024-01-01T00:00:00.000Z', // Stable timestamp for hydration
      isDefault: true
    }]
  }

  const [localAlbums, setLocalAlbums] = useState(getInitialAlbums)
  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false)
  const [selectedPredefinedName, setSelectedPredefinedName] = useState('')
  const [customAlbumName, setCustomAlbumName] = useState('')
  const [editingImageId, setEditingImageId] = useState(null)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    variant: 'danger'
  })
  const fileInputRefs = useRef({}) // Store refs for each album
  const imageEditInputRefs = useRef({}) // Store refs for each image
  const idGenerator = useRef(createIdGenerator()) // Stable ID generator
  const sliderRefs = useRef({}) // Store refs for each slider (for custom slider - deprecated)
  const [currentSlideIndex, setCurrentSlideIndex] = useState({}) // Track current slide position for each album (for custom slider - deprecated)
  const [itemsPerView, setItemsPerView] = useState({}) // Track items per view for each album (for custom slider - deprecated)
  const swiperInstancesRef = useRef({}) // Store Swiper instances for each album

  // Notify parent of initial albums state (only once on mount)
  React.useEffect(() => {
    if (onAlbumsChange && localAlbums.length > 0) {
      onAlbumsChange(localAlbums)
    }
  }, []) // Only run once on mount

  // Sync with parent albums prop - ensure General album always exists
  // Use a ref to track previous albums length and IDs to avoid unnecessary updates
  const prevAlbumsInfoRef = React.useRef({ length: 0, ids: '' })
  const isInitialMountRef = React.useRef(true)
  const localAlbumsRef = React.useRef(localAlbums)
  
  // Keep ref in sync with localAlbums
  React.useEffect(() => {
    localAlbumsRef.current = localAlbums
  }, [localAlbums])
  
  React.useEffect(() => {
    // On initial mount, skip sync (getInitialAlbums handles it)
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      if (albums && albums.length > 0) {
        prevAlbumsInfoRef.current = {
          length: albums.length,
          ids: albums.map(a => a.id).join(',')
        }
      }
      return
    }
    
    // Skip if albums prop is empty and we already have local albums (to prevent reset)
    if (!albums || albums.length === 0) {
      // Don't reset if we already have local albums
      if (localAlbumsRef.current.length > 0) {
        return
      }
      return
    }
    
    // Check if albums actually changed by comparing length and IDs (not File objects)
    const currentIds = albums.map(a => a.id).join(',')
    const albumsChanged = 
      albums.length !== prevAlbumsInfoRef.current.length ||
      currentIds !== prevAlbumsInfoRef.current.ids
    
    if (!albumsChanged) {
      return // Albums haven't actually changed, skip update
    }
    
    // Update ref
    prevAlbumsInfoRef.current = {
      length: albums.length,
      ids: currentIds
    }
    
    const hasGeneral = albums.some(album => album.name === GENERAL_ALBUM_NAME)
    if (!hasGeneral) {
      const generalAlbum = {
        id: albums.find(a => a.id === 'album_general_default')?.id || 'album_general_default',
        name: GENERAL_ALBUM_NAME,
        images: [],
        created_at: new Date().toISOString(),
        isDefault: true
      }
      setLocalAlbums([generalAlbum, ...albums])
      if (onAlbumsChange) {
        onAlbumsChange([generalAlbum, ...albums])
      }
    } else {
      // Ensure General album is first
      const sortedAlbums = [...albums].sort((a, b) => {
        if (a.name === GENERAL_ALBUM_NAME) return -1
        if (b.name === GENERAL_ALBUM_NAME) return 1
        return 0
      })
      // Only update if sorted albums are different from current (check IDs)
      const currentLocalIds = localAlbumsRef.current.map(a => a.id).join(',')
      const sortedIds = sortedAlbums.map(a => a.id).join(',')
      if (currentLocalIds !== sortedIds) {
        setLocalAlbums(sortedAlbums)
      }
    }
  }, [albums, onAlbumsChange])

  // Reset slide index when albums change
  React.useEffect(() => {
    setCurrentSlideIndex({})
  }, [albums])

  // Update all Swiper instances when images change
  React.useEffect(() => {
    const updateSwipers = () => {
      Object.keys(swiperInstancesRef.current).forEach(albumId => {
        const swiper = swiperInstancesRef.current[albumId]
        if (swiper && typeof swiper.update === 'function') {
          try {
            swiper.update()
            // Force update of navigation and pagination
            setTimeout(() => {
              if (swiper.navigation && typeof swiper.navigation.update === 'function') {
                swiper.navigation.update()
              }
              if (swiper.pagination && typeof swiper.pagination.render === 'function') {
                swiper.pagination.render()
                if (typeof swiper.pagination.update === 'function') {
                  swiper.pagination.update()
                }
              }
            }, 50)
          } catch (error) {
            console.warn('Error updating Swiper:', error)
          }
        }
      })
    }

    // Initial update
    const timer1 = setTimeout(updateSwipers, 200)
    const timer2 = setTimeout(updateSwipers, 500)
    
    // Update on window resize
    const handleResize = () => {
      updateSwipers()
    }

    window.addEventListener('resize', handleResize)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      window.removeEventListener('resize', handleResize)
    }
  }, [localAlbums])

  // Notify parent of changes
  const updateAlbums = useCallback((updatedAlbums) => {
    setLocalAlbums(updatedAlbums)
    if (onAlbumsChange) {
      onAlbumsChange(updatedAlbums)
    }
  }, [onAlbumsChange])

  // Get album name based on selection
  const getAlbumName = () => {
    if (selectedPredefinedName === 'Other') {
      return customAlbumName.trim()
    }
    return selectedPredefinedName
  }

  // Create new album
  const handleCreateAlbum = useCallback(() => {
    const albumName = getAlbumName()
    
    if (!albumName) {
      toast.error('Please select or enter an album name')
      return
    }

    // Prevent creating an album named "General"
    if (albumName.toLowerCase() === GENERAL_ALBUM_NAME.toLowerCase()) {
      toast.error(`"${GENERAL_ALBUM_NAME}" is a reserved album name. The General album already exists.`)
      return
    }

    // Check if album name already exists
    if (localAlbums.some(album => album.name.toLowerCase() === albumName.toLowerCase())) {
      toast.error('An album with this name already exists')
      return
    }

    const newAlbum = {
      id: `album_${idGenerator.current('album')}_${localAlbums.length}`,
      name: albumName,
      images: [],
      created_at: new Date().toISOString()
    }

    const updatedAlbums = [...localAlbums, newAlbum]
    updateAlbums(updatedAlbums)
    setSelectedPredefinedName('')
    setCustomAlbumName('')
    setShowCreateAlbumModal(false)
    toast.success('Album created successfully')
  }, [selectedPredefinedName, customAlbumName, localAlbums, updateAlbums])

  // Delete album - prevent deletion of General album
  const handleDeleteAlbum = useCallback((albumId) => {
    const album = localAlbums.find(a => a.id === albumId)
    
    // Prevent deletion of General album
    if (album?.name === GENERAL_ALBUM_NAME) {
      toast.error('The General album cannot be deleted')
      return
    }

    setConfirmModal({
      isOpen: true,
      title: 'Delete Album',
      message: `Are you sure you want to delete "${album?.name || 'this album'}"? All images in this album will be removed.`,
      onConfirm: () => {
        const updatedAlbums = localAlbums.filter(album => album.id !== albumId)
        updateAlbums(updatedAlbums)
        toast.success('Album deleted successfully')
      },
      variant: 'danger'
    })
  }, [localAlbums, updateAlbums])

  // Add images to album
  const handleAddImages = useCallback((albumId, files) => {
    if (!files || files.length === 0) {
      console.warn('No files provided to handleAddImages')
      return
    }

    const fileArray = Array.isArray(files) ? files : Array.from(files)
    
    console.log('Adding images:', {
      albumId,
      fileCount: fileArray.length,
      files: fileArray.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size,
        isFile: f instanceof File
      }))
    })

    const updatedAlbums = localAlbums.map(album => {
      if (album.id === albumId) {
        const newImages = fileArray.map((file, index) => {
          // Validate it's actually a File
          if (!(file instanceof File)) {
            console.error('Invalid file object:', file)
            return null
          }

          const blobUrl = URL.createObjectURL(file)
          console.log('Created blob URL:', blobUrl, 'for file:', file.name)

          return {
            id: `img_${albumId}_${index}_${idGenerator.current('img')}`,
            file: file,
            url: blobUrl,
            name: file.name,
            size: file.size,
            type: file.type,
            created_at: new Date().toISOString()
          }
        }).filter(img => img !== null) // Remove any null entries

        console.log('New images created:', newImages.length)
        newImages.forEach(img => {
          console.log('Image object:', {
            id: img.id,
            hasUrl: !!img.url,
            urlType: typeof img.url,
            urlStartsWith: img.url?.substring(0, 10),
            hasFile: !!img.file,
            fileType: img.file instanceof File ? 'File' : typeof img.file
          })
        })

        return {
          ...album,
          images: [...album.images, ...newImages]
        }
      }
      return album
    })

    console.log('Updated albums:', updatedAlbums.find(a => a.id === albumId))
    updateAlbums(updatedAlbums)
    
    // Update Swiper instance after images are added - multiple updates to ensure proper initialization
    setTimeout(() => {
      const swiper = swiperInstancesRef.current[albumId]
      if (swiper && typeof swiper.update === 'function') {
        swiper.update()
      }
    }, 100)
    setTimeout(() => {
      const swiper = swiperInstancesRef.current[albumId]
      if (swiper && typeof swiper.update === 'function') {
        swiper.update()
      }
    }, 300)
  }, [localAlbums, updateAlbums])

  // Remove image from album
  const handleRemoveImage = useCallback((albumId, imageId) => {
    const updatedAlbums = localAlbums.map(album => {
      if (album.id === albumId) {
        return {
          ...album,
          images: album.images.filter(img => img.id !== imageId)
        }
      }
      return album
    })

    updateAlbums(updatedAlbums)
    
    // Update Swiper instance after image is removed - multiple updates to ensure proper initialization
    setTimeout(() => {
      const swiper = swiperInstancesRef.current[albumId]
      if (swiper && typeof swiper.update === 'function') {
        swiper.update()
      }
    }, 100)
    setTimeout(() => {
      const swiper = swiperInstancesRef.current[albumId]
      if (swiper && typeof swiper.update === 'function') {
        swiper.update()
      }
    }, 300)
  }, [localAlbums, updateAlbums])

  // Replace image
  const handleReplaceImage = useCallback((albumId, imageId, file) => {
    const updatedAlbums = localAlbums.map(album => {
      if (album.id === albumId) {
        return {
          ...album,
          images: album.images.map(img => {
            if (img.id === imageId) {
              // Revoke old URL to free memory
              if (img.url && img.url.startsWith('blob:')) {
                URL.revokeObjectURL(img.url)
              }
              
              return {
                ...img,
                file: file,
                url: URL.createObjectURL(file),
                name: file.name,
                size: file.size,
                type: file.type,
                updated_at: new Date().toISOString()
              }
            }
            return img
          })
        }
      }
      return album
    })

    updateAlbums(updatedAlbums)
    setEditingImageId(null)
  }, [localAlbums, updateAlbums])

  // Handle file input change for adding images
  const handleFileInputChange = useCallback((e, albumId) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      handleAddImages(albumId, files)
    }
    // Reset input
    e.target.value = ''
  }, [handleAddImages])

  // Handle file input change for replacing image
  const handleReplaceImageInputChange = useCallback((e, albumId, imageId) => {
    const file = e.target.files[0]
    if (file) {
      handleReplaceImage(albumId, imageId, file)
    }
    // Reset input
    e.target.value = ''
    setEditingImageId(null)
  }, [handleReplaceImage])

  // Rename album - prevent renaming General album
  const handleRenameAlbum = useCallback((albumId) => {
    const album = localAlbums.find(a => a.id === albumId)
    if (!album) return

    // Prevent renaming General album
    if (album.name === GENERAL_ALBUM_NAME) {
      toast.error('The General album cannot be renamed')
      return
    }

    const newName = prompt('Enter new album name:', album.name)
    if (newName && newName.trim() && newName.trim() !== album.name) {
      // Prevent renaming to "General"
      if (newName.trim().toLowerCase() === GENERAL_ALBUM_NAME.toLowerCase()) {
        toast.error(`"${GENERAL_ALBUM_NAME}" is a reserved album name`)
        return
      }

      // Check if name already exists
      if (localAlbums.some(a => a.id !== albumId && a.name.toLowerCase() === newName.trim().toLowerCase())) {
        toast.error('An album with this name already exists')
        return
      }

      const updatedAlbums = localAlbums.map(a => {
        if (a.id === albumId) {
          return { ...a, name: newName.trim() }
        }
        return a
      })

      updateAlbums(updatedAlbums)
    }
  }, [localAlbums, updateAlbums])

  return (
    <div className="w-full space-y-4" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Image Albums</h3>
          <p className="text-sm text-gray-600">Organize your images into albums</p>
        </div>
        {mode === 'edit' && (
          <button
            type="button"
            onClick={() => setShowCreateAlbumModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
            suppressHydrationWarning
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Album
          </button>
        )}
      </div>

      {/* Albums List - Full Width */}
      {localAlbums.length > 0 ? (
        <div className="space-y-4">
          {localAlbums.map((album) => (
            <div
              key={album.id}
              className="border border-gray-200 rounded-lg p-4 bg-white w-full"
              style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}
            >
              {/* Album Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-semibold text-gray-900">{album.name}</h4>
                  {album.name === GENERAL_ALBUM_NAME && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      Default
                    </span>
                  )}
                </div>
                
                {mode === 'edit' && (
                  <div className="flex items-center gap-2">
                    {/* Hide rename and delete buttons for General album */}
                    {album.name !== GENERAL_ALBUM_NAME && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRenameAlbum(album.id)}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-1.5"
                          title="Edit album name"
                          suppressHydrationWarning
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleDeleteAlbum(album.id)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium flex items-center gap-1.5"
                          title="Delete album"
                          suppressHydrationWarning
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </>
                    )}
                    
                    <input
                      ref={(el) => {
                        if (el) fileInputRefs.current[album.id] = el
                      }}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileInputChange(e, album.id)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = fileInputRefs.current[album.id]
                        if (input) input.click()
                      }}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-1.5"
                      title="Add new images"
                      suppressHydrationWarning
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Images
                    </button>
                  </div>
                )}
              </div>

              {/* Images Swiper Slider */}
              {album.images.length > 0 ? (
                <div className="relative w-full overflow-hidden" style={{ minHeight: '220px', maxWidth: '100%' }} suppressHydrationWarning>
                  <Swiper
                    key={`swiper-${album.id}-${album.images.length}`}
                    modules={[Navigation, Pagination]}
                    navigation={true}
                    pagination={{ clickable: true }}
                    spaceBetween={8}
                    slidesPerView="auto"
                    className="album-swiper"
                    updateOnWindowResize={true}
                    observer={true}
                    observeParents={true}
                    watchSlidesProgress={true}
                    resizeObserver={true}
                    width={null}
                    onSwiper={(swiper) => {
                      // Store Swiper instance for this album
                      swiperInstancesRef.current[album.id] = swiper
                      // Force multiple updates to ensure proper initialization
                      setTimeout(() => {
                        if (swiper && typeof swiper.update === 'function') {
                          swiper.update()
                        }
                      }, 50)
                      setTimeout(() => {
                        if (swiper && typeof swiper.update === 'function') {
                          swiper.update()
                        }
                      }, 200)
                      setTimeout(() => {
                        if (swiper && typeof swiper.update === 'function') {
                          swiper.update()
                        }
                      }, 500)
                    }}
                    onInit={(swiper) => {
                      // Additional initialization after Swiper is fully ready
                      setTimeout(() => {
                        if (swiper && typeof swiper.update === 'function') {
                          swiper.update()
                        }
                      }, 150)
                    }}
                    onSlideChange={() => {
                      // Swiper is working
                    }}
                  >
                    {album.images.map((image, index) => {
                      // Determine image source - handle all possible formats
                      let imageSrc = null
                      
                      // Priority order: url property > file property > direct File > string
                      if (image && image.url) {
                        imageSrc = image.url
                        // If it's a blob URL that was revoked, try to recreate from file
                        if (!imageSrc.startsWith('blob:') && !imageSrc.startsWith('http') && image.file instanceof File) {
                          imageSrc = URL.createObjectURL(image.file)
                        }
                      } else if (image && image.file instanceof File) {
                        imageSrc = URL.createObjectURL(image.file)
                      } else if (image instanceof File) {
                        imageSrc = URL.createObjectURL(image)
                      } else if (typeof image === 'string' && image.length > 0) {
                        imageSrc = image
                      }
                      
                      return (
                        <SwiperSlide key={image?.id || 'img-' + album.id + '-' + index} style={{ width: '200px', flexShrink: 0 }}>
                          <div className="relative group">
                            {/* Image Container */}
                            <div className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden mb-1" style={{ width: '200px' }}>
                              {imageSrc ? (
                                <img
                                  src={imageSrc}
                                  alt={image?.name || `${album.name} ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.error('Image load error:', {
                                      imageSrc,
                                      image,
                                      type: typeof image,
                                      hasUrl: !!image?.url,
                                      hasFile: !!image?.file,
                                      isFile: image instanceof File
                                    })
                                    e.target.style.display = 'none'
                                    const errorDiv = e.target.nextElementSibling
                                    if (errorDiv) {
                                      errorDiv.style.display = 'flex'
                                    }
                                  }}
                                  onLoad={() => {
                                    // Image loaded successfully
                                    console.log('Image loaded successfully:', imageSrc)
                                  }}
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gray-300 flex items-center justify-center text-gray-500 text-xs">
                                  No Image
                                </div>
                              )}
                              
                              {mode === 'edit' && (
                                <>
                                  {/* Edit and Delete buttons - visible on hover */}
                                  <div className="absolute inset-0 flex items-center justify-center gap-2">
                                    <input
                                      ref={(el) => {
                                        if (el && image.id) {
                                          imageEditInputRefs.current[image.id] = el
                                        }
                                      }}
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => handleReplaceImageInputChange(e, album.id, image.id)}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingImageId(image.id)
                                        // Small delay to ensure ref is set
                                        setTimeout(() => {
                                          const input = imageEditInputRefs.current[image.id]
                                          if (input) {
                                            input.click()
                                          }
                                        }, 0)
                                      }}
                                      className="p-2 bg-blue-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-700 z-10"
                                      title="Replace image"
                                      suppressHydrationWarning
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const imageToDelete = image
                                        setConfirmModal({
                                          isOpen: true,
                                          title: 'Delete Image',
                                          message: `Are you sure you want to delete "${imageToDelete?.name || 'this image'}"?`,
                                          onConfirm: () => {
                                            handleRemoveImage(album.id, imageToDelete.id)
                                            toast.success('Image deleted successfully')
                                          },
                                          variant: 'danger'
                                        })
                                      }}
                                      className="p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 z-10"
                                      title="Delete image"
                                      suppressHydrationWarning
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                            
                            {/* Image name displayed under the image */}
                            {image.name && (
                              <div className="text-xs text-gray-600 truncate px-1" style={{ width: '200px' }} title={image.name}>
                                {image.name}
                              </div>
                            )}
                          </div>
                        </SwiperSlide>
                      )
                    })}
                  </Swiper>
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600 text-sm">No images in this album yet</p>
                  {mode === 'edit' && (
                    <p className="text-xs text-gray-500 mt-1">Click "Add Images" to get started</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600 mb-4">No albums yet</p>
          {mode === 'edit' && (
            <button
              type="button"
              onClick={() => setShowCreateAlbumModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              suppressHydrationWarning
            >
              Create New Album
            </button>
          )}
        </div>
      )}

      {/* Create Album Modal - Small and Compact */}
      {showCreateAlbumModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Album</h3>
              <button
                type="button"
                onClick={() => {
                  setShowCreateAlbumModal(false)
                  setSelectedPredefinedName('')
                  setCustomAlbumName('')
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                suppressHydrationWarning
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select Album Name
                </label>
                <select
                  value={selectedPredefinedName}
                  onChange={(e) => {
                    setSelectedPredefinedName(e.target.value)
                    if (e.target.value !== 'Other') {
                      setCustomAlbumName('')
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">-- Select --</option>
                  {PREDEFINED_ALBUM_NAMES.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {selectedPredefinedName === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Enter Custom Album Name
                  </label>
                  <input
                    type="text"
                    value={customAlbumName}
                    onChange={(e) => setCustomAlbumName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateAlbum()
                      }
                    }}
                    placeholder="Enter album name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreateAlbumModal(false)
                  setSelectedPredefinedName('')
                  setCustomAlbumName('')
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-sm"
                suppressHydrationWarning
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateAlbum}
                disabled={!selectedPredefinedName || (selectedPredefinedName === 'Other' && !customAlbumName.trim())}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                suppressHydrationWarning
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm || (() => {})}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
      />
    </div>
  )
}

export default AlbumGallery
