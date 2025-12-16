'use client'

import React, { useEffect, useState } from 'react'
import { FiCalendar, FiClock, FiUser, FiMapPin } from 'react-icons/fi'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200'
}

const ListingAppointments = ({ listingId, limit = 5 }) => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!listingId) return
    fetchAppointments()
  }, [listingId])

  async function fetchAppointments() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/appointments?listing_id=${listingId}&page=1&limit=${limit}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setAppointments(result.data || [])
      } else {
        setError(result.error || 'Failed to load appointments')
        setAppointments([])
      }
    } catch (err) {
      console.error('Error loading appointments:', err)
      setError('Failed to load appointments')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  if (!listingId) return null

  return (
    <div className="rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary_color">Upcoming Appointments</h3>
        <button
          onClick={fetchAppointments}
          className="text-sm text-primary_color hover:text-primary_color/80 font-medium"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary_color"></div>
        </div>
      ) : error ? (
        <div className="border border-red-200 text-red-800 p-4 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No appointments scheduled for this listing.
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map(appointment => (
            <div
              key={appointment.id}
              className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary_color">
                    {appointment.client_name || 'Unnamed client'}
                  </p>
                  {appointment.client_phone && (
                    <p className="text-xs text-gray-500">{appointment.client_phone}</p>
                  )}
                </div>

                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusColors[appointment.status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
                >
                  {appointment.status || 'pending'}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <FiCalendar className="w-4 h-4 text-gray-400" />
                  <span>{appointment.appointment_date || 'TBD'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiClock className="w-4 h-4 text-gray-400" />
                  <span>{appointment.appointment_time || 'TBD'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiUser className="w-4 h-4 text-gray-400" />
                  <span>{appointment.meeting_location || 'Not specified'}</span>
                </div>
              </div>

              {appointment.listings?.title && (
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <FiMapPin className="w-4 h-4" />
                  <span>{appointment.listings.title}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ListingAppointments

