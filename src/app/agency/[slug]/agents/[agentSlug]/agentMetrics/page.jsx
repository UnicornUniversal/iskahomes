'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FiLoader } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import AgentMetrics from '@/app/components/agency/AgentMetrics'

export default function AgentMetricsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { slug, agentSlug } = params
  
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.id || !agentSlug) {
      setLoading(false)
      return
    }

    const fetchAgent = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('agency_token')
        if (!token) {
          setError('Authentication required')
          return
        }

        const response = await fetch(`/api/agencies/agents/${agentSlug}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          if (response.status === 404) {
            setError('Agent not found')
          } else {
            setError('Failed to fetch agent')
          }
          return
        }

        const result = await response.json()
        if (result.success && result.data) {
          setAgent(result.data)
        } else {
          setError('Agent not found')
        }
      } catch (err) {
        console.error('Error fetching agent:', err)
        setError('Failed to load agent data')
      } finally {
        setLoading(false)
      }
    }

    fetchAgent()
  }, [user?.id, agentSlug])

  // Get currency from agency profile
  const currency = user?.profile?.default_currency || 'GHS'

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="w-8 h-8 text-primary_color animate-spin" />
          <p className="text-gray-600">Loading agent metrics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push(`/agency/${slug}/agents`)}
            className="px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors"
          >
            Back to Agents
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <AgentMetrics agent={agent} loading={loading} currency={currency} />
    </div>
  )
}
