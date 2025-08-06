"use client"
import React from 'react'
import AgentNav from '@/app/components/agents/AgentNav'
import AgentHeader from '@/app/components/agents/AgentHeader'
import Property from '@/app/components/agents/Property'
import { useParams } from 'next/navigation'

const page = () => {
  const { propertySlug } = useParams()
  
  return (
    <div className='w-full normal_div'>
      <AgentNav active={2} />
      <div className='w-full flex flex-col gap-[2em]'>
        <AgentHeader />
        <Property propertySlug={propertySlug} />
      </div>
    </div>
  )
}

export default page
