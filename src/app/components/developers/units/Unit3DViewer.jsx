"use client"
import React, { useState, useEffect } from 'react'
import Model3DViewer from './Model3DViewer'

const Unit3DViewer = ({ modelData, unitTitle = "Unit" }) => {
  const [modelUrl, setModelUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (modelData) {
      setLoading(true)
      setError(null)
      
      // If modelData has a URL (from database), use it directly
      if (modelData.url) {
        setModelUrl(modelData.url)
        setLoading(false)
      } else if (modelData instanceof File) {
        // If it's a File object, create object URL
        try {
          const url = URL.createObjectURL(modelData)
          setModelUrl(url)
          setLoading(false)
        } catch (err) {
          setError('Failed to load 3D model file')
          setLoading(false)
        }
      } else {
        setError('Invalid model data')
        setLoading(false)
      }
    }
  }, [modelData])

  if (loading) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading 3D Model...</div>
        </div>
      </div>
    )
  }

  if (error || !modelUrl) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          <div className="text-lg font-semibold mb-2">3D Model Not Available</div>
          <div className="text-sm">{error || 'No 3D model uploaded for this unit'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          3D Model: {unitTitle}
        </h3>
        {modelData.format && (
          <div className="text-sm text-gray-600">
            Format: {modelData.format.toUpperCase()}
          </div>
        )}
      </div>
      
      <Model3DViewer
        modelUrl={modelUrl}
        modelFormat={modelData.format || 'gltf'}
        width="100%"
        height="600px"
        showControls={true}
        autoRotate={true}
        className="border rounded-lg"
      />
      
      {/* Controls Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">3D Viewer Controls</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
          <div className="flex items-center">
            <span className="mr-2">🖱️</span>
            <span>Left click + drag: Rotate</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">🖱️</span>
            <span>Right click + drag: Pan</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">🖱️</span>
            <span>Scroll wheel: Zoom</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Unit3DViewer
