'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Star,
  MapPin
} from 'lucide-react'

const AppointmentAnalytics = () => {
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  // Dummy data for appointment analytics
  const appointmentData = {
    overview: {
      totalAppointments: 34,
      completedAppointments: 28,
      cancelledAppointments: 4,
      noShowAppointments: 2,
      completionRate: 82.4,
      averageRating: 4.6,
      totalAppointmentsChange: 12.1,
      completionRateChange: 5.3,
      averageRatingChange: 0.2
    },
    appointmentTypes: [
      { type: 'Property Viewing', count: 18, completion: 15, rate: 83.3 },
      { type: 'Consultation', count: 10, completion: 8, rate: 80.0 },
      { type: 'Site Visit', count: 4, completion: 4, rate: 100.0 },
      { type: 'Follow-up', count: 2, completion: 1, rate: 50.0 }
    ],
    recentAppointments: [
      { 
        id: 1, 
        client: 'John Doe', 
        property: 'Luxury Apartments East Legon',
        type: 'Property Viewing',
        date: '2024-01-15',
        time: '10:00 AM',
        status: 'completed',
        rating: 5,
        duration: '45 min'
      },
      { 
        id: 2, 
        client: 'Jane Smith', 
        property: 'Modern Villas Accra',
        type: 'Consultation',
        date: '2024-01-14',
        time: '2:00 PM',
        status: 'completed',
        rating: 4,
        duration: '30 min'
      },
      { 
        id: 3, 
        client: 'Mike Johnson', 
        property: 'Premium Condos',
        type: 'Site Visit',
        date: '2024-01-13',
        time: '9:00 AM',
        status: 'cancelled',
        rating: null,
        duration: null
      },
      { 
        id: 4, 
        client: 'Sarah Wilson', 
        property: 'Executive Homes',
        type: 'Property Viewing',
        date: '2024-01-12',
        time: '3:30 PM',
        status: 'no-show',
        rating: null,
        duration: null
      }
    ],
    dailyAppointments: [
      { date: '2024-01-01', scheduled: 2, completed: 2, cancelled: 0 },
      { date: '2024-01-02', scheduled: 1, completed: 1, cancelled: 0 },
      { date: '2024-01-03', scheduled: 3, completed: 2, cancelled: 1 },
      { date: '2024-01-04', scheduled: 2, completed: 2, cancelled: 0 },
      { date: '2024-01-05', scheduled: 1, completed: 1, cancelled: 0 },
      { date: '2024-01-06', scheduled: 4, completed: 3, cancelled: 1 },
      { date: '2024-01-07', scheduled: 2, completed: 2, cancelled: 0 }
    ],
    topProperties: [
      { name: 'Luxury Apartments East Legon', appointments: 12, completion: 10, rate: 83.3 },
      { name: 'Modern Villas Accra', appointments: 8, completion: 7, rate: 87.5 },
      { name: 'Premium Condos', appointments: 6, completion: 5, rate: 83.3 },
      { name: 'Executive Homes', appointments: 4, completion: 3, rate: 75.0 }
    ],
    timeSlots: {
      '9:00 AM': 8,
      '10:00 AM': 12,
      '11:00 AM': 6,
      '2:00 PM': 15,
      '3:00 PM': 9,
      '4:00 PM': 5
    }
  }

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckCircle
      case 'cancelled': return XCircle
      case 'no-show': return XCircle
      default: return Clock
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'cancelled': return 'text-red-600'
      case 'no-show': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100'
      case 'cancelled': return 'bg-red-100'
      case 'no-show': return 'bg-orange-100'
      default: return 'bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/developer/${params.slug}/analytics`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analytics
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointment Analytics</h1>
          <p className="text-gray-600">Track booking trends, completion rates, and appointment performance</p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{appointmentData.overview.totalAppointments}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {appointmentData.overview.totalAppointmentsChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ml-1 ${appointmentData.overview.totalAppointmentsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(appointmentData.overview.totalAppointmentsChange)}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{appointmentData.overview.completionRate}%</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {appointmentData.overview.completionRateChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ml-1 ${appointmentData.overview.completionRateChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(appointmentData.overview.completionRateChange)}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{appointmentData.overview.averageRating}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-full">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {appointmentData.overview.averageRatingChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ml-1 ${appointmentData.overview.averageRatingChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(appointmentData.overview.averageRatingChange)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">{appointmentData.overview.cancelledAppointments}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {appointmentData.overview.noShowAppointments} no-shows
            </div>
          </div>
        </div>

        {/* Appointment Types & Top Properties */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Types</h3>
            <div className="space-y-4">
              {appointmentData.appointmentTypes.map((type, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{type.type}</p>
                    <p className="text-xs text-gray-500">{type.completed}/{type.count} completed</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{type.rate}%</div>
                    <div className="text-xs text-gray-500">completion</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Properties by Appointments</h3>
            <div className="space-y-4">
              {appointmentData.topProperties.map((property, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{property.name}</p>
                    <p className="text-xs text-gray-500">{property.completion}/{property.appointments} completed</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{property.rate}%</div>
                    <div className="text-xs text-gray-500">completion</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Appointments</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointmentData.recentAppointments.map((appointment) => {
                  const StatusIcon = getStatusIcon(appointment.status)
                  return (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {appointment.client}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.property}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.date} at {appointment.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBgColor(appointment.status)} ${getStatusColor(appointment.status)}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.rating ? (
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="ml-1">{appointment.rating}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Time Slots Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Time Slots</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(appointmentData.timeSlots).map(([time, count]) => (
              <div key={time} className="text-center">
                <div className="text-lg font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-500">{time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppointmentAnalytics
