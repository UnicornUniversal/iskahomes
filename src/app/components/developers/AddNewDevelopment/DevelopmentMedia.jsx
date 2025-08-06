import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { cn } from '@/lib/utils'

const DevelopmentMedia = ({ developmentData, isEditMode }) => {
  const [formData, setFormData] = useState({
    banner: null,
    video: null,
    youtubeUrl: '',
    virtualTourUrl: '',
    mediaFiles: []
  })

  const [uploadProgress, setUploadProgress] = useState({})
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const bannerInputRef = useRef(null)

  // Populate form data when developmentData is available (edit mode)
  useEffect(() => {
    if (developmentData && isEditMode) {
      // For demo purposes, we'll create sample media data since dummy data doesn't have all media fields
      setFormData({
        banner: null, // Would be set from actual file upload
        video: null, // Would be set from actual file upload
        youtubeUrl: 'https://www.youtube.com/watch?v=sample-video',
        virtualTourUrl: 'https://example.com/virtual-tour',
        mediaFiles: [] // Would be populated from actual file uploads
      });
    }
  }, [developmentData, isEditMode]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = (files, type) => {
    const fileArray = Array.from(files)
    
    if (type === 'media') {
      setFormData(prev => ({
        ...prev,
        mediaFiles: [...prev.mediaFiles, ...fileArray]
      }))
    } else if (type === 'banner') {
      if (fileArray.length > 0) {
        setFormData(prev => ({
          ...prev,
          banner: fileArray[0]
        }))
      }
    } else if (type === 'video') {
      if (fileArray.length > 0) {
        const file = fileArray[0]
        // Check file size (10MB = 10 * 1024 * 1024 bytes)
        if (file.size > 10 * 1024 * 1024) {
          alert('Video file size must be less than 10MB')
          return
        }
        setFormData(prev => ({
          ...prev,
          video: file
        }))
      }
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files, 'media')
    }
  }

  const removeFile = (index, type) => {
    if (type === 'media') {
      setFormData(prev => ({
        ...prev,
        mediaFiles: prev.mediaFiles.filter((_, i) => i !== index)
      }))
    } else if (type === 'banner') {
      setFormData(prev => ({
        ...prev,
        banner: null
      }))
    } else if (type === 'video') {
      setFormData(prev => ({
        ...prev,
        video: null
      }))
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Development Media Data:', formData)
    // Handle form submission - differentiate between add and edit
    if (isEditMode) {
      console.log('Updating media for existing development...');
      // Add your update logic here
    } else {
      console.log('Saving media for new development...');
      // Add your create logic here
    }
  }

  return (
    <div className=" p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Development Media</h2>
        <p className="text-gray-600">
          {isEditMode ? 'Update media files and links for your development' : 'Upload media files and links for your development project'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Development Banner *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {formData.banner ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img
                    src={URL.createObjectURL(formData.banner)}
                    alt="Banner preview"
                    className="max-h-48 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(0, 'banner')}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-gray-600">{formData.banner.name}</p>
              </div>
            ) : (
              <div>
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-600 mb-2">Click to upload banner image</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  Choose Banner Image
                </Button>
              </div>
            )}
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files, 'banner')}
              className="hidden"
            />
          </div>
        </div>

        {/* Video Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Video Upload (Max 10MB)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {formData.video ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <video
                    src={URL.createObjectURL(formData.video)}
                    controls
                    className="max-h-48 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(0, 'video')}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  {formData.video.name} ({formatFileSize(formData.video.size)})
                </p>
              </div>
            ) : (
              <div>
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-600 mb-2">Click to upload video file</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => videoInputRef.current?.click()}
                >
                  Choose Video File
                </Button>
              </div>
            )}
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => handleFileUpload(e.target.files, 'video')}
              className="hidden"
            />
          </div>
        </div>

        {/* YouTube URL */}
        <div>
          <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700 mb-2">
            YouTube Video URL
          </label>
          <Input
            id="youtubeUrl"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={formData.youtubeUrl}
            onChange={(e) => handleInputChange('youtubeUrl', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Virtual Tour URL */}
        <div>
          <label htmlFor="virtualTourUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Virtual Tour URL
          </label>
          <Input
            id="virtualTourUrl"
            type="url"
            placeholder="https://..."
            value={formData.virtualTourUrl}
            onChange={(e) => handleInputChange('virtualTourUrl', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Additional Media Files */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Media Files
          </label>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              dragActive ? "border-primary bg-primary/5" : "border-gray-300"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-600 mb-2">Drag and drop files here, or click to select</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => handleFileUpload(e.target.files, 'media')}
              className="hidden"
            />
          </div>
        </div>

        {/* Media Files List */}
        {formData.mediaFiles.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Uploaded Media Files</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formData.mediaFiles.map((file, index) => (
                <div key={index} className="relative border rounded-lg p-3">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Media ${index + 1}`}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  ) : (
                    <video
                      src={URL.createObjectURL(file)}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  )}
                  <p className="text-sm text-gray-600 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  <button
                    type="button"
                    onClick={() => removeFile(index, 'media')}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-6">
          <Button type="submit" className="px-8">
            {isEditMode ? 'Update Media' : 'Save & Continue'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default DevelopmentMedia
