'use client'

import React, { useState } from 'react'
import Layout1 from '../../../../layout/Layout1'


import HomeOwnerHeader from '@/app/components/homeOwner/HomeOwnerHeader'

import HomeOwnerNav from '@/app/components/homeOwner/HomeOwnerNav'

import { FiCalendar, FiClock, FiMapPin, FiUser, FiPhone, FiMail, FiCheckCircle, FiXCircle, FiClock as FiPending } from 'react-icons/fi'

const HomeOwnerBookings = () => {
    const [activeFilter, setActiveFilter] = useState('all')

    // Dummy data for bookings
    const bookings = [
        {
            id: 1,
            propertyName: "Luxury Apartment in East Legon",
            propertyAddress: "East Legon, Accra",
            propertyImage: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500",
            bookingDate: "2024-01-15",
            bookingTime: "10:00 AM",
            status: "confirmed",
            agentName: "Sarah Johnson",
            agentPhone: "+233 24 123 4567",
            agentEmail: "sarah.johnson@iskahomes.com",
            clientName: "Michael Brown",
            clientPhone: "+233 20 987 6543",
            clientEmail: "michael.brown@email.com",
            notes: "Interested in 3-bedroom units"
        },
        {
            id: 2,
            propertyName: "Modern Townhouse in Airport Residential",
            propertyAddress: "Airport Residential, Accra",
            propertyImage: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500",
            bookingDate: "2024-01-16",
            bookingTime: "2:30 PM",
            status: "pending",
            agentName: "David Wilson",
            agentPhone: "+233 26 456 7890",
            agentEmail: "david.wilson@iskahomes.com",
            clientName: "Emma Davis",
            clientPhone: "+233 54 321 0987",
            clientEmail: "emma.davis@email.com",
            notes: "Looking for family home with garden"
        },
        {
            id: 3,
            propertyName: "Penthouse in Cantonments",
            propertyAddress: "Cantonments, Accra",
            propertyImage: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500",
            bookingDate: "2024-01-17",
            bookingTime: "11:00 AM",
            status: "confirmed",
            agentName: "Lisa Chen",
            agentPhone: "+233 27 789 0123",
            agentEmail: "lisa.chen@iskahomes.com",
            clientName: "Robert Taylor",
            clientPhone: "+233 50 654 3210",
            clientEmail: "robert.taylor@email.com",
            notes: "Interested in high-end finishes"
        },
        {
            id: 4,
            propertyName: "Villa in Trasacco Valley",
            propertyAddress: "Trasacco Valley, Accra",
            propertyImage: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=500",
            bookingDate: "2024-01-18",
            bookingTime: "3:00 PM",
            status: "cancelled",
            agentName: "James Anderson",
            agentPhone: "+233 24 567 8901",
            agentEmail: "james.anderson@iskahomes.com",
            clientName: "Maria Garcia",
            clientPhone: "+233 55 123 4567",
            clientEmail: "maria.garcia@email.com",
            notes: "Cancelled due to schedule conflict"
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

    const filteredBookings = activeFilter === 'all' 
        ? bookings 
        : bookings.filter(booking => booking.status === activeFilter)

    return (
        <Layout1>
            <div className="flex">
                <HomeOwnerNav active={4} />
                <div className="flex-1 p-8">
                    <HomeOwnerHeader />
                    
                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Property Bookings</h2>
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

                                            {/* Agent and Client Info */}
                                            <div className="grid md:grid-cols-2 gap-4">
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

                                                <div className="bg-blue-50 rounded-lg p-4">
                                                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                                                        <FiUser className="w-4 h-4 mr-1" />
                                                        Client
                                                    </h4>
                                                    <p className="text-sm font-medium">{booking.clientName}</p>
                                                    <div className="text-xs text-gray-600 space-y-1 mt-1">
                                                        <p className="flex items-center">
                                                            <FiPhone className="w-3 h-3 mr-1" />
                                                            {booking.clientPhone}
                                                        </p>
                                                        <p className="flex items-center">
                                                            <FiMail className="w-3 h-3 mr-1" />
                                                            {booking.clientEmail}
                                                        </p>
                                                    </div>
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
        </Layout1>
    )
}

export default HomeOwnerBookings 