'use client'
import React from 'react'
import PropertyManagement from '@/app/components/propertyManagement/PropertyManagement'

const page = () => {
  return (
    <div>
        <PropertyManagement 
          slug="addNewUnit"
          accountType="developer"
        />
    </div>
  )
}

export default page
