import React from 'react'
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi'

const BookingSchedule = () => {
  const bookings = [
    {
      id: 1,
      property: "Luxury Villa - East Legon",
      guest: "Michael Johnson",
      checkIn: "2024-02-15",
      checkOut: "2024-02-20",
      status: "Confirmed",
      time: "2:00 PM"
    },
    {
      id: 2,
      property: "Modern Apartment - Airport",
      guest: "Sarah Williams",
      checkIn: "2024-02-18",
      checkOut: "2024-02-25",
      status: "Pending",
      time: "3:30 PM"
    },
    {
      id: 3,
      property: "Townhouse - Cantonments",
      guest: "David Brown",
      checkIn: "2024-02-22",
      checkOut: "2024-02-28",
      status: "Confirmed",
      time: "1:00 PM"
    }
  ]

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800">Booking Schedule</h3>
        <FiCalendar className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 text-sm mb-1">{booking.property}</h4>
                <div className="flex items-center text-gray-600 text-xs mb-2">
                  <FiUser className="w-3 h-3 mr-1" />
                  <span>{booking.guest}</span>
                </div>
                <div className="flex items-center text-gray-600 text-xs">
                  <FiClock className="w-3 h-3 mr-1" />
                  <span>{booking.time}</span>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                {booking.status}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600">
                <span className="font-medium">Check-in:</span> {formatDate(booking.checkIn)}
              </div>
              <div className="text-gray-600">
                <span className="font-medium">Check-out:</span> {formatDate(booking.checkOut)}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 text-primary_color text-sm font-medium hover:text-primary_color/80 transition-colors">
        View All Bookings
      </button>
    </div>
  )
}

export default BookingSchedule 