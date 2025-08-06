"use client"
import React, { useState, useRef, useEffect } from 'react'
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
  FiEye,
  FiVideo,
  FiHome,
  FiFilter,
  FiSearch,
  FiGrid,
  FiList,
  FiTrash2
} from 'react-icons/fi'
import { appointments } from '../Data/Data'
import DeveloperNav from './DeveloperNav'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// Custom CSS for modern calendar styling
const calendarStyles = `
  .rbc-calendar {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    width: 100% !important;
    max-width: 100% !important;
  }
  
  .rbc-calendar * {
    box-sizing: border-box;
  }
  
  .rbc-header {
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 8px 4px;
    font-weight: 600;
    font-size: 12px;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .rbc-month-view {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    width: 100% !important;
    min-width: 800px;
  }
  
  .rbc-month-row {
    border-bottom: 1px solid #f3f4f6;
    min-height: 120px;
    display: flex;
  }
  
  
  
  .rbc-off-range-bg {
    background-color: #f9fafb;
  }
  
  .rbc-off-range {
    color: #9ca3af;
  }
  
  .rbc-today {
    background-color: #eff6ff;
  }
  
  .rbc-date-cell {
    padding: 6px 8px;
    font-size: 12px;
    color: #374151;
   
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 100px;
    align-items: center;
    justify-content: flex-start;
  }
  
  .rbc-event {
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    padding: 4px 6px;
    margin: 1px 2px;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    width: calc(100% - 4px) !important;
    max-width: calc(100% - 4px) !important;
    overflow: visible !important;
    min-height: 28px;
    max-height: 60px;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    text-align: center !important;
    position: relative;
    word-wrap: break-word;
    word-break: break-word;
    white-space: normal !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
  }
  
  .rbc-event-content {
    font-size: 11px;
    font-weight: 500;
    line-height: 1.3;
    width: 100% !important;
    text-align: center !important;
    overflow: visible !important;
    text-overflow: clip !important;
    white-space: normal !important;
    word-wrap: break-word !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
  }
  
  .rbc-toolbar {
    margin-bottom: 16px;
    padding: 0;
  }
  
  
  
  .rbc-toolbar button:hover {
    background-color: #f9fafb;
  }
  
  
  
  .rbc-toolbar-label {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
  }
  
  .rbc-btn-group button {
    font-size: 12px;
    padding: 6px 12px;
  }
  
  /* Day view specific styling */
  .rbc-time-view {
    min-height: 600px;
    width: 100% !important;
  }
  
  .rbc-time-content {
    min-height: 500px;
  }
  
 

  
  /* Week view styling */
  .rbc-week-view {
    width: 100% !important;
    min-width: 800px;
  }
  
  /* Week view specific event styling */
  .rbc-week-view .rbc-event {
    width: calc(100% - 4px) !important;
    max-width: calc(100% - 4px) !important;
    overflow: visible !important;
    white-space: normal !important;
    word-wrap: break-word !important;
    text-align: center !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    font-size: 10px !important;
    padding: 2px 4px !important;
    margin: 1px !important;
    min-height: 24px !important;
    max-height: 50px !important;
  }
  
  .rbc-week-view .rbc-event-content {
    width: 100% !important;
    text-align: center !important;
    overflow: visible !important;
    text-overflow: clip !important;
    white-space: normal !important;
    word-wrap: break-word !important;
    font-size: 10px !important;
    line-height: 1.2 !important;
  }
  
  /* Week view time slots */
  .rbc-week-view .rbc-time-slot {
    min-height: 30px !important;
  }
  
  /* Week view day slots */
  .rbc-week-view .rbc-day-slot {
    min-width: 120px !important;
  }
  
  /* Week view headers */
  .rbc-week-view .rbc-header {
    min-width: 120px !important;
    padding: 8px 4px !important;
    font-size: 11px !important;
  }
  
  /* Mobile responsive - allow horizontal scroll */
  @media (max-width: 768px) {
    .rbc-calendar {
      overflow-x: auto !important;
      overflow-y: hidden !important;
    }
    
    .rbc-month-view,
    .rbc-week-view,
    .rbc-time-view {
      min-width: 800px !important;
      width: 800px !important;
    }
    
    .rbc-date-cell {
      min-width: 100px !important;
    }
    
    .rbc-header {
      min-width: 100px !important;
    }
    
    /* Mobile week view specific */
    .rbc-week-view .rbc-day-slot {
      min-width: 100px !important;
    }
    
    .rbc-week-view .rbc-header {
      min-width: 100px !important;
    }
    
    .rbc-week-view .rbc-event {
      font-size: 9px !important;
      padding: 1px 3px !important;
      min-height: 20px !important;
      max-height: 40px !important;
    }
    
    .rbc-week-view .rbc-event-content {
      font-size: 9px !important;
      line-height: 1.1 !important;
    }
  }
`

