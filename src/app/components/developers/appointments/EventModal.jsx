"use client"
import React, { useState, useEffect } from 'react'
import { 
  FiCalendar, 
  FiClock, 
  FiMapPin, 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiEdit3, 
  FiX,
  FiVideo,
  FiHome,
  FiTrash2,
  FiLoader
} from 'react-icons/fi'
import moment from 'moment'
import { toast } from 'react-toastify'

const EventModal = ({ event, isOpen, onClose, onUpdate, user }) => {
  const [saving, setSaving] = useState(false)
  const [responseNotes, setResponseNotes] = useState([])
  const [newResponseNote, setNewResponseNote] = useState('')
  const [formData, setFormData] = useState({
    status: event?.appointment?.status || 'pending',
    notes: event?.appointment?.notes || '',
    meeting_location: event?.appointment?.meeting_location || '',
    appointment_type: event?.appointment?.appointment_type || 'virtual',
    appointment_date: event?.appointment?.appointment_date || '',
    appointment_time: event?.appointment?.appointment_time || '',
    duration: event?.appointment?.duration || 60
  })

  // Initialize response notes from appointment data
  useEffect(() => {
    if (event?.appointment?.response_notes) {
      setResponseNotes(Array.isArray(event.appointment.response_notes) ? event.appointment.response_notes : [])
    }
  }, [event])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const updateData = {
        status: formData.status,
        appointment_type: formData.appointment_type,
        response_notes: responseNotes
      }
      
      if (onUpdate) {
        await onUpdate(event.appointment.id, updateData)
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast.error('Failed to update appointment')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addResponseNote = () => {
    if (newResponseNote.trim()) {
      setResponseNotes(prev => [...prev, {
        id: Date.now(),
        text: newResponseNote.trim(),
        created_at: new Date().toISOString(),
        created_by: user?.id
      }])
      setNewResponseNote('')
    }
  }

  const removeResponseNote = (noteId) => {
    setResponseNotes(prev => prev.filter(note => note.id !== noteId))
  }

  const updateResponseNote = (noteId, newText) => {
    setResponseNotes(prev => prev.map(note => 
      note.id === noteId ? { ...note, text: newText } : note
    ))
  }

  if (!isOpen || !event) return null

  const appointment = event.appointment

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white mt-20 rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-primary_color to-blue-600 text-white">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${appointment?.status === 'confirmed' ? 'bg-green-400' : appointment?.status === 'pending' ? 'bg-yellow-400' : appointment?.status === 'completed' ? 'bg-blue-400' : 'bg-red-400'}`}></div>
            <div>
              <h3 className="text-lg !text-white font-semibold">
                {appointment?.client_name || 'Unknown Client'}
              </h3>
              <p className="text-sm opacity-90 !text-white">
                {appointment?.listings?.title || 'Unknown Property'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-white hover:text-gray-200 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
              title="Close"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Appointment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FiCalendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Appointment Date</h4>
                    <p className="text-sm text-gray-600">
                      {moment(appointment?.appointment_date).format('dddd, MMMM Do, YYYY')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiClock className="w-4 h-4" />
                  <span>
                    {moment(appointment?.appointment_date).format('HH:mm')} - {moment(appointment?.appointment_date).add(appointment?.duration || 60, 'minutes').format('HH:mm')}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    {appointment?.appointment_type === 'virtual' ? (
                      <FiVideo className="w-5 h-5 text-green-600" />
                    ) : appointment?.appointment_type === 'phone' ? (
                      <FiPhone className="w-5 h-5 text-green-600" />
                    ) : (
                      <FiHome className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Meeting Type</h4>
                    <p className="text-sm text-gray-600 capitalize">
                      {appointment?.appointment_type === 'virtual' ? 'Virtual Meeting' : 
                       appointment?.appointment_type === 'phone' ? 'Phone Call' : 'In Person'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FiUser className="w-4 h-4 text-purple-600" />
                </div>
                Client Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</label>
                  <p className="text-sm text-gray-900 font-medium mt-1">{appointment?.client_name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                  <p className="text-sm text-gray-900 font-medium mt-1">{appointment?.client_email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</label>
                  <p className="text-sm text-gray-900 font-medium mt-1">{appointment?.client_phone || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Property Information */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FiHome className="w-4 h-4 text-orange-600" />
                </div>
                Property Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Property Title</label>
                  <p className="text-sm text-gray-900 font-medium mt-1">{appointment?.listings?.title || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</label>
                  <p className="text-sm text-gray-900 font-medium mt-1 capitalize">{appointment?.listings?.listing_type || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">City</label>
                  <p className="text-sm text-gray-900 font-medium mt-1">{appointment?.listings?.city || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">State</label>
                  <p className="text-sm text-gray-900 font-medium mt-1">{appointment?.listings?.state || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Client Notes */}
            {appointment?.notes && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <FiEdit3 className="w-4 h-4 text-yellow-600" />
                  </div>
                  Client Notes
                </h4>
                <div className="text-sm text-gray-700 bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-400">
                  {appointment.notes}
                </div>
              </div>
            )}

            {/* Response Notes */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiEdit3 className="w-4 h-4 text-blue-600" />
                </div>
                Response Notes ({responseNotes.length})
              </h4>
              
              {/* Add New Response Note */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <textarea
                    value={newResponseNote}
                    onChange={(e) => setNewResponseNote(e.target.value)}
                    rows={2}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    placeholder="Add a response note..."
                  />
                  <button
                    type="button"
                    onClick={addResponseNote}
                    disabled={!newResponseNote.trim()}
                    className="px-4 py-3 bg-primary_color text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Response Notes List */}
              {responseNotes.length > 0 ? (
                <div className="space-y-3">
                  {responseNotes.map((note, index) => (
                    <div key={note.id || index} className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                      <div className="flex items-start justify-between">
                        <textarea
                          value={note.text}
                          onChange={(e) => updateResponseNote(note.id, e.target.value)}
                          className="flex-1 bg-transparent border-none resize-none text-sm text-gray-800 focus:outline-none"
                          rows={2}
                        />
                        <div className="flex items-center gap-2 ml-3">
                          <span className="text-xs text-gray-500">
                            {moment(note.created_at).format('MMM D, HH:mm')}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeResponseNote(note.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                            title="Delete note"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiEdit3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No response notes yet. Add your first note above.</p>
                </div>
              )}
            </div>

            {/* Status Change & Save */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FiEdit3 className="w-4 h-4 text-purple-600" />
                </div>
                Appointment Settings
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Type</label>
                  <select
                    value={formData.appointment_type}
                    onChange={(e) => handleInputChange('appointment_type', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                  >
                    <option value="virtual">Virtual Meeting</option>
                    <option value="in-person">In Person</option>
                    <option value="phone">Phone Call</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-6 py-3 bg-primary_color text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <FiLoader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventModal

