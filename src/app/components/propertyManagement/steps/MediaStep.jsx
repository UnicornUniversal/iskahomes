"use client"
import React, { useCallback } from 'react'
import { Input } from '../../ui/input'
import AlbumGallery from '../modules/AlbumGallery'

const MediaStep = ({ formData, updateFormData, mode }) => {
  // Handle albums change
  const handleAlbumsChange = useCallback((albums) => {
    updateFormData({
      media: {
        ...formData.media,
        albums: albums
      }
    })
  }, [formData.media, updateFormData])

  return (
    <div className="space-y-8 w-full relative ">
      <div>
        <h2 className="t">Media</h2>
        <p className="">{mode === 'edit' ? 'Update the media including pictures and videos for your property' : 'Upload images, videos, and other media for your property'}</p>
      </div>

      {/* Image Albums - Remove all overflow constraints */}
      <div className=" default_bg p-6 w-full max-w-[900px]">
        <AlbumGallery
          albums={formData.media?.albums || []}
          onAlbumsChange={handleAlbumsChange}
          mode="edit"
        />
      </div>

      {/* Video Sections - Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* YouTube URL Section */}
        <div className=" rounded-xl shadow-sm border border-gray-100 p-6 w-full">
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
                onChange={(e) => {
                  updateFormData({
                    media: {
                      ...formData.media,
                      youtubeUrl: e.target.value
                    }
                  })
                }}
                className="w-full"
              />
              {formData.media?.youtubeUrl && /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(formData.media.youtubeUrl) && (() => {
                const url = formData.media.youtubeUrl
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
                const match = url.match(regExp)
                const videoId = (match && match[2].length === 11) ? match[2] : null
                return videoId ? (
                  <div className="mt-3">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                      <p className="text-sm text-gray-600 mb-2">Preview:</p>
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden w-full">
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>
                    </div>
                  </div>
                ) : null
              })()}
            </div>
          </div>
        </div>

        {/* Video Upload Section */}
        <div className=" rounded-xl shadow-sm border border-gray-100 p-6 w-full">
          <h4 className="text-base font-semibold text-gray-900 mb-4">Video Upload</h4>
          <div className="space-y-4 w-full">
            {formData.media?.video ? (
              <div className="space-y-4 w-full">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                  <video
                    src={formData.media.video.url || (typeof formData.media.video === 'string' ? formData.media.video : formData.media.video.url)}
                    controls
                    className="w-full rounded-lg max-h-[300px] object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 w-full">
                  <div className="text-sm text-gray-600 flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {formData.media.video.name || formData.media.video.filename || 'Video file'}
                    </div>
                    {formData.media.video.size && (
                      <div className="text-xs text-gray-500">
                        {(formData.media.video.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    )}
                    {formData.media.video.url && formData.media.video.url.startsWith('blob:') && (
                      <div className="text-xs text-amber-600 mt-1">
                        ⚠️ Video will be uploaded when you save
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.media.video?.url && formData.media.video.url.startsWith('blob:')) {
                        URL.revokeObjectURL(formData.media.video.url)
                      }
                      updateFormData({
                        media: {
                          ...formData.media,
                          video: null
                        }
                      })
                    }}
                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium ml-3 flex-shrink-0"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all w-full"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'video/*'
                  input.onchange = (e) => {
                    const file = e.target.files[0]
                    if (!file) return

                    if (!file.type.startsWith('video/')) {
                      return
                    }

                    const maxSize = 100 * 1024 * 1024 // 100MB
                    if (file.size > maxSize) {
                      alert(`Video file size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the 100MB limit. Please compress the video.`)
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
                          url: URL.createObjectURL(file) // Blob URL for preview only
                        }
                      }
                    })
                  }
                  input.click()
                }}
              >
                <div className="space-y-3">
                  <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Click to upload a video
                    </p>
                    <p className="text-xs text-gray-500">
                      MP4, MOV, AVI up to 100MB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MediaStep