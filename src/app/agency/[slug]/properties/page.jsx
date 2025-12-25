'use client'

import React, { useState, useEffect } from 'react'
import { FiMapPin, FiEye, FiTrendingUp, FiLoader } from 'react-icons/fi'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'

export default function PropertiesPage() {
  const pathname = usePathname()
  const slug = pathname?.split('/')[2] || ''
  const { user } = useAuth()
  
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchProperties = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('agency_token')
        if (!token) {
          setError('Authentication required')
          return
        }

        const response = await fetch('/api/listings/by-user?page=1&limit=50', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch properties')
        }

        const result = await response.json()
        
        if (isMounted) {
          if (result.success) {
            setProperties(result.data || [])
          } else {
            setError(result.error || 'Failed to fetch properties')
          }
        }
      } catch (err) {
        console.error('Error fetching properties:', err)
        if (isMounted) {
          setError(err.message || 'Error loading properties')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchProperties()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  const formatLocation = (property) => {
    const parts = [property.city, property.state, property.country].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : property.full_address || property.location || 'Location not specified'
  }

  const getPropertyImage = (property) => {
    if (property.media && Array.isArray(property.media) && property.media.length > 0) {
      return property.media[0].url || property.media[0]
    }
    if (typeof property.media === 'string') {
      try {
        const parsed = JSON.parse(property.media)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].url || parsed[0]
        }
      } catch (e) {
        return property.media
      }
    }
    return '/placeholder-property.jpg'
  }

  return (
    <div className='w-full flex flex-col gap-6'>
      <div className='flex flex-col md:flex-row gap-4 justify-between items-start md:items-center'>
        <div>
          <h2 className='text-2xl font-bold text-primary_color mb-1'>Properties</h2>
          <p className='text-sm text-gray-600'>All properties managed by your agency</p>
        </div>
      </div>

      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <FiLoader className='w-6 h-6 animate-spin mr-2' />
          <span>Loading properties...</span>
        </div>
      ) : error ? (
        <div className='bg-red-50 border border-red-200 rounded-xl p-6 text-center'>
          <p className='text-red-600'>{error}</p>
        </div>
      ) : properties.length === 0 ? (
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center'>
          <p className='text-gray-600 mb-2'>No properties found</p>
          <p className='text-sm text-gray-500'>Start by adding your first property listing</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/agency/${slug}/properties/${property.slug || property.id}`}
              className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-primary_color/20 transition-all duration-300'
            >
              <div className='w-full h-48 bg-gray-200 overflow-hidden'>
                <img 
                  src={getPropertyImage(property)} 
                  alt={property.title}
                  className='w-full h-full object-cover'
                  onError={(e) => {
                    e.target.src = '/placeholder-property.jpg'
                  }}
                />
              </div>
              <div className='p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-2 line-clamp-2'>{property.title}</h3>
                <div className='flex items-center text-sm text-gray-600 mb-4'>
                  <FiMapPin className='w-4 h-4 mr-1 flex-shrink-0' />
                  <span className='truncate'>{formatLocation(property)}</span>
                </div>
                <div className='flex items-center justify-between pt-4 border-t border-gray-100'>
                  <div className='flex items-center gap-4 text-sm text-gray-600'>
                    <div className='flex items-center gap-1'>
                      <FiEye className='w-4 h-4' />
                      {property.total_views || 0}
                    </div>
                    <div className='flex items-center gap-1'>
                      <FiTrendingUp className='w-4 h-4' />
                      {property.total_leads || 0}
                    </div>
                  </div>
                  <p className='text-lg font-bold text-secondary_color'>
                    {formatCurrency(property.price, property.currency)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
