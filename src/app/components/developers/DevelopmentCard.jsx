'use client'
import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const DevelopmentCard = ({ development }) => {
  const params = useParams()

  // Get the first available image
  const getDisplayImage = () => {
    // Try banner first
    if (development.banner?.url) {
      return development.banner.url
    }
    // Try first media file
    if (development.media_files && development.media_files.length > 0 && development.media_files[0]?.url) {
      return development.media_files[0].url
    }
    // Return null if no image available (don't use placeholder)
    return null
  }

  // Get unit type names from the database unit types
  const getUnitTypeNames = () => {
    if (development.unit_types?.database && Array.isArray(development.unit_types.database)) {
      return development.unit_types.database.map(unit => unit.name).slice(0, 3) // Show max 3
    }
    return []
  }

  return (
    <div className='bg-white rounded-lg border border-black overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer'>
      <Link href={`/developer/${params.slug}/developments/${development?.id}`}>
        <div className='flex flex-col px-2 sm:flex-row'>
          {/* Development Image */}
          <div className='relative w-full my-auto self-center sm:w-48 md:w-56 lg:w-64 h-48 sm:h-full flex-shrink-0'>
            {getDisplayImage() ? (
              <img 
                src={getDisplayImage()} 
                alt={development.title || 'Development'}
                className='w-full h-full object-cover sm:rounded-l-lg'
                onError={(e) => {
                  // Hide image on error instead of trying another URL
                  e.target.style.display = 'none'
                }}
              />
            ) : (
              <div className='w-full h-full bg-gray-200 flex items-center justify-center sm:rounded-l-lg'>
                <div className='text-gray-500 text-center'>
                  <svg className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <p className='text-xs sm:text-sm'>No Image</p>
                </div>
              </div>
            )}
          </div>

          {/* Development Info */}
          <div className='flex-1 p-4 sm:p-6 flex flex-col justify-between'>
            {/* Top Row - Status and Views */}
            <div className='flex justify-between items-start mb-3 sm:mb-4'>
              {development.status && (
                <div className='bg-black text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium'>
                  {development.status.charAt(0).toUpperCase() + development.status.slice(1)}
                </div>
              )}
              <div className='flex items-center text-gray-600 text-xs sm:text-sm'>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className='hidden sm:inline'>2,000,400 views</span>
                <span className='sm:hidden'>2M views</span>
              </div>
            </div>

            {/* Title */}
            <h3 className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2'>
              {development.title || 'Untitled Development'}
            </h3>

            {/* Location */}
            {(development.city || development.state || development.country) && (
              <div className='flex items-center text-gray-600 mb-3 sm:mb-4'>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className='text-xs sm:text-sm line-clamp-1'>
                  {[development.town, development.city, development.state, development.country]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}

            {/* Separator Line */}
            <div className='flex items-center mb-3 sm:mb-4'>
              <div className='flex-1 h-px bg-gray-400'></div>
              <div className='w-1.5 sm:w-2 h-1.5 sm:h-2 bg-black rounded-full ml-1 sm:ml-2'></div>
            </div>

            {/* Development Details */}
            <div className='flex flex-wrap items-between justify-between   md:grid sm:grid-cols-3 gap-3 sm:gap-6 mb-3 sm:mb-4'>
              <div>
                <div className='text-gray-600 text-xs sm:text-sm mb-1'>Sizes:</div>
                <div className='text-gray-900 font-medium text-sm sm:text-base'>
                  {development.size || 'Not specified'}
                </div>
              </div>
              <div>
                <div className='text-gray-600 text-xs sm:text-sm mb-1'>Buildings:</div>
                <div className='text-gray-900 font-medium text-sm sm:text-base'>
                  {development.number_of_buildings || '1'}
                </div>
              </div>
              <div>
                <div className='text-gray-600 text-xs sm:text-sm mb-1'>Total Units:</div>
                <div className='text-gray-900 font-medium text-sm sm:text-base'>
                  {development.total_units || '1'}
                </div>
              </div>
            </div>

            {/* Unit Types */}
            {getUnitTypeNames().length > 0 && (
              <div className='p-3 sm:p-4 bg-[rgba(0,0,0,0.02)] rounded-lg'>
                <div className='text-gray-600 text-xs mb-2'>Unit Types:</div>
                <div className='flex flex-wrap gap-1 sm:gap-2'>
                  {getUnitTypeNames().map((type, index) => (
                    <span key={index} className='bg-black text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium'>
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}

export default DevelopmentCard
