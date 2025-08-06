'use client'

import React from 'react'
import { agentAppointments } from '../../Data/Data'
import { FiCalendar, FiClock, FiMapPin, FiUser, FiVideo, FiMonitor } from 'react-icons/fi'

const LatestAppoinments = () => {
  // Get the latest 5 appointments sorted by date
  const latestAppointments = agentAppointments
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timeString) => {
    return timeString
  }

  const getContactTypeIcon = (type) => {
    return type === 'video_call' ? <FiVideo className="w-4 h-4" /> : <FiMonitor className="w-4 h-4" />
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Latest Appointments</h2>
          <p className="text-sm text-gray-600">Recent property viewings and client meetings</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FiCalendar className="w-4 h-4" />
          <span>Last 5 appointments</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Type
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {latestAppointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FiUser className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {appointment.homeseeker.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FiMapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {appointment.propertyName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FiClock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {formatDate(appointment.date)} at {formatTime(appointment.start_time)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getContactTypeIcon(appointment.appointment_type)}
                      <span className="text-sm text-gray-900">
                        {appointment.appointment_type === 'video_call' ? 'Video Call' : 'In Person'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default LatestAppoinments
