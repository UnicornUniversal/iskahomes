'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

export default function Reminders({ listerId, listerType = 'developer', refreshKey = 0 }) {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const listerIdRef = useRef(listerId)
  const listerTypeRef = useRef(listerType)

  // Update refs when props change
  useEffect(() => {
    listerIdRef.current = listerId
    listerTypeRef.current = listerType
  }, [listerId, listerType])

  useEffect(() => {
    if (!listerId) return

    let isMounted = true

    async function loadReminders() {
      if (!listerIdRef.current) return
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/reminders?user_id=${encodeURIComponent(listerIdRef.current)}&user_type=${encodeURIComponent(listerTypeRef.current)}`)
        const result = await response.json()
        if (!isMounted) return
        if (response.ok && result.success) {
          setReminders(result.data || [])
        } else {
          setError('reminders error')
          setReminders([])
        }
      } catch (err) {
        console.error('Error loading reminders:', err)
        if (!isMounted) return
        setError('reminders error')
        setReminders([])
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadReminders()

    return () => {
      isMounted = false
    }
  }, [listerId, listerType, refreshKey])

  // Format date as "3 - 12 - 2024"
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    return `${day} - ${month} - ${year}`
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
      bedrooms = specs?.bedrooms || specs?.number_of_bedrooms || specs?.bedroom
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
    <div className="w-full space-y-4 text-primary_color">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-secondary_color-900">Appointments & Reminders</h3>
        <div className="text-sm text-secondary_color-500">
          Total: <span className="font-medium text-secondary_color-900">{reminders.length}</span>
        </div>
      </div>

      {/* Swiper Container */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-secondary_color-600">Loading reminders...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-secondary_color-500 text-sm">
          reminders error
        </div>
      ) : reminders.length > 0 ? (
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={16}
          slidesPerView={1.2}
          breakpoints={{
            640: {
              slidesPerView: 1.5,
            },
            768: {
              slidesPerView: 2,
            },
            1024: {
              slidesPerView: 2.5,
            },
          }}
          navigation
          pagination={{ clickable: true }}
          className="reminders-swiper"
        >
          {reminders.map((reminder) => (
            <SwiperSlide key={reminder.id}>
              <div className="default_bg rounded-lg max-w-[450px] border border-white/50 p-4 h-full flex flex-col">
                {/* Date and Time  and Status*/}
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-medium text-secondary_color-900 mb-1">
                    {formatDate(reminder.reminder_date)}
                  </div>
                  {reminder.reminder_time && (
                    <div className="text-sm text-secondary_color-600">
                      {formatTime(reminder.reminder_time)}
                    </div>
                  )}

                    {/* Status */}
                <div className="mb-3">
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                    reminder.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : reminder.is_overdue 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {getStatusText(reminder)}
                  </span>
                </div>
                </div>

              

                {/* Note */}
                <div className="mb-4 flex-1">
                  <p className="text-xs text-secondary_color-500 mb-1">Note</p>
                  <p className="text-sm text-secondary_color-900 leading-relaxed">
                    {reminder.note_text}
                  </p>
                </div>

                {/* Property Information */}
                {reminder.listing && (
                  <div className="mt-auto pt-3 border-t border-white/30">
                    {getPropertyTitle(reminder) && (
                      <p className="text-sm font-medium text-secondary_color-900 mb-1">
                        {getPropertyTitle(reminder)}
                      </p>
                    )}
                    {getLocation(reminder) && (
                      <p className="text-xs text-secondary_color-600">
                        {getLocation(reminder)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className="text-center py-8 text-secondary_color-500 text-sm">
          no reminders found
        </div>
      )}
    </div>
  )
}

