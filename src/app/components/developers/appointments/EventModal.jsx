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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white/70 mt-20 rounded-2xl shadow-2xl border border-white/50 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/30 bg-primary_color text-white">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              appointment?.status === 'confirmed' || appointment?.status === 'completed' 
                ? 'bg-white' 
                : appointment?.status === 'pending' 
                  ? 'bg-secondary_color' 
                  : 'bg-white/70'
            }`}></div>
            <div>
              <h3 className="text-lg text-white font-semibold">
                {appointment?.client_name || 'Unknown Client'}
              </h3>
              <p className="text-sm text-white/90">
                {appointment?.listings?.title || 'Unknown Property'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-white hover:text-white/80 hover:bg-white/20 rounded-lg transition-all"
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
              <div className="secondary_bg rounded-xl p-4 border border-white/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary_color/10 rounded-lg flex items-center justify-center">
                    <FiCalendar className="w-5 h-5 text-primary_color" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary_color-900">Appointment Date</h4>
                    <p className="text-sm text-secondary_color-600">
                      {moment(appointment?.appointment_date).format('dddd, MMMM Do, YYYY')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-secondary_color-600">
                  <FiClock className="w-4 h-4" />
                  <span>
                    {moment(appointment?.appointment_date).format('HH:mm')} - {moment(appointment?.appointment_date).add(appointment?.duration || 60, 'minutes').format('HH:mm')}
                  </span>
                </div>
              </div>

              <div className="secondary_bg rounded-xl p-4 border border-white/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary_color/10 rounded-lg flex items-center justify-center">
                    {appointment?.appointment_type === 'virtual' ? (
                      <FiVideo className="w-5 h-5 text-primary_color" />
                    ) : appointment?.appointment_type === 'phone' ? (
                      <FiPhone className="w-5 h-5 text-primary_color" />
                    ) : (
                      <FiHome className="w-5 h-5 text-primary_color" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary_color-900">Meeting Type</h4>
                    <p className="text-sm text-secondary_color-600 capitalize">
                      {appointment?.appointment_type === 'virtual' ? 'Virtual Meeting' : 
                       appointment?.appointment_type === 'phone' ? 'Phone Call' : 'In Person'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div className="secondary_bg border border-white/30 rounded-xl p-6">
              <h4 className="font-semibold text-secondary_color-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-primary_color/10 rounded-lg flex items-center justify-center">
                  <FiUser className="w-4 h-4 text-primary_color" />
                </div>
                Client Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-secondary_color-500 uppercase tracking-wide">Name</label>
                  <p className="text-sm text-secondary_color-900 font-medium mt-1">{appointment?.client_name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-secondary_color-500 uppercase tracking-wide">Email</label>
                  <p className="text-sm text-secondary_color-900 font-medium mt-1">{appointment?.client_email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-secondary_color-500 uppercase tracking-wide">Phone</label>
                  <p className="text-sm text-secondary_color-900 font-medium mt-1">{appointment?.client_phone || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Property Information */}
            <div className="secondary_bg border border-white/30 rounded-xl p-6">
              <h4 className="font-semibold text-secondary_color-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-primary_color/10 rounded-lg flex items-center justify-center">
                  <FiHome className="w-4 h-4 text-primary_color" />
                </div>
                Property Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-secondary_color-500 uppercase tracking-wide">Property Title</label>
                  <p className="text-sm text-secondary_color-900 font-medium mt-1">{appointment?.listings?.title || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-secondary_color-500 uppercase tracking-wide">Type</label>
                  <p className="text-sm text-secondary_color-900 font-medium mt-1 capitalize">{appointment?.listings?.listing_type || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-secondary_color-500 uppercase tracking-wide">City</label>
                  <p className="text-sm text-secondary_color-900 font-medium mt-1">{appointment?.listings?.city || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-secondary_color-500 uppercase tracking-wide">State</label>
                  <p className="text-sm text-secondary_color-900 font-medium mt-1">{appointment?.listings?.state || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Client Notes */}
            {appointment?.notes && (
              <div className="secondary_bg border border-white/30 rounded-xl p-6">
                <h4 className="font-semibold text-secondary_color-900 mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary_color/10 rounded-lg flex items-center justify-center">
                    <FiEdit3 className="w-4 h-4 text-primary_color" />
                  </div>
                  Client Notes
                </h4>
                <div className="text-sm text-secondary_color-700 secondary_bg rounded-lg p-4 border-l-4 border-primary_color">
                  {appointment.notes}
                </div>
              </div>
            )}

            {/* Response Notes */}
            <div className="secondary_bg border border-white/30 rounded-xl p-6">
              <h4 className="font-semibold text-secondary_color-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-primary_color/10 rounded-lg flex items-center justify-center">
                  <FiEdit3 className="w-4 h-4 text-primary_color" />
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
                    className="flex-1 px-4 py-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-primary_color default_bg"
                    placeholder="Add a response note..."
                  />
                  <button
                    type="button"
                    onClick={addResponseNote}
                    disabled={!newResponseNote.trim()}
                    className="px-4 py-3 primary_button disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Response Notes List */}
              {responseNotes.length > 0 ? (
                <div className="space-y-3">
                  {responseNotes.map((note, index) => (
                    <div key={note.id || index} className="secondary_bg rounded-lg p-4 border-l-4 border-primary_color">
                      <div className="flex items-start justify-between">
                        <textarea
                          value={note.text}
                          onChange={(e) => updateResponseNote(note.id, e.target.value)}
                          className="flex-1 bg-transparent border-none resize-none text-sm text-secondary_color-800 focus:outline-none"
                          rows={2}
                        />
                        <div className="flex items-center gap-2 ml-3">
                          <span className="text-xs text-secondary_color-500">
                            {moment(note.created_at).format('MMM D, HH:mm')}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeResponseNote(note.id)}
                            className="p-1 text-secondary_color-500 hover:text-secondary_color-700 hover:bg-secondary_color/10 rounded transition-colors"
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
                <div className="text-center py-8 text-secondary_color-500">
                  <FiEdit3 className="w-12 h-12 mx-auto mb-3 text-secondary_color-300" />
                  <p>No response notes yet. Add your first note above.</p>
                </div>
              )}
            </div>

            {/* Status Change & Save */}
            <div className="secondary_bg border border-white/30 rounded-xl p-6">
              <h4 className="font-semibold text-secondary_color-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-primary_color/10 rounded-lg flex items-center justify-center">
                  <FiEdit3 className="w-4 h-4 text-primary_color" />
                </div>
                Appointment Settings
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-secondary_color-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-primary_color default_bg"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary_color-700 mb-2">Meeting Type</label>
                  <select
                    value={formData.appointment_type}
                    onChange={(e) => handleInputChange('appointment_type', e.target.value)}
                    className="w-full px-4 py-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-primary_color default_bg"
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
                  className="px-6 py-3 primary_button font-medium disabled:opacity-50 flex items-center gap-2"
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

