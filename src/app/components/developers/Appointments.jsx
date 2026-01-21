"use client"
import React, { useState, useEffect } from 'react'
import { 
  FiCalendar, 
  FiGrid,
  FiList,
  FiFilter,
  FiSearch
} from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import DeveloperNav from './DeveloperNav'
import { toast } from 'react-toastify'
import AppointmentsList from './appointments/AppointmentsList'
import AppointmentsCalendar from './appointments/AppointmentsCalendar'
import EventModal from './appointments/EventModal'

const Appointments = ({ accountId: propAccountId = null, accountType: propAccountType = 'developer', readOnly = false }) => {
  const { user, isAuthenticated } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'calendar'
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(null)

  // Use provided accountId/accountType or fall back to auth user
  // For team members, use developer_id from profile (already set in AuthContext)
  const accountId = propAccountId || (user?.profile?.developer_id || user?.profile?.agency_id || user?.profile?.agent_id || user?.id)
  const accountType = propAccountType || user?.profile?.account_type || 'developer'

  // Fetch appointments from API
  const fetchAppointments = async (pageNum = 1, reset = false) => {
    if (!accountId) return

    try {
      if (reset) {
        setLoading(true)
        setPage(1)
      } else {
        setLoadingMore(true)
      }

      const response = await fetch(`/api/appointments?account_id=${accountId}&account_type=${accountType}&page=${pageNum}&limit=10`)
      const result = await response.json()

      if (result.success) {
        const newAppointments = result.data || []
        
        if (reset) {
          setAppointments(newAppointments)
        } else {
          setAppointments(prev => [...prev, ...newAppointments])
        }
        
        setHasMore(newAppointments.length === 10)
        setPage(pageNum)
      } else {
        toast.error(result.error || 'Failed to fetch appointments')
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Failed to fetch appointments')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Update appointment status
  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    setUpdatingStatus(appointmentId)
    
    try {
      const response = await fetch('/api/appointments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: appointmentId,
          status: newStatus
        })
      })

      const result = await response.json()

      if (result.success) {
        // Update the appointment in the local state
        setAppointments(prev => 
          prev.map(appointment => 
            appointment.id === appointmentId 
              ? { ...appointment, status: newStatus }
              : appointment
          )
        )
        
        toast.success(`Appointment ${newStatus} successfully!`)
        setEditingAppointment(null)
      } else {
        toast.error(result.error || 'Failed to update appointment')
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast.error('Failed to update appointment')
    } finally {
      setUpdatingStatus(null)
    }
  }

  // Load more appointments
  const loadMoreAppointments = () => {
    if (!loadingMore && hasMore) {
      fetchAppointments(page + 1, false)
    }
  }

  // Initial load
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchAppointments(1, true)
    }
  }, [isAuthenticated, user?.id])

  // Filter appointments based on search and status
  // Also mark appointments as read-only if they're for agents (when viewing as agency)
  const filteredAppointments = appointments.map(appointment => {
    // Determine if this appointment is read-only
    // For agencies: if appointment is for an agent, it's read-only
    // For agencies: if appointment is for the agency directly, it's read-write
    const isReadOnly = readOnly || (accountType === 'agency' && appointment.account_type === 'agent')
    
    return {
      ...appointment,
      _isReadOnly: isReadOnly
    }
  }).filter(appointment => {
    const matchesStatus = selectedStatus === 'all' || appointment.status === selectedStatus
    const matchesSearch = searchTerm === '' || 
      appointment.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.listings?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  // Handle event select from calendar
  const handleEventSelect = (event) => {
    setSelectedEvent(event)
    setIsEventModalOpen(true)
  }

  // Handle view details from list
  const handleViewDetails = (appointment) => {
    setSelectedEvent({ id: appointment.id, appointment: appointment })
    setIsEventModalOpen(true)
  }

  // Handle event update from modal
  const handleEventUpdate = async (appointmentId, updateData) => {
    try {
        const response = await fetch('/api/appointments', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
          id: appointmentId,
            ...updateData
          })
        })

        const result = await response.json()

        if (result.success) {
          // Update the appointment in the local state
          setAppointments(prev => 
            prev.map(appointment => 
            appointment.id === appointmentId 
                ? { ...appointment, ...updateData }
                : appointment
            )
          )
          
          toast.success('Appointment updated successfully!')
        setIsEventModalOpen(false)
        setSelectedEvent(null)
        } else {
          toast.error(result.error || 'Failed to update appointment')
        }
      } catch (error) {
        console.error('Error updating appointment:', error)
        toast.error('Failed to update appointment')
    }
  }

  const closeEventModal = () => {
    setIsEventModalOpen(false)
    setSelectedEvent(null)
  }

  return (
    <div className="flex min-h-screen">
      {/* <DeveloperNav /> */}
      
      <div className="flex-1 p-6 overflow-hidden">
        {/* Header */}
        <div className="mb-8">
          <h1 className="">Appointments</h1>
          <p className="">Manage and track all property viewing appointments</p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 bg-white/50 rounded-xl p-1 shadow-sm border border-gray-100">
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
        </div>

        {/* Filters and Search */}
        <div className="bg-white/50 rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
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
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Appointments', value: appointments.length, color: 'bg-blue-500' },
            { label: 'Pending', value: appointments.filter(a => a.status === 'pending').length, color: 'bg-yellow-500' },
            { label: 'Confirmed', value: appointments.filter(a => a.status === 'confirmed').length, color: 'bg-green-500' },
            { label: 'Completed', value: appointments.filter(a => a.status === 'completed').length, color: 'bg-purple-500' }
          ].map((stat, index) => (
            <div key={index} className="bg-white/50 rounded-2xl p-6 shadow-sm border border-gray-100">
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
        {viewMode === 'calendar' && (
          <AppointmentsCalendar
            appointments={filteredAppointments}
            onEventSelect={handleEventSelect}
          />
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <AppointmentsList
            appointments={filteredAppointments}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={loadMoreAppointments}
            onUpdateStatus={updateAppointmentStatus}
            onViewDetails={handleViewDetails}
            updatingStatus={updatingStatus}
            editingAppointment={editingAppointment}
            setEditingAppointment={setEditingAppointment}
          />
        )}

        {/* Event Modal */}
        <EventModal
          event={selectedEvent}
          isOpen={isEventModalOpen}
          onClose={closeEventModal}
          onUpdate={handleEventUpdate}
          user={user}
        />
      </div>
    </div>
  )
}

export default Appointments
