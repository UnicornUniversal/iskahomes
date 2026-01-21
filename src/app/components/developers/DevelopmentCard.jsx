'use client'
import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const DevelopmentCard = ({ development, viewMode = 'list' }) => {
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

  // Format views number
  const formatViews = (views) => {
    if (!views) return '0 views'
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`
    }
    return `${views.toLocaleString()} views`
  }

  // Format revenue
  const formatRevenue = (revenue, currency = 'GHS') => {
    if (!revenue && revenue !== 0) return `${currency} 0.000`
    return `${currency} ${revenue.toLocaleString()}`
  }

  // Determine layout based on viewMode
  const isGrid = viewMode === 'grid'
  const isList = viewMode === 'list'

  return (
    <Link href={`/developer/${params.slug}/developments/${development?.slug || development?.id}`}>
      <div className='rounded-lg border border-primary_color text-primary_color overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full flex flex-col '>
        <div className={`flex ${isGrid ? 'flex-col' : 'flex-col md:flex-row'} h-full`}>
          {/* Development Image */}
          <div className={`relative flex-shrink-0 overflow-hidden ${
            isGrid 
              ? 'w-full h-48 md:h-64' 
              : 'w-full md:w-80 lg:w-96 h-48 md:h-auto md:max-h-[300px]'
          }`}>
            {getDisplayImage() ? (
              <img 
                src={getDisplayImage()} 
                alt={development.title || 'Development'}
                className='w-full h-full object-cover'
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            ) : (
              <div className='w-full h-full bg-gray-200 flex items-center justify-center'>
                <div className='text-center'>
                  <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <p className='text-sm'>No Image</p>
                </div>
              </div>
            )}
          </div>

          {/* Development Info */}
          <div className='flex-1 p-4 md:p-6 flex flex-col'>
            {/* Top Row - Status and Views */}
            <div className='flex flex-wrap justify-between items-start gap-2 mb-3'>
              {development.status && (
                <div className='bg-primary_color text-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium'>
                  {development.status.charAt(0).toUpperCase() + development.status.slice(1)}
                </div>
              )}
              <div className='flex items-center text-xs sm:text-sm'>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{formatViews(development.total_views)}</span>
              </div>
            </div>

            {/* Title */}
            <h3 className='text-xl lg:text-2xl font-bold mb-2 line-clamp-2'>
              {development.title || 'Untitled Development'}
            </h3>

            {/* Location */}
            {(development.city || development.state || development.country) && (
              <div className='flex items-center mb-4'>
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className='text-sm line-clamp-1'>
                  {[development.town, development.city, development.state, development.country]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}

            {/* Separator Line */}
            <div className='flex items-center mb-4'>
              <div className='flex-1 h-px bg-gray-400'></div>
              <div className='w-2 h-2 bg-primary_color rounded-full ml-2'></div>
            </div>

            {/* Development Details - Flex Wrap */}
            <div className='w-full flex flex-wrap justify-between gap-4'>
              <div>
                <div className='text-xs mb-1'>Total Units</div>
                <p className='font-medium text-sm'>
                  {development.total_units !== null && development.total_units !== undefined 
                    ? development.total_units 
                    : 'No units available'}
                </p>
              </div>
              <div>
                <div className='text-xs mb-1'>Estimated Revenue</div>
                <p className='font-medium text-sm'>
                  {formatRevenue(development.estimated_revenue || development.revenue || development.total_revenue || development.revenue_generated, development.currency)}
                </p>
              </div>
              <div>
                <div className='text-xs mb-1'>Revenue</div>
                <p className='font-medium text-sm'>
                  {formatRevenue(development.revenue || development.total_revenue || development.revenue_generated, development.currency)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default DevelopmentCard
