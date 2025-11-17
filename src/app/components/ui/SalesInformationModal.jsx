"use client"
import React, { useState } from 'react'
import { Input } from './input'
import { Button } from './button'

const SalesInformationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  saleType = 'sold', // 'sold' or 'rented'
  isLoading = false 
}) => {
  const [buyerName, setBuyerName] = useState('')
  const [salesSource, setSalesSource] = useState('Iska Homes')
  const [otherSource, setOtherSource] = useState('')
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const finalSalesSource = salesSource === 'Other' ? otherSource : salesSource
    onConfirm({
      buyer_name: buyerName.trim() || null,
      sale_source: finalSalesSource || 'Iska Homes',
      notes: notes.trim() || null
    })
  }

  const handleSkip = () => {
    onConfirm({
      buyer_name: null,
      sale_source: 'Iska Homes',
      notes: null
    })
  }

  const handleCancel = () => {
    // Reset form
    setBuyerName('')
    setSalesSource('Iska Homes')
    setOtherSource('')
    setNotes('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 ease-out">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
            {saleType === 'sold' ? 'Sale Information' : 'Rental Information'}
          </h3>
          
          <p className="text-gray-600 text-center text-sm leading-relaxed">
            {saleType === 'sold' 
              ? 'Congratulations on the sale! Please provide additional information (optional).'
              : 'Congratulations on the rental! Please provide additional information (optional).'}
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          <div className="space-y-4 mb-6">
            {/* Buyer Name */}
            <div>
              <label htmlFor="buyerName" className="block text-sm font-medium text-gray-700 mb-2">
                {saleType === 'sold' ? 'Buyer Name' : 'Tenant Name'} <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <Input
                id="buyerName"
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder={`Enter ${saleType === 'sold' ? 'buyer' : 'tenant'} name`}
                className="w-full"
              />
            </div>

            {/* Sales Source */}
            <div>
              <label htmlFor="salesSource" className="block text-sm font-medium text-gray-700 mb-2">
                Sales Source <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <select
                id="salesSource"
                value={salesSource}
                onChange={(e) => setSalesSource(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="Iska Homes">Iska Homes</option>
                <option value="Referral">Referral</option>
                <option value="External Ad">External Ad</option>
                <option value="Friends and Family">Friends and Family</option>
                <option value="Social Media">Social Media</option>
                <option value="Direct Contact">Direct Contact</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Other Source Input */}
            {salesSource === 'Other' && (
              <div>
                <label htmlFor="otherSource" className="block text-sm font-medium text-gray-700 mb-2">
                  Specify Other Source <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <Input
                  id="otherSource"
                  type="text"
                  value={otherSource}
                  onChange={(e) => setOtherSource(e.target.value)}
                  placeholder="Enter sales source"
                  className="w-full"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this sale..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-2.5 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SalesInformationModal

