'use client'
import React from 'react'
import { X, AlertTriangle, Loader2 } from 'lucide-react'

const DeleteDevelopmentModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  development,
  listingsCount = 0,
  totalUnits = 0,
  isLoading = false 
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 ease-out">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-primary_color">
                Delete Development
              </h3>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {development && (
            <p className="text-gray-700 font-medium">
              {development.title || 'Untitled Development'}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this development? This action will mark it as deleted and update your metrics.
          </p>

          {/* Statistics */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <h4 className="text-sm font-semibold text-primary_color mb-3">
              Development Statistics
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Listings</p>
                <p className="text-lg font-semibold text-primary_color">
                  {listingsCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Units</p>
                <p className="text-lg font-semibold text-primary_color">
                  {totalUnits}
                </p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">What will happen:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Development will be marked as deleted (soft delete)</li>
                  <li>Your total developments count will decrease by 1</li>
                  <li>Your total units will decrease by {totalUnits}</li>
                  <li>Revenue metrics will be updated accordingly</li>
                  <li>All listings and historical data will remain linked</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <span>Delete Development</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteDevelopmentModal
