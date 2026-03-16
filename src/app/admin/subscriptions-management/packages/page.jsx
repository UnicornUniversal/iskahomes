'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FiMoreVertical, FiPlus } from 'react-icons/fi'
import { toast } from 'react-toastify'

const PackagesPage = () => {
  const router = useRouter()
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [openActionsId, setOpenActionsId] = useState(null)
  const [duplicatingId, setDuplicatingId] = useState(null)
  const abortControllerRef = useRef(null)
  const isMountedRef = useRef(true)

  const fetchPackages = useCallback(async () => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token') || localStorage.getItem('developer_token')
      const response = await fetch('/api/admin/packages', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: abortController.signal
      })

      // Check if request was aborted
      if (abortController.signal.aborted) return

      if (response.ok) {
        const { data } = await response.json()
        if (isMountedRef.current) {
          setPackages(data || [])
        }
      } else {
        if (isMountedRef.current) {
          toast.error('Failed to fetch packages')
        }
      }
    } catch (error) {
      // Don't show error if request was aborted
      if (error.name === 'AbortError') {
        return
      }
      console.error('Error fetching packages:', error)
      if (isMountedRef.current) {
        toast.error('Failed to fetch packages')
      }
    } finally {
      // Only update loading if request wasn't aborted and component is mounted
      if (!abortController.signal.aborted && isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  // Fetch packages
  useEffect(() => {
    isMountedRef.current = true
    fetchPackages()

    // Cleanup: abort request on unmount
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchPackages])

  const handleDuplicatePackage = useCallback(async (id) => {
    try {
      setDuplicatingId(id)
      const token = localStorage.getItem('admin_token') || localStorage.getItem('developer_token')
      const response = await fetch(`/api/admin/packages/${id}/duplicate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to duplicate package')
      }

      toast.success('Package duplicated successfully')
      setOpenActionsId(null)
      fetchPackages()
    } catch (error) {
      console.error('Error duplicating package:', error)
      toast.error(error.message || 'Failed to duplicate package')
    } finally {
      if (isMountedRef.current) {
        setDuplicatingId(null)
      }
    }
  }, [fetchPackages])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading packages...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Packages</h1>
        <button
          onClick={() => router.push('/admin/subscriptions-management/packages/newPackage')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus /> Create Package
        </button>
      </div>

      {/* Packages Table */}
      {packages.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No packages found. Create your first package!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-visible">
          <div className="grid grid-cols-6 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">Package Name</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">User Type</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">Price (GHS)</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">Price (USD)</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">Status</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-600 text-right">Actions</div>
          </div>

          <div className="divide-y divide-gray-100 overflow-visible">
            {packages.map((pkg) => (
              <div key={pkg.id} className="grid grid-cols-6 gap-4 px-4 py-3 items-center hover:bg-gray-50">
                <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                <div className="text-sm text-gray-700 capitalize">{pkg.user_type || '-'}</div>
                <div className="text-sm text-gray-700">
                  GHS {parseFloat(pkg.local_currency_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-700">
                  USD {parseFloat(pkg.international_currency_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${pkg.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {pkg.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-right relative">
                  <div className="relative inline-block text-left">
                    <button
                      onClick={() => setOpenActionsId(prev => (prev === pkg.id ? null : pkg.id))}
                      className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                      aria-label="Open package actions"
                    >
                      <FiMoreVertical />
                    </button>

                    {openActionsId === pkg.id && (
                      <div className="absolute right-0 z-50 mt-1 w-36 origin-top-right rounded-md border border-gray-200 bg-white shadow-lg">
                        <button
                          onClick={() => {
                            setOpenActionsId(null)
                            router.push(`/admin/subscriptions-management/packages/${pkg.id}`)
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDuplicatePackage(pkg.id)}
                          disabled={duplicatingId === pkg.id}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                        >
                          {duplicatingId === pkg.id ? 'Duplicating...' : 'Duplicate'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PackagesPage

