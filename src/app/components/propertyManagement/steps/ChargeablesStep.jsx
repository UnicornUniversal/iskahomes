'use client'

import React from 'react'
import PropertyChargeables from '../modules/PropertyChargeables'

const ChargeablesStep = ({ formData, updateFormData, mode }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="">Chargeables</h2>
        <p className="">
          {mode === 'edit'
            ? 'Review the recurring charges on this property and override amount or interval if needed'
            : 'Default chargeables are attached automatically. Override amount or interval for this property only'}
        </p>
      </div>

      <PropertyChargeables
        formData={formData}
        updateFormData={updateFormData}
      />
    </div>
  )
}

export default ChargeablesStep
