import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { cn } from '@/lib/utils'

const DevelopmentMedia = ({ formData, updateFormData, isEditMode }) => {
  const [localMediaData, setLocalMediaData] = useState({
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

  // Initialize with form data
  useEffect(() => {
    if (formData.media) {
      setLocalMediaData(prev => ({
        ...prev,
        ...formData.media
      }));
    }
  }, [formData.media]);

  const handleInputChange = (field, value) => {
    const newMediaData = {
      ...localMediaData,
      [field]: value
    };
    setLocalMediaData(newMediaData);
    updateFormData({
      media: newMediaData
    });
  }

  const handleFileUpload = (files, type) => {
    const fileArray = Array.from(files)
    
    if (type === 'media') {
      const newMediaFiles = [...localMediaData.mediaFiles, ...fileArray];
      const newMediaData = {
        ...localMediaData,
        mediaFiles: newMediaFiles
      };
      setLocalMediaData(newMediaData);
      updateFormData({
        media: newMediaData
      });
    } else if (type === 'banner') {
      if (fileArray.length > 0) {
        const file = fileArray[0];
        // Check file size (5MB = 5 * 1024 * 1024 bytes)
        if (file.size > 5 * 1024 * 1024) {
          alert('Banner image size must be less than 5MB');
          return;
        }
        // Check file type
        if (!file.type.startsWith('image/')) {
          alert('Please select an image file for the banner');
          return;
        }
        const newMediaData = {
          ...localMediaData,
          banner: file
        };
        setLocalMediaData(newMediaData);
        updateFormData({
          media: newMediaData
        });
      }
    } else if (type === 'video') {
      if (fileArray.length > 0) {
        const file = fileArray[0]
        // Check file size (50MB = 50 * 1024 * 1024 bytes)
        if (file.size > 50 * 1024 * 1024) {
          alert('Video file size must be less than 50MB')
          return
        }
        // Check file type
        if (!file.type.startsWith('video/')) {
          alert('Please select a video file');
          return;
        }
        const newMediaData = {
          ...localMediaData,
          video: file
        };
        setLocalMediaData(newMediaData);
        updateFormData({
          media: newMediaData
        });
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
      const newMediaFiles = localMediaData.mediaFiles.filter((_, i) => i !== index);
      const newMediaData = {
        ...localMediaData,
        mediaFiles: newMediaFiles
      };
      setLocalMediaData(newMediaData);
      updateFormData({
        media: newMediaData
      });
    } else if (type === 'banner') {
      const newMediaData = {
        ...localMediaData,
        banner: null
      };
      setLocalMediaData(newMediaData);
      updateFormData({
        media: newMediaData
      });
    } else if (type === 'video') {
      const newMediaData = {
        ...localMediaData,
        video: null
      };
      setLocalMediaData(newMediaData);
      updateFormData({
        media: newMediaData
      });
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
    console.log('Development Media Data:', localMediaData)
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

      <div className="space-y-6">
        {/* Banner Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Development Banner *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {localMediaData.banner ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img
                    src={localMediaData.banner instanceof File ? URL.createObjectURL(localMediaData.banner) : localMediaData.banner.url}
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
                <p className="text-sm text-gray-600">
                  {localMediaData.banner instanceof File ? localMediaData.banner.name : localMediaData.banner.name}
                </p>
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
            {localMediaData.video ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <video
                    src={localMediaData.video instanceof File ? URL.createObjectURL(localMediaData.video) : localMediaData.video.url}
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
                  {localMediaData.video.name} ({localMediaData.video instanceof File ? formatFileSize(localMediaData.video.size) : formatFileSize(localMediaData.video.size)})
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
            value={localMediaData.youtubeUrl}
            onChange={(e) => handleInputChange('youtubeUrl', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Virtual Tour Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Virtual Tour
          </label>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Virtual Tour URL</h4>
                  <p className="text-xs text-gray-500 mt-1">Currently disabled - request a virtual tour instead</p>
                </div>
                <div className="text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <Input
                id="virtualTourUrl"
                type="url"
                placeholder="https://..."
                value={localMediaData.virtualTourUrl}
                onChange={(e) => handleInputChange('virtualTourUrl', e.target.value)}
                className="w-full mt-2"
                disabled
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Request a virtual tour for this project
            </Button>
          </div>
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
        {localMediaData.mediaFiles.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Uploaded Media Files</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {localMediaData.mediaFiles.map((file, index) => (
                <div key={index} className="relative border rounded-lg p-3">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={file instanceof File ? URL.createObjectURL(file) : file.url}
                      alt={`Media ${index + 1}`}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  ) : (
                    <video
                      src={file instanceof File ? URL.createObjectURL(file) : file.url}
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
      </div>
    </div>
  )
}

export default DevelopmentMedia
