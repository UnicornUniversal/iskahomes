"use client"
import React from 'react'
import { Input } from '../../ui/input'
import DevelopmentSelector from '../modules/DevelopmentSelector'
import PropertyDescription from '../modules/PropertyDescription'

const BasicInfoStep = ({ formData, updateFormData, mode, accountType, developments, developmentsLoading, user }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="">Basic Information</h2>
        <p className="text-sm t">Enter the basic details about your property</p>
      </div>

      {/* Development Selection - Only for developers */}
      {accountType === 'developer' && (
        <div className="p-4 secondary_bg">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Development *
          </label>
          <DevelopmentSelector
            developments={developments}
            loading={developmentsLoading}
            selectedDevelopmentId={formData.development_id || ''}
            onSelect={(developmentId) => updateFormData({ development_id: developmentId || '' })}
            required
            developerId={user?.profile?.developer_id}
          />
        </div>
      )}

      {/* Description Section */}
      <PropertyDescription 
        formData={formData}
        updateFormData={updateFormData}
        isEditMode={mode === 'edit'}
        accountType={accountType}
      />

      <div className="p-4 secondary_bg">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Visibility</p>
            <p className="text-sm text-gray-500 mt-1">
              {formData.visibility !== false
                ? 'Visible on Iska Homes and partner property APIs when the listing is active.'
                : 'Non-Visible. Hidden from public pages and the partner properties API.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => updateFormData({ visibility: formData.visibility === false })}
            className="flex items-center gap-2 text-primary_color shrink-0"
          >
            <span
              className={`relative w-9 h-5 rounded-full transition-colors ${
                formData.visibility !== false ? 'bg-primary_color' : 'bg-primary_color/20'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                  formData.visibility !== false ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </span>
            <span className={formData.visibility !== false ? 'font-medium' : 'text-primary_color/60'}>
              {formData.visibility !== false ? 'Visible' : 'Non-Visible'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default BasicInfoStep

