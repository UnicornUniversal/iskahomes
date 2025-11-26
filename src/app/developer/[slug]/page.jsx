'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import DeveloperNav from '@/app/components/developers/DeveloperNav'

const DeveloperSlugPage = () => {
  const params = useParams()
  const developerId = params.slug

  return (
    <div className='normal_div template_body_bg'>
      <DeveloperNav active={0} />
      <div className='w-full flex flex-col gap-4 p-6'>
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Developer Dashboard</h1>
          <p className="text-gray-600 mb-6">Welcome to developer {developerId}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Quick Stats</h3>
              <p className="text-gray-600">Dashboard content will go here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeveloperSlugPage 