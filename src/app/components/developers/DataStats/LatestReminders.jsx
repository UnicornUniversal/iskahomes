'use client'

import React, { useEffect, useState } from 'react'
import { FiCalendar, FiClock, FiAlertCircle, FiCheckCircle, FiXCircle, FiUser, FiMapPin, FiImage } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'

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
      const response = await fetch(
        `/api/reminders/latest?user_id=${encodeURIComponent(user.id)}&user_type=${encodeURIComponent(user.user_type)}&limit=${limit}`
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

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return 'No date'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (e) {
      return dateStr
    }
  }

  // Format time for display
  const formatTime = (timeStr) => {
    if (!timeStr) return null
    try {
      const [hours, minutes] = timeStr.split(':')
      const date = new Date()
      date.setHours(parseInt(hours), parseInt(minutes))
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch (e) {
      return timeStr
    }
  }

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 border-red-200'
      case 'high':
        return 'bg-orange-100 border-orange-200'
      case 'normal':
        return 'bg-blue-100 border-blue-200'
      case 'low':
        return 'bg-gray-100 border-gray-200'
      default:
        return 'bg-gray-100 border-gray-200'
    }
  }

  // Get listing image
  const getListingImage = (listing) => {
    if (!listing) return null
    
    // Check for images array
    if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
      // If images is array of strings (URLs)
      if (typeof listing.images[0] === 'string') {
        return listing.images[0]
      }
      // If images is array of objects with url property
      if (listing.images[0]?.url) {
        return listing.images[0].url
      }
    }
    
    return null
  }

  if (loading) {
    return (
      <div className=" rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading reminders...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className=" rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (reminders.length === 0) {
    return (
      <div className=" rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Latest Reminders</h3>
        <div className="text-center py-8">
          <FiCalendar className="w-12 h-12 mx-auto mb-3" />
          <p>No reminders found</p>
        </div>
      </div>
    )
  }

  return (
    <div className=" rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Latest Reminders</h3>
        <span className="text-sm">{reminders.length} reminder{reminders.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-4">
        {reminders.map((reminder) => {
          const reminderDate = new Date(reminder.reminder_date)
          const now = new Date()
          const isToday = reminderDate.toDateString() === now.toDateString()
          const isTomorrow = reminderDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString()
          const listingImage = getListingImage(reminder.listing)

          return (
            <div
              key={reminder.id}
              className={`rounded-lg border overflow-hidden ${
                reminder.is_overdue
                  ? 'bg-red-50 border-red-200'
                  : isToday
                  ? 'bg-yellow-50 border-yellow-200'
                  : ' border-gray-200'
              } hover:shadow-md transition-shadow`}
            >
              {/* Listing Info at Top */}
              {reminder.listing && (
                <div className=" border-b border-gray-200">
                  <div className="flex gap-4 p-4">
                    {/* Listing Image */}
                    <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                      {listingImage ? (
                        <img
                          src={listingImage}
                          alt={reminder.listing.title || 'Listing'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <FiImage className="w-8 h-8 text-white opacity-70" />
                        </div>
                      )}
                    </div>
                    
                    {/* Listing Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold mb-1 line-clamp-1">
                        {reminder.listing.title || 'Listing'}
                      </h4>
                      {reminder.listing.location && (
                        <div className="flex items-center gap-1 text-sm mb-1">
                          <FiMapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{reminder.listing.location}</span>
                        </div>
                      )}
                      {reminder.listing.property_type && (
                        <span className="inline-block text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {reminder.listing.property_type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Reminder Details Below */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Reminder Text */}
                    <p className="text-sm font-medium mb-3">{reminder.note_text}</p>

                    {/* Date and Time */}
                    <div className="flex items-center gap-4 text-xs mb-3">
                      <div className="flex items-center gap-1">
                        <FiCalendar className="w-3 h-3" />
                        <span>
                          {isToday
                            ? 'Today'
                            : isTomorrow
                            ? 'Tomorrow'
                            : formatDate(reminder.reminder_date)}
                        </span>
                      </div>
                      {reminder.reminder_time && (
                        <div className="flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          <span>{formatTime(reminder.reminder_time)}</span>
                        </div>
                      )}
                    </div>

                    {/* Lead Info */}
                    {reminder.lead?.seeker_id && (
                      <div className="flex items-center gap-1 text-xs mb-3">
                        <FiUser className="w-3 h-3" />
                        <span>Lead Score: {reminder.lead.lead_score || 0}</span>
                      </div>
                    )}

                    {/* Priority and Status Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(
                          reminder.priority
                        )}`}
                      >
                        {reminder.priority || 'normal'}
                      </span>
                      {reminder.is_overdue && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 border border-red-200">
                          <FiAlertCircle className="w-3 h-3" />
                          Overdue
                        </span>
                      )}
                      {isToday && !reminder.is_overdue && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 border border-yellow-200">
                          <FiClock className="w-3 h-3" />
                          Today
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {reminders.length >= limit && (
        <div className="mt-4 text-center">
          <button
            onClick={loadReminders}
            className="text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  )
}

export default LatestReminders
