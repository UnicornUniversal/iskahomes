import React from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { cn } from '@/lib/utils'

const PropertyDescription = ({ formData, updateFormData, isEditMode }) => {
  const statusOptions = [
    'Available',
    'Unavailable',
    'Reserved / On Hold',
    'Sold',
    'Under Maintenance / Renovation',
    'Coming Soon'
  ]

  const handleInputChange = (field, value) => {
    updateFormData({
        [field]: value
    });
  }

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Property Description</h2>
        <p className="text-sm sm:text-base text-gray-600">
          {isEditMode ? 'Update the property information' : 'Provide detailed information about your property'}
        </p>
      </div>

    <div className="space-y-4 sm:space-y-6">
        {/* Title */}
          <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
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
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            rows={6}
            placeholder="Provide a detailed description of your property..."
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            required
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 preserve-whitespace"
          />
      </div>

        {/* Size and Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
              Size (sq ft)
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
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
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


      </div>
    </div>
  )
}

export default PropertyDescription