'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Activity, Loader2 } from 'lucide-react'

function formatAction(eventName) {
  if (!eventName) return 'did an activity'
  return eventName.replace(/_/g, ' ').trim()
}

function formatActor(event, users) {
  const eventUserId = event?.user_id || event?.distinct_id
  const matchedUser = users.find((user) => user.user_id === eventUserId)
  if (matchedUser?.name) return matchedUser.name

  const actorName =
    event?.properties?.user_name ||
    event?.properties?.name ||
    event?.metadata?.user_name ||
    event?.metadata?.name

  if (actorName && String(actorName).trim()) return actorName

  const fallbackId = event?.user_id || event?.distinct_id
  if (!fallbackId) return 'Unknown user'

  const str = String(fallbackId)
  return str.length > 20 ? `${str.slice(0, 8)}...` : str
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const RecentActivities = ({ limit = 10 }) => {
  const { developerToken, agencyToken } = useAuth()
  const token = developerToken || agencyToken
  const [activities, setActivities] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const fetchUsers = async () => {
      if (!token) return
      try {
        const response = await fetch('/api/audit/users', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        })
        if (!response.ok) return
        const result = await response.json()
        if (isMounted) {
          setUsers(Array.isArray(result.users) ? result.users : [])
        }
      } catch (err) {
        if (err?.name === 'AbortError') return
      }
    }

    fetchUsers()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [token])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const fetchActivities = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const params = new URLSearchParams({
          page: '0',
          page_size: String(limit)
        })

        const response = await fetch(`/api/audit/events?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        })

        if (!response.ok) {
          const result = await response.json().catch(() => ({}))
          throw new Error(result.error || 'Failed to fetch recent activities')
        }

        const result = await response.json()
        if (isMounted) {
          setActivities(Array.isArray(result.events) ? result.events.slice(0, limit) : [])
        }
      } catch (err) {
        if (err?.name === 'AbortError') return
        if (isMounted) {
          setActivities([])
          setError(err?.message || 'Failed to load activities')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchActivities()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [token, limit])

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary_color/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary_color" />
          </div>
          <h3 className="text-base font-bold text-primary_color">Recent Activities</h3>
        </div>
        <span className="text-sm text-primary_color">{activities.length}</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-primary_color" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-sm text-primary_color">{error}</div>
      ) : activities.length > 0 ? (
        <div className="summary_height flex flex-col gap-3">
          {activities.map((activity, index) => {
            const key = activity.uuid || `${activity.event || 'activity'}-${index}`
            return (
              <div key={key} className="bg-white/30 rounded-lg p-3 border border-gray-100/50">
                <p className="text-sm text-primary_color capitalize">
                  {formatAction(activity.event)}
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-primary_color">
                    {formatActor(activity, users)}
                  </p>
                  <p className="text-xs text-primary_color/70 whitespace-nowrap">
                    {formatTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-3">
            <Activity className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-primary_color">No recent activities yet</p>
        </div>
      )}
    </div>
  )
}

export default RecentActivities

