"use client"
import React, { useState, useEffect } from 'react'
import PropertyManagement from '@/app/components/propertyManagement/PropertyManagement'

const SingleUnitPageContent = ({ unitSlug }) => {
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
  if (unitSlug?.endsWith('/edit')) {
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

const SingleUnitPage = ({ params }) => {
  const [unitSlug, setUnitSlug] = useState(null)
  
  useEffect(() => {
    const resolveParams = async () => {
      try {
        // Handle params as Promise or direct value
        const resolvedParams = params instanceof Promise ? await params : params
        setUnitSlug(resolvedParams?.unitSlug || null)
      } catch (error) {
        console.error('Error resolving params:', error)
        setUnitSlug(null)
      }
    }
    resolveParams()
  }, [params])
  
  // Don't render until params are resolved
  if (!unitSlug) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary_color"></div>
      </div>
    )
  }

  return <SingleUnitPageContent unitSlug={unitSlug} />
}

export default SingleUnitPage
