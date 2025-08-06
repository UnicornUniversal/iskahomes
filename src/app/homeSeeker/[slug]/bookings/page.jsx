'use client'

import React, { useState } from 'react'
import Layout1 from '../../../layout/Layout1'
import HomeSeekerHeader from '../../../components/homeSeeker/HomeSeekerHeader'
import HomeSeekerNav from '../../../components/homeSeeker/HomeSeekerNav'
import { FiCalendar, FiClock, FiMapPin, FiUser, FiPhone, FiMail, FiCheckCircle, FiXCircle, FiClock as FiPending, FiEdit, FiTrash2 } from 'react-icons/fi'

const HomeSeekerBookings = () => {
    const [activeFilter, setActiveFilter] = useState('all')
    const [showRescheduleModal, setShowRescheduleModal] = useState(false)
    const [selectedBooking, setSelectedBooking] = useState(null)
    const [newDate, setNewDate] = useState('')
    const [newTime, setNewTime] = useState('')

    // Dummy data for bookings
    const bookings = [
        {
            id: 1,
            propertyName: "Luxury Villa - East Legon",
            propertyAddress: "East Legon, Accra",
            propertyImage: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500",
            bookingDate: "2024-01-15",
            bookingTime: "10:00 AM",
            status: "confirmed",
            agentName: "Sarah Johnson",
            agentPhone: "+233 24 123 4567",
            agentEmail: "sarah.johnson@iskahomes.com",
            notes: "Interested in 3-bedroom units",
            propertyType: "Villa",
            price: "$2,500/month"
        },
        {
            id: 2,
            propertyName: "Modern Apartment - Airport",
            propertyAddress: "Airport Residential, Accra",
            propertyImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500",
            bookingDate: "2024-01-16",
            bookingTime: "2:30 PM",
            status: "pending",
            agentName: "David Wilson",
            agentPhone: "+233 26 456 7890",
            agentEmail: "david.wilson@iskahomes.com",
            notes: "Looking for family home with garden",
            propertyType: "Apartment",
            price: "$1,800/month"
        },
        {
            id: 3,
            propertyName: "Penthouse - Cantonments",
            propertyAddress: "Cantonments, Accra",
            propertyImage: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500",
            bookingDate: "2024-01-17",
            bookingTime: "11:00 AM",
            status: "confirmed",
            agentName: "Lisa Chen",
            agentPhone: "+233 27 789 0123",
            agentEmail: "lisa.chen@iskahomes.com",
            notes: "Interested in high-end finishes",
            propertyType: "Penthouse",
            price: "$3,200/month"
        },
        {
            id: 4,
            propertyName: "Townhouse - Trasacco Valley",
            propertyAddress: "Trasacco Valley, Accra",
            propertyImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500",
            bookingDate: "2024-01-18",
            bookingTime: "3:00 PM",
            status: "cancelled",
            agentName: "James Anderson",
            agentPhone: "+233 24 567 8901",
            agentEmail: "james.anderson@iskahomes.com",
            notes: "Cancelled due to schedule conflict",
            propertyType: "Townhouse",
            price: "$850,000"
        }
    ]

    const getStatusIcon = (status) => {
        switch (status) {
            case 'confirmed':
                return <FiCheckCircle className="w-5 h-5 text-green-500" />
            case 'pending':
                return <FiPending className="w-5 h-5 text-yellow-500" />
            case 'cancelled':
                return <FiXCircle className="w-5 h-5 text-red-500" />
            default:
                return <FiClock className="w-5 h-5 text-gray-500" />
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
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

    const handleReschedule = (booking) => {
        setSelectedBooking(booking)
        setNewDate(booking.bookingDate)
        setNewTime(booking.bookingTime)
        setShowRescheduleModal(true)
    }

    const handleRescheduleSubmit = () => {
        // Here you would typically make an API call to update the booking
        console.log('Rescheduling booking:', selectedBooking.id, 'to', newDate, newTime)
        setShowRescheduleModal(false)
        setSelectedBooking(null)
        // You could also update the local state here
    }

    const handleCancelBooking = (bookingId) => {
        // Here you would typically make an API call to cancel the booking
        console.log('Cancelling booking:', bookingId)
    }

    const filteredBookings = activeFilter === 'all' 
        ? bookings 
        : bookings.filter(booking => booking.status === activeFilter)

    return (
        <Layout1>
            <div className="flex">
                <HomeSeekerNav active={3} />
                <div className="flex-1 p-8">
                    <HomeSeekerHeader />
                    
                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">My Bookings</h2>
                            <div className="flex space-x-2">
                                {['all', 'confirmed', 'pending', 'cancelled'].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setActiveFilter(filter)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                            activeFilter === filter
                                                ? 'bg-primary_color text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-6">
                            {filteredBookings.map((booking) => (
                                <div key={booking.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        {/* Property Image */}
                                        <div className="lg:w-1/4">
                                            <img
                                                src={booking.propertyImage}
                                                alt={booking.propertyName}
                                                className="w-full h-48 lg:h-32 object-cover rounded-lg"
                                            />
                                        </div>

                                        {/* Booking Details */}
                                        <div className="lg:w-3/4 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-xl font-semibold text-gray-800 mb-1">
                                                        {booking.propertyName}
                                                    </h3>
                                                    <p className="text-gray-600 flex items-center">
                                                        <FiMapPin className="w-4 h-4 mr-1" />
                                                        {booking.propertyAddress}
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {booking.propertyType} • {booking.price}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {getStatusIcon(booking.status)}
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Booking Time */}
                                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                <div className="flex items-center">
                                                    <FiCalendar className="w-4 h-4 mr-1" />
                                                    {new Date(booking.bookingDate).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center">
                                                    <FiClock className="w-4 h-4 mr-1" />
                                                    {booking.bookingTime}
                                                </div>
                                            </div>

                                            {/* Agent Info */}
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                                                    <FiUser className="w-4 h-4 mr-1" />
                                                    Assigned Agent
                                                </h4>
                                                <p className="text-sm font-medium">{booking.agentName}</p>
                                                <div className="text-xs text-gray-600 space-y-1 mt-1">
                                                    <p className="flex items-center">
                                                        <FiPhone className="w-3 h-3 mr-1" />
                                                        {booking.agentPhone}
                                                    </p>
                                                    <p className="flex items-center">
                                                        <FiMail className="w-3 h-3 mr-1" />
                                                        {booking.agentEmail}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Notes */}
                                            {booking.notes && (
                                                <div className="bg-yellow-50 rounded-lg p-3">
                                                    <p className="text-sm text-gray-700">
                                                        <span className="font-medium">Notes:</span> {booking.notes}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex space-x-3">
                                                {booking.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => handleReschedule(booking)}
                                                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                    >
                                                        <FiEdit className="w-4 h-4" />
                                                        <span>Reschedule</span>
                                                    </button>
                                                )}
                                                {booking.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleReschedule(booking)}
                                                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                        >
                                                            <FiEdit className="w-4 h-4" />
                                                            <span>Reschedule</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancelBooking(booking.id)}
                                                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                            <span>Cancel</span>
                                                        </button>
                                                    </>
                                                )}
                                                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                                                    View Property
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredBookings.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <FiCalendar className="w-16 h-16 mx-auto" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-600 mb-2">No bookings found</h3>
                                <p className="text-gray-500">There are no bookings matching your current filter.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Reschedule Modal */}
            {showRescheduleModal && selectedBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Reschedule Booking</h3>
                        <p className="text-gray-600 mb-4">
                            Reschedule your visit to <strong>{selectedBooking.propertyName}</strong>
                        </p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">New Date</label>
                                <input
                                    type="date"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">New Time</label>
                                <input
                                    type="time"
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={handleRescheduleSubmit}
                                className="flex-1 px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors"
                            >
                                Confirm Reschedule
                            </button>
                            <button
                                onClick={() => setShowRescheduleModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout1>
    )
}

export default HomeSeekerBookings 