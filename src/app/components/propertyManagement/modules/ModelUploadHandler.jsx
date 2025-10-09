"use client"
import React, { useState, useRef } from 'react'

const ModelUploadHandler = ({ onModelUpload, onModelRemove, currentModel, maxSize = 100 }) => {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const supportedFormats = ['gltf', 'glb', 'obj', 'fbx']
  const maxSizeBytes = maxSize * 1024 * 1024 // Convert MB to bytes

  const validateFile = (file) => {
    const extension = file.name.toLowerCase().split('.').pop()
    
    if (!supportedFormats.includes(extension)) {
      throw new Error(`Unsupported format. Supported formats: ${supportedFormats.join(', ').toUpperCase()}`)
    }
    
    if (file.size > maxSizeBytes) {
      throw new Error(`File too large. Maximum size: ${maxSize}MB`)
    }
    
    return true
  }

  const handleFileUpload = (files) => {
    const file = files[0]
    if (!file) return

    try {
      validateFile(file)
      setUploading(true)
      
      // Simulate upload process
      setTimeout(() => {
        onModelUpload(file)
        setUploading(false)
      }, 1000)
    } catch (error) {
      alert(error.message)
      setUploading(false)
    }
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
    handleFileUpload(e.dataTransfer.files)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="space-y-2">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-600">Processing 3D model...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm text-gray-600">
              Drag and drop 3D model here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                browse files
              </button>
            </p>
            <p className="text-xs text-gray-500">
              {supportedFormats.join(', ').toUpperCase()} up to {maxSize}MB
            </p>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept={supportedFormats.map(f => `.${f}`).join(',')}
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Current Model Display */}
      {currentModel && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-green-600">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-green-900">
                  {currentModel.name}
                </div>
                <div className="text-xs text-green-700">
                  {currentModel.name.split('.').pop().toUpperCase()} • {formatFileSize(currentModel.size)}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onModelRemove}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Supported Formats Info */}
      <div className="bg-blue-50 p-3 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Supported 3D Formats</h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
          <div className="flex items-center">
            <span className="mr-2">📦</span>
            <span><strong>GLTF/GLB:</strong> Recommended format</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">📦</span>
            <span><strong>OBJ:</strong> Legacy format</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">📦</span>
            <span><strong>FBX:</strong> Autodesk format</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">💡</span>
            <span><strong>Tip:</strong> GLTF/GLB preferred</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModelUploadHandler
