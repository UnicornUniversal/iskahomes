"use client"
import React, { useState, useRef } from 'react'
import AlbumGallery from './AlbumGallery'
import FloorPlan from './FloorPlan'
import { Input } from '../../ui/input'
import { toast } from 'react-toastify'

const PropertyMedia = ({ formData, updateFormData, mode, accountType = 'developer' }) => {
  const [showVideoModal, setShowVideoModal] = useState(false)
  const videoInputRef = useRef(null)
  const isViewMode = mode === 'view'

  // Handle albums change from AlbumGallery
  const handleAlbumsChange = (albums) => {
    updateFormData({
      media: {
        ...formData.media,
        albums: albums
      }
    })
  }

  // Handle YouTube URL change
  const handleYouTubeUrlChange = (e) => {
    const url = e.target.value
    updateFormData({
      media: {
        ...formData.media,
        youtubeUrl: url
      }
    })
  }

  // Handle video file upload
  const handleVideoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate video file
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a valid video file')
      return
    }

    // Check file size (max 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2)
      toast.error(`Video file size (${fileSizeMB}MB) exceeds the 100MB limit. Please compress the video.`)
      return
    }

    updateFormData({
      media: {
        ...formData.media,
        video: {
          file: file,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file)
        }
      }
    })

    toast.success('Video uploaded successfully')
    e.target.value = '' // Reset input
  }

  // Remove video
  const handleRemoveVideo = () => {
    if (confirm('Are you sure you want to remove the video?')) {
      // Revoke object URL to free memory
      if (formData.media.video?.url && formData.media.video.url.startsWith('blob:')) {
        URL.revokeObjectURL(formData.media.video.url)
      }
      
      updateFormData({
        media: {
          ...formData.media,
          video: null
        }
      })
      toast.success('Video removed')
    }
  }

  // Validate YouTube URL
  const isValidYouTubeUrl = (url) => {
    if (!url) return false
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
    return youtubeRegex.test(url)
  }

  // Extract YouTube video ID
  const getYouTubeVideoId = (url) => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-6'>
      <h3 className='text-lg font-semibold text-primary_color mb-6'>Property Media</h3>
      
      <div className="space-y-8">
        {/* Image Albums Section */}
        <div>
          <AlbumGallery
            albums={formData.media?.albums || []}
            onAlbumsChange={handleAlbumsChange}
            mode={isViewMode ? 'view' : 'edit'}
          />
        </div>

        {/* Floor Plan Section */}
        <div className="border-t pt-6">
          <FloorPlan
            formData={formData}
            updateFormData={updateFormData}
            mode={isViewMode ? 'view' : 'edit'}
          />
        </div>

        {/* YouTube URL Section */}
        <div className="border-t pt-6">
          <h4 className="text-base font-semibold text-gray-900 mb-4">YouTube Video</h4>
          <div className="space-y-3">
            <div>
              <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700 mb-2">
                YouTube Video URL
              </label>
              <Input
                id="youtubeUrl"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.media?.youtubeUrl || ''}
                onChange={handleYouTubeUrlChange}
                readOnly={isViewMode}
                className="w-full"
              />
              {formData.media?.youtubeUrl && isValidYouTubeUrl(formData.media.youtubeUrl) && (
                <div className="mt-3">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(formData.media.youtubeUrl)}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                </div>
              )}
              {formData.media?.youtubeUrl && !isValidYouTubeUrl(formData.media.youtubeUrl) && (
                <p className="text-sm text-red-600 mt-2">Please enter a valid YouTube URL</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Enter a YouTube video URL to embed it in your property listing
              </p>
            </div>
          </div>
        </div>

        {/* Video Upload Section */}
        <div className="border-t pt-6">
          <h4 className="text-base font-semibold text-gray-900 mb-4">Video Upload</h4>
          <div className="space-y-4">
            {formData.media?.video ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <video
                    src={formData.media.video.url || formData.media.video}
                    controls
                    className="w-full rounded-lg"
                    style={{ maxHeight: '400px' }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formData.media.video.name || formData.media.video.filename || 'Video file'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Size: {(formData.media.video.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  {!isViewMode && (
                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Remove Video
                    </button>
                  )}
                </div>
              </div>
            ) : !isViewMode ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                onClick={() => videoInputRef.current?.click()}
              >
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <div className="space-y-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-base font-medium text-gray-700 mb-1">
                      Click to upload a video or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                      MP4, MOV, AVI up to 100MB
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium">No video uploaded</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertyMedia