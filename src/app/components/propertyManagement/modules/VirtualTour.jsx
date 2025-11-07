"use client"
import React, { useState } from 'react'
import { Input } from '../../ui/input'
import { toast } from 'react-toastify'

const VirtualTour = ({ formData, updateFormData, mode }) => {
  const [virtualTourLink, setVirtualTourLink] = useState(formData.virtual_tour_link || '')
  const [isRequesting, setIsRequesting] = useState(false)
  const isViewMode = mode === 'view'

  const handleLinkChange = (value) => {
    setVirtualTourLink(value)
    updateFormData({
      virtual_tour_link: value
    })
  }

  const handleRequestVirtualTour = async () => {
    if (isRequesting) return

    setIsRequesting(true)
    try {
      // Here you would call your API to request a virtual tour
      // For now, we'll just show a success message
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Virtual tour request submitted! Our team will contact you shortly.')
    } catch (error) {
      toast.error('Failed to submit virtual tour request. Please try again.')
      console.error('Error requesting virtual tour:', error)
    } finally {
      setIsRequesting(false)
    }
  }

  const isValidUrl = (string) => {
    try {
      const url = new URL(string)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch (_) {
      return false
    }
  }

  return (
    <div>
      <div className="mb-4">
        <h4 className="text-base font-semibold text-gray-900 mb-2">Virtual Tour</h4>
        <p className="text-sm text-gray-600">
          {mode === 'edit' 
            ? 'Update the virtual tour link' 
            : mode === 'view' 
            ? 'View the virtual tour information' 
            : 'Add a virtual tour link or request one from our team'}
        </p>
      </div>

      <div className="space-y-4">
        {/* Virtual Tour Link Input */}
        <div>
          <label htmlFor="virtualTourLink" className="block text-sm font-medium text-gray-700 mb-2">
            Virtual Tour Link
          </label>
          <div className="flex gap-2">
            <Input
              id="virtualTourLink"
              type="url"
              placeholder="https://example.com/virtual-tour"
              value={virtualTourLink}
              onChange={(e) => handleLinkChange(e.target.value)}
              className="flex-1"
              disabled={isViewMode}
            />
            {!isViewMode && (
              <button
                type="button"
                suppressHydrationWarning
                onClick={handleRequestVirtualTour}
                disabled={isRequesting}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
              >
                {isRequesting ? 'Requesting...' : 'Request Virtual Tour'}
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter a link to an existing virtual tour, or click the button to request one
          </p>
        </div>

        {/* Preview Link */}
        {virtualTourLink && isValidUrl(virtualTourLink) && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">Virtual Tour Available</p>
                <a
                  href={virtualTourLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-700 hover:underline mt-1 block truncate"
                >
                  {virtualTourLink}
                </a>
              </div>
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            {!isViewMode && (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => handleLinkChange('')}
                className="mt-2 text-xs text-red-600 hover:text-red-800"
              >
                Clear link
              </button>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">About Virtual Tours</p>
              <p className="text-xs text-blue-700 mt-1">
                Add a link to an existing virtual tour (360° view, Matterport, etc.), or request our team to create a professional virtual tour for this property.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VirtualTour

