'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { FiMessageCircle, FiEdit3, FiTrash2, FiPlus, FiX, FiSend, FiUser, FiCalendar, FiPhone, FiMail } from 'react-icons/fi'

export default function LeadsManagement({ listerId, listerType = 'developer', listingId = null, pageSize = 20 }) {
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

  const offset = useMemo(() => page * pageSize, [page, pageSize])

  // Dummy data builder (no API calls)
  function buildDummyLeads(currentListerId, currentListerType, currentListingId) {
    const base = [
      {
        id: 'ld_1',
        listing_id: currentListingId || 'lst_1001',
        listing_title: 'Premium Apartments East Legon',
        lister_id: currentListerId,
        lister_type: currentListerType,
        seeker_id: 'seeker_001',
        seeker_name: 'John Doe',
        total_actions: 3,
        lead_actions: [
          { action_id: 'a1', action_type: 'lead_message', action_date: '2025-01-24', action_timestamp: '2025-01-24T09:00:00Z', action_metadata: { message_type: 'direct_message' } },
          { action_id: 'a2', action_type: 'lead_phone', action_date: '2025-01-25', action_timestamp: '2025-01-25T10:00:00Z', action_metadata: { action: 'click' } },
          { action_id: 'a3', action_type: 'lead_appointment', action_date: '2025-01-27', action_timestamp: '2025-01-27T14:00:00Z', action_metadata: { appointment_type: 'viewing' } }
        ],
        first_action_date: '2025-01-20',
        last_action_date: '2025-01-27',
        last_action_type: 'lead_message',
        status: 'new',
        notes: []
      },
      {
        id: 'ld_2',
        listing_id: currentListingId || 'lst_1002',
        listing_title: 'Karl\'s Manet Ville',
        lister_id: currentListerId,
        lister_type: currentListerType,
        seeker_id: 'seeker_002',
        seeker_name: 'Sarah Wilson',
        total_actions: 2,
        lead_actions: [
          { action_id: 'b1', action_type: 'lead_phone', action_date: '2025-01-22', action_timestamp: '2025-01-22T12:00:00Z', action_metadata: { action: 'click' } },
          { action_id: 'b2', action_type: 'lead_message', action_date: '2025-01-26', action_timestamp: '2025-01-26T15:30:00Z', action_metadata: { message_type: 'email' } }
        ],
        first_action_date: '2025-01-22',
        last_action_date: '2025-01-26',
        last_action_type: 'lead_phone',
        status: 'contacted',
        notes: ['Called back']
      },
      {
        id: 'ld_3',
        listing_id: currentListingId || 'lst_1003',
        listing_title: 'Jojo Jones',
        lister_id: currentListerId,
        lister_type: currentListerType,
        seeker_id: 'seeker_003',
        seeker_name: 'Mike Smith',
        total_actions: 4,
        lead_actions: [
          { action_id: 'c1', action_type: 'lead_message', action_date: '2025-01-18', action_timestamp: '2025-01-18T08:30:00Z', action_metadata: { message_type: 'whatsapp' } },
          { action_id: 'c2', action_type: 'lead_message', action_date: '2025-01-20', action_timestamp: '2025-01-20T09:15:00Z', action_metadata: { message_type: 'direct_message' } },
          { action_id: 'c3', action_type: 'lead_phone', action_date: '2025-01-22', action_timestamp: '2025-01-22T10:45:00Z', action_metadata: { action: 'click' } },
          { action_id: 'c4', action_type: 'lead_appointment', action_date: '2025-01-25', action_timestamp: '2025-01-25T11:00:00Z', action_metadata: { appointment_type: 'consultation' } }
        ],
        first_action_date: '2025-01-18',
        last_action_date: '2025-01-25',
        last_action_type: 'lead_appointment',
        status: 'scheduled',
        notes: []
      }
    ]
    return base
  }

  function loadLeads() {
    if (!listerId) return
    setLoading(true)
    setError(null)
    // Build, filter, paginate dummy data locally
    let data = buildDummyLeads(listerId, listerType, listingId)
    if (statusFilter) data = data.filter(d => (d.status || '').toLowerCase() === statusFilter.toLowerCase())
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(d =>
        (d.seeker_name || '').toLowerCase().includes(q) ||
        (d.listing_title || '').toLowerCase().includes(q) ||
        (d.seeker_id || '').toLowerCase().includes(q)
      )
    }
    const totalCount = data.length
    const pageItems = data.slice(offset, offset + pageSize)
    // Simulate network delay
    setTimeout(() => {
      setLeads(pageItems)
      setTotal(totalCount)
      setLoading(false)
    }, 150)
  }

  useEffect(() => {
    loadLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listerId, listerType, listingId, statusFilter, search, page, pageSize])

  function updateLeadStatus(leadId, newStatus) {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
    setSelectedLead(prev => prev && prev.id === leadId ? { ...prev, status: newStatus } : prev)
  }

  function addLeadNote(leadId) {
    const text = prompt('Add note (text only):')
    if (!text || !text.trim()) return
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes: [...(Array.isArray(l.notes) ? l.notes : []), text.trim()] } : l))
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // Filter leads based on search and status
  const filteredLeads = useMemo(() => {
    let filtered = leads
    
    if (statusFilter) {
      filtered = filtered.filter(lead => (lead.status || '').toLowerCase() === statusFilter.toLowerCase())
    }
    
    if (search) {
      const query = search.toLowerCase()
      filtered = filtered.filter(lead =>
        (lead.seeker_name || '').toLowerCase().includes(query) ||
        (lead.listing_title || '').toLowerCase().includes(query) ||
        (lead.seeker_id || '').toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [leads, statusFilter, search])

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
              {filteredLeads.slice(offset, offset + pageSize).map((lead) => (
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
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {lead.listing_title || lead.listing_id}
                    </div>
                    <div className="text-sm text-gray-500">
                      {lead.first_action_date}
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
                        onClick={() => alert('Open conversation UI')}
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
                            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                            onClick={() => {
                              if (!chatMessage.trim()) return
                              alert(`Message sent: "${chatMessage}"`)
                              setChatMessage('')
                              setShowChat(false)
                            }}
                          >
                            <FiSend className="w-4 h-4" />
                            Send
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


