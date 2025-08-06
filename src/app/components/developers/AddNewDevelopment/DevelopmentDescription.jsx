import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { cn } from '@/lib/utils'

const DevelopmentDescription = ({ developmentData, isEditMode }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    developmentType: '',
    size: '',
    status: '',
    numberOfBuildings: '',
    unitTypes: []
  })

  // Populate form data when developmentData is available (edit mode)
  useEffect(() => {
    if (developmentData && isEditMode) {
      setFormData({
        title: developmentData.title || '',
        description: developmentData.description || '',
        developmentType: developmentData.developmentType || '',
        size: developmentData.size || '',
        status: developmentData.status || '',
        numberOfBuildings: developmentData.numberOfBuildings?.toString() || '',
        unitTypes: developmentData.unitTypes || []
      });
    }
  }, [developmentData, isEditMode]);

  const developmentTypes = [
    'Residential',
    'Commercial',
    'Mixed-Use',
    'Industrial',
    'Retail',
    'Office',
    'Hotel',
    'Apartment Complex',
    'Townhouse Community',
    'Single Family Homes'
  ]

  const statusOptions = [
    'Planning',
    'Under Construction',
    'Pre-Construction',
    'Ready for Occupancy',
    'Completed',
    'Sold Out'
  ]

  const unitTypeOptions = [
    'Studio',
    '1 Bedroom',
    '2 Bedroom',
    '3 Bedroom',
    '4+ Bedroom',
    'Penthouse',
    'Duplex',
    'Townhouse',
    'Villa',
    'Office Space',
    'Retail Space'
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleUnitTypeToggle = (unitType) => {
    setFormData(prev => ({
      ...prev,
      unitTypes: prev.unitTypes.includes(unitType)
        ? prev.unitTypes.filter(type => type !== unitType)
        : [...prev.unitTypes, unitType]
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Development Description Data:', formData)
    // Handle form submission - differentiate between add and edit
    if (isEditMode) {
      console.log('Updating existing development...');
      // Add your update logic here
    } else {
      console.log('Creating new development...');
      // Add your create logic here
    }
  }

  return (
    <div className=" p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Development Description</h2>
        <p className="text-gray-600">
          {isEditMode ? 'Update the development information' : 'Provide detailed information about your development project'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Development Title *
          </label>
          <Input
            id="title"
            type="text"
            placeholder="Enter development title"
            value={formData.title}
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
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            required
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Development Type */}
        <div>
          <label htmlFor="developmentType" className="block text-sm font-medium text-gray-700 mb-2">
            Development Type *
          </label>
          <select
            id="developmentType"
            value={formData.developmentType}
            onChange={(e) => handleInputChange('developmentType', e.target.value)}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Select development type</option>
            {developmentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
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
              value={formData.size}
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
              value={formData.status}
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
          <label htmlFor="numberOfBuildings" className="block text-sm font-medium text-gray-700 mb-2">
            Number of Buildings
          </label>
          <Input
            id="numberOfBuildings"
            type="number"
            placeholder="Total number of buildings"
            value={formData.numberOfBuildings}
            onChange={(e) => handleInputChange('numberOfBuildings', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Unit Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Unit Types Available *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {unitTypeOptions.map(unitType => (
              <label key={unitType} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.unitTypes.includes(unitType)}
                  onChange={() => handleUnitTypeToggle(unitType)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">{unitType}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6">
          <Button type="submit" className="px-8">
            {isEditMode ? 'Update Development' : 'Save & Continue'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default DevelopmentDescription
