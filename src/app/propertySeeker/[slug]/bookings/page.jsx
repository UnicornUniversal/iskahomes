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
                return 'bg-primary_color/10 text-primary_color border-primary_color/20'
            case 'pending':
                return 'bg-secondary_color/10 text-secondary_color border-secondary_color/20'
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
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
            <HomeSeekerHeader />
            
            <div className="mt-6 lg:mt-8">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl lg:text-3xl font-bold text-primary_color mb-2 flex items-center gap-3">
                            <div className="p-2 bg-secondary_color/10 rounded-lg">
                                <FiCalendar className="w-6 h-6 text-secondary_color" />
                            </div>
                            My Appointments
                        </h2>
                        <p className="text-primary_color/60 text-sm">Manage your property visits</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['all', 'confirmed', 'pending', 'cancelled'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                    activeFilter === filter
                                        ? 'bg-primary_color text-white shadow-lg shadow-primary_color/20'
                                        : 'default_bg text-primary_color hover:bg-primary_color/10 border border-primary_color/10'
                                }`}
                            >
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-16">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary_color/20 border-t-primary_color mx-auto mb-4"></div>
                            <p className="text-primary_color/70 font-medium">Loading appointments...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-16 default_bg rounded-2xl border border-primary_color/10">
                            <div className="text-red-400 mb-4">
                                <FiCalendar className="w-20 h-20 mx-auto" />
                            </div>
                            <h3 className="text-xl font-bold text-red-600 mb-2">Error loading appointments</h3>
                            <p className="text-primary_color/60">{error}</p>
                        </div>
                    ) : filteredAppointments.length === 0 ? (
                        <div className="text-center py-16 default_bg rounded-2xl border border-primary_color/10">
                            <div className="text-primary_color/30 mb-4">
                                <FiCalendar className="w-20 h-20 mx-auto" />
                            </div>
                            <h3 className="text-xl font-bold text-primary_color mb-2">No appointments found</h3>
                            <p className="text-primary_color/60 max-w-md mx-auto">
                                {appointments.length === 0 
                                    ? "You haven't booked any appointments yet. Start exploring properties to schedule visits!"
                                    : "Try adjusting your filters to find what you're looking for."
                                }
                            </p>
                        </div>
                    ) : (
                        filteredAppointments.map((appointment) => {
                            const listing = appointment.listings
                            
                            // Extract image from media
                            const getMainImage = () => {
                              if (!listing?.media) return null
                              
                              try {
                                const media = typeof listing.media === 'string' 
                                  ? JSON.parse(listing.media) 
                                  : listing.media
                                
                                if (!media || typeof media !== 'object') return null
                                
                                if (media.albums && Array.isArray(media.albums) && media.albums.length > 0) {
                                  for (const album of media.albums) {
                                    if (album?.images && Array.isArray(album.images) && album.images.length > 0) {
                                      return album.images[0].url
                                    }
                                  }
                                }
                                
                                if (media.mediaFiles && Array.isArray(media.mediaFiles) && media.mediaFiles.length > 0) {
                                  return media.mediaFiles[0].url
                                }
                                
                                if (media.banner?.url) {
                                  return media.banner.url
                                }
                                
                                return null
                              } catch (err) {
                                return null
                              }
                            }
                            
                            const mainImage = getMainImage()
                            const isExpanded = expandedCards[appointment.id] || false
                            
                            return (
                                <div key={appointment.id} className="default_bg rounded-2xl shadow-lg border border-primary_color/10 overflow-hidden hover:shadow-xl transition-all duration-300">
                                    {/* Main Card Header - Always Visible */}
                                    <div className="p-4 lg:p-6">
                                        <div className="flex items-start gap-4">
                                            {/* Property Image */}
                                            <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden border-2 border-primary_color/10">
                                                {mainImage ? (
                                                    <img
                                                        src={mainImage}
                                                        alt={listing?.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-primary_color to-secondary_color flex items-center justify-center">
                                                        <div className="text-white text-xl font-bold">
                                                            {listing?.title?.charAt(0) || 'P'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Main Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-primary_color mb-1.5 truncate">
                                                            {listing?.title}
                                                        </h3>
                                                        <p className="text-sm text-primary_color/70 flex items-center mb-1">
                                                            <FiMapPin className="w-3 h-3 mr-1.5 flex-shrink-0" />
                                                            <span className="truncate">{listing?.full_address || `${listing?.city}, ${listing?.state}`}</span>
                                                        </p>
                                                        <p className="text-base font-bold text-secondary_color">
                                                            {listing?.currency} {parseFloat(listing?.price || 0).toLocaleString()}
                                                            {listing?.price_type === 'rent' && `/${listing?.duration}`}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        {getStatusIcon(appointment.status)}
                                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                                                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Quick Info Row */}
                                                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-primary_color/10">
                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-primary_color/70">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="p-1 bg-primary_color/10 rounded">
                                                                <FiCalendar className="w-3 h-3 text-primary_color" />
                                                            </div>
                                                            <span className="font-medium">{new Date(appointment.appointment_date).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="p-1 bg-primary_color/10 rounded">
                                                                <FiClock className="w-3 h-3 text-primary_color" />
                                                            </div>
                                                            <span className="font-medium">{appointment.appointment_time}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="p-1 bg-primary_color/10 rounded">
                                                                <FiMapPin className="w-3 h-3 text-primary_color" />
                                                            </div>
                                                            <span className="font-medium capitalize">{appointment.appointment_type}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        {/* Quick Message Button */}
                                                        <button
                                                            onClick={() => handleMessageOwner(appointment)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary_color/10 text-primary_color rounded-lg hover:bg-primary_color/20 transition-colors text-xs font-medium"
                                                        >
                                                            <FiMessageSquare className="w-3 h-3" />
                                                            <span>Message</span>
                                                        </button>
                                                        
                                                        {/* Expand/Collapse Button */}
                                                        <button
                                                            onClick={() => toggleCardExpansion(appointment.id)}
                                                            className="p-2 hover:bg-primary_color/10 rounded-lg transition-colors"
                                                        >
                                                            {isExpanded ? (
                                                                <FiChevronUp className="w-5 h-5 text-primary_color" />
                                                            ) : (
                                                                <FiChevronDown className="w-5 h-5 text-primary_color" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expandable Content */}
                                    {isExpanded && (
                                        <div className="border-t border-primary_color/10 p-4 lg:p-6 bg-primary_color/5">
                                            <div className="space-y-4">
                                                {/* Detailed Appointment Info */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="flex items-center gap-3 default_bg p-3 rounded-xl border border-primary_color/10">
                                                        <div className="p-2 bg-primary_color/10 rounded-lg">
                                                            <FiMapPin className="w-4 h-4 text-primary_color" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-primary_color/60 font-medium">Meeting Location</p>
                                                            <p className="text-sm font-bold text-primary_color">{appointment.meeting_location}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 default_bg p-3 rounded-xl border border-primary_color/10">
                                                        <div className="p-2 bg-primary_color/10 rounded-lg">
                                                            <FiClock className="w-4 h-4 text-primary_color" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-primary_color/60 font-medium">Duration</p>
                                                            <p className="text-sm font-bold text-primary_color">{appointment.duration} minutes</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Client Information */}
                                                <div className="default_bg rounded-xl p-4 border border-primary_color/10">
                                                    <h4 className="text-sm font-bold text-primary_color mb-3 flex items-center gap-2">
                                                        <div className="w-1 h-4 bg-primary_color rounded-full"></div>
                                                        Your Information
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <FiUser className="w-4 h-4 text-primary_color/60" />
                                                            <span className="text-sm text-primary_color/80">{appointment.client_name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <FiPhone className="w-4 h-4 text-primary_color/60" />
                                                            <span className="text-sm text-primary_color/80">{appointment.client_phone}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <FiMail className="w-4 h-4 text-primary_color/60" />
                                                            <span className="text-sm text-primary_color/80 truncate">{appointment.client_email}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Notes */}
                                                {appointment.notes && (
                                                    <div className="default_bg rounded-xl p-4 border border-secondary_color/20 bg-secondary_color/5">
                                                        <h4 className="text-sm font-bold text-primary_color mb-2 flex items-center gap-2">
                                                            <div className="w-1 h-4 bg-secondary_color rounded-full"></div>
                                                            Notes
                                                        </h4>
                                                        <p className="text-sm text-primary_color/80">{appointment.notes}</p>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex flex-wrap gap-3 pt-2">
                                                    <button
                                                        onClick={() => handleMessageOwner(appointment)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors text-sm font-medium shadow-lg shadow-primary_color/20"
                                                    >
                                                        <FiMessageSquare className="w-4 h-4" />
                                                        <span>Message Owner</span>
                                                    </button>

                                                    {appointment.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleReschedule(appointment)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-secondary_color text-white rounded-lg hover:bg-secondary_color/90 transition-colors text-sm font-medium shadow-lg shadow-secondary_color/20"
                                                        >
                                                            <FiEdit className="w-4 h-4" />
                                                            <span>Reschedule</span>
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

            {/* Reschedule Modal */}
            {showRescheduleModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="default_bg rounded-2xl shadow-2xl max-w-md w-full p-6 border border-primary_color/10">
                        <h3 className="text-xl font-bold text-primary_color mb-6">Reschedule Appointment</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-primary_color mb-2">New Date</label>
                                <input
                                    type="date"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    className="w-full px-4 py-3 border border-primary_color/20 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-primary_color outline-none default_bg text-primary_color"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-primary_color mb-2">New Time</label>
                                <input
                                    type="time"
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                    className="w-full px-4 py-3 border border-primary_color/20 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-primary_color outline-none default_bg text-primary_color"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary_color mb-2">Meeting Type</label>
                                <select
                                    value={newMeetingType}
                                    onChange={(e) => setNewMeetingType(e.target.value)}
                                    className="w-full px-4 py-3 border border-primary_color/20 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-primary_color outline-none default_bg text-primary_color"
                                >
                                    <option value="in-person">In-Person</option>
                                    <option value="virtual">Virtual</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleRescheduleSubmit}
                                className="flex-1 px-4 py-3 bg-primary_color text-white rounded-xl hover:bg-primary_color/90 transition-colors font-medium shadow-lg shadow-primary_color/20"
                            >
                                Reschedule
                            </button>
                            <button
                                onClick={() => setShowRescheduleModal(false)}
                                className="flex-1 px-4 py-3 default_bg text-primary_color rounded-xl hover:bg-primary_color/10 transition-colors font-medium border border-primary_color/10"
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