import React, { useState, useEffect, useMemo } from 'react'
import { Input } from '../../ui/input'
import countryToCurrencyCode from 'country-to-currency'

// Helper function to get currency from country code using country-to-currency package
// This directly uses the ISO country code from Google Places API
const getCurrencyFromCountryCode = (countryCode) => {
  if (!countryCode) return null
  
  // Use the country-to-currency package directly with ISO code
  return countryToCurrencyCode[countryCode.toUpperCase()] || null
}

// Function to generate pricing preview text
const generatePricingPreview = (pricingData) => {
  const { price, currency, time, duration, price_type } = pricingData;
  
  // If no price entered, show placeholder
  if (!price || price === 0) {
    return "Enter a price to see preview";
  }
  
  // Format currency symbol
  const currencySymbol = currency === 'USD' ? '$' : '₵';
  
  // Format price with commas
  const formattedPrice = new Intl.NumberFormat().format(price);
  
  // Check if this is a sale (no duration applicable)
  const isSale = price_type === 'sale';
  
  if (isSale) {
    // For sales, just show the price without duration
    return `${currencySymbol}${formattedPrice} ${currency}`;
  }
  
  // Handle duration for non-sale purposes
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

const PropertyPricing = ({ formData, updateFormData, mode, purposeData, companyLocations = [] }) => {
  // Get unique currencies from company_locations and always include local currency and USD
  const availableCurrencies = useMemo(() => {
    const currencies = new Map()
    const currencyOrder = [] // Track order: local currency first, then USD, then others
    
    // Add local currency from selected country using country code from Google Places (FIRST)
    // Use countryCode if available (from Google Places), fallback to country name
    const countryCode = formData.location?.countryCode || formData.location?.country
    if (countryCode) {
      // Use country code directly (from Google Places) or try to get from country name
      const localCurrencyCode = countryCode.length === 2 
        ? getCurrencyFromCountryCode(countryCode) // Direct ISO code from Google Places
        : null // If not a 2-letter code, it's a country name - skip (shouldn't happen if Google Places is used)
      
      if (localCurrencyCode) {
        // Get currency name from Intl API or use code as fallback
        try {
          const currencyName = new Intl.DisplayNames(['en'], { type: 'currency' }).of(localCurrencyCode)
          currencies.set(localCurrencyCode, currencyName || localCurrencyCode)
          currencyOrder.push(localCurrencyCode) // Add to order first
        } catch {
          currencies.set(localCurrencyCode, localCurrencyCode)
          currencyOrder.push(localCurrencyCode) // Add to order first
        }
      }
    }
    
    // Always include USD (SECOND)
    currencies.set('USD', 'US Dollar')
    currencyOrder.push('USD') // Add to order second
    
    // Add currencies from company locations (THIRD)
    companyLocations.forEach(loc => {
      if (loc.currency && loc.currency_name) {
        // Only add if not already added (avoid duplicates)
        if (!currencies.has(loc.currency)) {
          currencies.set(loc.currency, loc.currency_name)
          currencyOrder.push(loc.currency) // Add to order
        }
      }
    })
    
    // If no local currency was added, default to GHS as first
    if (currencyOrder.length === 1) { // Only USD
      currencies.set('GHS', 'Ghanaian Cedi')
      currencyOrder.unshift('GHS') // Add GHS as first
    }
    
    // Return in the correct order: local currency first, then USD, then others
    return currencyOrder.map(code => ({
      code,
      name: currencies.get(code) || code
    }))
  }, [companyLocations, formData.location?.countryCode, formData.location?.country])

  // Default currency (prioritize local currency from selected country)
  const defaultCurrency = useMemo(() => {
    // Get current pricing currency from formData if available
    if (formData.pricing?.currency) {
      return formData.pricing.currency
    }
    // Get local currency from country code (from Google Places)
    const countryCode = formData.location?.countryCode
    if (countryCode) {
      const localCurrency = getCurrencyFromCountryCode(countryCode)
      if (localCurrency) {
        return localCurrency
      }
    }
    // Fallback to first non-USD currency or GHS
    const localCurrency = availableCurrencies.find(c => c.code !== 'USD')
    return localCurrency?.code || availableCurrencies[0]?.code || 'GHS'
  }, [availableCurrencies, formData.pricing?.currency, formData.location?.countryCode])


  const [pricingData, setPricingData] = useState({
    price: '',
    currency: defaultCurrency,
    time: 1, // Duration length (number) - default to 1
    duration: 'monthly', // Duration type (monthly, yearly)
    price_type: 'rent', // rent, lease, or sale
    ideal_duration: '', // For rent/lease: ideal duration number
    time_span: 'months', // For rent/lease: months or years
    estimated_revenue: '', // Calculated: price * ideal_duration (in listing currency - same as pricing.currency)
    cancellation_policy: '',
    is_negotiable: false,
    security_requirements: '',
    flexible_terms: false
  })

  // Local state for time input to allow free typing
  const [timeInputValue, setTimeInputValue] = useState(String(pricingData.time || 1))

  // Initialize with form data
  useEffect(() => {
    if (formData.pricing) {
      const timeValue = formData.pricing.time && formData.pricing.time > 0 ? formData.pricing.time : 1;
      // Extract estimated_revenue - handle both string and object formats
      let estimatedRevenueValue = formData.pricing.estimated_revenue || ''
      if (typeof estimatedRevenueValue === 'object' && estimatedRevenueValue !== null) {
        // If it's an object, extract the value
        estimatedRevenueValue = estimatedRevenueValue.estimated_revenue || estimatedRevenueValue.price || ''
      }
      
      // If no estimated_revenue from formData, calculate it based on current pricing
      let finalEstimatedRevenue = estimatedRevenueValue
      if (!finalEstimatedRevenue && formData.pricing.price) {
        if (formData.pricing.price_type === 'sale') {
          finalEstimatedRevenue = String(parseFloat(formData.pricing.price) || 0)
        } else if ((formData.pricing.price_type === 'rent' || formData.pricing.price_type === 'lease') &&
                   formData.pricing.ideal_duration && formData.pricing.time_span) {
          const price = parseFloat(formData.pricing.price) || 0
          const duration = parseFloat(formData.pricing.ideal_duration) || 0
          const multiplier = formData.pricing.time_span === 'years' ? 12 : 1
          finalEstimatedRevenue = String((price * duration * multiplier).toFixed(2))
        }
      }
      
      setPricingData(prev => ({
        ...prev,
        ...formData.pricing,
        // Ensure currency is from available currencies
        currency: formData.pricing.currency && availableCurrencies.some(c => c.code === formData.pricing.currency)
          ? formData.pricing.currency
          : defaultCurrency,
        // Default time to 1 if not set or is 0/empty
        time: timeValue,
        // Use extracted or calculated estimated_revenue value (in listing currency - same as pricing.currency)
        estimated_revenue: String(finalEstimatedRevenue || '')
      }))
      // Also update the local input state
      setTimeInputValue(String(timeValue));
    }
  }, [formData.pricing, availableCurrencies, defaultCurrency]);

  // Calculate estimated_revenue when price, ideal_duration, or time_span changes
  useEffect(() => {
    // Skip if we don't have the necessary data yet
    if (!pricingData.price || pricingData.price === '' || pricingData.price === '0') {
      return
    }
    
    if (pricingData.price_type === 'sale' && pricingData.price) {
      // For sale, estimated revenue is just the sale price (in listing currency)
      const price = parseFloat(pricingData.price) || 0
      const currentEstimatedRevenue = parseFloat(pricingData.estimated_revenue) || 0
      if (Math.abs(price - currentEstimatedRevenue) > 0.01) { // Only update if significantly different
        const newEstimatedRevenue = price.toFixed(2)
        setPricingData(prev => ({
          ...prev,
          estimated_revenue: newEstimatedRevenue // Store in listing currency (same as pricing.currency)
        }))
        // Update formData via handlePricingChange to trigger update
        handlePricingChange('estimated_revenue', newEstimatedRevenue)
      }
    } else if ((pricingData.price_type === 'rent' || pricingData.price_type === 'lease') &&
        pricingData.price && 
        pricingData.ideal_duration && 
        pricingData.time_span) {
      const price = parseFloat(pricingData.price) || 0
      const duration = parseFloat(pricingData.ideal_duration) || 0
      let multiplier = 1
      
      // Convert to months for calculation
      if (pricingData.time_span === 'years') {
        multiplier = 12 // Convert years to months
      }
      
      const estimatedRevenue = price * duration * multiplier
      const currentEstimatedRevenue = parseFloat(pricingData.estimated_revenue) || 0
      if (Math.abs(estimatedRevenue - currentEstimatedRevenue) > 0.01) { // Only update if significantly different
        const newEstimatedRevenue = estimatedRevenue.toFixed(2)
        setPricingData(prev => ({
          ...prev,
          estimated_revenue: newEstimatedRevenue // Store in listing currency (same as pricing.currency)
        }))
        // Update formData via handlePricingChange to trigger update
        handlePricingChange('estimated_revenue', newEstimatedRevenue)
      }
    } else if (!pricingData.price) {
      // Clear estimated revenue if no price
      if (pricingData.estimated_revenue !== '') {
        setPricingData(prev => ({
          ...prev,
          estimated_revenue: ''
        }))
        handlePricingChange('estimated_revenue', '')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricingData.price, pricingData.ideal_duration, pricingData.time_span, pricingData.price_type, pricingData.currency]);

  // Update price_type based on purpose
  useEffect(() => {
    if (purposeData && purposeData.name) {
      const purposeName = purposeData.name.toLowerCase();
      let newPriceType;
      
      if (purposeName === 'sale') {
        newPriceType = 'sale';
      } else if (purposeName === 'lease') {
        newPriceType = 'lease';
      } else {
        newPriceType = 'rent';
      }
      
      if (pricingData.price_type !== newPriceType) {
        handlePricingChange('price_type', newPriceType);
      }
    }
  }, [purposeData]);

  // Update pricing data when form data changes
  const handlePricingChange = (field, value) => {
    const updatedPricing = {
      ...pricingData,
      [field]: value
    };
    
    // Recalculate estimated_revenue if relevant fields change
    if (updatedPricing.price_type === 'sale' && updatedPricing.price) {
      // For sale, estimated revenue is just the sale price
      updatedPricing.estimated_revenue = parseFloat(updatedPricing.price || 0).toFixed(2)
    } else if ((field === 'price' || field === 'ideal_duration' || field === 'time_span' || field === 'price_type') &&
        (updatedPricing.price_type === 'rent' || updatedPricing.price_type === 'lease') &&
        updatedPricing.price && 
        updatedPricing.ideal_duration && 
        updatedPricing.time_span) {
      const price = parseFloat(updatedPricing.price) || 0
      const duration = parseFloat(updatedPricing.ideal_duration) || 0
      let multiplier = 1
      
      if (updatedPricing.time_span === 'years') {
        multiplier = 12
      }
      
      updatedPricing.estimated_revenue = (price * duration * multiplier).toFixed(2)
    } else if (!updatedPricing.price) {
      updatedPricing.estimated_revenue = ''
    }
    
    setPricingData(updatedPricing);
    updateFormData({
      pricing: updatedPricing
    });
  };

  // Auto-update currency when country code changes
  useEffect(() => {
    const countryCode = formData.location?.countryCode
    const currentCurrency = pricingData.currency
    
    if (countryCode) {
      const localCurrency = getCurrencyFromCountryCode(countryCode)
      
      if (localCurrency) {
        // Auto-update currency if:
        // 1. No currency is set yet, OR
        // 2. Current currency doesn't match the country's currency (and not USD)
        if (!currentCurrency || (currentCurrency !== localCurrency && currentCurrency !== 'USD')) {
          handlePricingChange('currency', localCurrency)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.location?.countryCode])


  return (
    <div className="w-full p-4 sm:p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Property Pricing & Availability</h2>
        <p className="text-sm sm:text-base text-gray-600">
          {mode === 'edit' ? 'Update the pricing and availability information for this property' : 'Set the pricing details and availability for this property'}
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
              <label className="text-xs text-gray-500 mb-1">Currency *</label>
              <select
                suppressHydrationWarning
                value={pricingData.currency || defaultCurrency}
                onChange={(e) => handlePricingChange('currency', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 !text-sm"
                required
              >
                {availableCurrencies.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} ({curr.name})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Enter the property price
          </p>
        </div>

        {/* Time Input - Only show if price_type is not "sale" */}
        {pricingData.price_type !== 'sale' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration Length *
            </label>
            <div className="flex space-x-2 items-end">
              <Input
                type="number"
                min="1"
                value={timeInputValue}
                onChange={(e) => {
                  // Allow completely free typing - just update local state
                  const inputValue = e.target.value;
                  setTimeInputValue(inputValue);
                }}
                onBlur={(e) => {
                  // Only validate and default to 1 when field loses focus
                  const inputValue = e.target.value;
                  const numValue = Number(inputValue);
                  
                  let finalValue = 1;
                  if (inputValue !== '' && !isNaN(numValue) && numValue >= 1) {
                    finalValue = Math.floor(numValue);
                  }
                  
                  // Update both local state and pricing data
                  setTimeInputValue(String(finalValue));
                  handlePricingChange('time', finalValue);
                }}
                placeholder="Enter duration length"
                className="flex-1 !text-sm"
                required
              />
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Duration *</label>
                <select
                  suppressHydrationWarning
                  value={pricingData.duration || 'monthly'}
                  onChange={(e) => handlePricingChange('duration', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 !text-sm"
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Enter how long the pricing applies for (defaults to 1)
            </p>
          </div>
        )}
      </div>

      {/* Pricing Preview */}
      <div className="mt-4 sm:mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-blue-900">Pricing Preview</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            pricingData.price_type === 'sale' 
              ? 'bg-green-100 text-green-800' 
              : pricingData.price_type === 'lease'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {pricingData.price_type === 'sale' ? 'For Sale' : 
             pricingData.price_type === 'lease' ? 'For Lease' : 'For Rent'}
          </span>
        </div>
        <div className="text-lg font-semibold text-blue-800">
          {generatePricingPreview(pricingData)}
        </div>
      </div>

      {/* Ideal Duration & Estimated Revenue - Different for Sale vs Rent/Lease */}
      {pricingData.price_type === 'sale' ? (
        <div className="mt-4 sm:mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Revenue (Sale Price) *
              </label>
              <Input
                type="text"
                value={pricingData.estimated_revenue 
                  ? `${pricingData.currency} ${parseFloat(pricingData.estimated_revenue || 0).toLocaleString()}` 
                  : ''}
                placeholder="Auto-calculated from sale price"
                className="w-full !text-sm bg-gray-50"
                readOnly
                disabled
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Total sale price (one-time payment) in {pricingData.currency}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ideal Duration *
            </label>
            <Input
              type="number"
              min="1"
              value={pricingData.ideal_duration || ''}
              onChange={(e) => handlePricingChange('ideal_duration', parseInt(e.target.value) || '')}
              placeholder="e.g., 12"
              className="w-full !text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Expected rental/lease duration
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Span *
            </label>
            <select
              suppressHydrationWarning
              value={pricingData.time_span || 'months'}
              onChange={(e) => handlePricingChange('time_span', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 !text-sm"
              required
            >
              <option value="months">Months</option>
              <option value="years">Years</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Duration unit
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Revenue (Auto-calculated) *
            </label>
            <Input
              type="text"
              value={pricingData.estimated_revenue 
                ? `${pricingData.currency} ${parseFloat(pricingData.estimated_revenue || 0).toLocaleString()}` 
                : ''}
              placeholder="Auto-calculated"
              className="w-full !text-sm bg-gray-50"
              readOnly
              disabled
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Price × Ideal Duration (in {pricingData.currency})
            </p>
          </div>
        </div>
      )}

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

      {/* Availability Section */}
      <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-200">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Availability</h3>
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
                Available From
              </label>
              <Input
                type="date"
                value={formData.availability?.available_from || ''}
                onChange={(e) => updateFormData({
                  availability: {
                    ...formData.availability,
                    available_from: e.target.value
                  }
                })}
                className="w-full"
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
                value={formData.availability?.available_until || ''}
                onChange={(e) => updateFormData({
                  availability: {
                    ...formData.availability,
                    available_until: e.target.value
                  }
                })}
                className="w-full"
                min={formData.availability?.available_from || ''}
              />
              <p className="text-sm text-gray-500 mt-1">
                When will this property no longer be available? (Leave empty for indefinite availability)
              </p>
            </div>
          </div>

          {/* Acquisition Rules */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Acquisition Rules
            </label>
            <textarea
              value={formData.availability?.acquisition_rules || ''}
              onChange={(e) => updateFormData({
                availability: {
                  ...formData.availability,
                  acquisition_rules: e.target.value
                }
              })}
              placeholder="Enter acquisition rules and requirements..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
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
    </div>
  )
}

export default PropertyPricing
