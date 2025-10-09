import React, { useState, useEffect } from 'react'
import { Input } from '../../ui/input'

// Function to generate pricing preview text
const generatePricingPreview = (pricingData) => {
  const { price, currency, time, duration } = pricingData;
  
  // If no price entered, show placeholder
  if (!price || price === 0) {
    return "Enter a price to see preview";
  }
  
  // Format currency symbol
  const currencySymbol = currency === 'USD' ? '$' : '₵';
  
  // Format price with commas
  const formattedPrice = new Intl.NumberFormat().format(price);
  
  // Handle duration
  if (time && time > 0) {
    // If specific time is entered (e.g., "2 months")
    const timeText = time === 1 ? 
      duration.replace(/ly$/, '') : // Remove 'ly' for singular (1 month)
      duration.replace(/ly$/, 's'); // Remove 'ly' and add 's' for plural (2 months)
    
    return `${currencySymbol}${formattedPrice} ${currency} / ${time} ${timeText}`;
  } else if (duration) {
    // If no time entered but duration is selected (e.g., "monthly" -> "month")
    const durationText = duration.replace(/ly$/, ''); // Remove 'ly' for singular
    return `${currencySymbol}${formattedPrice} ${currency} / ${durationText}`;
  } else {
    // Fallback
    return `${currencySymbol}${formattedPrice} ${currency}`;
  }
};

const PropertyPricing = ({ formData, updateFormData, mode }) => {
  const [pricingData, setPricingData] = useState({
    price: '',
    currency: 'GHS', // Default to Ghana Cedis
    time: '', // Duration length (number)
    duration: 'monthly', // Duration type (hourly, daily, monthly, yearly)
    cancellation_policy: '',
    is_negotiable: false,
    security_requirements: '',
    flexible_terms: false
  })

  // Initialize with form data
  useEffect(() => {
    if (formData.pricing) {
      setPricingData(prev => ({
        ...prev,
        ...formData.pricing
      }));
    }
  }, [formData.pricing]);

  // Update pricing data when form data changes
  const handlePricingChange = (field, value) => {
    const updatedPricing = {
      ...pricingData,
      [field]: value
    };
    
    setPricingData(updatedPricing);
    updateFormData({
      pricing: updatedPricing
    });
  };


  return (
    <div className="w-full p-4 sm:p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Property Pricing</h2>
        <p className="text-sm sm:text-base text-gray-600">
          {mode === 'edit' ? 'Update the pricing information for this property' : 'Set the pricing for this property'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Price Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price *
          </label>
          <div className="flex space-x-2 items-end">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={pricingData.price || ''}
              onChange={(e) => handlePricingChange('price', parseFloat(e.target.value) || 0)}
              placeholder="Enter price"
              className="flex-1 !text-sm"
              required
            />
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Currency</label>
              <select
                value={pricingData.currency || 'GHS'}
                onChange={(e) => handlePricingChange('currency', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 !text-sm"
              >
                <option value="GHS">GHS (Cedis)</option>
                <option value="USD">USD (Dollars)</option>
              </select>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Enter the property price
          </p>
        </div>

        {/* Time Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration Length (Optional)
          </label>
          <div className="flex space-x-2 items-end">
            <Input
              type="number"
              min="0"
              value={pricingData.time || ''}
              onChange={(e) => handlePricingChange('time', parseInt(e.target.value) || 0)}
              placeholder="Enter duration length (optional)"
              className="flex-1 !text-sm"
            />
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Duration</label>
              <select
                value={pricingData.duration || 'monthly'}
                onChange={(e) => handlePricingChange('duration', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 !text-sm"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Enter how long the pricing applies for (leave empty for standard duration)
          </p>
        </div>
      </div>

      {/* Pricing Preview */}
      <div className="mt-4 sm:mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Pricing Preview</h3>
        <div className="text-lg font-semibold text-blue-800">
          {generatePricingPreview(pricingData)}
        </div>
      </div>


      {/* Additional Pricing Fields */}
      <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
        {/* Cancellation Policy */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cancellation Policy
          </label>
          <textarea
            value={pricingData.cancellation_policy || ''}
            onChange={(e) => handlePricingChange('cancellation_policy', e.target.value)}
            placeholder="Enter cancellation policy details..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <p className="text-sm text-gray-500 mt-1">
            Describe the cancellation terms and conditions
          </p>
        </div>

        {/* Security Requirements */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Security Requirements
          </label>
          <textarea
            value={pricingData.security_requirements || ''}
            onChange={(e) => handlePricingChange('security_requirements', e.target.value)}
            placeholder="Enter security requirements..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <p className="text-sm text-gray-500 mt-1">
            Specify any security deposits, references, or other requirements
          </p>
        </div>

        {/* Radio Button Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Negotiable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Is the price negotiable?
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="is_negotiable"
                  checked={pricingData.is_negotiable === true}
                  onChange={() => handlePricingChange('is_negotiable', true)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Yes, negotiable</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="is_negotiable"
                  checked={pricingData.is_negotiable === false}
                  onChange={() => handlePricingChange('is_negotiable', false)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">No, fixed price</span>
              </label>
            </div>
          </div>

          {/* Flexible Terms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Are terms flexible?
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="flexible_terms"
                  checked={pricingData.flexible_terms === true}
                  onChange={() => handlePricingChange('flexible_terms', true)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Yes, flexible</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="flexible_terms"
                  checked={pricingData.flexible_terms === false}
                  onChange={() => handlePricingChange('flexible_terms', false)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">No, standard terms</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertyPricing
