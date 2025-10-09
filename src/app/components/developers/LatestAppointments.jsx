'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, Clock, User, MapPin, Loader2 } from 'lucide-react'

const LatestAppointments = () => {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchAppointments()
    }
  }, [user?.id])

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`/api/appointments/latest?account_id=${user.id}&limit=5`)
      if (response.ok) {
        const result = await response.json()
        setAppointments(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString) => {
    const [h, m] = timeString.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 === 0 ? 12 : hour % 12
    return `${hour12}:${m} ${ampm}`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6">
      <div className="flex items-center mb-4">
        <Calendar className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Latest Appointments</h3>
      </div>

      <div className="space-y-3">
        {appointments.map((appointment) => (
          <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <User className="w-4 h-4 text-gray-500 mr-2" />
                <span className="font-medium text-gray-900">{appointment.clientName}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-3 h-3 mr-1" />
                <span>{appointment.property.title}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <Calendar className="w-3 h-3 mr-1" />
                <span>{formatDate(appointment.date)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-3 h-3 mr-1" />
                <span>{formatTime(appointment.startTime)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {appointments.length === 0 && (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No appointments yet</p>
        </div>
      )}

      {appointments.length > 0 && (
        <div className="text-center mt-4">
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            View All Appointments
          </button>
        </div>
      )}
    </div>
  )
}

export default LatestAppointments
