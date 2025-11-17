'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { FiMessageCircle, FiEdit3, FiTrash2, FiPlus, FiX, FiSend, FiUser, FiCalendar, FiPhone, FiMail, FiImage } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'

export default function LeadsManagement({ listerId, listerType = 'developer', listingId = null, pageSize = 20 }) {
  const { user } = useAuth()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [selectedLead, setSelectedLead] = useState(null)
  const [newNoteText, setNewNoteText] = useState('')
  const [editingNoteIndex, setEditingNoteIndex] = useState(null)
  const [editingNoteText, setEditingNoteText] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  const offset = useMemo(() => page * pageSize, [page, pageSize])

  async function loadLeads() {
    if (!listerId) return
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        lister_id: listerId,
        lister_type: listerType,
        page: page.toString(),
        page_size: pageSize.toString()
      })
      
      if (listingId) {
        params.append('listing_id', listingId)
      }
      
      if (statusFilter) {
        params.append('status', statusFilter)
      }
      
      if (search) {
        params.append('search', search)
      }

      const response = await fetch(`/api/leads?${params.toString()}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setLeads(result.data || [])
        setTotal(result.total || 0)
      } else {
        setError(result.error || 'Failed to load leads')
        setLeads([])
        setTotal(0)
      }
    } catch (err) {
      console.error('Error loading leads:', err)
      setError('Failed to load leads')
      setLeads([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listerId, listerType, listingId, statusFilter, search, page, pageSize])

  async function updateLeadStatus(leadId, newStatus) {
    try {
      // Update locally first for instant feedback
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
      setSelectedLead(prev => prev && prev.id === leadId ? { ...prev, status: newStatus } : prev)

      // Update in database
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        // Revert on error
        loadLeads()
      }
    } catch (err) {
      console.error('Error updating lead status:', err)
      loadLeads() // Reload on error
    }
  }

  async function sendMessage(lead) {
    if (!chatMessage.trim() || !user || !lead.seeker_id) return

    setSendingMessage(true)
    try {
      // Get token from localStorage or session
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      if (!token) {
        alert('Please log in to send messages')
        return
      }

      // Create or find conversation
      const convResponse = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          otherUserId: lead.seeker_id,
          otherUserType: 'property_seeker',
          listingId: lead.listing_id || null,
          conversationType: lead.listing_id ? 'listing_inquiry' : 'general_inquiry',
          firstMessage: chatMessage.trim()
        })
      })

      if (convResponse.ok) {
        const convResult = await convResponse.json()
        setChatMessage('')
        setShowChat(false)
        alert('Message sent successfully!')
      } else {
        const errorData = await convResponse.json()
        alert(errorData.error || 'Failed to send message')
      }
    } catch (err) {
      console.error('Error sending message:', err)
      alert('Failed to send message. Please try again.')
    } finally {
      setSendingMessage(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // Leads are already filtered by the API, so we use them directly
  const filteredLeads = leads

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Leads Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            {listingId ? 'Single listing leads' : 'All leads for this lister'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            Total: <span className="font-medium text-gray-900">{total}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search by seeker name or listing..."
            value={search}
            onChange={(e) => { setPage(0); setSearch(e.target.value) }}
          />
        </div>
        <div className="sm:w-48">
          <select 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            value={statusFilter} 
            onChange={(e) => { setPage(0); setStatusFilter(e.target.value) }}
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="scheduled">Scheduled</option>
            <option value="responded">Responded</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seeker</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listing</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manage</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading leads...</span>
                    </div>
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-red-600">
                    <div className="flex items-center justify-center">
                      <span className="text-red-600">{error}</span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && !error && filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <FiUser className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No leads found</h3>
                      <p className="text-sm text-gray-500">
                        {search || statusFilter ? 'Try adjusting your filters' : 'No leads have been generated yet'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <FiUser className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {lead.seeker_name || lead.seeker_id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {lead.total_actions} actions
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {lead.listing_image ? (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                          <img 
                            src={lead.listing_image} 
                            alt={lead.listing_title || 'Listing'} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              const placeholder = e.target.nextElementSibling
                              if (placeholder) placeholder.style.display = 'flex'
                            }}
                          />
                          <div className="absolute inset-0 w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 hidden">
                            <FiImage className="w-6 h-6 text-gray-400" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 border border-gray-300">
                          <FiImage className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-gray-900 max-w-xs truncate font-medium">
                          {lead.listing_title || 'No listing'}
                        </div>
                        {lead.listing_location && (
                          <div className="text-xs text-gray-500 truncate">
                            {lead.listing_location}
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          {lead.first_action_date}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(lead.lead_actions || []).slice(0, 3).map((action, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {action.action_type.replace('lead_', '')}
                        </span>
                      ))}
                      {(lead.lead_actions || []).length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          +{(lead.lead_actions || []).length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      className="px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={lead.status || 'new'}
                      onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="responded">Responded</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        className="text-blue-600 hover:text-blue-900 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
                        onClick={() => {
                          setSelectedLead(lead)
                          setShowChat(true)
                        }}
                      >
                        <FiMessageCircle className="w-4 h-4" />
                        Message
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => setSelectedLead(lead)}
                      >
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {filteredLeads.length > 0 ? offset + 1 : 0} to {Math.min(offset + pageSize, filteredLeads.length)} of {filteredLeads.length} results
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
            disabled={page === 0} 
            onClick={() => setPage(p => Math.max(0, p - 1))}
          >
            Previous
          </button>
          <span className="px-3 py-2 text-sm text-gray-700">
            Page {page + 1} of {Math.max(1, Math.ceil(filteredLeads.length / pageSize))}
          </span>
          <button 
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
            disabled={(page + 1) >= Math.ceil(filteredLeads.length / pageSize)} 
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Lead Details Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Lead Details</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedLead.seeker_name || selectedLead.seeker_id} • {selectedLead.listing_title || selectedLead.listing_id}
                  </p>
                </div>
                <button 
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  onClick={() => setSelectedLead(null)}
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lead Information */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Lead Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <FiUser className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{selectedLead.seeker_name || selectedLead.seeker_id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiCalendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{selectedLead.first_action_date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Status:</span>
                        <select
                          className="px-2 py-1 text-sm border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          value={selectedLead.status || 'new'}
                          onChange={(e) => updateLeadStatus(selectedLead.id, e.target.value)}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="responded">Responded</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Actions:</span>
                        <span className="text-sm text-gray-700">{selectedLead.total_actions || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Add New Note */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                      <FiPlus className="w-4 h-4" />
                      Add New Note
                    </h5>
                    <div className="space-y-3">
                      <textarea
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows="3"
                        placeholder="Enter your note here..."
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                      />
                      <button
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        disabled={!newNoteText.trim()}
                        onClick={() => {
                          if (!newNoteText.trim()) return
                          const next = [...(selectedLead.notes || []), newNoteText.trim()]
                          setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, notes: next } : l))
                          setSelectedLead(prev => ({ ...prev, notes: next }))
                          setNewNoteText('')
                        }}
                      >
                        <FiPlus className="w-4 h-4" />
                        Add Note
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions Timeline */}
                <div className="lg:col-span-1 space-y-4">
                  <h4 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2">Actions Timeline</h4>
                  <div className="space-y-3">
                    {(selectedLead.lead_actions || []).map((action, index) => (
                      <div key={action.action_id || index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {action.action_type.replace('lead_', '')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900">
                            {action.action_metadata?.message_type && (
                              <span>Message: {action.action_metadata.message_type}</span>
                            )}
                            {action.action_metadata?.appointment_type && (
                              <span>Appointment: {action.action_metadata.appointment_type}</span>
                            )}
                            {action.action_metadata?.action && (
                              <span>Phone: {action.action_metadata.action}</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {action.action_date}
                          </div>
                        </div>
                        <button
                          className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          onClick={() => setShowChat(!showChat)}
                          title="Send message"
                        >
                          <FiMessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {(selectedLead.lead_actions || []).length === 0 && (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        No actions recorded yet
                      </div>
                    )}
                  </div>

                  {/* Inline Chat */}
                  {showChat && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-medium text-green-900 flex items-center gap-2">
                          <FiMessageCircle className="w-4 h-4" />
                          Quick Message
                        </h5>
                        <button
                          className="text-green-600 hover:text-green-800"
                          onClick={() => setShowChat(false)}
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <textarea
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                          rows="3"
                          placeholder="Type your message here..."
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!chatMessage.trim() || sendingMessage}
                            onClick={() => sendMessage(selectedLead)}
                          >
                            <FiSend className="w-4 h-4" />
                            {sendingMessage ? 'Sending...' : 'Send'}
                          </button>
                          <button
                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            onClick={() => setChatMessage('')}
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Saved Notes */}
                <div className="lg:col-span-1 space-y-4">
                  <h4 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2">Saved Notes</h4>
                  
                  <div className="space-y-3">
                    {(Array.isArray(selectedLead.notes) ? selectedLead.notes : []).map((note, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        {editingNoteIndex === idx ? (
                          <div className="space-y-3">
                            <textarea
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                              rows="3"
                              value={editingNoteText}
                              onChange={(e) => setEditingNoteText(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <button
                                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
                                onClick={() => {
                                  const next = [...(selectedLead.notes || [])]
                                  next[idx] = editingNoteText
                                  setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, notes: next } : l))
                                  setSelectedLead(prev => ({ ...prev, notes: next }))
                                  setEditingNoteIndex(null)
                                  setEditingNoteText('')
                                }}
                              >
                                <FiEdit3 className="w-3 h-3" />
                                Save
                              </button>
                              <button 
                                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                onClick={() => { setEditingNoteIndex(null); setEditingNoteText('') }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-gray-900 leading-relaxed">{note}</p>
                            <div className="mt-3 flex gap-2">
                              <button 
                                className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors flex items-center gap-1"
                                onClick={() => { setEditingNoteIndex(idx); setEditingNoteText(note) }}
                              >
                                <FiEdit3 className="w-3 h-3" />
                                Edit
                              </button>
                              <button
                                className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors flex items-center gap-1"
                                onClick={() => {
                                  const next = (selectedLead.notes || []).filter((_, i) => i !== idx)
                                  setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, notes: next } : l))
                                  setSelectedLead(prev => ({ ...prev, notes: next }))
                                }}
                              >
                                <FiTrash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {(Array.isArray(selectedLead.notes) ? selectedLead.notes : []).length === 0 && (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        No notes yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


