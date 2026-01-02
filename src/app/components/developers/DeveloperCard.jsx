'use client'

import React from 'react'
import Link from 'next/link'
import { FiMapPin, FiHome, FiLayers } from 'react-icons/fi'
import { dynamic_images } from '@/app/components/Data/StaticData'

const DeveloperCard = ({ developer, index = 0 }) => {
  // Get dynamic image classes
  const configIndex = index % dynamic_images.length
  const imageClasses = dynamic_images[configIndex].imageClasses
  
  // Extract height classes from imageClasses, always use w-full for width
  const getImageHeightClasses = () => {
    if (!imageClasses) return 'h-[220px]'
    const classes = imageClasses.split(' ')
    const heightClasses = classes.filter(cls => cls.startsWith('h-'))
    return heightClasses.length > 0 ? heightClasses.join(' ') : 'h-[220px]'
  }

  // Parse cover image
  let coverImageUrl = null
  try {
    const coverImage = typeof developer.cover_image === 'string'
      ? JSON.parse(developer.cover_image)
      : developer.cover_image
    coverImageUrl = coverImage?.url || null
  } catch (e) {
    coverImageUrl = developer.cover_image?.url || developer.cover_image || null
  }

  // Parse profile image
  let profileImageUrl = null
  try {
    const profileImage = typeof developer.profile_image === 'string'
      ? JSON.parse(developer.profile_image)
      : developer.profile_image
    profileImageUrl = profileImage?.url || null
  } catch (e) {
    profileImageUrl = developer.profile_image?.url || developer.profile_image || null
  }

  // Get location from primary location in company_locations
  let location = null
  try {
    const companyLocations = typeof developer.company_locations === 'string'
      ? JSON.parse(developer.company_locations)
      : developer.company_locations

    if (Array.isArray(companyLocations) && companyLocations.length > 0) {
      const primaryLocation = companyLocations.find(loc => loc.primary_location === true)
      if (primaryLocation) {
        const parts = [primaryLocation.city, primaryLocation.region, primaryLocation.country].filter(Boolean)
        if (parts.length > 0) {
          location = parts.join(', ')
        }
      }
    }
  } catch (e) {
    // Continue to fallback
  }

  // Fallback to direct city/region/country fields
  if (!location) {
    const parts = [developer.city, developer.region, developer.country].filter(Boolean)
    if (parts.length > 0) {
      location = parts.join(', ')
    }
  }

  // Final fallback
  if (!location) {
    location = 'Location not specified'
  }

  return (
    <Link href={`/home/allDevelopers/${developer.slug}`} className="block">
      <div className="overflow-hidden transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group flex flex-col w-full">
        {/* Cover Image Section */}
        <div className={`relative overflow-hidden w-full ${getImageHeightClasses()}`}>
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={developer.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary_color opacity-50 to-secondary_color opacity-10 flex items-center justify-center">
              <div className="text-white text-4xl font-bold">
                {developer.name?.charAt(0) || 'D'}
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="mt-4">
          {/* Profile Image, Name and Location */}
          <div className="flex items-start gap-3 mb-3">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={developer.name}
                className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.style.display = 'none'
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-md bg-gray-200 flex items-center justify-center flex-shrink-0">
                <span className="text-primary_color text-lg font-bold">
                  {developer.name?.charAt(0) || 'D'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-primary_color mb-1">
                {developer.name || 'Developer'}
              </h3>
              <div className="flex items-center gap-2 text-sm text-primary_color">
                <FiMapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-primary_color">
            <div className="flex items-center gap-2">
              <FiLayers className="w-4 h-4" />
              <span>{developer.total_developments || 0} Developments</span>
            </div>
            <div className="flex items-center gap-2">
              <FiHome className="w-4 h-4" />
              <span>{developer.total_units || 0} Units</span>
            </div>
          </div>

          {/* Account Status */}
          {developer.account_status && (
            <div className="mt-3">
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                developer.account_status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : developer.account_status === 'approved'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {developer.account_status.charAt(0).toUpperCase() + developer.account_status.slice(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default DeveloperCard
