'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { FiMessageCircle, FiEdit3, FiTrash2, FiPlus, FiX, FiSend, FiUser, FiCalendar, FiPhone, FiMail, FiImage, FiStar, FiSettings } from 'react-icons/fi'
import { BarChart3, MessageCircle, Phone, Calendar, TrendingUp } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import DataCard from '@/app/components/developers/DataCard'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Reminders from './Reminders'

// Helper function to get lead category from score
function getLeadCategory(score) {
  if (score >= 60) return { label: 'High', color: 'bg-green-100 text-green-800 border-green-200' }
  if (score >= 25) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
  return { label: 'Base', color: 'bg-gray-100 text-secondary_color-800 border-gray-200' }
}

export default function LeadsManagement({ listerId, listerType = 'developer', listingId = null, pageSize = 20 }) {
  const { user, developerToken, propertySeekerToken } = useAuth()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [selectedLead, setSelectedLead] = useState(null)
  const [newNoteText, setNewNoteText] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [reminders, setReminders] = useState([])
  const [loadingReminders, setLoadingReminders] = useState(false)
  const [isReminder, setIsReminder] = useState(false)
  const [editingItem, setEditingItem] = useState(null) // { type: 'note' | 'reminder', index: number | id: string }
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [messageBoxLead, setMessageBoxLead] = useState(null) // Lead for which message box is open
  const [remindersRefreshKey, setRemindersRefreshKey] = useState(0)

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
      
      if (actionFilter) {
        params.append('action_type', actionFilter)
      }
      
      if (dateFrom) {
        params.append('date_from', dateFrom)
      }
      
      if (dateTo) {
        params.append('date_to', dateTo)
      }
      
      if (search) {
        params.append('search', search)
      }

      const response = await fetch(`/api/leads?${params.toString()}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setLeads(result.data || [])
        setTotal(result.total || 0)
        // If a lead is selected, update its reminders
        if (selectedLead) {
          const updatedLead = result.data?.find(l => l.id === selectedLead.id)
          if (updatedLead) {
            setSelectedLead(updatedLead)
            setReminders(updatedLead.reminders || [])
          }
        }
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
  }, [listerId, listerType, listingId, statusFilter, actionFilter, dateFrom, dateTo, search, page, pageSize])

  function updateLeadStatusLocally(leadId, newStatus) {
    // Update locally (will be saved when user clicks "Save Changes")
    setSelectedLead(prev => prev && prev.id === leadId ? { ...prev, status: newStatus } : prev)
    setHasChanges(true)
  }

  // Load reminders when a lead is selected
  useEffect(() => {
    if (selectedLead && selectedLead.grouped_lead_key) {
      loadReminders(selectedLead.grouped_lead_key)
    } else if (selectedLead) {
      setReminders(selectedLead.reminders || [])
    } else {
      setReminders([])
    }
    // Only reset hasChanges if we're closing the modal (selectedLead becomes null)
    // Don't reset it when selectedLead updates with new data
    if (!selectedLead) {
      setHasChanges(false)
      setEditingItem(null)
      setNewNoteText('')
      setIsReminder(false)
    }
  }, [selectedLead?.id]) // Only trigger when the lead ID changes, not when the lead data updates

  // Track changes - check if notes or reminders have been modified
  useEffect(() => {
    if (selectedLead) {
      // Check if there are any unsaved changes
      const hasUnsavedNotes = newNoteText.trim().length > 0
      const hasUnsavedReminder = isReminder && newNoteText.trim().length > 0
      const hasEditingItem = editingItem !== null
      // Note: We can't easily detect if notes/reminders arrays changed, so we rely on user actions
      // The hasChanges flag is set manually when user makes changes
    }
  }, [selectedLead, newNoteText, isReminder, editingItem])

  async function loadReminders(groupedLeadKey) {
    if (!groupedLeadKey) return
    setLoadingReminders(true)
    try {
      const response = await fetch(`/api/reminders?grouped_lead_key=${encodeURIComponent(groupedLeadKey)}`)
      const result = await response.json()
      if (response.ok && result.success) {
        setReminders(result.data || [])
      }
    } catch (err) {
      console.error('Error loading reminders:', err)
    } finally {
      setLoadingReminders(false)
    }
  }

  function startEditingNote(noteIndex) {
    const note = selectedLead.notes?.[noteIndex]
    if (note) {
      setNewNoteText(note)
      setIsReminder(false)
      setEditingItem({ type: 'note', index: noteIndex })
    }
  }

  function startEditingReminder(reminder) {
    setNewNoteText(reminder.note_text)
    setIsReminder(true)
    setEditingItem({ type: 'reminder', id: reminder.id })
    
    // Set reminder fields after a brief delay to ensure DOM is ready
    setTimeout(() => {
      const dateInput = document.getElementById('reminder_date')
      const timeInput = document.getElementById('reminder_time')
      const prioritySelect = document.getElementById('reminder_priority')
      
      if (dateInput && reminder.reminder_date) {
        dateInput.value = reminder.reminder_date
      }
      if (timeInput && reminder.reminder_time) {
        timeInput.value = reminder.reminder_time
      }
      if (prioritySelect && reminder.priority) {
        prioritySelect.value = reminder.priority
      }
    }, 0)
  }

  function cancelEditing() {
    setEditingItem(null)
    setNewNoteText('')
    setIsReminder(false)
  }

  function addNoteOrReminder() {
    if (!selectedLead || !newNoteText.trim()) {
      toast.error('Please enter a note')
      return
    }

    // If editing, update existing item
    if (editingItem) {
      if (editingItem.type === 'note') {
        // If converting note to reminder
        if (isReminder) {
          const reminderDate = document.getElementById('reminder_date')?.value
          if (!reminderDate) {
            alert('Please select a reminder date')
            return
          }
          
          // Remove note from notes array
          const next = (selectedLead.notes || []).filter((_, i) => i !== editingItem.index)
          setSelectedLead(prev => ({ ...prev, notes: next }))
          
          // Add as new reminder
          const newReminder = {
            note_text: newNoteText.trim(),
            reminder_date: reminderDate,
            reminder_time: document.getElementById('reminder_time')?.value || null,
            priority: document.getElementById('reminder_priority')?.value || 'normal',
            status: 'incomplete'
          }
          setReminders(prev => [...prev, newReminder])
        } else {
          // Just update the note
          const next = [...(selectedLead.notes || [])]
          next[editingItem.index] = newNoteText.trim()
          setSelectedLead(prev => ({ ...prev, notes: next }))
        }
        setNewNoteText('')
        setIsReminder(false)
        setEditingItem(null)
        setHasChanges(true)
        return
      } else if (editingItem.type === 'reminder') {
        // If converting reminder to note
        if (!isReminder) {
          // Remove reminder from reminders array
          setReminders(prev => prev.filter(r => r.id !== editingItem.id))
          
          // Add as new note
          const next = [...(selectedLead.notes || []), newNoteText.trim()]
          setSelectedLead(prev => ({ ...prev, notes: next }))
        } else {
          // Update reminder
          const reminderDate = document.getElementById('reminder_date')?.value
          if (!reminderDate) {
            toast.error('Please select a reminder date')
            return
          }
          
          const updatedReminder = {
            note_text: newNoteText.trim(),
            reminder_date: reminderDate,
            reminder_time: document.getElementById('reminder_time')?.value || null,
            priority: document.getElementById('reminder_priority')?.value || 'normal',
            status: reminders.find(r => r.id === editingItem.id)?.status || 'incomplete'
          }
          
          setReminders(prev => prev.map(r => 
            r.id === editingItem.id ? { ...r, ...updatedReminder } : r
          ))
        }
        setNewNoteText('')
        setIsReminder(false)
        setEditingItem(null)
        setHasChanges(true)
        return
      }
    }

    // If it's a reminder, validate reminder fields
    if (isReminder) {
      const reminderDate = document.getElementById('reminder_date')?.value
      if (!reminderDate) {
        toast.error('Please select a reminder date')
        return
      }

      // Add to local reminders state (will be saved when user clicks "Save Changes")
      const newReminder = {
        note_text: newNoteText.trim(),
        reminder_date: reminderDate,
        reminder_time: document.getElementById('reminder_time')?.value || null,
        priority: document.getElementById('reminder_priority')?.value || 'normal',
        status: 'incomplete'
      }
      setReminders(prev => [...prev, newReminder])
      setNewNoteText('')
      setIsReminder(false)
      setHasChanges(true)
    } else {
      // Regular note - add to notes array locally (will be saved when user clicks "Save Changes")
      const next = [...(selectedLead.notes || []), newNoteText.trim()]
      setSelectedLead(prev => ({ ...prev, notes: next }))
      setNewNoteText('')
      setHasChanges(true)
    }
  }

  function updateReminderStatusLocally(reminderId, updates) {
    setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, ...updates } : r))
    setHasChanges(true)
  }

  function deleteReminderLocally(reminderId) {
    setReminders(prev => prev.filter(r => r.id !== reminderId))
    setHasChanges(true)
  }

  // Unified save function - saves all changes at once
  async function saveAllChanges() {
    if (!selectedLead || !hasChanges) return

    setSaving(true)
    try {
      // Prepare reminders data (include all reminders with their current state)
      const remindersToSave = reminders.map(r => ({
        id: r.id || null, // null for new reminders
        note_text: r.note_text,
        reminder_date: r.reminder_date,
        reminder_time: r.reminder_time || null,
        priority: r.priority || 'normal',
        status: r.status || 'incomplete'
      }))

      // Ensure notes is always an array
      const notesToSave = Array.isArray(selectedLead.notes) ? selectedLead.notes : []

      // Include user_id and user_type when saving reminders
      const response = await fetch(`/api/leads/${selectedLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedLead.status,
          notes: notesToSave,
          reminders: remindersToSave,
          user_id: user?.id || null,
          user_type: user?.user_type || null
        })
      })

      const result = await response.json()
      if (response.ok && result.success) {
        // Update local state with saved data
        if (result.data) {
          // Update selectedLead with the saved data (including notes)
          setSelectedLead(prev => ({
            ...prev,
            notes: result.data.notes || prev.notes || [],
            status: result.data.status || prev.status,
            status_tracker: result.data.status_tracker || prev.status_tracker || []
          }))
        }
        
        if (result.reminders) {
          // Merge saved reminders (new ones will have IDs now)
          const savedReminders = [
            ...result.reminders.created,
            ...result.reminders.updated
          ]
          const existingReminderIds = new Set(savedReminders.map(r => r.id))
          const currentReminders = reminders.filter(r => !r.id || existingReminderIds.has(r.id))
          const mergedReminders = currentReminders.map(r => {
            const saved = savedReminders.find(s => s.id === r.id)
            return saved || r
          })
          // Add newly created reminders
          result.reminders.created.forEach(newReminder => {
            if (!mergedReminders.find(r => r.id === newReminder.id)) {
              mergedReminders.push(newReminder)
            }
          })
          setReminders(mergedReminders)
        }
        setHasChanges(false)
        setEditingItem(null)
        setNewNoteText('')
        setIsReminder(false)
        loadLeads() // Refresh the leads list
        setRemindersRefreshKey(prev => prev + 1) // Trigger reminders refresh
        toast.success('Changes saved successfully!')
      } else {
        toast.error(result.error || 'Failed to save changes')
      }
    } catch (err) {
      console.error('Error saving changes:', err)
      toast.error('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  async function sendMessage(lead) {
    if (!chatMessage.trim() || !user || !lead.seeker_id) return

    setSendingMessage(true)
    try {
      // Get token from AuthContext based on user type
      const token = user?.user_type === 'developer' ? developerToken : propertySeekerToken
      
      if (!token) {
        toast.error('Please log in to send messages')
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
        setMessageBoxLead(null)
        toast.success('Message sent successfully!')
      } else {
        const errorData = await convResponse.json()
        toast.error(errorData.error || 'Failed to send message')
      }
    } catch (err) {
      console.error('Error sending message:', err)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setSendingMessage(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // Leads are already filtered by the API, so we use them directly
  const filteredLeads = leads

  // Extract leads data for data cards
  const getTotalLeadsData = () => {
    if (!user?.profile) return null

    // Parse leads_breakdown JSON
    let leadsBreakdown = null
    if (user.profile.leads_breakdown) {
      try {
        leadsBreakdown = typeof user.profile.leads_breakdown === 'string'
          ? JSON.parse(user.profile.leads_breakdown)
          : user.profile.leads_breakdown
      } catch (e) {
        console.error('Error parsing leads_breakdown:', e)
      }
    }

    // Parse conversion_rate (can be string or number)
    let conversionRate = 0
    if (user.profile.conversion_rate) {
      conversionRate = typeof user.profile.conversion_rate === 'string'
        ? parseFloat(user.profile.conversion_rate)
        : user.profile.conversion_rate
    }

    // Support both old structure (phone_leads, message_leads) and new structure (phone, messaging, whatsapp, direct_message)
    const phoneLeads = leadsBreakdown?.phone?.total ?? leadsBreakdown?.phone_leads?.total ?? 0
    
    // Extract messaging data from nested structure
    const messagingData = leadsBreakdown?.messaging || {}
    const whatsappLeads = messagingData?.whatsapp?.total ?? leadsBreakdown?.whatsapp?.total ?? 0
    const directMessageLeads = messagingData?.direct_message?.total ?? leadsBreakdown?.direct_message?.total ?? 0
    const calculatedMessageTotal = whatsappLeads + directMessageLeads
    const messageTotal = messagingData?.total ?? leadsBreakdown?.message_leads?.total ?? calculatedMessageTotal
    
    const emailLeads = leadsBreakdown?.email?.total ?? leadsBreakdown?.email_leads?.total ?? 0
    const appointmentLeads = user.profile.total_appointments ?? leadsBreakdown?.appointment?.total ?? leadsBreakdown?.appointment_leads?.total ?? 0
    const websiteLeads = leadsBreakdown?.website?.total ?? leadsBreakdown?.website_leads?.total ?? 0

    return {
      total_leads: leadsBreakdown?.total_leads || user.profile.total_leads || 0,
      phone_leads: phoneLeads,
      messaging: messagingData, // Nested messaging structure
      whatsapp_leads: whatsappLeads,
      direct_message_leads: directMessageLeads,
      email_leads: emailLeads,
      appointment_leads: appointmentLeads,
      website_leads: websiteLeads,
      message_leads: messageTotal, // Backward compatibility
      conversion_rate: conversionRate || 0,
      leads_breakdown: leadsBreakdown
    }
  }

  const totalLeadsData = getTotalLeadsData()

  return (
    <div className="w-full space-y-6 text-primary_color">
      <ToastContainer position="top-right" autoClose={3000} />
      {/* Data Cards */}
      {totalLeadsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <DataCard
            title="Total Leads"
            value={(totalLeadsData.total_leads || 0).toLocaleString()}
            icon={BarChart3}
          />
          <DataCard
            title="Conversion Rate"
            value={`${(totalLeadsData.conversion_rate || 0).toFixed(2)}%`}
            icon={TrendingUp}
          />
          <DataCard
            title="Phone Leads"
            value={(totalLeadsData.phone_leads || 0).toLocaleString()}
            icon={Phone}
          />
          <DataCard
            title="Message Leads"
            value={(totalLeadsData.message_leads || 0).toLocaleString()}
            icon={MessageCircle}
          />
          <DataCard
            title="Appointments"
            value={(totalLeadsData.appointment_leads || 0).toLocaleString()}
            icon={Calendar}
          />
        </div>
      )}
      <br/>
      <Reminders listerId={listerId} listerType={listerType} refreshKey={remindersRefreshKey} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-secondary_color-900">Leads Manager System</h2>
          <p className="text-sm text-secondary_color-600 mt-1">
            {listingId ? 'Single listing leads' : 'All leads for this lister'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-secondary_color-500">
            Total: <span className="font-medium text-secondary_color-900">{total}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Search Input - Top */}
        <div>
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search by seeker name or listing..."
            value={search}
            onChange={(e) => { setPage(0); setSearch(e.target.value) }}
          />
        </div>

        {/* Filters Grid - Hidden on small, visible on medium+ */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary_color-700 mb-1">Status</label>
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
          <div>
            <label className="block text-sm font-medium text-secondary_color-700 mb-1">Action Type</label>
            <select 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              value={actionFilter} 
              onChange={(e) => { setPage(0); setActionFilter(e.target.value) }}
            >
              <option value="">All Actions</option>
              <option value="lead_phone">Phone</option>
              <option value="lead_message">Message</option>
              <option value="lead_appointment">Appointment</option>
              <option value="lead_email">Email</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary_color-700 mb-1">From Date</label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={dateFrom}
              onChange={(e) => { setPage(0); setDateFrom(e.target.value) }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary_color-700 mb-1">To Date</label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={dateTo}
              onChange={(e) => { setPage(0); setDateTo(e.target.value) }}
              min={dateFrom || undefined}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setPage(0)
                setStatusFilter('')
                setActionFilter('')
                setDateFrom('')
                setDateTo('')
                setSearch('')
              }}
              className="w-full px-4 py-2 text-sm font-medium text-secondary_color-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Mobile Filter Button - Only visible on small screens */}
        <div className="md:hidden">
          <button
            onClick={() => setShowFiltersModal(true)}
            className="w-full px-4 py-2 text-sm font-medium text-secondary_color-700 default_bg border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Show Filters
          </button>
        </div>

        {/* Mobile Filters Modal */}
        {showFiltersModal && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-secondary_color-900">Filters</h3>
                  <button
                    onClick={() => setShowFiltersModal(false)}
                    className="text-secondary_color-400 hover:text-secondary_color-600"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary_color-700 mb-1">Status</label>
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
                  <div>
                    <label className="block text-sm font-medium text-secondary_color-700 mb-1">Action Type</label>
                    <select 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      value={actionFilter} 
                      onChange={(e) => { setPage(0); setActionFilter(e.target.value) }}
                    >
                      <option value="">All Actions</option>
                      <option value="lead_phone">Phone</option>
                      <option value="lead_message">Message</option>
                      <option value="lead_appointment">Appointment</option>
                      <option value="lead_email">Email</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary_color-700 mb-1">From Date</label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={dateFrom}
                      onChange={(e) => { setPage(0); setDateFrom(e.target.value) }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary_color-700 mb-1">To Date</label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={dateTo}
                      onChange={(e) => { setPage(0); setDateTo(e.target.value) }}
                      min={dateFrom || undefined}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setPage(0)
                        setStatusFilter('')
                        setActionFilter('')
                        setDateFrom('')
                        setDateTo('')
                        setSearch('')
                      }}
                      className="flex-1 px-4 py-2 text-sm font-medium text-secondary_color-700 default_bg border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Clear Filters
                    </button>
                    <button
                      onClick={() => setShowFiltersModal(false)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Two Column Layout */}
     
        {/* Leads Management - Takes 2/3 width */}
        <div className="w-full space-y-6">
          {/* Table */}
          <div className="default_bg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-medium text-secondary_color-500 uppercase tracking-wider">Manage</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-secondary_color-500 uppercase tracking-wider w-32">Seeker</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-secondary_color-500 uppercase tracking-wider">Listing</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-secondary_color-500 uppercase tracking-wider">Score</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-secondary_color-500 uppercase tracking-wider">Actions</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-secondary_color-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="default_bg divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-secondary_color-600">Loading leads...</span>
                    </div>
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-red-600">
                    <div className="flex items-center justify-center">
                      <span className="text-red-600">{error}</span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && !error && filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <FiUser className="h-12 w-12 text-secondary_color-400 mb-4" />
                      <h3 className="text-sm font-medium text-secondary_color-900 mb-1">No leads found</h3>
                      <p className="text-sm text-secondary_color-500">
                        {search || statusFilter ? 'Try adjusting your filters' : 'No leads have been generated yet'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        className="text-blue-600 hover:text-blue-900 transition-colors relative"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Generate default message with listing link
                          const listingLink = lead.listing_id && lead.listing_slug && lead.listing_type
                            ? `${window.location.origin}/property/${lead.listing_type}/${lead.listing_slug}/${lead.listing_id}`
                            : null
                          const defaultMessage = listingLink
                            ? `Hi! I noticed your interest in ${lead.listing_title || 'this property'}. Here's the link: ${listingLink}`
                            : `Hi! I noticed your interest in ${lead.listing_title || 'this property'}. How can I help you?`
                          setChatMessage(defaultMessage)
                          setMessageBoxLead(lead)
                        }}
                        title="Message"
                      >
                        <FiMessageCircle className="box_holder border-1 border-primary_color w-8 h-8" />
                      </button>
                      <button
                        className="text-secondary_color-600 hover:text-secondary_color-900 transition-colors"
                        onClick={() => setSelectedLead(lead)}
                        title="Manage Lead"
                      >
                        <FiSettings className="box_holder w-8 h-8 border-1 border-primary_color" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <FiUser className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-secondary_color-900 truncate">
                          {lead.seeker_name || lead.seeker_id}
                        </div>
                        <div className="text-xs text-secondary_color-500">
                          {lead.total_actions} actions
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
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
                            <FiImage className="w-6 h-6 text-secondary_color-400" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 border border-gray-300">
                          <FiImage className="w-6 h-6 text-secondary_color-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-secondary_color-900 max-w-xs truncate font-medium">
                          {lead.listing_title || 'No listing'}
                        </div>
                        {lead.listing_location && (
                          <div className="text-xs text-secondary_color-500 truncate">
                            {lead.listing_location}
                          </div>
                        )}
                        <div className="text-xs text-secondary_color-400">
                          {lead.first_action_date}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        {/* <FiStar className="w-10 h-10 text-yellow-500" /> */}
                        <span className="text-sm font-semibold text-secondary_color-900">{lead.lead_score || 0}</span>
                      </div>
                      {(() => {
                        const category = getLeadCategory(lead.lead_score || 0)
                        return (
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${category.color}`}>
                            {category.label}
                          </span>
                        )
                      })()}
                    </div>
                  </td>
                  <td className="px-4 py-4">
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
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-secondary_color-600">
                          +{(lead.lead_actions || []).length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <select
                      className="px-2 py-1 text-xs border border-gray-300 rounded default_bg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={lead.status || 'new'}
                      onChange={async (e) => {
                        // For table view, save immediately
                        try {
                          const response = await fetch(`/api/leads/${lead.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: e.target.value })
                          })
                          if (response.ok) {
                            loadLeads()
                          }
                        } catch (err) {
                          console.error('Error updating status:', err)
                        }
                      }}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="responded">Responded</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                </tr>
              ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
        <div className="text-sm text-secondary_color-700">
          Showing {filteredLeads.length > 0 ? offset + 1 : 0} to {Math.min(offset + pageSize, filteredLeads.length)} of {filteredLeads.length} results
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="px-3 py-2 text-sm font-medium text-secondary_color-700 default_bg border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
            disabled={page === 0} 
            onClick={() => setPage(p => Math.max(0, p - 1))}
          >
            Previous
          </button>
          <span className="px-3 py-2 text-sm text-secondary_color-700">
            Page {page + 1} of {Math.max(1, Math.ceil(filteredLeads.length / pageSize))}
          </span>
          <button 
            className="px-3 py-2 text-sm font-medium text-secondary_color-700 default_bg border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
            disabled={(page + 1) >= Math.ceil(filteredLeads.length / pageSize)} 
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
        </div>

        {/* Reminders Sidebar - Takes 1/3 width */}
        {/* <div className="lg:col-span-1">
          <Reminders listerId={listerId} listerType={listerType} />
        </div> */}
 

      {/* Lead Details Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white/40 backdrop-blur-lg md:mt-[4em] ounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200  flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-secondary_color-900">Lead Details</h3>
                  <p className="text-sm text-secondary_color-600 mt-1">
                    {selectedLead.seeker_name || selectedLead.seeker_id} • {selectedLead.listing_title || selectedLead.listing_id}
                  </p>
                </div>
                <button 
                  className="px-4 py-2 text-sm font-medium text-secondary_color-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  onClick={() => {
                    if (hasChanges) {
                      if (!window.confirm('You have unsaved changes. Are you sure you want to close?')) {
                        return
                      }
                    }
                    setSelectedLead(null)
                    setHasChanges(false)
                    setEditingItem(null)
                    setNewNoteText('')
                    setIsReminder(false)
                  }}
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lead Information */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-base font-semibold text-secondary_color-900 mb-3">Lead Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <FiUser className="w-5 h-5 text-secondary_color-500" />
                        <span className="text-sm text-secondary_color-700">{selectedLead.seeker_name || selectedLead.seeker_id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiCalendar className="w-5 h-5 text-secondary_color-500" />
                        <span className="text-sm text-secondary_color-700">{selectedLead.first_action_date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-secondary_color-500">Status:</span>
                        <select
                          className="px-2 py-1 text-sm border border-gray-300 rounded default_bg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          value={selectedLead.status || 'new'}
                          onChange={(e) => updateLeadStatusLocally(selectedLead.id, e.target.value)}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="responded">Responded</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-secondary_color-500">Actions:</span>
                        <span className="text-sm text-secondary_color-700">{selectedLead.total_actions || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* <FiStar className="w-10 h-10 text-yellow-500" /> */}
                        <span className="text-sm text-secondary_color-500">Lead Score:</span>
                        <span className="text-sm font-semibold text-secondary_color-900">{selectedLead.lead_score || 0}</span>
                        {(() => {
                          const category = getLeadCategory(selectedLead.lead_score || 0)
                          return (
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ml-2 ${category.color}`}>
                              {category.label}
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Status History */}
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="text-base font-semibold text-secondary_color-900 mb-3">Status History</h4>
                    <div className="space-y-2">
                      {(Array.isArray(selectedLead.status_tracker) && selectedLead.status_tracker.length > 0) ? (
                        selectedLead.status_tracker.map((status, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span className="text-sm text-secondary_color-700 capitalize">{status}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-secondary_color-500">No status history yet</div>
                      )}
                    </div>
                  </div>

              
                </div>

                {/* Actions Timeline */}
                <div className="lg:col-span-1 space-y-4">
                  <h4 className="text-base font-semibold text-secondary_color-900 border-b border-gray-200 pb-2">Actions Timeline</h4>
                  <div className="space-y-3">
                    {(selectedLead.lead_actions || []).map((action, index) => {
                      // Format date from YYYYMMDD to readable format
                      const formatDate = (dateStr) => {
                        if (!dateStr || dateStr.length !== 8) return dateStr
                        try {
                          const year = dateStr.substring(0, 4)
                          const month = dateStr.substring(4, 6)
                          const day = dateStr.substring(6, 8)
                          const date = new Date(`${year}-${month}-${day}`)
                          return date.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })
                        } catch (e) {
                          return dateStr
                        }
                      }

                      // Format timestamp if available
                      const formatTime = (timestamp) => {
                        if (!timestamp) return null
                        try {
                          const date = new Date(timestamp)
                          return date.toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })
                        } catch (e) {
                          return null
                        }
                      }

                      const formattedDate = formatDate(action.action_date)
                      const formattedTime = formatTime(action.action_timestamp)

                      return (
                        <div key={action.action_id || index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex-shrink-0 mt-0.5">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                              {action.action_type.replace('lead_', '').replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-secondary_color-900 mb-1">
                              {action.action_metadata?.message_type && (
                                <span className="capitalize">Message: {action.action_metadata.message_type.replace('_', ' ')}</span>
                              )}
                              {action.action_metadata?.appointment_type && (
                                <span className="capitalize">Appointment: {action.action_metadata.appointment_type.replace('_', ' ')}</span>
                              )}
                              {action.action_metadata?.action && (
                                <span className="capitalize">Phone: {action.action_metadata.action}</span>
                              )}
                              {!action.action_metadata?.message_type && !action.action_metadata?.appointment_type && !action.action_metadata?.action && (
                                <span className="capitalize">{action.action_type.replace('lead_', '').replace('_', ' ')}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-secondary_color-500">
                              <FiCalendar className="w-3 h-3" />
                              <span>{formattedDate}</span>
                              {formattedTime && (
                                <>
                                  <span className="text-secondary_color-300">•</span>
                                  <span>{formattedTime}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <button
                            className="flex-shrink-0 p-1 text-secondary_color-400 hover:text-blue-600 transition-colors"
                            onClick={() => setShowChat(!showChat)}
                            title="Send message"
                          >
                            <FiMessageCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )
                    })}
                    {(selectedLead.lead_actions || []).length === 0 && (
                      <div className="text-center py-8 text-secondary_color-500 text-sm">
                        No actions recorded yet
                      </div>
                    )}
                  </div>

                  {/* Inline Chat */}
                  {showChat && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-medium text-green-900 flex items-center gap-2">
                          <FiMessageCircle className="w-5 h-5" />
                          Quick Message
                        </h5>
                        <button
                          className="text-green-600 hover:text-green-800"
                          onClick={() => setShowChat(false)}
                        >
                          <FiX className="w-5 h-5" />
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
                            <FiSend className="w-5 h-5" />
                            {sendingMessage ? 'Sending...' : 'Send'}
                          </button>
                          <button
                            className="px-3 py-2 text-sm font-medium text-secondary_color-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            onClick={() => setChatMessage('')}
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes and Reminders */}
                
                <div className="lg:col-span-1 space-y-4">
                  {/* Unified Add/Edit Note/Reminder */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                      {editingItem ? (
                        <>
                          <FiEdit3 className="w-5 h-5" />
                          {editingItem.type === 'reminder' ? 'Edit Reminder' : 'Edit Note'}
                        </>
                      ) : (
                        <>
                          <FiPlus className="w-5 h-5" />
                          Add Note
                        </>
                      )}
                    </h5>
                    <div className="space-y-3">
                      <textarea
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows="3"
                        placeholder="Enter your note here..."
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                      />
                      
                      {/* Reminder Toggle */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_reminder"
                          checked={isReminder}
                          onChange={(e) => setIsReminder(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="is_reminder" className="text-sm text-secondary_color-700 cursor-pointer">
                          Set as reminder
                        </label>
                      </div>

                      {/* Reminder Fields - Show when isReminder is true */}
                      {isReminder && (
                        <div className="space-y-3 p-3 default_bg rounded-lg border border-blue-200">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-secondary_color-700 mb-1">Date *</label>
                              <input
                                id="reminder_date"
                                type="date"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min={new Date().toISOString().split('T')[0]}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-secondary_color-700 mb-1">Time (optional)</label>
                              <input
                                id="reminder_time"
                                type="time"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-secondary_color-700 mb-1">Priority</label>
                            <select
                              id="reminder_priority"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              defaultValue="normal"
                            >
                              <option value="low">Low</option>
                              <option value="normal">Normal</option>
                              <option value="high">High</option>
                              <option value="urgent">Urgent</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {editingItem && (
                          <button
                            className="flex-1 px-4 py-2 text-sm font-medium text-secondary_color-700 default_bg border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            onClick={cancelEditing}
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          className={`${editingItem ? 'flex-1' : 'w-full'} px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                          disabled={!newNoteText.trim()}
                          onClick={addNoteOrReminder}
                        >
                          {editingItem ? (
                            <>
                              <FiEdit3 className="w-5 h-5" />
                              Save Changes
                            </>
                          ) : (
                            <>
                              <FiPlus className="w-5 h-5" />
                              {isReminder ? 'Add Reminder' : 'Add Note'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Reminders List */}
                  {reminders.length > 0 && (
                    <div>
                      <h4 className="text-base font-semibold text-secondary_color-900 border-b border-gray-200 pb-2 mb-3">Reminders</h4>
                      <div className="space-y-2">
                        {reminders.map((reminder) => {
                          const reminderDate = new Date(reminder.reminder_date)
                          const formattedDate = reminderDate.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })
                          const formattedTime = reminder.reminder_time 
                            ? new Date(`2000-01-01T${reminder.reminder_time}`).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              })
                            : null

                          // Determine status colors
                          let statusColor = 'bg-gray-100 text-secondary_color-800'
                          let borderColor = 'border-gray-200'
                          if (reminder.status === 'completed') {
                            statusColor = 'bg-green-100 text-green-800'
                            borderColor = 'border-green-200'
                          } else if (reminder.status === 'cancelled') {
                            statusColor = 'bg-gray-100 text-secondary_color-500'
                            borderColor = 'border-gray-200'
                          } else if (reminder.is_overdue) {
                            statusColor = 'bg-red-100 text-red-800'
                            borderColor = 'border-red-200'
                          } else {
                            statusColor = 'bg-yellow-100 text-yellow-800'
                            borderColor = 'border-yellow-200'
                          }

                          // Priority colors
                          let priorityColor = 'bg-gray-100 text-secondary_color-600'
                          if (reminder.priority === 'urgent') priorityColor = 'bg-red-100 text-red-700'
                          else if (reminder.priority === 'high') priorityColor = 'bg-orange-100 text-orange-700'
                          else if (reminder.priority === 'normal') priorityColor = 'bg-blue-100 text-blue-700'
                          else priorityColor = 'bg-gray-100 text-secondary_color-600'

                          return (
                            <div key={reminder.id || `temp-${reminders.indexOf(reminder)}`} className={`p-3 rounded-lg border ${borderColor} ${reminder.status === 'completed' ? 'opacity-60' : ''}`}>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="text-sm text-secondary_color-900 flex-1">{reminder.note_text}</p>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => startEditingReminder(reminder)}
                                    className="flex-shrink-0 p-1 text-secondary_color-400 hover:text-blue-600 transition-colors"
                                    title="Edit reminder"
                                  >
                                    <FiEdit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteReminderLocally(reminder.id)}
                                    className="flex-shrink-0 p-1 text-secondary_color-400 hover:text-red-600 transition-colors"
                                    title="Delete reminder"
                                  >
                                    <FiTrash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center gap-1 text-xs text-secondary_color-600">
                                      <FiCalendar className="w-3 h-3" />
                                      <span>{formattedDate}</span>
                                      {formattedTime && <span>• {formattedTime}</span>}
                                    </div>
                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${priorityColor}`}>
                                      {reminder.priority}
                                    </span>
                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>
                                      {reminder.status === 'completed' ? 'Completed' : reminder.is_overdue ? 'Overdue' : 'Pending'}
                                    </span>
                                  </div>
                                  {reminder.status === 'incomplete' && (
                                    <div className="mt-2 flex gap-2">
                                      <button
                                        onClick={() => updateReminderStatusLocally(reminder.id, { status: 'completed' })}
                                        className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded transition-colors"
                                      >
                                        Mark Complete
                                      </button>
                                      <button
                                        onClick={() => updateReminderStatusLocally(reminder.id, { status: 'cancelled' })}
                                        className="px-2 py-1 text-xs font-medium text-secondary_color-700 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  )}
                                  {reminder.status === 'completed' && (
                                    <button
                                      onClick={() => updateReminderStatusLocally(reminder.id, { status: 'incomplete' })}
                                      className="mt-2 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                                    >
                                      Reopen
                                    </button>
                                  )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Saved Notes */}
                  <h4 className="text-base font-semibold text-secondary_color-900 border-b border-gray-200 pb-2">Saved Notes</h4>
                  
                  <div className="space-y-3">
                    {(Array.isArray(selectedLead.notes) ? selectedLead.notes : []).map((note, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <p className="text-sm text-secondary_color-900 leading-relaxed">{note}</p>
                          <div className="mt-3 flex gap-2">
                            <button 
                              className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors flex items-center gap-1"
                              onClick={() => startEditingNote(idx)}
                            >
                              <FiEdit3 className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors flex items-center gap-1"
                              onClick={() => {
                                const next = (selectedLead.notes || []).filter((_, i) => i !== idx)
                                setSelectedLead(prev => ({ ...prev, notes: next }))
                                setHasChanges(true)
                              }}
                            >
                              <FiTrash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(Array.isArray(selectedLead.notes) ? selectedLead.notes : []).length === 0 && (
                      <div className="text-center py-8 text-secondary_color-500 text-sm">
                        No notes yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer with Save Changes Button - Fixed at bottom */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-shrink-0">
              <div className="text-sm text-secondary_color-600">
                {hasChanges && <span className="text-orange-600 font-medium">You have unsaved changes</span>}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (hasChanges) {
                      if (!window.confirm('You have unsaved changes. Are you sure you want to close?')) {
                        return
                      }
                    }
                    setSelectedLead(null)
                    setHasChanges(false)
                    setEditingItem(null)
                    setNewNoteText('')
                    setIsReminder(false)
                  }}
                  className="px-4 py-2 text-sm font-medium text-secondary_color-700 default_bg border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {hasChanges ? 'Cancel' : 'Close'}
                </button>
                {hasChanges && (
                  <button
                    onClick={saveAllChanges}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Box Modal */}
      {messageBoxLead && (
        <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4" onClick={() => {
          setChatMessage('')
          setMessageBoxLead(null)
        }}>
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary_color-900">Send Message</h3>
              <button
                onClick={() => setMessageBoxLead(null)}
                className="text-secondary_color-400 hover:text-secondary_color-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-secondary_color-600 mb-2">
                To: <span className="font-medium">{messageBoxLead.seeker_name || messageBoxLead.seeker_id}</span>
              </p>
              {messageBoxLead.listing_title && (
                <p className="text-sm text-secondary_color-600">
                  Listing: <span className="font-medium">{messageBoxLead.listing_title}</span>
                </p>
              )}
            </div>

            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none mb-4"
              rows="4"
              placeholder="Type your message here..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setChatMessage('')
                  setMessageBoxLead(null)
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-secondary_color-700 default_bg border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!chatMessage.trim()) {
                    toast.error('Please enter a message')
                    return
                  }
                  await sendMessage(messageBoxLead)
                  setMessageBoxLead(null)
                }}
                disabled={!chatMessage.trim() || sendingMessage}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FiSend className="w-4 h-4" />
                {sendingMessage ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


