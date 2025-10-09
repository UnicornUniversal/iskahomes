import React, { useState, useEffect } from 'react'
import { Input } from '../../ui/input'

const PropertyAvailability = ({ formData, updateFormData, mode }) => {
  const [availabilityData, setAvailabilityData] = useState({
    available_from: '',
    available_until: '',
    acquisition_rules: ''
  })

  // Initialize with form data
  useEffect(() => {
    if (formData.availability) {
      setAvailabilityData(prev => ({
        ...prev,
        ...formData.availability
      }));
    }
  }, [formData.availability]);

  // Update availability data when form data changes
  const handleAvailabilityChange = (field, value) => {
    const updatedAvailability = {
      ...availabilityData,
      [field]: value
    };
    
    setAvailabilityData(updatedAvailability);
    updateFormData({
      availability: updatedAvailability
    });
  };

  return (
    <div className="w-full p-4 sm:p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Property Availability</h2>
        <p className="text-sm sm:text-base text-gray-600">
          {mode === 'edit' ? 'Update the availability information for this property' : 'Set the availability dates and rules for this property'}
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Date Fields - Side by side on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Available From Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available From *
            </label>
            <Input
              type="date"
              value={availabilityData.available_from || ''}
              onChange={(e) => handleAvailabilityChange('available_from', e.target.value)}
              className="w-full"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              When will this property become available?
            </p>
          </div>

          {/* Available Until Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Until
            </label>
            <Input
              type="date"
              value={availabilityData.available_until || ''}
              onChange={(e) => handleAvailabilityChange('available_until', e.target.value)}
              className="w-full"
              min={availabilityData.available_from || ''}
            />
            <p className="text-sm text-gray-500 mt-1">
              When will this property no longer be available? (Leave empty for indefinite availability)
            </p>
          </div>
        </div>

        {/* Acquisition Rules */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Acquisition Rules *
          </label>
          <textarea
            value={availabilityData.acquisition_rules || ''}
            onChange={(e) => handleAvailabilityChange('acquisition_rules', e.target.value)}
            placeholder="Enter acquisition rules and requirements..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Specify any rules, requirements, or conditions that potential buyers/renters should know about acquiring this property
          </p>
        </div>

        {/* Availability Guidelines */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Availability Guidelines</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Set realistic availability dates based on your property timeline</li>
            <li>• Include any special conditions or requirements in acquisition rules</li>
            <li>• Be clear about any restrictions or limitations</li>
            <li>• Update availability dates as your property status changes</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default PropertyAvailability
