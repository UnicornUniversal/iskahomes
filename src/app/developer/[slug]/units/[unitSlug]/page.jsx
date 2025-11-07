"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import PropertyManagement from '@/app/components/propertyManagement/PropertyManagement'
import DeveloperNav from '@/app/components/developers/DeveloperNav'

const SingleUnitPage = ({ params }) => {
  const router = useRouter()
  const { unitSlug } = React.use(params)

  // Handle add new unit case
  if (unitSlug === 'addNewUnit') {
    return (
      <div className='flex-1 overflow-x-auto'>
      <PropertyManagement 
        slug="addNewUnit" 
        propertyId={null} 
        accountType="developer" 
      />
    </div>
    )
  }

  // Handle edit unit case
  if (unitSlug.endsWith('/edit')) {
    const unitId = unitSlug.replace('/edit', '')
    return (
      <div className='flex-1 overflow-x-auto'>
      <PropertyManagement 
        slug="editUnit" 
        propertyId={unitId} 
        accountType="developer" 
      />
    </div>
    )
  }

  // For regular unit viewing - show in edit mode
  return (
  
    
      <div className='flex-1 overflow-x-auto'>
        <PropertyManagement 
          slug="editUnit" 
          propertyId={unitSlug} 
          accountType="developer" 
        />
      </div>
 
  )
}

export default SingleUnitPage
