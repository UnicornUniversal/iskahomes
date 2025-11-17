'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, Clock, User, MapPin, Loader2, ChevronRight } from 'lucide-react'
import Link from 'next/link'

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
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-primary_color" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary_color/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-primary_color" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Latest Appointments</h3>
        </div>
        {appointments.length > 0 && (
          <span className="text-xs text-gray-500">{appointments.length}</span>
        )}
      </div>

      <div className="space-y-2">
        {appointments.map((appointment) => (
          <div 
            key={appointment.id} 
            className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-primary_color/20 hover:bg-gray-50/50 transition-all"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="font-medium text-sm text-gray-900 truncate">{appointment.clientName}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="truncate">{appointment.property.title}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-3">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span>{formatDate(appointment.date)}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Clock className="w-3 h-3 text-gray-400" />
                <span>{formatTime(appointment.startTime)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {appointments.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm text-gray-500">No appointments yet</p>
        </div>
      )}

      {appointments.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <Link
            href="#"
            className="flex items-center justify-center gap-1 text-sm font-medium text-primary_color hover:text-primary_color/80 transition-colors"
          >
            View All Appointments
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}

export default LatestAppointments