const Appointments = () => {
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingAppointment, setEditingAppointment] = useState(null)
  // const [viewMode, setViewMode] = useState('calendar') // 'list' or 'calendar'
  const [viewMode, setViewMode] = useState('list') // Only list view for now
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  
  const localizer = momentLocalizer(moment)

  // Custom Toolbar Component
  const CustomToolbar = (toolbar) => {
    const goToToday = () => {
      toolbar.onNavigate('TODAY')
    }

    const goToPrevious = () => {
      toolbar.onNavigate('PREV')
    }

    const goToNext = () => {
      toolbar.onNavigate('NEXT')
    }

    const viewNames = {
      month: 'Month',
      week: 'Week',
      day: 'Day'
    }

    return (
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevious}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <h2 className="text-sm font-semibold text-gray-900 ml-2">
            {toolbar.label}
          </h2>
        </div>
        
        <div className="flex items-center gap-1">
          {toolbar.views.map(view => (
            <button
              key={view}
              onClick={() => toolbar.onView(view)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                toolbar.view === view
                  ? 'bg-primary_color text-white'
                  : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {viewNames[view]}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Custom Event Component
  const CustomEvent = ({ event }) => {
    const startTime = moment(event.start).format('HH:mm')
    const endTime = moment(event.end).format('HH:mm')
    const timeRange = `${startTime}-${endTime}`
    
    return (
      <div className="text-xs font-medium w-full h-full flex flex-col justify-center items-center text-center p-1" style={{ textAlign: 'center', width: '100%' }}>
        <div className="font-semibold text-white text-center text-xs leading-tight mb-0.5" title={event.title} style={{ width: '100%', textAlign: 'center' }}>
          {event.title}
        </div>
        <div className="text-xs opacity-90 font-normal text-white text-center leading-tight" style={{ width: '100%', textAlign: 'center' }}>
          {timeRange}
        </div>
      </div>
    )
  }

  // Convert appointments to calendar events
  const calendarEvents = appointments.map(appointment => {
    const startDateTime = moment(`${appointment.date} ${appointment.start_time}`, 'YYYY-MM-DD HH:mm')
    const endDateTime = moment(`${appointment.date} ${appointment.end_time}`, 'YYYY-MM-DD HH:mm')
    
    return {
      id: appointment.id,
      title: `${appointment?.homeseeker?.name || 'Unknown Client'} - ${appointment?.development_and_unit?.development_name || 'Unknown Property'}`,
      start: startDateTime.toDate(),
      end: endDateTime.toDate(),
      appointment: appointment, // Store the full appointment data
      resource: appointment
    }
  })

  // Update calendar events when appointments change
  // useEffect(() => {
  //   if (calendarInstance.current && viewMode === 'calendar') {
  //     calendarInstance.current.setEvents(
  //       filteredAppointments.map(appointment => {
  //         // Format dates as YYYY-MM-DD HH:mm for Schedule X
  //         const startDateTime = `${appointment.date} ${appointment.start_time}`
  //         const endDateTime = `${appointment.date} ${appointment.end_time}`
          
  //         return {
  //           id: appointment.id,
  //           title: `${appointment?.homeseeker?.name || 'Unknown Client'} - ${appointment?.development_and_unit?.development_name || 'Unknown Property'}`,
  //           start: startDateTime,
  //           end: endDateTime,
  //           color: getStatusColorForCalendar(appointment.status),
  //           description: appointment.notes || '',
  //           location: appointment.location,
  //           type: appointment.appointment_type
  //         }
  //       })
  //     )
  //   }
  // }, [filteredAppointments, viewMode])

  const getStatusColorForCalendar = (status) => {
    switch (status) {
      case 'confirmed': return '#10B981' // green
      case 'pending': return '#F59E0B' // yellow
      case 'completed': return '#3B82F6' // blue
      case 'cancelled': return '#EF4444' // red
      default: return '#6B7280' // gray
    }
  }

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

  const updateAppointmentStatus = (appointmentId, newStatus) => {
    // In a real app, this would update the database
    console.log(`Updating appointment ${appointmentId} to status: ${newStatus}`)
    setEditingAppointment(null)
  }

  const handleEventSelect = (event) => {
    setSelectedEvent(event)
    setIsEventModalOpen(true)
  }

  const handleEventUpdate = (eventId, updatedData) => {
    // In a real app, this would update the database
    console.log('Updating event:', eventId, updatedData)
    
    // Update the appointments array (for demo purposes)
    const updatedAppointments = appointments.map(appointment => {
      if (appointment.id === eventId) {
        return {
          ...appointment,
          status: updatedData.status,
          notes: updatedData.notes,
          location: updatedData.location,
          appointment_type: updatedData.appointment_type,
          date: updatedData.date,
          start_time: updatedData.start_time,
          end_time: updatedData.end_time
        }
      }
      return appointment
    })
    
    // In a real app, you would call an API to update the appointment
    console.log('Updated appointments:', updatedAppointments)
  }

  const closeEventModal = () => {
    setIsEventModalOpen(false)
    setSelectedEvent(null)
  }

  // Event Modal Component
  const EventModal = ({ event, isOpen, onClose, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
      status: event?.appointment?.status || 'pending',
      notes: event?.appointment?.notes || '',
      location: event?.appointment?.location || '',
      appointment_type: event?.appointment?.appointment_type || 'in_person',
      date: event?.start ? moment(event.start).format('YYYY-MM-DD') : '',
      start_time: event?.start ? moment(event.start).format('HH:mm') : '',
      end_time: event?.end ? moment(event.end).format('HH:mm') : ''
    })

    const handleSubmit = (e) => {
      e.preventDefault()
      onUpdate(event.id, formData)
      setIsEditing(false)
    }

    const handleInputChange = (field, value) => {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }

    const handleEdit = () => {
      setIsEditing(true)
    }

    const handleCancelEdit = () => {
      setIsEditing(false)
      // Reset form data to original values
      setFormData({
        status: event?.appointment?.status || 'pending',
        notes: event?.appointment?.notes || '',
        location: event?.appointment?.location || '',
        appointment_type: event?.appointment?.appointment_type || 'in_person',
        date: event?.start ? moment(event.start).format('YYYY-MM-DD') : '',
        start_time: event?.start ? moment(event.start).format('HH:mm') : '',
        end_time: event?.end ? moment(event.end).format('HH:mm') : ''
      })
    }

    if (!isOpen || !event) return null

    const appointment = event.appointment
    const homeseeker = appointment?.homeseeker
    const development = appointment?.development_and_unit

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(appointment?.status).split(' ')[0]}`}></div>
              <h3 className="text-sm font-semibold text-gray-900">
                {homeseeker?.name || 'Unknown Client'} - {development?.development_name || 'Unknown Property'}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleEdit}
                className="p-1 text-white hover:text-gray-200 hover:bg-gray-700 rounded"
              >
                <FiEdit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {/* Delete functionality */}}
                className="p-1 text-white hover:text-red-300 hover:bg-red-600 rounded"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1 text-white hover:text-gray-200 hover:bg-gray-700 rounded"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {!isEditing ? (
              // View Mode
              <>
                {/* Date and Time */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiCalendar className="w-4 h-4" />
                  <span>{moment(event.start).format('dddd, D MMMM')} · {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}</span>
                </div>

                {/* Appointment Type */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {appointment?.appointment_type === 'video_call' ? (
                    <FiVideo className="w-4 h-4" />
                  ) : (
                    <FiHome className="w-4 h-4" />
                  )}
                  <span className="capitalize">
                    {appointment?.appointment_type === 'video_call' ? 'Video Call' : 'In Person'}
                  </span>
                </div>

                {/* Location */}
                {appointment?.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiMapPin className="w-4 h-4" />
                    <span>{appointment.location}</span>
                  </div>
                )}

                {/* Client Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                    <FiUser className="w-4 h-4" />
                    Client Information
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-600">Name</label>
                      <p className="text-sm text-gray-900">{homeseeker?.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Email</label>
                      <p className="text-sm text-gray-900">{homeseeker?.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Phone</label>
                      <p className="text-sm text-gray-900">{homeseeker?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Property Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                    <FiHome className="w-4 h-4" />
                    Property Information
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-600">Development</label>
                      <p className="text-sm text-gray-900">{development?.development_name || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Unit</label>
                      <p className="text-sm text-gray-900">{development?.unit_name || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Location</label>
                      <p className="text-sm text-gray-900">{appointment?.location || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {appointment?.notes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Notes</h4>
                    <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      {appointment.notes}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleInputChange('status', 'confirmed')}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleInputChange('status', 'cancelled')}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEdit}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </>
            ) : (
              // Edit Mode
              <form onSubmit={handleSubmit} className="space-y-4">
                <h4 className="font-semibold text-gray-900 text-sm">Edit Appointment</h4>
                
                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => handleInputChange('start_time', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => handleInputChange('end_time', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Appointment Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Appointment Type</label>
                  <select
                    value={formData.appointment_type}
                    onChange={(e) => handleInputChange('appointment_type', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                  >
                    <option value="in_person">In Person</option>
                    <option value="video_call">Video Call</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    placeholder="Enter meeting location"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    placeholder="Add any additional notes..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-1 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs bg-primary_color text-white hover:bg-blue-700 rounded transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <style dangerouslySetInnerHTML={{ __html: calendarStyles }} />
    
    
    
      
      <div className="flex-1 p-6 overflow-hidden">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointments</h1>
          <p className="text-gray-600">Manage and track all property viewing appointments</p>
        </div>

        {/* View Toggle */}
        {/* <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'bg-primary_color text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FiList className="w-4 h-4" />
              <span className="text-sm font-medium">List View</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                viewMode === 'calendar' 
                  ? 'bg-primary_color text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FiGrid className="w-4 h-4" />
              <span className="text-sm font-medium">Calendar View</span>
            </button>
          </div>
        </div> */}

        {/* Filters and Search */}
        {/* <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by client name or property..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400 w-5 h-5" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div> */}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Appointments', value: appointments.length, color: 'bg-blue-500' },
            { label: 'Pending', value: appointments.filter(a => a.status === 'pending').length, color: 'bg-yellow-500' },
            { label: 'Confirmed', value: appointments.filter(a => a.status === 'confirmed').length, color: 'bg-green-500' },
            { label: 'Completed', value: appointments.filter(a => a.status === 'completed').length, color: 'bg-purple-500' }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <FiCalendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Calendar View */}
        {/* {viewMode === 'calendar' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="w-full overflow-x-auto" style={{ maxWidth: '100%' }}>
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 700, minWidth: '800px', width: '100%' }}
                defaultView="month"
                views={['month', 'week', 'day']}
                step={60}
                timeslots={1}
                selectable
                popup
                className="text-xs"
                onSelectEvent={handleEventSelect}
                eventPropGetter={(event) => {
                  const status = event.appointment?.status
                  let backgroundColor = '#6B7280' // default gray
                  
                  switch (status) {
                    case 'confirmed': backgroundColor = '#10B981'; break // green
                    case 'pending': backgroundColor = '#F59E0B'; break // yellow
                    case 'completed': backgroundColor = '#3B82F6'; break // blue
                    case 'cancelled': backgroundColor = '#EF4444'; break // red
                    default: backgroundColor = '#6B7280'; break // gray
                  }
                  
                  return {
                    style: {
                      backgroundColor,
                      borderRadius: '6px',
                      opacity: 0.95,
                      color: 'white',
                      border: '0px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: '11px',
                      padding: '4px 6px',
                      margin: '1px 2px',
                      fontWeight: '500',
                      minHeight: '28px',
                      maxHeight: '60px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                      width: 'calc(100% - 4px)',
                      maxWidth: 'calc(100% - 4px)',
                      position: 'relative',
                      overflow: 'visible',
                      textOverflow: 'clip',
                      wordWrap: 'break-word',
                      whiteSpace: 'normal',
                      textAlign: 'center',
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }
                  }
                }}
                components={{
                  toolbar: CustomToolbar,
                  event: CustomEvent
                }}
              />
            </div>
          </div>
        )} */}

        {/* List View */}
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Section - Property Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {appointment?.development_and_unit?.development_name || 'Unknown Property'}
                      </h3>
                      <p className="text-gray-600 mb-2">{appointment?.development_and_unit?.unit_name || 'Unknown Unit'}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FiMapPin className="w-4 h-4" />
                          {appointment.location}
                        </span>
                        <span className="flex items-center gap-1">
                          {appointment.appointment_type === 'video_call' ? (
                            <FiVideo className="w-4 h-4" />
                          ) : (
                            <FiHome className="w-4 h-4" />
                          )}
                          {appointment.appointment_type === 'video_call' ? 'Video Call' : 'In Person'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)} {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                      {editingAppointment === appointment.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingAppointment(null)}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded"
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

                  {/* Client Info */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Client Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <FiUser className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{appointment?.homeseeker?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiMail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{appointment?.homeseeker?.email || 'No email'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiPhone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{appointment?.homeseeker?.phone || 'No phone'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {appointment?.notes && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Client Notes</h4>
                      <p className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3">{appointment.notes}</p>
                    </div>
                  )}

                  {/* Agent Response */}
                  {appointment?.response && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Agent Response</h4>
                      <p className="text-sm text-gray-600 bg-green-50 rounded-lg p-3">{appointment.response?.additional_notes || 'No response notes'}</p>
                    </div>
                  )}
                </div>

                {/* Right Section - Date & Time */}
                <div className="lg:w-48 flex-shrink-0">
                  <div className="bg-gradient-to-br from-primary_color to-blue-600 rounded-xl p-4 text-white">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <FiCalendar className="w-5 h-5" />
                        <span className="font-medium">Appointment</span>
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {new Date(appointment.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="text-sm opacity-90 mb-3">
                        {new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <FiClock className="w-4 h-4" />
                        <span>{appointment.start_time} - {appointment.end_time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 space-y-2">
                    <button className="w-full bg-primary_color text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium">
                      View Details
                    </button>
                    {appointment.status === 'pending' && (
                      <button className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm font-medium">
                        Confirm
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {appointments.length === 0 && (
          <div className="text-center py-12">
            <FiCalendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Event Modal */}
        <EventModal
          event={selectedEvent}
          isOpen={isEventModalOpen}
          onClose={closeEventModal}
          onUpdate={handleEventUpdate}
        />
      </div>
    </div>
  )
}

export default Appointments
