import React from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { cn } from '@/lib/utils'

const DevelopmentDescription = ({ formData, updateFormData, isEditMode }) => {
  const statusOptions = [
    'Planning',
    'Under Construction',
    'Pre-Construction',
    'Ready for Occupancy',
    'Completed',
    'Sold Out'
  ]

  const handleInputChange = (field, value) => {
    updateFormData({
      [field]: value
    });
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Development Description</h2>
        <p className="text-gray-600">
          {isEditMode ? 'Update the development information' : 'Provide detailed information about your development project'}
        </p>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
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

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
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
            <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
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

        {/* Number of Buildings */}
        <div>
          <label htmlFor="number_of_buildings" className="block text-sm font-medium text-gray-700 mb-2">
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
    </div>
  )
}

export default DevelopmentDescription
