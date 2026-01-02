'use client'

import React from 'react'
import PropertyNav from '@/app/components/Listing/PropertyNav'

const PropertiesLayout = ({ children }) => {
  return (
    <div className='w-full flex flex-col gap-4'>
      <PropertyNav />
      {children}
    </div>
  )
}

export default PropertiesLayout

