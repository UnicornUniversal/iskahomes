'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { formatFullDate } from '@/lib/utils'

const LatestReminders = ({ limit = 10 }) => {
  const { user } = useAuth()
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.id || !user?.user_type) {
      setLoading(false)
      return
    }

    loadReminders()
  }, [user?.id, user?.user_type, limit])

  async function loadReminders() {
    if (!user?.id || !user?.user_type) return

    setLoading(true)
    setError(null)

    try {
      // For team members, get the developer's user_id from organization
      let userId = user.id
      let userType = user.user_type
      
      if (user?.user_type === 'team_member' && user?.profile?.organization_type === 'developer') {
        // Fetch developer's user_id from developers table
        const { data: developer } = await supabase
          .from('developers')
          .select('developer_id')
          .eq('id', user.profile.organization_id)
          .single()
        
        if (developer?.developer_id) {
          userId = developer.developer_id
          userType = 'developer' // Use 'developer' as user_type for the API
        }
      }
      
      const response = await fetch(
        `/api/reminders/latest?user_id=${encodeURIComponent(userId)}&user_type=${encodeURIComponent(userType)}&limit=${limit}`
      )

      const result = await response.json()

      if (response.ok && result.success) {
        setReminders(result.data || [])
      } else {
        setError(result.error || 'Failed to load reminders')
        setReminders([])
      }
    } catch (err) {
      console.error('Error loading reminders:', err)
      setError('Failed to load reminders')
      setReminders([])
    } finally {
      setLoading(false)
    }
  }

  // Format time as "10:00 PM"
  const formatTime = (timeString) => {
    if (!timeString) return null
    try {
      const [hours, minutes] = timeString.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}:${minutes.padStart(2, '0')} ${ampm}`
    } catch (e) {
      return null
    }
  }

  // Get status text
  const getStatusText = (reminder) => {
    if (reminder.status === 'completed') return 'Completed'
    if (reminder.status === 'cancelled') return 'Cancelled'
    if (reminder.is_overdue) return 'Overdue'
    return 'Uncompleted'
  }

  // Get property title with size
  const getPropertyTitle = (reminder) => {
    if (!reminder.listing) return null
    const title = reminder.listing.title || ''
    
    // Try to get bedrooms from specifications
    let bedrooms = null
    if (reminder.listing.specifications) {
      const specs = typeof reminder.listing.specifications === 'string' 
        ? JSON.parse(reminder.listing.specifications) 
        : reminder.listing.specifications
      bedrooms = specs?.bedrooms || specs?.nuer_of_bedrooms || specs?.bedroom
    }
    
    // Fallback to size field
    const size = bedrooms || reminder.listing.size
    
    if (size) {
      // Format: "3 Bedroom" or just the size value
      const bedroomText = typeof size === 'number' ? `${size} Bedroom${size > 1 ? 's' : ''}` : size
      return `${bedroomText} ${title}`.trim()
    }
    return title
  }

  // Get location string
  const getLocation = (reminder) => {
    if (!reminder.listing) return null
    const { town, city, state, country } = reminder.listing
    const parts = [town, city, state, country].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : null
  }

  return (
    <div className="border  border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-bold text-primary_color">Latest Reminders</h3>
        <div className="text-sm text-primary_color">
          Total: {reminders.length}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-sm text-primary_color">
          {error}
        </div>
      ) : reminders.length > 0 ? (
        <div className="flex flex-col gap-4">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="bg-white/30 rounded-lg p-4 border border-gray-100/50">
              {/* Note */}
              <div className="mb-3">
                <p className="text-xs mb-1 font-medium text-primary_color">Note</p>
                <p className="text-xs leading-relaxed text-primary_color">
                  {reminder.note_text}
                </p>
              </div>

              {/* Date, Time and Status */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-primary_color">
                  {formatFullDate(reminder.reminder_date)}
                </p>
                {reminder.reminder_time && (
                  <p className="text-xs text-primary_color">
                    {formatTime(reminder.reminder_time)}
                  </p>
                )}

                {/* Status */}
                <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                  reminder.status === 'completed' 
                    ? 'bg-gray-100 text-primary_color' 
                    : reminder.is_overdue 
                      ? 'bg-red-50 text-red-700' 
                      : 'bg-yellow-50 text-yellow-700'
                }`}>
                  {getStatusText(reminder)}
                </span>
              </div>

              {/* Property Information */}
              {reminder.listing && (
                <div className="mt-3 pt-3 border-t border-gray-200/50">
                  {getPropertyTitle(reminder) && (
                    <p className="text-xs mb-1 font-medium text-primary_color">
                      {getPropertyTitle(reminder)}
                    </p>
                  )}
                  {getLocation(reminder) && (
                    <p className="text-xs text-primary_color">
                      {getLocation(reminder)}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-sm text-primary_color">
          No reminders found
        </div>
      )}
    </div>
  )
}

export default LatestReminders
