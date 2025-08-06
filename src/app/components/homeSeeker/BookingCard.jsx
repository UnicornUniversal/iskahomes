import React from 'react'
import { FiCalendar, FiClock, FiMapPin, FiUser } from 'react-icons/fi'

const BookingCard = () => {
  const bookings = [
    {
      id: 1,
      property: "Luxury Villa - East Legon",
      agent: "John Agent",
      date: "2024-02-15",
      time: "2:00 PM",
      status: "Confirmed",
      type: "Property Viewing"
    },
    {
      id: 2,
      property: "Modern Apartment - Airport",
      agent: "Sarah Agent",
      date: "2024-02-18",
      time: "3:30 PM",
      status: "Pending",
      type: "Virtual Tour"
    },
    {
      id: 3,
      property: "Townhouse - Cantonments",
      agent: "Mike Agent",
      date: "2024-02-22",
      time: "1:00 PM",
      status: "Confirmed",
      type: "Property Viewing"
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
    <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-lg border border-green-100 p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <h3 className="text-base lg:text-lg font-bold text-green-900 flex items-center">
          <FiCalendar className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-green-600" />
          Upcoming Visits
        </h3>
      </div>
      
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="border border-green-200 rounded-xl p-3 lg:p-4 hover:shadow-md transition-all duration-300 hover:scale-[1.02] bg-white">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
              <div className="flex-1 mb-2 sm:mb-0">
                <h4 className="font-semibold text-green-900 text-xs lg:text-sm mb-1">{booking.property}</h4>
                <div className="flex items-center text-green-600 text-xs mb-1 lg:mb-2">
                  <FiUser className="w-3 h-3 mr-1" />
                  <span>{booking.agent}</span>
                </div>
                <div className="flex items-center text-green-600 text-xs">
                  <FiMapPin className="w-3 h-3 mr-1" />
                  <span>{booking.type}</span>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)} self-start sm:self-auto`}>
                {booking.status}
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs lg:text-sm gap-1">
              <div className="text-green-600">
                <span className="font-medium">Date:</span> {formatDate(booking.date)}
              </div>
              <div className="text-green-600">
                <span className="font-medium">Time:</span> {booking.time}
              </div>
            </div>
            
            <div className="flex space-x-2 mt-3">
              <button className="flex-1 px-2 lg:px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Reschedule
              </button>
              <button className="flex-1 px-2 lg:px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 text-green-600 text-sm font-medium hover:text-green-700 transition-colors">
        View All Bookings
      </button>
    </div>
  )
}

export default BookingCard 