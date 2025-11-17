"use client"
import React, { useState } from 'react'
import { 
  FiCalendar, 
  FiClock, 
  FiMapPin, 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiEdit3, 
  FiCheck, 
  FiX,
  FiLoader,
  FiVideo,
  FiHome,
  FiImage
} from 'react-icons/fi'
import moment from 'moment'
import { toast } from 'react-toastify'
import Image from 'next/image'

const AppointmentsList = ({ 
  appointments, 
  loading, 
  loadingMore, 
  hasMore, 
  onLoadMore,
  onUpdateStatus,
  onViewDetails,
  updatingStatus,
  editingAppointment,
  setEditingAppointment
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return '✓'
      case 'pending': return '⏳'
      case 'completed': return '✓'
      case 'cancelled': return '✕'
      default: return '•'
    }
  }

  // Get first image from listing media
  const getFirstImage = (listing) => {
    if (!listing?.media) return null
    
    try {
      const media = typeof listing.media === 'string' ? JSON.parse(listing.media) : listing.media
      if (media?.albums && media.albums.length > 0) {
        const firstAlbum = media.albums[0]
        if (firstAlbum?.images && firstAlbum.images.length > 0) {
          return firstAlbum.images[0].url
        }
      }
    } catch (error) {
      console.error('Error parsing media:', error)
    }
    return null
  }

  // Get location string
  const getLocationString = (listing) => {
    if (!listing) return 'Location not specified'
    
    const parts = []
    if (listing.town) parts.push(listing.town)
    if (listing.city) parts.push(listing.city)
    if (listing.state) parts.push(listing.state)
    if (listing.country) parts.push(listing.country)
    
    if (listing.full_address) {
      return listing.full_address
    }
    
    return parts.length > 0 ? parts.join(', ') : 'Location not specified'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiLoader className="w-8 h-8 animate-spin text-primary_color mr-3" />
        <span className="text-gray-600">Loading appointments...</span>
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-12">
        <FiCalendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
        <p className="text-gray-600">You don't have any appointments yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => {
        const listing = appointment?.listings
        const firstImage = getFirstImage(listing)
        const locationString = getLocationString(listing)
        
        return (
          <div key={appointment.id} className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Row 1: Property Details */}
              <div className="flex flex-col sm:flex-row lg:flex-col lg:w-80 xl:w-96 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100">
                {/* Property Image */}
                {firstImage ? (
                  <div className="sm:w-48 md:w-56 lg:w-full flex-shrink-0 h-48 sm:h-auto lg:h-48">
                    <a 
                      href={`/property/${listing?.listing_type}/${listing?.slug}/${listing?.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full h-full relative"
                    >
                      <Image
                        src={firstImage}
                        alt={listing?.title || 'Property image'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 384px"
                      />
                    </a>
                  </div>
                ) : (
                  <div className="sm:w-48 md:w-56 lg:w-full flex-shrink-0 h-48 sm:h-auto lg:h-48 bg-gray-100 flex items-center justify-center">
                    <FiImage className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                {/* Property Info */}
                <div className="flex-1 p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                        <a 
                          href={`/property/${listing?.listing_type}/${listing?.slug}/${listing?.id}`}
                          className="hover:text-primary_color transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {listing?.title || 'Unknown Property'}
                        </a>
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiMapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="break-words">{locationString}</span>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)} {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                      {editingAppointment === appointment.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => onUpdateStatus(appointment.id, 'confirmed')}
                            disabled={updatingStatus === appointment.id}
                            className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                          >
                            {updatingStatus === appointment.id ? (
                              <FiLoader className="w-4 h-4 animate-spin" />
                            ) : (
                              <FiCheck className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingAppointment(null)}
                            disabled={updatingStatus === appointment.id}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded disabled:opacity-50"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingAppointment(appointment.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                        >
                          <FiEdit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Meeting Details */}
              <div className="flex-1 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <FiCalendar className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {moment(appointment.appointment_date).format('MMM D, YYYY')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <FiClock className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Time</p>
                      <p className="text-sm font-medium text-gray-900">
                        {moment(appointment.appointment_date).format('HH:mm')} - {moment(appointment.appointment_date).add(appointment.duration || 60, 'minutes').format('HH:mm')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      {appointment.appointment_type === 'virtual' ? (
                        <FiVideo className="w-5 h-5 text-gray-600" />
                      ) : (
                        <FiHome className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Type</p>
                      <p className="text-sm font-medium text-gray-900">
                        {appointment.appointment_type === 'virtual' ? 'Virtual' : 'In Person'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button 
                    onClick={() => onViewDetails(appointment)}
                    className="flex-1 bg-primary_color text-white py-2.5 px-4 rounded-lg hover:bg-primary_color/90 transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                  {appointment.status === 'pending' && (
                    <button 
                      onClick={() => onUpdateStatus(appointment.id, 'confirmed')}
                      disabled={updatingStatus === appointment.id}
                      className="flex-1 bg-green-500 text-white py-2.5 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center"
                    >
                      {updatingStatus === appointment.id ? (
                        <>
                          <FiLoader className="w-4 h-4 animate-spin mr-2" />
                          Confirming...
                        </>
                      ) : (
                        'Confirm'
                      )}
                    </button>
                  )}
                  {appointment.status === 'confirmed' && (
                    <button 
                      onClick={() => onUpdateStatus(appointment.id, 'completed')}
                      disabled={updatingStatus === appointment.id}
                      className="flex-1 bg-blue-500 text-white py-2.5 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center"
                    >
                      {updatingStatus === appointment.id ? (
                        <>
                          <FiLoader className="w-4 h-4 animate-spin mr-2" />
                          Completing...
                        </>
                      ) : (
                        'Mark Complete'
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Row 3: Client Information and Notes - Hidden on small/medium, visible on large */}
              <div className="hidden lg:block flex-1 p-4 sm:p-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* Client Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FiUser className="w-4 h-4 text-gray-500" />
                      Client Information
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <FiUser className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700">{appointment?.client_name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FiMail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700 truncate">{appointment?.client_email || 'No email'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FiPhone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700">{appointment?.client_phone || 'No phone'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Client Notes */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Client Notes</h4>
                    {appointment?.notes ? (
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        {appointment.notes}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No notes provided</p>
                    )}
                    
                    {/* Agent Response */}
                    {appointment?.response && (
                      <div className="mt-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Agent Response</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200">
                          {appointment.response?.additional_notes || 'No response notes'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
      
      {/* Load More Button */}
      {hasMore && !loadingMore && (
        <div className="text-center py-6">
          <button
            onClick={onLoadMore}
            className="px-6 py-3 bg-primary_color text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Load More Appointments
          </button>
        </div>
      )}
      
      {/* Loading More */}
      {loadingMore && (
        <div className="flex items-center justify-center py-6">
          <FiLoader className="w-6 h-6 animate-spin text-primary_color mr-3" />
          <span className="text-gray-600">Loading more appointments...</span>
        </div>
      )}
    </div>
  )
}

export default AppointmentsList

