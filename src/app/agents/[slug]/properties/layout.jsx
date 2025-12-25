'use client'

import React from 'react'
import PropertyNav from '@/app/components/Listing/PropertyNav'

const PropertiesLayout = ({ children }) => {
  return (
    <div>
      <PropertyNav />
      {children}
    </div>
  )
}

export default PropertiesLayout

