'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { FiCalendar, FiClock, FiMapPin, FiUser, FiChevronRight } from 'react-icons/fi'
import Link from 'next/link'

const BookingCard = () => {
  const params = useParams()
  const slug = params?.slug || ''
  const { user, propertySeekerToken } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user || !propertySeekerToken || user.user_type !== 'property_seeker') {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/appointments', {
          headers: {
            'Authorization': `Bearer ${propertySeekerToken}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          const appointments = result.data || []
          
          // Filter upcoming appointments and limit to 3
          const upcoming = appointments
            .filter(apt => {
              const aptDate = new Date(apt.appointment_date)
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              return aptDate >= today && (apt.status === 'confirmed' || apt.status === 'pending')
            })
            .sort((a, b) => {
              const dateA = new Date(`${a.appointment_date} ${a.appointment_time}`)
              const dateB = new Date(`${b.appointment_date} ${b.appointment_time}`)
              return dateA - dateB
            })
            .slice(0, 3)
          
          setBookings(upcoming)
        }
      } catch (err) {
        console.error('Error fetching appointments:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [user, propertySeekerToken])

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-primary_color/10 text-primary_color border-primary_color/20'
      case 'pending':
        return 'bg-secondary_color/10 text-secondary_color border-secondary_color/20'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="default_bg rounded-2xl shadow-lg border border-primary_color/10 p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg lg:text-xl font-bold text-primary_color flex items-center gap-2">
          <div className="p-2 bg-secondary_color/10 rounded-lg">
            <FiCalendar className="w-5 h-5 text-secondary_color" />
          </div>
          Upcoming Visits
        </h3>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary_color/20 border-t-primary_color mx-auto mb-2"></div>
          <p className="text-primary_color/60 text-sm">Loading...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-primary_color/60 text-sm">No upcoming appointments</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const listing = booking.listings
            return (
              <div key={booking.id} className="default_bg border border-primary_color/10 rounded-xl p-4 hover:shadow-md transition-all duration-300 hover:scale-[1.01] group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-primary_color text-sm mb-1.5 truncate group-hover:text-secondary_color transition-colors">
                      {listing?.title || 'Property Viewing'}
                    </h4>
                    {booking.meeting_location && (
                      <div className="flex items-center text-primary_color/70 text-xs mb-1.5">
                        <FiMapPin className="w-3 h-3 mr-1.5 flex-shrink-0" />
                        <span className="truncate">{booking.meeting_location}</span>
                      </div>
                    )}
                    <div className="flex items-center text-primary_color/70 text-xs">
                      <FiMapPin className="w-3 h-3 mr-1.5 flex-shrink-0" />
                      <span className="capitalize">{booking.appointment_type || 'In-Person'}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)} flex-shrink-0 ml-2`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs mb-3 pb-3 border-b border-primary_color/10">
                  <div className="flex items-center gap-1.5 text-primary_color/70">
                    <FiCalendar className="w-3 h-3" />
                    <span className="font-medium">{formatDate(booking.appointment_date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-primary_color/70">
                    <FiClock className="w-3 h-3" />
                    <span className="font-medium">{booking.appointment_time}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-1.5 text-xs font-medium default_bg text-primary_color rounded-lg hover:bg-primary_color/10 transition-colors border border-primary_color/10">
                    Reschedule
                  </button>
                  <button className="flex-1 px-3 py-1.5 text-xs font-medium bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors shadow-lg shadow-primary_color/20">
                    View
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {slug && (
        <Link 
          href={`/propertySeeker/${slug}/bookings`}
          className="flex items-center justify-center gap-2 w-full mt-4 pt-4 border-t border-primary_color/10 text-sm font-medium text-primary_color hover:text-secondary_color transition-colors group"
        >
          <span>View All Bookings</span>
          <FiChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  )
}

export default BookingCard 