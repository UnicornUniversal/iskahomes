"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PropertyManagement from '@/app/components/propertyManagement/PropertyManagement'
import AgentNav from '@/app/components/agents/AgentNav'
import AgentHeader from '@/app/components/agents/AgentHeader'

const SinglePropertyPage = ({ params }) => {
  const router = useRouter()
  const [propertySlug, setPropertySlug] = useState(null)
  
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = params instanceof Promise ? await params : params
      setPropertySlug(resolvedParams.propertySlug)
    }
    resolveParams()
  }, [params])
  
  // Don't render until params are resolved
  if (!propertySlug) {
    return <div>Loading...</div>
  }

  // Handle add new property case
  if (propertySlug === 'addNewProperty') {
    return (
      <div className='w-full normal_div'>
        <AgentNav active={2} />
        <div className='w-full flex flex-col gap-[2em]'>
          <AgentHeader />
          <div className='flex-1 overflow-x-auto'>
            <PropertyManagement 
              slug="addNewProperty" 
              propertyId={null} 
              accountType="agent" 
            />
          </div>
        </div>
      </div>
    )
  }

  // Handle edit property case
  if (propertySlug.endsWith('/edit')) {
    const propertyId = propertySlug.replace('/edit', '')
    return (
      <div className='w-full normal_div'>
        <AgentNav active={2} />
        <div className='w-full flex flex-col gap-[2em]'>
          <AgentHeader />
          <div className='flex-1 overflow-x-auto'>
            <PropertyManagement 
              slug="editProperty" 
              propertyId={propertyId} 
              accountType="agent" 
            />
          </div>
        </div>
      </div>
    )
  }

  // For regular property viewing - show in edit mode
  return (
    <div className='w-full normal_div'>
      <AgentNav active={2} />
      <div className='w-full flex flex-col gap-[2em]'>
        <AgentHeader />
        <div className='flex-1 overflow-x-auto'>
          <PropertyManagement 
            slug="editProperty" 
            propertyId={propertySlug} 
            accountType="agent" 
          />
        </div>
      </div>
    </div>
  )
}

export default SinglePropertyPage
