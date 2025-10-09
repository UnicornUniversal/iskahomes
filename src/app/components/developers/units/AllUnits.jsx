"use client"
import React, { useState, useEffect } from 'react'
import UnitCard from '@/app/components/developers/units/UnitCard'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'

const AllUnits = () => {
  const router = useRouter()
  const { user } = useAuth()
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Get developer ID from user profile or URL params
  const developerId = user?.profile?.developer_id

  useEffect(() => {
    if (developerId) {
      fetchUnits()
    }
  }, [developerId])

  const fetchUnits = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('developer_token')
      
      if (!token) {
        setError('No authentication token found')
        return
      }

      const response = await fetch(`/api/listings?listing_type=unit`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📋 Fetched units:', data)
        setUnits(data.data || data || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch units')
        toast.error('Failed to fetch units')
      }
    } catch (error) {
      console.error('Error fetching units:', error)
      setError('Error fetching units')
      toast.error('Error fetching units')
    } finally {
      setLoading(false)
    }
  }


  const handleAddUnit = () => {
    if (!user?.profile?.slug) {
      toast.error('Developer profile not found')
      return
    }
    router.push(`/developer/${user.profile.slug}/units/addNewUnit`)
  }

  const handleRefresh = () => {
    fetchUnits()
  }

  if (loading) {
    return (
      <div className="w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className=" font-bold text-gray-900">All Units</h1>
          <button 
            onClick={handleAddUnit}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add New Unit
          </button>
        </div>
        
        <div className="flex justify-center items-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading units...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">All Units</h2>
          <button 
            onClick={handleAddUnit}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add New Unit
          </button>
        </div>
        
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-lg font-medium">Error loading units</p>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Units</h2>
          <p className="text-gray-600 mt-1">
            {units.length} {units.length === 1 ? 'unit' : 'units'} found
          </p>
        </div>
        <button 
          onClick={handleAddUnit}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Unit
        </button>
      </div>

      {units.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No units found</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first unit</p>
          <button 
            onClick={handleAddUnit}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Unit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {units.map((unit) => (
            <UnitCard 
              key={unit.id} 
              unit={unit}
              developerSlug={user?.profile?.slug}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default AllUnits
