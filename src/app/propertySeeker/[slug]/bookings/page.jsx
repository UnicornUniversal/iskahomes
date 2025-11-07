'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Layout1 from '../../../layout/Layout1'
import HomeSeekerHeader from '../../../components/homeSeeker/HomeSeekerHeader'
import { FiCalendar, FiClock, FiMapPin, FiUser, FiPhone, FiMail, FiCheckCircle, FiXCircle, FiClock as FiPending, FiEdit, FiTrash2, FiChevronDown, FiChevronUp, FiMessageSquare } from 'react-icons/fi'

const HomeSeekerBookings = () => {
    const params = useParams()
    const router = useRouter()
    const { user, propertySeekerToken } = useAuth()
    const [activeFilter, setActiveFilter] = useState('all')
    const [showRescheduleModal, setShowRescheduleModal] = useState(false)
    const [selectedBooking, setSelectedBooking] = useState(null)
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [newDate, setNewDate] = useState('')
    const [newTime, setNewTime] = useState('')
    const [newMeetingType, setNewMeetingType] = useState('')
    const [expandedCards, setExpandedCards] = useState({})

    // Fetch appointments
    useEffect(() => {
        const fetchAppointments = async () => {
            if (!user || !propertySeekerToken || user.user_type !== 'property_seeker') {
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                const response = await fetch('/api/appointments', {
                    headers: {
                        'Authorization': `Bearer ${propertySeekerToken}`
                    }
                })

                if (response.ok) {
                    const result = await response.json()
                    setAppointments(result.data || [])
                } else {
                    const errorData = await response.json()
                    setError(errorData.error || 'Failed to fetch appointments')
                }
            } catch (err) {
                console.error('Error fetching appointments:', err)
                setError('Failed to fetch appointments')
            } finally {
                setLoading(false)
            }
        }

        fetchAppointments()
    }, [user, propertySeekerToken])

    const filteredAppointments = activeFilter === 'all' 
        ? appointments 
        : appointments.filter(appointment => appointment.status === activeFilter)

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

    const toggleCardExpansion = (appointmentId) => {
        setExpandedCards(prev => ({
            ...prev,
            [appointmentId]: !prev[appointmentId]
        }))
    }

    const handleReschedule = (appointment) => {
        setSelectedBooking(appointment)
        setNewDate(new Date(appointment.appointment_date).toISOString().split('T')[0])
        setNewTime(appointment.appointment_time)
        setNewMeetingType(appointment.appointment_type)
        setShowRescheduleModal(true)
    }

    const handleRescheduleSubmit = () => {
        // TODO: Implement reschedule functionality
        console.log('Reschedule appointment:', selectedBooking.id, newDate, newTime, newMeetingType)
        setShowRescheduleModal(false)
    }

    const handleMessageOwner = (appointment) => {
        // Redirect to chat page with the listing owner
        const listing = appointment.listings
        const ownerId = listing?.user_id || appointment.account_id
        router.push(`/propertySeeker/${user.id}/messages?chat=${ownerId}&listing=${listing?.id}`)
    }

    return (
        <>
            <div className=" w-full">
                <HomeSeekerHeader />
                
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">My Appointments</h2>
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

                    <div className="space-y-3">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary_color mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading appointments...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-12">
                                <div className="text-red-400 mb-4">
                                    <FiCalendar className="w-16 h-16 mx-auto" />
                                </div>
                                <h3 className="text-lg font-medium text-red-600 mb-2">Error loading appointments</h3>
                                <p className="text-gray-500">{error}</p>
                            </div>
                        ) : filteredAppointments.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <FiCalendar className="w-16 h-16 mx-auto" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-600 mb-2">No appointments found</h3>
                                <p className="text-gray-500">
                                    {appointments.length === 0 
                                        ? "You haven't booked any appointments yet. Start exploring properties to schedule visits!"
                                        : "Try adjusting your filters to find what you're looking for."
                                    }
                                </p>
                            </div>
                            ) : (
                                filteredAppointments.map((appointment) => {
                                    const listing = appointment.listings
                                    const mainImage = listing?.media?.mediaFiles?.[0]?.url || listing?.media?.banner?.url
                                    const isExpanded = expandedCards[appointment.id] || false
                                    
                                    return (
                                        <div key={appointment.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                                            {/* Main Card Header - Always Visible */}
                                            <div className="p-4">
                                                <div className="flex items-start gap-4">
                                                    {/* Property Image - Smaller */}
                                                    <div className="w-20 h-20 flex-shrink-0">
                                                        {mainImage ? (
                                                            <img
                                                                src={mainImage}
                                                                alt={listing?.title}
                                                                className="w-full h-full object-cover rounded-lg"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                                <div className="text-white text-lg font-bold">
                                                                    {listing?.title?.charAt(0) || 'P'}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Main Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h3 className="text-lg font-semibold text-gray-800 truncate">
                                                                {listing?.title}
                                                            </h3>
                                                            <div className="flex items-center space-x-2 ml-2">
                                                                {getStatusIcon(appointment.status)}
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                                                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        <p className="text-sm text-gray-600 flex items-center mb-1">
                                                            <FiMapPin className="w-3 h-3 mr-1" />
                                                            {listing?.full_address || `${listing?.city}, ${listing?.state}`}
                                                        </p>
                                                        
                                                        <p className="text-sm text-gray-500 mb-2">
                                                            {listing?.currency} {parseFloat(listing?.price || 0).toLocaleString()}
                                                            {listing?.price_type === 'rent' && `/${listing?.duration}`}
                                                        </p>

                                                        {/* Quick Info Row */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                                <div className="flex items-center gap-1">
                                                                    <FiCalendar className="w-3 h-3" />
                                                                    <span>{new Date(appointment.appointment_date).toLocaleDateString()}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <FiClock className="w-3 h-3" />
                                                                    <span>{appointment.appointment_time}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <FiMapPin className="w-3 h-3" />
                                                                    <span className="capitalize">{appointment.appointment_type}</span>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Quick Message Button */}
                                                            <button
                                                                onClick={() => handleMessageOwner(appointment)}
                                                                className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-xs"
                                                            >
                                                                <FiMessageSquare className="w-3 h-3" />
                                                                <span>Message</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Expand/Collapse Button */}
                                                    <button
                                                        onClick={() => toggleCardExpansion(appointment.id)}
                                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        {isExpanded ? (
                                                            <FiChevronUp className="w-5 h-5 text-gray-500" />
                                                        ) : (
                                                            <FiChevronDown className="w-5 h-5 text-gray-500" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expandable Content */}
                                            {isExpanded && (
                                                <div className="border-t border-gray-100 p-4 bg-gray-50">
                                                    <div className="space-y-4">
                                                        {/* Detailed Appointment Info */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="flex items-center space-x-3">
                                                                <FiMapPin className="w-4 h-4 text-blue-600" />
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Meeting Location</p>
                                                                    <p className="text-sm font-medium">{appointment.meeting_location}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-3">
                                                                <FiClock className="w-4 h-4 text-blue-600" />
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Duration</p>
                                                                    <p className="text-sm font-medium">{appointment.duration} minutes</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Client Information Accordion */}
                                                        <div className="bg-white rounded-lg p-3">
                                                            <h4 className="text-sm font-medium text-gray-800 mb-2">Your Information</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                <div className="flex items-center space-x-2">
                                                                    <FiUser className="w-3 h-3 text-gray-600" />
                                                                    <span className="text-xs">{appointment.client_name}</span>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <FiPhone className="w-3 h-3 text-gray-600" />
                                                                    <span className="text-xs">{appointment.client_phone}</span>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <FiMail className="w-3 h-3 text-gray-600" />
                                                                    <span className="text-xs">{appointment.client_email}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Notes Accordion */}
                                                        {appointment.notes && (
                                                            <div className="bg-blue-50 rounded-lg p-3">
                                                                <h4 className="text-sm font-medium text-blue-800 mb-1">Notes</h4>
                                                                <p className="text-xs text-blue-700">{appointment.notes}</p>
                                                            </div>
                                                        )}

                                                        {/* Actions */}
                                                        <div className="flex space-x-2 pt-2">
                                                            {/* Message Owner Button - Always visible */}
                                                            <button
                                                                onClick={() => handleMessageOwner(appointment)}
                                                                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                                            >
                                                                <FiMessageSquare className="w-3 h-3" />
                                                                <span>Message Owner</span>
                                                            </button>

                                                            {appointment.status === 'pending' && (
                                                                <button
                                                                    onClick={() => handleReschedule(appointment)}
                                                                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                                                >
                                                                    <FiEdit className="w-3 h-3" />
                                                                    <span>Reschedule</span>
                                                                </button>
                                                            )}
                                                            {appointment.status === 'confirmed' && (
                                                                <button className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                                                                    <FiCheckCircle className="w-3 h-3" />
                                                                    <span>Confirmed</span>
                                                                </button>
                                                            )}
                                                            {appointment.status === 'cancelled' && (
                                                                <button className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                                                                    <FiXCircle className="w-3 h-3" />
                                                                    <span>Cancelled</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                    </div>
                </div>
            </div>

            {/* Reschedule Modal */}
            {showRescheduleModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Reschedule Appointment</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
                                <input
                                    type="date"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Time</label>
                                <input
                                    type="time"
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Type</label>
                                <select
                                    value={newMeetingType}
                                    onChange={(e) => setNewMeetingType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                                >
                                    <option value="in-person">In-Person</option>
                                    <option value="virtual">Virtual</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={handleRescheduleSubmit}
                                className="flex-1 px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors"
                            >
                                Reschedule
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
        </>
    )
}

export default HomeSeekerBookings