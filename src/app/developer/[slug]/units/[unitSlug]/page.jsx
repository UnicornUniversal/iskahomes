"use client"
import React from 'react'
import { units } from '@/app/components/Data/Data'
import { useRouter } from 'next/navigation'
import UnitComponent from '@/app/components/developers/units/UnitComponent'
import DeveloperNav from '@/app/components/developers/DeveloperNav'
const SingleUnitPage = ({ params }) => {
  const router = useRouter()
  const { unitSlug } = React.use(params)

  // Handle add new unit case
  if (unitSlug === 'addNewUnit') {
    return (
      <div className='normal_div w-full'>
        <DeveloperNav active={4} />
        <UnitComponent mode="add" />
      </div>
    )
  }

  // Handle edit unit case
  if (unitSlug.endsWith('/edit')) {
    const unitId = unitSlug.replace('/edit', '')
    const unit = units.find(u => u.id === unitId)
    if (!unit) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Unit Not Found</h1>
            <p className="text-gray-600 mb-4">The unit you're trying to edit doesn't exist.</p>
            <button 
              onClick={() => router.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      )
    }
    return <UnitComponent mode="edit" unit={unit} />
  }

  // For regular unit viewing, also render the UnitComponent in view mode
  const unit = units.find(u => u.id === unitSlug)
  if (!unit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unit Not Found</h1>
          <p className="text-gray-600 mb-4">The unit you're looking for doesn't exist.</p>
          <button 
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='flex'>
      <DeveloperNav active={4} />
      <UnitComponent mode="view" unit={unit} />
    </div>
  )
}

export default SingleUnitPage
