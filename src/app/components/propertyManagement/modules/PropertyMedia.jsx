"use client"
import React, { useState, useRef } from 'react'
import Model3DViewer, { Model3DPreview, Model3DModal } from './Model3DViewer'

const PropertyMedia = ({ formData, updateFormData, mode, accountType = 'developer' }) => {
  const [dragOver, setDragOver] = useState(false)
  const [showModelModal, setShowModelModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const fileInputRef = useRef(null)

  const handleFileUpload = (files) => {
    const fileArray = Array.from(files)
    
    // Check 20-file limit for images
    const currentImageCount = formData.media.mediaFiles?.length || 0
    if (currentImageCount + fileArray.length > 20) {
      alert(`Maximum 20 images allowed. You currently have ${currentImageCount} images.`)
      return
    }
    
    // Validate file types and sizes
    const validFiles = fileArray.filter(file => {
      return file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024 // 5MB
    })

    if (validFiles.length !== fileArray.length) {
      alert(`Some files were rejected. Please check file types and sizes.`)
    }

    if (validFiles.length === 0) return

    // Add files to mediaFiles
    updateFormData({
      media: {
        ...formData.media,
        mediaFiles: [...(formData.media.mediaFiles || []), ...validFiles]
      }
    })
  }

  const removeFile = (index) => {
    const updatedFiles = formData.media.mediaFiles.filter((_, i) => i !== index)
    updateFormData({
      media: {
        ...formData.media,
        mediaFiles: updatedFiles
      }
    })
  }

  const replaceFile = (index) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = false
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file && file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
        const updatedFiles = [...formData.media.mediaFiles]
        // Mark the old file for removal if it's an existing file with URL
        const oldFile = updatedFiles[index]
        if (oldFile && oldFile.url && !(oldFile instanceof File)) {
          // Keep the old file info but mark it for removal
          oldFile._markedForRemoval = true
        }
        // Replace with new file
        updatedFiles[index] = file
        updateFormData({
          media: {
            ...formData.media,
            mediaFiles: updatedFiles
          }
        })
      } else {
        alert('Please select a valid image file under 5MB')
      }
    }
    input.click()
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileInputChange = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-6'>
      <h3 className='text-lg font-semibold text-primary_color mb-4'>Property Media</h3>
      
      <div className="space-y-6">
        {/* Images Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Images</h3>
            <div className="text-sm text-gray-600">
              {formData.media.mediaFiles?.length || 0}/20 images
            </div>
          </div>
          
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleFileSelect}
          >
            <div className="space-y-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Click to upload images or drag and drop
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, GIF up to 5MB each • Maximum 20 images
                </p>
              </div>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Image Preview Grid */}
          {formData.media.mediaFiles && formData.media.mediaFiles.length > 0 && (
            <div className="mt-6">
              <p className="!text-sm font-medium text-gray-900 mb-4">
                Uploaded Images ({formData.media.mediaFiles.length})
              </p>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {formData.media.mediaFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div 
                      className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        setSelectedImageIndex(index)
                        setShowImageModal(true)
                      }}
                    >
                      {file && (file instanceof File ? file.type.startsWith('image/') : file.url) ? (
                        <img
                          src={file instanceof File ? URL.createObjectURL(file) : file.url}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full flex items-center justify-center bg-gray-100" style={{ display: 'none' }}>
                        <span className="text-gray-400 text-xs">
                          {file && (file.name || file.originalName) ? (file.name || file.originalName) : 'Invalid file'}
                        </span>
                      </div>
                    </div>
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => replaceFile(index)}
                        className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-blue-600"
                        title="Replace image"
                      >
                        ↻
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        title="Remove image"
                      >
                        ×
                      </button>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 truncate">
                      {file.name || file.originalName || file.filename}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {(!formData.media.mediaFiles || formData.media.mediaFiles.length === 0) && (
            <div className="mt-6 text-center py-8 text-gray-500">
              <p className="text-sm">No images uploaded yet</p>
              <p className="text-xs">Use the upload area above to add images</p>
            </div>
          )}
        </div>

        {/* Image Modal */}
        {showImageModal && formData.media.mediaFiles && formData.media.mediaFiles[selectedImageIndex] && formData.media.mediaFiles[selectedImageIndex] instanceof File && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg overflow-hidden w-full max-w-5xl h-full max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
                <h3 className="text-lg font-semibold truncate">
                  {formData.media.mediaFiles[selectedImageIndex].name}
                </h3>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl ml-4 flex-shrink-0"
                >
                  ×
                </button>
              </div>
              
              {/* Image Container */}
              <div className="flex-1 flex items-center justify-center p-4 min-h-0">
                <img
                  src={URL.createObjectURL(formData.media.mediaFiles[selectedImageIndex])}
                  alt={formData.media.mediaFiles[selectedImageIndex].name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              
              {/* Navigation */}
              {formData.media.mediaFiles.length > 1 && (
                <div className="flex justify-between items-center p-4 border-t flex-shrink-0">
                  <button
                    onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                    disabled={selectedImageIndex === 0}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">
                    {selectedImageIndex + 1} of {formData.media.mediaFiles.length}
                  </span>
                  <button
                    onClick={() => setSelectedImageIndex(Math.min(formData.media.mediaFiles.length - 1, selectedImageIndex + 1))}
                    disabled={selectedImageIndex === formData.media.mediaFiles.length - 1}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PropertyMedia