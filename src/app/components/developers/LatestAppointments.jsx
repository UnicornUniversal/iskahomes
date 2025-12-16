'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, Loader2, ChevronRight, Phone, Mail, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatFullDate } from '@/lib/utils'

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
      const response = await fetch(`/api/appointments/latest?account_id=${user.id}&limit=3`)
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

  const formatTime = (timeString) => {
    if (!timeString) return ''
    const [h, m] = timeString.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 === 0 ? 12 : hour % 12
    return `${hour12}:${m} ${ampm}`
  }

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </div>
    )
  }

  const AppointmentCard = ({ appointment }) => (
    <div className="border-b border-gray-100 pb-4 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 capitalize">
              {appointment.appointmentType || 'Meeting'}
            </span>
          </div>
          <div className="text-sm truncate mb-1">
            {appointment.clientName || 'Client'}
          </div>
          <div className="flex justify-between items-center flex-wrap gap-1 text-xs">
            {appointment.clientPhone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{appointment.clientPhone}</span>
              </div>
            )}
            {appointment.clientEmail && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{appointment.clientEmail}</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right flex flex-col gap-1 text-xs whitespace-nowrap flex-shrink-0">
          <div className="flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3" />
            <span>{formatFullDate(appointment.date)}</span>
          </div>
          <span>{formatTime(appointment.startTime)}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base">Latest Appointments</h3>
        {appointments.length > 0 && (
          <span className="text-sm">{appointments.length} scheduled</span>
        )}
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-sm">No appointments yet</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {appointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide">
              Need to see more?
            </div>
            <Link
              href="#"
              className="flex items-center gap-1 text-sm transition-colors"
            >
              View calendar
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default LatestAppointments

