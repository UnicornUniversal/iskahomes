"use client"
import React, { useState, useRef } from 'react'
import Model3DViewer, { Model3DPreview, Model3DModal } from './Model3DViewer'

const UnitMedia = ({ formData, updateFormData, mode }) => {
  const [dragOver, setDragOver] = useState(false)
  const [showModelModal, setShowModelModal] = useState(false)
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const modelInputRef = useRef(null)

  const handleFileUpload = (files, type) => {
    const fileArray = Array.from(files)
    
    // Validate file types and sizes
    const validFiles = fileArray.filter(file => {
      if (type === 'images') {
        return file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024 // 5MB
      } else if (type === 'videos') {
        return file.type.startsWith('video/') && file.size <= 50 * 1024 * 1024 // 50MB
      } else if (type === 'model') {
        const validExtensions = ['.gltf', '.glb', '.obj', '.fbx']
        const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
        return validExtensions.includes(extension) && file.size <= 100 * 1024 * 1024 // 100MB
      }
      return false
    })

    if (validFiles.length !== fileArray.length) {
      alert(`Some files were rejected. Please check file types and sizes.`)
    }

    if (type === 'model') {
      updateFormData({
        media: {
          ...formData.media,
          model_3d: validFiles[0] || null
        }
      })
    } else {
      updateFormData({
        media: {
          ...formData.media,
          [type]: [...(formData.media[type] || []), ...validFiles]
        }
      })
    }
  }

  const removeFile = (index, type) => {
    const updatedFiles = formData.media[type].filter((_, i) => i !== index)
    updateFormData({
      media: {
        ...formData.media,
        [type]: updatedFiles
      }
    })
  }

  const removeModel = () => {
    updateFormData({
      media: {
        ...formData.media,
        model_3d: null
      }
    })
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e, type) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    handleFileUpload(files, type)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return '🖼️'
    } else if (file.type.startsWith('video/')) {
      return '🎥'
    } else {
      return '📄'
    }
  }

  return (
    <div className="space-y-6">
      {/* Images Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Images</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Images (Max 5MB each, up to 20 images)
          </label>
          
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'images')}
          >
            <div className="space-y-2">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm text-gray-600">
                Drag and drop images here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  browse files
                </button>
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to 5MB each
              </p>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileUpload(e.target.files, 'images')}
            className="hidden"
          />
        </div>

        {/* Display uploaded images */}
        {formData.media.images && formData.media.images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {formData.media.images.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index, 'images')}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
                <div className="mt-1 text-xs text-gray-500 truncate">
                  {file.name} ({formatFileSize(file.size)})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Videos Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Videos</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Videos (Max 50MB each, up to 5 videos)
          </label>
          
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'videos')}
          >
            <div className="space-y-2">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M15 10l4 4m0 0l4-4m-4 4V3m0 7l4 4m0 0l-4 4m4-4v7m-4-4l-4 4m0 0l4 4m-4-4v7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm text-gray-600">
                Drag and drop videos here, or{' '}
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  browse files
                </button>
              </p>
              <p className="text-xs text-gray-500">
                MP4, MOV, AVI up to 50MB each
              </p>
            </div>
          </div>
          
          <input
            ref={videoInputRef}
            type="file"
            multiple
            accept="video/*"
            onChange={(e) => handleFileUpload(e.target.files, 'videos')}
            className="hidden"
          />
        </div>

        {/* Display uploaded videos */}
        {formData.media.videos && formData.media.videos.length > 0 && (
          <div className="space-y-4">
            {formData.media.videos.map((file, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-white rounded-lg border">
                <div className="text-2xl">{getFileIcon(file)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index, 'videos')}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3D Model Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">3D Model</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload 3D Model (Max 100MB, GLTF/GLB/OBJ/FBX)
          </label>
          
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'model')}
          >
            <div className="space-y-2">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm text-gray-600">
                Drag and drop 3D model here, or{' '}
                <button
                  type="button"
                  onClick={() => modelInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  browse files
                </button>
              </p>
              <p className="text-xs text-gray-500">
                GLTF, GLB, OBJ, FBX up to 100MB
              </p>
            </div>
          </div>
          
          <input
            ref={modelInputRef}
            type="file"
            accept=".gltf,.glb,.obj,.fbx"
            onChange={(e) => handleFileUpload(e.target.files, 'model')}
            className="hidden"
          />
        </div>

        {/* Display uploaded 3D model */}
        {formData.media.model_3d && (
          <div className="flex items-center space-x-4 p-3 bg-white rounded-lg border">
            <div className="text-2xl">🎯</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{formData.media.model_3d.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(formData.media.model_3d.size)}</p>
            </div>
            <button
              type="button"
              onClick={removeModel}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          </div>
        )}

        {/* 3D Model Viewer Preview */}
        {formData.media.model_3d && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">3D Model Preview</h4>
              <button
                type="button"
                onClick={() => setShowModelModal(true)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Full Screen
              </button>
            </div>
            
            {/* 3D Model Preview */}
            <div className="border rounded-lg overflow-hidden">
              <Model3DPreview
                modelUrl={URL.createObjectURL(formData.media.model_3d)}
                modelFormat={formData.media.model_3d.name.split('.').pop().toLowerCase()}
                className="w-full"
              />
            </div>
            
            {/* Model Info */}
            <div className="mt-2 text-xs text-gray-500">
              <div>Format: {formData.media.model_3d.name.split('.').pop().toUpperCase()}</div>
              <div>Size: {formatFileSize(formData.media.model_3d.size)}</div>
              <div className="mt-1">
                <span className="text-green-600">✓</span> Interactive 3D model ready for viewing
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Virtual Tour URL */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Virtual Tour</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Virtual Tour URL
          </label>
          <input
            type="url"
            value={formData.media.virtual_tour_url || ''}
            onChange={(e) => updateFormData({
              media: {
                ...formData.media,
                virtual_tour_url: e.target.value
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/virtual-tour"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter a URL for a virtual tour (e.g., Matterport, Google Street View)
          </p>
        </div>
      </div>

      {/* Media Guidelines */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Media Guidelines</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Images: High quality, well-lit photos showing different angles</li>
          <li>• Videos: Short clips (30-60 seconds) highlighting key features</li>
          <li>• 3D Models: Interactive models for better visualization (GLTF, GLB, OBJ, FBX)</li>
          <li>• Virtual Tours: 360° views for immersive experience</li>
          <li>• All media will be optimized for web viewing</li>
        </ul>
      </div>

      {/* 3D Model Modal */}
      {formData.media.model_3d && (
        <Model3DModal
          isOpen={showModelModal}
          onClose={() => setShowModelModal(false)}
          modelUrl={URL.createObjectURL(formData.media.model_3d)}
          modelFormat={formData.media.model_3d.name.split('.').pop().toLowerCase()}
          title={`3D Model: ${formData.media.model_3d.name}`}
        />
      )}
    </div>
  )
}

export default UnitMedia