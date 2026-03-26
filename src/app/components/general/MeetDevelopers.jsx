'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, MapPin } from 'lucide-react'

const parseImageUrl = (imageValue) => {
  if (!imageValue) return null

  if (typeof imageValue === 'object') {
    return imageValue?.url || null
  }

  if (typeof imageValue === 'string') {
    try {
      const parsed = JSON.parse(imageValue)
      return parsed?.url || parsed || null
    } catch (error) {
      return imageValue.startsWith('http') ? imageValue : null
    }
  }

  return null
}

const getDeveloperLocation = (developer) => {
  try {
    const companyLocations = typeof developer.company_locations === 'string'
      ? JSON.parse(developer.company_locations)
      : developer.company_locations

    if (Array.isArray(companyLocations) && companyLocations.length > 0) {
      const primaryLocation = companyLocations.find(location =>
        location.primary_location === true ||
        location.primary_location === 'true' ||
        location.primary_location === 1
      )

      if (primaryLocation) {
        const parts = [primaryLocation.city, primaryLocation.region, primaryLocation.country].filter(Boolean)
        if (parts.length > 0) {
          return parts.join(', ')
        }
      }
    }
  } catch (error) {
    // Fall through to direct fields.
  }

  const fallbackParts = [developer.city, developer.region, developer.country].filter(Boolean)
  return fallbackParts.length > 0 ? fallbackParts.join(', ') : 'Location not specified'
}

const MeetDevelopers = () => {
  const [developers, setDevelopers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedDevelopers = async () => {
      try {
        const response = await fetch('/api/developers?limit=4&featured=true')
        const result = await response.json()

        if (result.success) {
          setDevelopers(result.data || [])
        }
      } catch (error) {
        console.error('Error fetching featured developers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedDevelopers()
  }, [])

  if (loading) {
    return (
      <section className="w-full px-4 md:px-8 py-14">
        <div className="border-t border-primary_color/20 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-56 bg-primary_color/10 mb-4" />
                <div className="h-5 bg-primary_color/10 w-2/3 mb-3" />
                <div className="h-4 bg-primary_color/10 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (developers.length === 0) {
    return null
  }

  return (
    <section className="w-full px-4 md:px-8 py-14">
      <div className="border-t border-primary_color/20 pt-8">
        <div className="flex items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-primary_color/60 mb-2">
              Featured Developers
            </p>
            <h2 className="text-3xl md:text-5xl text-primary_color">
              Meet developers building with intent.
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {developers.map((developer) => {
            const coverImageUrl = parseImageUrl(developer.cover_image)
            const location = getDeveloperLocation(developer)

            return (
              <Link
                key={developer.slug}
                href={`/home/allDevelopers/${developer.slug}`}
                className="group block border border-primary_color/10 bg-white hover:border-primary_color/30 transition-colors"
              >
                <div className="relative h-60 overflow-hidden bg-primary_color/5">
                  {coverImageUrl ? (
                    <img
                      src={coverImageUrl}
                      alt={developer.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary_color/10 flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-primary_color/50" />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-xl text-primary_color mb-2 line-clamp-2">
                    {developer.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-primary_color/75 mb-4">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="line-clamp-1">{location}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-primary_color/80">
                    <span>{developer.total_developments || 0} developments</span>
                    <span>{developer.total_units || 0} units</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default MeetDevelopers
