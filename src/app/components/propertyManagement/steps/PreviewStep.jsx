"use client"
import React from 'react'
import ViewProperty from '../ViewProperty'
import { CheckCircle2, AlertCircle } from 'lucide-react'

const PreviewStep = ({ formData, accountType, onFinalize }) => {
  // Check if all required fields are filled
  const checkCompleteness = () => {
    const required = {
      'Basic Info': !!(formData?.title && formData?.description),
      'Categories': !!(formData?.purposes?.length > 0 && formData?.types?.length > 0 && formData?.categories?.length > 0),
      'Location': !!(formData?.location?.country && formData?.location?.city),
      'Pricing': !!(formData?.pricing?.price && formData?.pricing?.currency)
    }

    const missing = Object.entries(required).filter(([_, filled]) => !filled).map(([step]) => step)
    return { required, missing, isComplete: missing.length === 0 }
  }

  const { missing, isComplete } = checkCompleteness()

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          {isComplete ? (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
              Ready to Publish
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
              Review Required
            </>
          )}
        </h3>
        {isComplete ? (
          <p className="text-blue-800">
            All required information has been provided. You can finalize and publish your listing.
          </p>
        ) : (
          <div>
            <p className="text-blue-800 mb-2">Please complete the following sections before finalizing:</p>
            <ul className="list-disc list-inside text-blue-800 space-y-1">
              {missing.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ViewProperty formData={formData} accountType={accountType} />

      {onFinalize && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
          <button
            onClick={onFinalize}
            disabled={!isComplete}
            className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${
              isComplete
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isComplete ? 'Finalize and Publish Listing' : 'Complete Required Sections First'}
          </button>
        </div>
      )}
    </div>
  )
}

export default PreviewStep

