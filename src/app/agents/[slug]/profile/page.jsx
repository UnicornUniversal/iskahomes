'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { FiLoader } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import AgentProfile from '@/app/components/agency/AgentProfile'
import AgentNav from '@/app/components/agents/AgentNav'
import AgentHeader from '@/app/components/agents/AgentHeader'

export default function AgentProfilePage() {
  const params = useParams()
  const { user, agentToken } = useAuth()
  const agentSlug = params.slug

  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.id || !agentSlug) {
      setLoading(false)
      return
    }

    const fetchAgentProfile = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = agentToken || user?.token
        if (!token) {
          setError('Authentication required')
          return
        }

        const response = await fetch(`/api/agents/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          if (response.status === 404) {
            setError('Agent profile not found')
          } else {
            setError('Failed to fetch agent profile')
          }
          return
        }

        const result = await response.json()
        if (result.success && result.data) {
          setAgent(result.data)
        } else {
          setError('Agent profile not found')
        }
      } catch (err) {
        console.error('Error fetching agent profile:', err)
        setError('Failed to load agent profile')
      } finally {
        setLoading(false)
      }
    }

    fetchAgentProfile()
  }, [user?.id, agentSlug, agentToken])

  const handleUpdate = (updatedAgent) => {
    setAgent(updatedAgent)
  }

  if (loading) {
    return (
      <div className='w-full normal_div'>
        <AgentNav agentSlug={agentSlug} />
        <div className='w-full flex items-center justify-center min-h-[600px]'>
          <div className='flex flex-col items-center gap-4'>
            <FiLoader className='w-8 h-8 text-primary_color animate-spin' />
            <p className='text-gray-600'>Loading agent profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='w-full normal_div'>
        <AgentNav agentSlug={agentSlug} />
        <div className='w-full flex flex-col items-center justify-center min-h-[600px]'>
          <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-md'>
            <p className='text-red-600 mb-4'>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='w-full normal_div'>
      <AgentNav agentSlug={agentSlug} />
      <div className='w-full flex flex-col gap-[2em] p-6'>
        <AgentHeader agent={agent} />
        <AgentProfile 
          agent={agent} 
          loading={loading} 
          isEditable={true}
          onUpdate={handleUpdate}
        />
      </div>
    </div>
  )
}
