import React, { useState, useEffect } from 'react'

const PropertyAdditionalInfo = ({ formData, updateFormData, mode }) => {
  const [additionalInfo, setAdditionalInfo] = useState('')

  // Initialize with form data
  useEffect(() => {
    if (formData.additional_information) {
      setAdditionalInfo(formData.additional_information);
    }
  }, [formData.additional_information]);

  // Update additional information when form data changes
  const handleAdditionalInfoChange = (value) => {
    setAdditionalInfo(value);
    updateFormData({
      additional_information: value
    });
  };

  return (
    <div className="w-full py-4 ">
      {/* <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Additional Information</h2>
        <p className="text-sm sm:text-base text-gray-600">
          {mode === 'edit' ? 'Update any additional information about this property' : 'Add any additional information that potential buyers/renters should know about this property'}
        </p>
      </div> */}

      <div className="space-y-4 sm:space-y-6">
        {/* Additional Information Textarea */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Information
          </label>
          <textarea
            value={additionalInfo}
            onChange={(e) => handleAdditionalInfoChange(e.target.value)}
            placeholder="Enter any additional information, special notes, or important details about this property..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={6}
          />
          <p className="text-sm text-gray-500 mt-1">
            Include any special features, restrictions, neighborhood information, or other details that would be helpful for potential buyers or renters
          </p>
        </div>

        {/* Character Count */}
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Character count: {additionalInfo.length}</span>
          <span>Maximum recommended: 2000 characters</span>
        </div>

        {/* Guidelines */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-green-900 mb-2">Information Guidelines</h4>
          <ul className="text-xs text-green-800 space-y-1">
            <li>• Include special features or unique selling points</li>
            <li>• Mention any restrictions or limitations</li>
            <li>• Add neighborhood information or nearby amenities</li>
            <li>• Include any special instructions or requirements</li>
            <li>• Be honest and transparent about the property</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default PropertyAdditionalInfo
