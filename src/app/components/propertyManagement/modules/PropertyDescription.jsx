import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { CustomSelect } from '../../ui/custom-select'
import { cn } from '@/lib/utils'
import SalesInformationModal from '../../ui/SalesInformationModal'

const PropertyDescription = ({ formData, updateFormData, isEditMode }) => {
  const [showSalesModal, setShowSalesModal] = useState(false)
  const [pendingStatus, setPendingStatus] = useState(null)
  const [previousStatus, setPreviousStatus] = useState(formData.status || '')

  const statusOptions = [
    { value: '', label: 'Select status' },
    { value: 'Available', label: 'Available' },
    { value: 'Unavailable', label: 'Unavailable' },
    { value: 'Sold', label: 'Sold' },
    { value: 'Rented Out', label: 'Rented Out' },
    { value: 'Taken', label: 'Taken' },
    { value: 'Under Maintenance / Renovation', label: 'Under Maintenance / Renovation' },
    { value: 'Coming Soon', label: 'Coming Soon' }
  ]

  const isSoldRentedOrTaken = (status) => {
    if (!status) return false
    const statusLower = status.toLowerCase().trim()
    return ['sold', 'rented out', 'taken'].includes(statusLower)
  }

  useEffect(() => {
    // Track previous status
    if (formData.status !== previousStatus) {
      setPreviousStatus(formData.status || '')
    }
  }, [formData.status, previousStatus])

  const handleInputChange = (field, value) => {
    // If status is changing to sold/rented/taken, show modal
    if (field === 'status' && isSoldRentedOrTaken(value) && !isSoldRentedOrTaken(formData.status)) {
      setPendingStatus(value)
      setShowSalesModal(true)
    } else {
      updateFormData({
        [field]: value
      })
    }
  }

  const handleSalesModalConfirm = (salesInfo) => {
    // Determine sale type
    const saleType = pendingStatus?.toLowerCase() === 'rented out' ? 'rented' : 'sold'
    
    // Update formData with status and sales info
    updateFormData({
      status: pendingStatus,
      sales_info: salesInfo
    })
    
    setShowSalesModal(false)
    setPendingStatus(null)
  }

  const handleSalesModalClose = () => {
    // If user closes modal without confirming, revert status
    if (pendingStatus) {
      updateFormData({
        status: previousStatus
      })
    }
    setShowSalesModal(false)
    setPendingStatus(null)
  }

  return (
    <div className="p-4 sm:p-6 ">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl  mb-2">Property Description</h2>
        <p className="text-sm sm:text-base text-gray-600">
          {isEditMode ? 'Update the property information' : 'Provide detailed information about your property'}
        </p>
      </div>

    <div className="space-y-4 sm:space-y-6">
        {/* Title */}
          <div>
          <label htmlFor="title" className="block text-sm font-medium  mb-2">
            Property Title *
            </label>
          <Input
            id="title"
              type="text"
            placeholder="Enter property title"
              value={formData.title || ''}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            className="w-full"
            />
          </div>

        {/* Description */}
          <div>
          <label htmlFor="description" className="block text-sm font-medium  mb-2">
            Description *
          </label>
          <textarea
            id="description"
            rows={6}
            placeholder="Provide a detailed description of your property..."
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            required
            className="flex w-full rounded-md border border-input  px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 preserve-whitespace"
          />
      </div>

        {/* Size and Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="size" className="block text-sm font-medium  mb-2">
              Size (sq meters)
            </label>
            <Input
              id="size"
              type="number"
              placeholder="Total property size"
              value={formData.size || ''}
              onChange={(e) => handleInputChange('size', e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium  mb-2">
              Status *
            </label>
            <CustomSelect
              id="status"
              value={formData.status || ''}
              onChange={(e) => handleInputChange('status', e.target.value)}
              options={statusOptions}
              placeholder="Select status"
              required
            />
          </div>
        </div>


      </div>
      
      {/* Sales Information Modal */}
      <SalesInformationModal
        isOpen={showSalesModal}
        onClose={handleSalesModalClose}
        onConfirm={handleSalesModalConfirm}
        saleType={pendingStatus?.toLowerCase() === 'rented out' ? 'rented' : 'sold'}
        isLoading={false}
      />
    </div>
  )
}

export default PropertyDescription