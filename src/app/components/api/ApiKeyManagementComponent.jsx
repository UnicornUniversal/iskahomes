'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'
import { FiChevronRight, FiPlus } from 'react-icons/fi'

export default function ApiKeyManagementComponent({ userType = 'developer', slug = 'default' }) {
  const { developerToken, agencyToken } = useAuth()
  const token = userType === 'agency' ? agencyToken : developerToken
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    const fetchKeys = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/api-keys', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to load keys')
        setKeys(result.data || [])
      } catch (error) {
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
    }
    fetchKeys()
  }, [token])

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page_heading">API Integration</h1>
          <p className="text-gray-600">Saved API keys for this account</p>
        </div>
        <Link
          href={`/${userType}/${slug}/api/new`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90"
        >
          <FiPlus className="w-4 h-4" />
          Create API key
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color" />
        </div>
      ) : keys.length === 0 ? (
        <p className="text-gray-600">No API keys yet.</p>
            ) : (
              <div className="space-y-4">
          {keys.map((key) => {
            const isActive = key.status !== 'inactive'
                  return (
              <div key={key.id} className="bg-white/40 border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-primary_color">{key.name}</p>
                    {key.description && <p className="text-gray-600 mt-1">{key.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isActive ? 'bg-primary_color/10 text-primary_color' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                    <Link
                      href={`/${userType}/${slug}/api/${key.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90"
                    >
                      Manage
                      <FiChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
