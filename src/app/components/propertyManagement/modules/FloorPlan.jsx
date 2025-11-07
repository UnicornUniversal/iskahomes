"use client"
import React, { useState, useRef } from 'react'
import { FiEdit3, FiTrash2, FiUpload, FiImage } from 'react-icons/fi'
import { toast } from 'react-toastify'

const FloorPlan = ({ formData, updateFormData, mode }) => {
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const isViewMode = mode === 'view'

  const handleFileUpload = (file) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, GIF)')
      return
    }

    // Validate file size - 300KB limit
    const maxSize = 300 * 1024 // 300KB in bytes
    if (file.size > maxSize) {
      const fileSizeKB = (file.size / 1024).toFixed(2)
      toast.error(`File size (${fileSizeKB}KB) exceeds the 300KB limit. Please compress the image.`)
      return
    }

    updateFormData({
      floor_plan: {
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      }
    })
    
    toast.success('Floor plan uploaded successfully')
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const removeFloorPlan = () => {
    if (confirm('Are you sure you want to remove the floor plan?')) {
      updateFormData({
        floor_plan: null
      })
      toast.success('Floor plan removed')
    }
  }

  const replaceFloorPlan = () => {
    fileInputRef.current?.click()
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
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  return (
    <div>
      <div className="mb-4">
        <h4 className="text-base font-semibold text-gray-900 mb-2">Floor Plan</h4>
        <p className="text-sm text-gray-600">
          {mode === 'edit' ? 'Update the floor plan image' : mode === 'view' ? 'View the floor plan' : 'Upload a floor plan image for this property (max 300KB)'}
        </p>
      </div>

      {formData.floor_plan ? (
        <div className="space-y-4">
          {/* Floor Plan Image Container */}
          <div className="relative group border-2 border-gray-200 rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 hover:border-blue-300 transition-all duration-200">
            <img
              src={formData.floor_plan.url || formData.floor_plan}
              alt="Floor Plan"
              className="w-full h-auto max-h-[500px] object-contain mx-auto block"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
            <div className="hidden w-full h-64 items-center justify-center bg-gray-100">
              <span className="text-gray-400 text-sm">Failed to load image</span>
            </div>

            {/* Action Buttons Overlay - Show on hover */}
            {!isViewMode && (
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={replaceFloorPlan}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                  title="Replace floor plan"
                >
                  <FiEdit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={removeFloorPlan}
                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                  title="Remove floor plan"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* File Info */}
          {formData.floor_plan.name && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <FiImage className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                    {formData.floor_plan.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Size: {(formData.floor_plan.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              {!isViewMode && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={replaceFloorPlan}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Replace"
                  >
                    <FiEdit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={removeFloorPlan}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : !isViewMode ? (
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer ${
            dragOver
              ? 'border-blue-500 bg-blue-50 scale-[1.02]'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className={`p-4 rounded-full ${dragOver ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <FiUpload className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div>
              <p className="text-base font-medium text-gray-700 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-gray-500">
                PNG, JPG, GIF • Max 300KB
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Compress images to reduce file size if needed
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <FiImage className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm font-medium">No floor plan uploaded</p>
        </div>
      )}
    </div>
  )
}

export default FloorPlan

