import React from 'react'
import { appointments } from '../Data/Data'

const AVATAR_PLACEHOLDER = '/iska-dark.png'

const LatestAppointments = () => {
  // Get pending appointments and sort by closest time (ascending)
  const pendingAppointments = appointments
    .filter(appointment => appointment.status === 'pending')
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.start_time}`)
      const dateB = new Date(`${b.date}T${b.start_time}`)
      return dateA - dateB
    })
    .slice(0, 10)

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (timeString) => {
    const [h, m] = timeString.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 === 0 ? 12 : hour % 12
    return `${hour12}:${m}`
  }

  return (
    <div className="bg-white rounded-3xl shadow-md p-6">
      <div className="flex items-center mb-6">
        <span className="text-blue-500 text-xl mr-2">📅</span>
        <h3 className="text-lg font-semibold text-gray-900">Recent Appointments</h3>
      </div>
      <div className="space-y-4">
        {pendingAppointments.map((appointment) => {
          const { development_and_unit } = appointment
          return (
            <div
              key={appointment.id}
              className="flex items-center  justify-between bg-[#f8fbfd] rounded-full px-6 py-3 shadow-sm"
            >
              {/* Avatar */}
              {/* <img
                src={AVATAR_PLACEHOLDER}
                alt="avatar"
                className="w-12 h-12 rounded-full object-cover mr-4 border border-gray-200"
              /> */}
              {/* Seeker info */}
              <div className="flex flex-col justify-center min-w-[140px] mr-6">
                <span className="font-semibold text-gray-800 text-base leading-tight">{appointment.homeseeker.name}</span>
                <span className="text-xs text-gray-400 leading-tight mt-1">{appointment.homeseeker.phone || appointment.homeseeker.email}</span>
              </div>
              {/* Development & unit */}
              <div className="flex flex-col justify-center min-w-[160px] mr-6">
                <span className="flex items-center text-gray-800 text-base font-semibold leading-tight">
                  <span className="mr-1">🏢</span>{development_and_unit?.development_name || '—'}
                </span>
                <span className="text-xs text-gray-400 leading-tight mt-1">{development_and_unit?.unit_name || '—'}</span>
              </div>
              {/* Date & time */}
              <div className="flex flex-col justify-end min-w-[120px] mr-6">
                <span className="flex items-end text-gray-800 text-base font-semibold leading-tight">
                  <span className="mr-1">📅</span>{formatDate(appointment.date)}
                </span>
                <span className="text-xs text-gray-400 leading-tight mt-1">{formatTime(appointment.start_time)}</span>
              </div>
            </div>
          )
        })}
      </div>
      {pendingAppointments.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">📅</div>
          <p className="text-gray-500">No appointments found</p>
        </div>
      )}
      <div className="flex justify-center mt-8">
        <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full px-8 py-2 flex items-center gap-2 transition">
          See All Appointments <span>→</span>
        </button>
      </div>
    </div>
  )
}

export default LatestAppointments
