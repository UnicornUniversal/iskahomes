'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, Loader2, ChevronRight, Phone, Mail, Clock } from 'lucide-react'
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
      <div className=" border border-white/20 rounded-2xl p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </div>
    )
  }

  const AppointmentCard = ({ appointment }) => (
    <div className=" border-b border-primary_color  pb-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded-md bg-primary_color/20 text-primary_color font-medium capitalize">
              {appointment.appointmentType || 'Meeting'}
            </span>
          </div>
          <h4 className="font-semibold text-sm sm:text-base truncate mb-0.5">
            {appointment.clientName || 'Client'}
          </h4>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs opacity-80">
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
        <div className="text-right flex flex-col gap-0.5 text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
          <div className="flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3 opacity-70" />
            <span className="font-semibold">{formatDate(appointment.date)}</span>
          </div>
          <span className="opacity-70">{formatTime(appointment.startTime)}</span>
        </div>
      </div>
      {/* {appointment.property?.title && (
        <div className="text-xs opacity-60 truncate pt-2 border-t border-white/10">
          {appointment.property.title}
        </div>
      )} */}
    </div>
  )

  return (
    <div className="border border-white/20 rounded-2xl p-4 sm:p-6 w-full flex flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between 4 flex-wrap gap-2">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide opacity-70">This Week</p>
          <h3 className="text-lg sm:text-xl font-semibold truncate">Latest Appointments</h3>
        </div>
        {appointments.length > 0 && (
          <span className="text-xs px-2 sm:px-3 py-1 rounded-full border border-white/30 flex-shrink-0">
            {appointments.length} scheduled
          </span>
        )}
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/5 border border-white/20 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <p className="text-xs sm:text-sm opacity-80">No appointments yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {appointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      )}

      {appointments.length > 0 && (
        <div className="mt-6 sm:mt-8 flex items-center justify-between text-xs sm:text-sm flex-wrap gap-2">
          <div className="text-xs uppercase tracking-wide opacity-60">
            Need to see more?
          </div>
          <Link
            href="#"
            className="flex items-center gap-1 font-medium px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/30 hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <span className="hidden sm:inline">View calendar</span>
            <span className="sm:hidden">Calendar</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}

export default LatestAppointments
