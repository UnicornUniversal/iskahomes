'use client'
import React from 'react'
import Link from 'next/link'

const DevelopmentCard = ({ development }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'ongoing':
        return 'bg-blue-100 text-blue-800'
      case 'inDevelopment':
        return 'bg-yellow-100 text-yellow-800'
      case 'rtc':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300'>
      {/* Development Image */}
      <div className='relative mb-4'>
        <img 
          src={development.projectImages[0]} 
          alt={development.title}
          className='w-full h-48 object-cover rounded-lg'
        />
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold z-10 shadow-sm ${getStatusColor(development.status)}`}>
          {development.status.charAt(0).toUpperCase() + development.status.slice(1)}
        </div>
      </div>

      {/* Development Info */}
      <Link href={`/developer/${development?.developerId}/developments/${development?.id}`}>
      <div className='space-y-3'>
        <h3 className='text-xl font-bold text-gray-900'>{development.title}</h3>
        {/* <p className='text-sm text-gray-600 line-clamp-2'>{development.description}</p> */}
        
        {/* Location */}
        <div className='flex items-center text-sm text-gray-500'>
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          {development.location.city}, {development.location.state}
        </div>

        {/* Development Details */}
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <span className='text-gray-500'>Type:</span>
            <span className='ml-1 font-medium'>{development.developmentType}</span>
          </div>
          <div>
            <span className='text-gray-500'>Size:</span>
            <span className='ml-1 font-medium'>{development.size}</span>
          </div>
          <div>
            <span className='text-gray-500'>Buildings:</span>
            <span className='ml-1 font-medium'>{development.numberOfBuildings}</span>
          </div>
          <div>
            <span className='text-gray-500'>Total Units:</span>
            <span className='ml-1 font-medium'>{development.total_units}</span>
          </div>
        </div>

        {/* Unit Types */}
        <div>
          <span className='text-sm text-gray-500'>Unit Types:</span>
          <div className='flex flex-wrap gap-1 mt-1'>
            {development.unitTypes.map((type, index) => (
              <span key={index} className='px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full'>
                {type}
              </span>
            ))}
          </div>
        </div>

        {/* Developer Info */}
        {/* <div className='pt-2 border-t border-gray-200'>
          <span className='text-sm text-gray-500'>Developer:</span>
          <span className='ml-1 text-sm font-medium'>{development.additionalInfo.developer}</span>
        </div> */}
      </div>
      </Link>
    </div>
  )
}

export default DevelopmentCard
