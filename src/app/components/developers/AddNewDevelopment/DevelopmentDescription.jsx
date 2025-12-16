import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { cn } from '@/lib/utils'
import ConfirmModal from '../../ui/ConfirmModal'
import { toast } from 'react-toastify'

const DevelopmentDescription = ({ formData, updateFormData, isEditMode, developmentId }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingStatus, setPendingStatus] = useState(null)
  const [previousStatus, setPreviousStatus] = useState(formData.status || '')
  const [isProcessing, setIsProcessing] = useState(false)

  const statusOptions = [
    'Planning',
    'Under Construction',
    'Pre-Construction',
    'Ready for Occupancy',
    'Completed',
    'Sold Out'
  ]

  useEffect(() => {
    // Track previous status
    if (formData.status !== previousStatus) {
      setPreviousStatus(formData.status || '')
    }
  }, [formData.status, previousStatus])

  const handleInputChange = async (field, value) => {
    // If status is changing to "Sold Out", show confirmation modal
    if (field === 'status' && value === 'Sold Out' && formData.status !== 'Sold Out' && isEditMode && developmentId) {
      setPendingStatus(value)
      setShowConfirmModal(true)
    } else {
      updateFormData({
        [field]: value
      })
    }
  }

  const handleConfirmSoldOut = async () => {
    if (!developmentId) {
      toast.error('Development ID is required')
      return
    }

    setIsProcessing(true)
    try {
      const token = localStorage.getItem('developer_token')
      const response = await fetch(`/api/developments/${developmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'Sold Out'
        })
      })

      const result = await response.json()

      if (response.ok) {
        // Update form data with new status
        updateFormData({
          status: 'Sold Out'
        })
        
        const listingsUpdated = result.listingsUpdated || 0
        const salesCreated = result.salesCreated || 0
        
        toast.success(
          `Successfully marked development as Sold Out. ${listingsUpdated} listings updated, ${salesCreated} sales records created.`,
          { autoClose: 5000 }
        )
      } else {
        toast.error(result.error || 'Failed to mark development as Sold Out')
        // Revert status on error
        updateFormData({
          status: previousStatus
        })
      }
    } catch (error) {
      console.error('Error marking development as sold out:', error)
      toast.error('Error marking development as Sold Out. Please try again.')
      // Revert status on error
      updateFormData({
        status: previousStatus
      })
    } finally {
      setIsProcessing(false)
      setShowConfirmModal(false)
      setPendingStatus(null)
    }
  }

  const handleCancelSoldOut = () => {
    // Revert status to previous value
    updateFormData({
      status: previousStatus
    })
    setShowConfirmModal(false)
    setPendingStatus(null)
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="mb-2">Development Description</h2>
        <p>
          {isEditMode ? 'Update the development information' : 'Provide detailed information about your development project'}
        </p>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Development Title *
          </label>
          <Input
            id="title"
            type="text"
            placeholder="Enter development title"
            value={formData.title || ''}
            onChange={(e) => handleInputChange('title', e.target.value)}
            required
            className="w-full"
          />
        </div>

        {/* Tagline */}
        <div>
          <label htmlFor="tagline" className="block text-sm font-medium mb-2">
            Tagline
          </label>
          <Input
            id="tagline"
            type="text"
            placeholder="Enter a catchy tagline for your development"
            value={formData.tagline || ''}
            onChange={(e) => handleInputChange('tagline', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description *
          </label>
          <textarea
            id="description"
            rows={6}
            placeholder="Provide a detailed description of your development..."
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            required
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 preserve-whitespace"
          />
        </div>

        {/* Size and Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="size" className="block text-sm font-medium mb-2">
              Size (sq ft)
            </label>
            <Input
              id="size"
              type="number"
              placeholder="Total development size"
              value={formData.size || ''}
              onChange={(e) => handleInputChange('size', e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-2">
              Status *
            </label>
            <select
              id="status"
              value={formData.status || ''}
              onChange={(e) => handleInputChange('status', e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Number of Buildings */}
        <div>
          <label htmlFor="number_of_buildings" className="block text-sm font-medium mb-2">
            Number of Buildings
          </label>
          <Input
            id="number_of_buildings"
            type="number"
            placeholder="Total number of buildings"
            value={formData.number_of_buildings || ''}
            onChange={(e) => handleInputChange('number_of_buildings', e.target.value)}
            className="w-full"
          />
        </div>

      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={handleCancelSoldOut}
        onConfirm={handleConfirmSoldOut}
        title="Mark Development as Sold Out"
        message="Are you sure you want to mark this development as Sold Out? This will update all available listings in this development to either 'Sold Out' (for sale listings) or 'Rented Out' (for rent listings), create sales records, and update revenue statistics. This action cannot be easily undone."
        confirmText={isProcessing ? "Processing..." : "Yes, Mark as Sold Out"}
        cancelText="Cancel"
        variant="warning"
      />
    </div>
  )
}

export default DevelopmentDescription
