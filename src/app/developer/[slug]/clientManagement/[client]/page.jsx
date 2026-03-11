'use client'

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiDollarSign,
  FiCalendar,
  FiPlus,
  FiTrash2,
  FiClock,
  FiSearch,
  FiMessageSquare,
  FiFileText,
  FiGrid,
  FiCreditCard,
  FiPocket,
  FiEdit2,
  FiUpload,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiSettings
} from 'react-icons/fi'
import { Input } from '@/app/components/ui/input'
import UnitCard from '@/app/components/developers/units/UnitCard'
import { useAuth } from '@/contexts/AuthContext'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {
  CLIENT_STATUSES,
  CLIENT_SOURCE_CHANNELS,
  CLIENT_TYPES,
  ASSIGNMENT_ROLES
} from '../dummyClients'

const ENGAGEMENT_STATUSES = ['Pending', 'Completed', 'Overdue']
const TRANSACTION_TYPES = ['Deposit', 'Installment', 'Full payment', 'Adjustment']
const TRANSACTION_STATUSES = ['Pending', 'Completed', 'Failed', 'Reversed']
const SERVICE_CHARGE_STATUSES = ['Pending', 'Paid', 'Overdue']

const NAV_ITEMS = [
  { id: 'info', label: 'Info', icon: FiUser },
  { id: 'units', label: 'Units', icon: FiGrid },
  { id: 'transactions', label: 'Transactions', icon: FiCreditCard },
  { id: 'serviceCharges', label: 'Service charges', icon: FiPocket },
  { id: 'engagement', label: 'Engagement', icon: FiClock },
  { id: 'documents', label: 'Documents', icon: FiFileText },
  { id: 'messaging', label: 'Messaging', icon: FiMessageSquare }
]

// Client assigned-user permissions: Create, Read, Update, Delete as separate permissions per section
const INFO_FIELDS = ['name', 'address', 'emails', 'phone', 'clientType', 'totalUnitsSold', 'firstContactDate', 'secondContactDate', 'sourceUser', 'notes']
const defaultInfoSub = () => Object.fromEntries(INFO_FIELDS.map(f => [f, 'none']))
const defaultCrud = () => ({ create: false, read: false, update: false, delete: false })
const defaultCrudWithExport = () => ({ ...defaultCrud(), export: false })

const getDefaultPermissions = () => ({
  info: defaultInfoSub(),
  units: 'none',
  documents: defaultCrud(),
  serviceCharges: defaultCrudWithExport(),
  transactions: defaultCrudWithExport(),
  userAssignment: defaultCrud(),
  engagement: defaultCrud(),
  messaging: defaultCrud()
})

function toCrud(obj) {
  if (!obj || typeof obj !== 'object') return defaultCrud()
  return {
    create: !!obj.create,
    read: !!obj.read,
    update: !!obj.update,
    delete: !!obj.delete
  }
}

function toCrudWithExport(obj) {
  if (!obj || typeof obj !== 'object') return defaultCrudWithExport()
  return { ...toCrud(obj), export: !!obj.export }
}

function normalizePermissions(perms) {
  if (!perms || typeof perms !== 'object') return getDefaultPermissions()
  const def = getDefaultPermissions()
  const info = { ...def.info }
  if (perms.info && typeof perms.info === 'object') INFO_FIELDS.forEach(f => { if (perms.info[f]) info[f] = perms.info[f] })
  else if (typeof perms.info === 'string') { if (perms.info === 'full') INFO_FIELDS.forEach(f => { info[f] = 'view' }); else if (perms.info === 'name_only') info.name = 'view' }

  const migrate = (key, crudKeys) => {
    const v = perms[key]
    if (typeof v === 'object' && v !== null) return crudKeys.includes('export') ? toCrudWithExport(v) : toCrud(v)
    if (typeof v === 'string') {
      const obj = crudKeys.includes('export') ? defaultCrudWithExport() : defaultCrud()
      if (v === 'none') return obj
      if (v === 'view') return { ...obj, read: true }
      if (v === 'crud') return { ...obj, create: true, read: true, update: true, delete: true }
      if (v === 'crud_export') return { ...obj, create: true, read: true, update: true, delete: true, export: true }
    }
    return crudKeys.includes('export') ? defaultCrudWithExport() : defaultCrud()
  }

  return {
    info,
    units: ['none', 'view'].includes(perms.units) ? perms.units : def.units,
    documents: migrate('documents', []),
    serviceCharges: migrate('serviceCharges', ['export']),
    transactions: migrate('transactions', ['export']),
    userAssignment: migrate('userAssignment', []),
    engagement: migrate('engagement', []),
    messaging: migrate('messaging', [])
  }
}


// Address search using Google Maps Places API - selects value into fullAddress

const SingleClientPage = () => {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug || ''
  const clientId = params?.client || ''
  const isAddNew = clientId === 'addNewClient'
  const { developerToken, user } = useAuth()
  const isAdminOrSuperAdmin = !user?.profile?.permissions || /^(super\s*admin|admin)$/i.test(String(user?.profile?.role_name || '').trim())

  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(!isAddNew)
  const [assignableUsers, setAssignableUsers] = useState([])
  const basePath = `/developer/${slug}/clientManagement`

  const token = () => developerToken || (typeof window !== 'undefined' ? localStorage.getItem('developer_token') : null)
  const authHeaders = () => ({ Authorization: `Bearer ${token()}` })

  const fetchClient = useCallback(() => {
    if (!clientId || isAddNew || !token()) return
    fetch(`/api/clients/${clientId}`, { headers: authHeaders() })
      .then(res => res.json())
      .then(data => { if (data.success) setClient(data.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [clientId, isAddNew])

  const fetchedForRef = useRef(null)
  useEffect(() => {
    if (isAddNew) {
      router.replace(`${basePath}?add=1`)
      return
    }
    if (fetchedForRef.current === clientId) return
    fetchedForRef.current = clientId
    fetchClient()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- basePath/router excluded to avoid infinite refetch from unstable refs
  }, [isAddNew, clientId, fetchClient])

  useEffect(() => {
    if (!token()) return
    fetch('/api/clients/assignable-users', { headers: authHeaders() })
      .then(res => res.json())
      .then(data => { if (data.success) setAssignableUsers(data.data || []) })
  }, [developerToken])

  const [activeTab, setActiveTab] = useState('info')
  const [assignSearch, setAssignSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteServiceChargeId, setDeleteServiceChargeId] = useState(null)
  const [editingServiceChargeId, setEditingServiceChargeId] = useState(null)
  const [editingTransactionId, setEditingTransactionId] = useState(null)
  const [savingTransaction, setSavingTransaction] = useState(false)
  const [savingServiceCharge, setSavingServiceCharge] = useState(false)
  const [newEngagement, setNewEngagement] = useState({ heading: '', note: '', isReminder: false, date: '', time: '', status: 'Pending' })
  const [editingEngagementId, setEditingEngagementId] = useState(null)
  const [openModal, setOpenModal] = useState(null)
  const [newTransaction, setNewTransaction] = useState({ unitId: '', unitName: '', amount: '', transactionType: 'Deposit', transactionDate: '', paymentMethod: '', reference: '', status: 'Completed', attachments: [] })
  const [newServiceCharge, setNewServiceCharge] = useState({ unitId: '', unitName: '', amount: '', period: '', periodStart: '', periodEnd: '', dueDate: '', status: 'Pending', paidAt: '', billingReference: '' })
  const [newDocument, setNewDocument] = useState({ fileName: '', fileUrl: '' })
  const [infoForm, setInfoForm] = useState({ name: '', clientType: 'Individual', emails: [''], phones: [''], address: {}, status: 'Qualified', sourceChannel: 'Website', sourceUserId: '', firstContactDate: '', convertedDate: '', notes: '', tags: '' })
  const [editingPermissionsUserId, setEditingPermissionsUserId] = useState(null)
  const [editingRole, setEditingRole] = useState('')
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(false)
  const [serviceChargeUnitDropdownOpen, setServiceChargeUnitDropdownOpen] = useState(false)
  const [savingInfo, setSavingInfo] = useState(false)
  const [permissionForm, setPermissionForm] = useState(getDefaultPermissions)
  const [expandedPermissionSections, setExpandedPermissionSections] = useState({})
  const [gmPlacesLoaded, setGmPlacesLoaded] = useState(false)
  const [addressQuery, setAddressQuery] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const autocompleteServiceRef = useRef(null)
  const placesServiceRef = useRef(null)
  const addressTimerRef = useRef(null)

  // Load Google Maps Places API
  useEffect(() => {
    if (typeof window === 'undefined') return
    const initPlaces = () => {
      try {
        if (window.google?.maps?.places) {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
          placesServiceRef.current = new window.google.maps.places.PlacesService(document.createElement('div'))
          setGmPlacesLoaded(true)
        }
      } catch (e) {
        console.error('Google Places init error:', e)
      }
    }
    if (window.google?.maps?.places) {
      initPlaces()
      return
    }
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API
    if (!apiKey) return
    const existing = document.getElementById('gmaps-script')
    if (existing) {
      const h = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(h)
          initPlaces()
        }
      }, 100)
      return () => clearInterval(h)
    }
    const s = document.createElement('script')
    s.id = 'gmaps-script'
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    s.async = true
    s.defer = true
    s.onload = initPlaces
    document.head.appendChild(s)
  }, [])

  const onAddressSearch = useCallback((value, onSelect) => {
    setAddressQuery(value)
    if (!gmPlacesLoaded || !autocompleteServiceRef.current) return
    if (addressTimerRef.current) clearTimeout(addressTimerRef.current)
    addressTimerRef.current = setTimeout(() => {
      if (!value.trim()) {
        setAddressSuggestions([])
        return
      }
      autocompleteServiceRef.current.getPlacePredictions({ input: value }, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setAddressSuggestions(predictions.slice(0, 6))
        } else {
          setAddressSuggestions([])
        }
      })
    }, 250)
  }, [gmPlacesLoaded])

  const onAddressSuggestionSelect = useCallback((prediction, onSelect) => {
    if (!placesServiceRef.current) return
    placesServiceRef.current.getDetails(
      { placeId: prediction.place_id, fields: ['formatted_address'] },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.formatted_address) {
          onSelect({ fullAddress: place.formatted_address })
          setAddressQuery(place.formatted_address)
          setAddressSuggestions([])
        }
      }
    )
  }, [])

  useEffect(() => {
    setAddressSuggestions([])
  }, [clientId, isAddNew])

  useEffect(() => {
    if (client && !isAddNew) {
      setInfoForm({
        name: client.name || '',
        clientType: client.clientType || 'Individual',
        emails: (client.emails && client.emails.length) ? [...client.emails] : [''],
        phones: (client.phones && client.phones.length) ? [...client.phones] : [''],
        address: client.address || {},
        status: client.status || 'Qualified',
        sourceChannel: client.sourceChannel || 'Website',
        sourceUserId: client.sourceUserId || '',
        firstContactDate: client.firstContactDate || '',
        convertedDate: client.convertedDate || '',
        notes: client.notes || '',
        tags: Array.isArray(client.tags) ? client.tags.join(', ') : (client.tags || '')
      })
    }
  }, [client?.id])

  const addEmailInfo = () => setInfoForm(f => ({ ...f, emails: [...f.emails, ''] }))
  const removeEmailInfo = (i) => setInfoForm(f => ({ ...f, emails: f.emails.filter((_, idx) => idx !== i) }))
  const setEmailInfo = (i, v) => setInfoForm(f => ({ ...f, emails: f.emails.map((e, idx) => idx === i ? v : e) }))
  const addPhoneInfo = () => setInfoForm(f => ({ ...f, phones: [...f.phones, ''] }))
  const removePhoneInfo = (i) => setInfoForm(f => ({ ...f, phones: f.phones.filter((_, idx) => idx !== i) }))
  const setPhoneInfo = (i, v) => setInfoForm(f => ({ ...f, phones: f.phones.map((p, idx) => idx === i ? v : p) }))

  const assignableUsersFiltered = useMemo(() => {
    if (!client) return []
    const assignedIds = (client.assignedUserIds || [])
    const filtered = assignableUsers.filter(
      u => !assignedIds.includes(u.id) &&
        (!assignSearch.trim() || (u.name || '').toLowerCase().includes(assignSearch.toLowerCase()))
    )
    return assignSearch.trim() ? filtered : filtered.slice(0, 5)
  }, [client, assignSearch, assignableUsers])

  // Current user's client assignment and permissions (from API or derived from assignedUsers)
  const myAssignment = useMemo(() => {
    if (client?.currentUserAssignment) {
      return { id: client.currentUserAssignment.id, role: client.currentUserAssignment.role, permissions: client.currentUserAssignment.permissions }
    }
    if (!client?.assignedUsers || !user?.id) return null
    return (client.assignedUsers || []).find(a => String(a.id) === String(user.id))
  }, [client?.currentUserAssignment, client?.assignedUsers, user?.id])
  const myPerms = useMemo(() => normalizePermissions(myAssignment?.permissions ?? client?.currentUserPermissions), [myAssignment?.permissions, client?.currentUserPermissions])
  // If not assigned: treat as full access (e.g. owner/admin viewing any client)
  const canUpdate = (section) => {
    if (!myAssignment) return true
    if (section === 'info') return Object.values(myPerms.info || {}).some(v => v === 'view')
    if (section === 'units') return (myPerms.units || 'none') === 'view'
    return !!myPerms?.[section]?.update
  }
  const canCreate = (section) => !myAssignment || !!myPerms?.[section]?.create
  const canDelete = (section) => !myAssignment || !!myPerms?.[section]?.delete
  const canRead = (section) => {
    if (!myAssignment) return true
    if (section === 'info') return Object.values(myPerms.info || {}).some(v => v === 'view')
    if (section === 'units') return (myPerms.units || 'none') === 'view'
    return !!myPerms?.[section]?.read
  }
  const canManageUserAssignment = () => !myAssignment || !!myPerms?.userAssignment?.update
  const canAssignUser = () => !myAssignment || !!myPerms?.userAssignment?.create
  const canUnassignUser = () => !myAssignment || !!myPerms?.userAssignment?.delete
  const canViewInfoField = (field) => !myAssignment || (myPerms?.info?.[field] === 'view')

  const visibleNavItems = useMemo(() => NAV_ITEMS.filter(t => canRead(t.id)), [myPerms, myAssignment])
  const defaultTab = visibleNavItems[0]?.id

  useEffect(() => {
    if (defaultTab && !visibleNavItems.some(t => t.id === activeTab)) {
      setActiveTab(defaultTab)
    }
  }, [visibleNavItems, defaultTab, activeTab])

  const clientUnitOptions = useMemo(() => (client?.units || []).map(u => ({ id: u.id, name: u.title || u.name || 'Unit' })), [client])

  const getUnitImage = (unit) => {
    if (!unit?.media) return null
    if (unit.media?.albums && Array.isArray(unit.media.albums)) {
      for (const album of unit.media.albums) {
        if (album?.images?.length) return album.images[0]?.url
      }
    }
    if (unit.media?.mediaFiles?.length) return unit.media.mediaFiles[0]?.url
    return null
  }
  const getUnitLocation = (unit) => [unit?.city, unit?.town, unit?.state, unit?.country].filter(Boolean).join(', ') || unit?.full_address || '—'
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const formatPeriodDate = (d) => {
    if (!d) return ''
    const [y, m, day] = String(d).split('-')
    const mi = parseInt(m, 10) - 1
    return `${parseInt(day, 10)}-${MONTHS[mi] || m}-${y}`
  }

  const handleAssignUser = (user) => {
    if (!client || !token()) return
    fetch(`/api/clients/${clientId}/assignments`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, role: user.role || 'Support', permissions: getDefaultPermissions() })
    })
      .then(res => res.json())
      .then(data => { if (data.success) { fetchClient(); setAssignSearch(''); setAssignDropdownOpen(false) } })
      .catch(() => {})
  }

  const handleUnassignUser = (userId, userName) => {
    if (!client || !token()) return
    if (!window.confirm(`Are you sure you want to remove ${userName || 'this user'} from the people managing this client?`)) return
    fetch(`/api/clients/${clientId}/assignments?userId=${userId}`, { method: 'DELETE', headers: authHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchClient()
          if (editingPermissionsUserId === userId) { setEditingPermissionsUserId(null); setOpenModal(null) }
        }
      })
      .catch(() => {})
  }

  const openPermissionsEditor = (user) => {
    setPermissionForm(normalizePermissions(user.permissions))
    setEditingPermissionsUserId(user.id)
    setExpandedPermissionSections({})
    setOpenModal('permissions')
  }

  const togglePermissionSection = (section) => {
    setExpandedPermissionSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleUpdateUserPermissions = (userId, permissions, role) => {
    if (!client || !token()) return
    fetch(`/api/clients/${clientId}/assignments/${userId}`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: { ...getDefaultPermissions(), ...permissions }, role: role ?? undefined })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchClient()
          setEditingPermissionsUserId(null)
          setOpenModal(null)
          toast.success('Changes saved successfully!')
        } else toast.error(data.error || 'Failed to save changes')
      })
      .catch(() => toast.error('Failed to save changes'))
  }

  const handleSaveClientInfo = () => {
    if (!client || !token()) return
    setSavingInfo(true)
    const tagsArr = (infoForm.tags || '').split(',').map(t => t.trim()).filter(Boolean)
    fetch(`/api/clients/${clientId}`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: infoForm.name,
        clientType: infoForm.clientType,
        emails: infoForm.emails.filter(Boolean),
        phones: infoForm.phones.filter(Boolean),
        address: infoForm.address,
        status: infoForm.status,
        sourceChannel: infoForm.sourceChannel,
        sourceUserId: infoForm.sourceUserId || null,
        firstContactDate: infoForm.firstContactDate || null,
        convertedDate: infoForm.convertedDate || null,
        notes: infoForm.notes || '',
        tags: tagsArr
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchClient()
          toast.success('Changes saved successfully!')
        } else toast.error(data.error || 'Failed to save changes')
      })
      .catch(() => toast.error('Failed to save changes'))
      .finally(() => setSavingInfo(false))
  }

  const handleAddTransaction = () => {
    if (!client || !newTransaction.amount || !newTransaction.transactionDate || !token() || savingTransaction) return
    setSavingTransaction(true)
    fetch(`/api/clients/${clientId}/transactions`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unitId: newTransaction.unitId || null,
        amount: Number(newTransaction.amount),
        transactionDate: newTransaction.transactionDate,
        transactionType: newTransaction.transactionType,
        paymentMethod: newTransaction.paymentMethod || null,
        reference: newTransaction.reference || null,
        status: newTransaction.status,
        attachments: newTransaction.attachments || []
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchClient()
          setNewTransaction({ unitId: '', unitName: '', amount: '', transactionType: 'Deposit', transactionDate: '', paymentMethod: '', reference: '', status: 'Completed', attachments: [] })
          setOpenModal(null)
          toast.success('Transaction added successfully!')
        } else toast.error(data.error || 'Failed to save')
      })
      .catch(() => toast.error('Failed to save'))
      .finally(() => setSavingTransaction(false))
  }

  const handleUpdateTransaction = () => {
    if (!client || !editingTransactionId || !newTransaction.amount || !newTransaction.transactionDate || !token() || savingTransaction) return
    setSavingTransaction(true)
    fetch(`/api/clients/${clientId}/transactions/${editingTransactionId}`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unitId: newTransaction.unitId || null,
        amount: Number(newTransaction.amount),
        transactionDate: newTransaction.transactionDate,
        transactionType: newTransaction.transactionType,
        paymentMethod: newTransaction.paymentMethod || null,
        reference: newTransaction.reference || null,
        status: newTransaction.status,
        attachments: newTransaction.attachments || []
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchClient()
          setEditingTransactionId(null)
          setNewTransaction({ unitId: '', unitName: '', amount: '', transactionType: 'Deposit', transactionDate: '', paymentMethod: '', reference: '', status: 'Completed', attachments: [] })
          setOpenModal(null)
          toast.success('Transaction updated successfully!')
        } else toast.error(data.error || 'Failed to update')
      })
      .catch(() => toast.error('Failed to update'))
      .finally(() => setSavingTransaction(false))
  }

  const handleTransactionFileChange = (e) => {
    const files = e.target.files
    if (!files?.length) return
    const names = [...(newTransaction.attachments || []), ...Array.from(files).map(f => f.name)]
    setNewTransaction(prev => ({ ...prev, attachments: names }))
    e.target.value = ''
  }

  const removeTransactionAttachment = (index) => {
    setNewTransaction(prev => ({ ...prev, attachments: (prev.attachments || []).filter((_, i) => i !== index) }))
  }

  const handleDeleteTransaction = (txId) => {
    if (!client || !token()) return
    fetch(`/api/clients/${clientId}/transactions/${txId}`, { method: 'DELETE', headers: authHeaders() })
      .then(res => res.json())
      .then(data => { if (data.success) fetchClient() })
      .catch(() => {})
  }

  const handleAddServiceCharge = () => {
    if (!client || !newServiceCharge.amount || !newServiceCharge.unitId || !token() || savingServiceCharge) return
    const payload = { unitId: newServiceCharge.unitId, amount: Number(newServiceCharge.amount), periodStart: newServiceCharge.periodStart || null, periodEnd: newServiceCharge.periodEnd || null, status: newServiceCharge.status, paidAt: newServiceCharge.paidAt || null, billingReference: newServiceCharge.billingReference || null }
    console.log('[client] POST service-charge payload:', payload)
    setSavingServiceCharge(true)
    fetch(`/api/clients/${clientId}/service-charges`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchClient()
          setNewServiceCharge({ unitId: '', unitName: '', amount: '', period: '', periodStart: '', periodEnd: '', dueDate: '', status: 'Pending', paidAt: '', billingReference: '' })
          setOpenModal(null)
          toast.success('Service charge added successfully!')
        } else toast.error(data.error || 'Failed to save')
      })
      .catch(() => toast.error('Failed to save'))
      .finally(() => setSavingServiceCharge(false))
  }

  const handleUpdateServiceCharge = () => {
    if (!client || !editingServiceChargeId || !newServiceCharge.amount || !newServiceCharge.unitId || !token() || savingServiceCharge) return
    setSavingServiceCharge(true)
    fetch(`/api/clients/${clientId}/service-charges/${editingServiceChargeId}`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unitId: newServiceCharge.unitId,
        amount: Number(newServiceCharge.amount),
        periodStart: newServiceCharge.periodStart || null,
        periodEnd: newServiceCharge.periodEnd || null,
        status: newServiceCharge.status,
        paidAt: newServiceCharge.paidAt || null,
        billingReference: newServiceCharge.billingReference || null
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchClient()
          setEditingServiceChargeId(null)
          setNewServiceCharge({ unitId: '', unitName: '', amount: '', period: '', periodStart: '', periodEnd: '', dueDate: '', status: 'Pending', paidAt: '', billingReference: '' })
          setOpenModal(null)
          toast.success('Service charge updated successfully!')
        } else toast.error(data.error || 'Failed to update')
      })
      .catch(() => toast.error('Failed to update'))
      .finally(() => setSavingServiceCharge(false))
  }

  const handleDeleteServiceCharge = (scId) => {
    if (!client || !token() || !scId) return
    fetch(`/api/clients/${clientId}/service-charges/${scId}`, { method: 'DELETE', headers: authHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchClient()
          setDeleteServiceChargeId(null)
          toast.success('Service charge deleted successfully.')
        } else toast.error(data.error || 'Failed to delete')
      })
      .catch(() => toast.error('Failed to delete'))
  }

  const handleAddDocument = () => {
    if (!client || !newDocument.fileName.trim() || !token()) return
    fetch(`/api/clients/${clientId}/documents`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: newDocument.fileName.trim(), fileUrl: newDocument.fileUrl || '#' })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchClient()
          setNewDocument({ fileName: '', fileUrl: '' })
          setOpenModal(null)
          toast.success('Changes saved successfully!')
        } else toast.error(data.error || 'Failed to save')
      })
      .catch(() => toast.error('Failed to save'))
  }

  const handleDeleteDocument = (docId) => {
    if (!client || !token()) return
    fetch(`/api/clients/${clientId}/documents/${docId}`, { method: 'DELETE', headers: authHeaders() })
      .then(res => res.json())
      .then(data => { if (data.success) fetchClient() })
      .catch(() => {})
  }

  const handleUpdateEngagement = (entry) => {
    if (!client || !editingEngagementId || !token()) return
    const e = (client.engagementLog || []).find(x => x.id === editingEngagementId)
    const dateTime = entry.dateTime !== undefined ? entry.dateTime : e?.dateTime
    fetch(`/api/clients/${clientId}/engagement/${editingEngagementId}`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ heading: entry.heading, note: entry.note, dateTime, isReminder: entry.isReminder, status: entry.status })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchClient()
          setEditingEngagementId(null)
          setOpenModal(null)
          toast.success('Changes saved successfully!')
        } else toast.error(data.error || 'Failed to save')
      })
      .catch(() => toast.error('Failed to save'))
  }

  const handleDeleteEngagement = (engId) => {
    if (!client || !token()) return
    fetch(`/api/clients/${clientId}/engagement/${engId}`, { method: 'DELETE', headers: authHeaders() })
      .then(res => res.json())
      .then(data => { if (data.success) { fetchClient(); setEditingEngagementId(null) } })
      .catch(() => {})
  }

  const handleAddEngagement = () => {
    if (!newEngagement.heading.trim() || !client || !token()) return
    const dateTime = newEngagement.date && newEngagement.time
      ? `${newEngagement.date}T${newEngagement.time}`
      : newEngagement.date ? `${newEngagement.date}T09:00:00` : new Date().toISOString().slice(0, 16)
    fetch(`/api/clients/${clientId}/engagement`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        heading: newEngagement.heading,
        note: newEngagement.note,
        dateTime,
        isReminder: newEngagement.isReminder,
        status: newEngagement.status
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchClient()
          setNewEngagement({ heading: '', note: '', isReminder: false, date: '', time: '', status: 'Pending' })
          setOpenModal(null)
          toast.success('Changes saved successfully!')
        } else toast.error(data.error || 'Failed to save')
      })
      .catch(() => toast.error('Failed to save'))
  }

  const handleDeleteClient = () => {
    if (!deleteConfirm || !client || !token()) return
    fetch(`/api/clients/${clientId}`, { method: 'DELETE', headers: authHeaders() })
      .then(res => res.json())
      .then(data => { if (data.success) router.push(basePath) })
      .catch(() => {})
  }

  if (isAddNew) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center text-primary_color">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary_color border-t-transparent mx-auto mb-4" />
          <p>Redirecting...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center text-primary_color">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary_color border-t-transparent mx-auto mb-4" />
          <p>Loading client...</p>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center text-primary_color">
          <p className="mb-4">Client not found.</p>
          <Link href={basePath}><span className="secondary_button inline-block">Back to clients</span></Link>
        </div>
      </div>
    )
  }

  const closeModal = () => {
    setOpenModal(null)
    setEditingEngagementId(null)
    setNewEngagement({ heading: '', note: '', isReminder: false, date: '', time: '', status: 'Pending' })
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
    <div className="min-h-screen p-4 md:p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <Link href={basePath} className="inline-flex items-center gap-2 text-sm text-primary_color/80 hover:text-primary_color">
          <FiArrowLeft className="w-4 h-4" /> Back to clients
        </Link>
        {isAdminOrSuperAdmin && (
        <Link href={`${basePath}?add=1`} className="primary_button inline-flex items-center gap-2 text-sm py-2 px-4">
          <FiPlus className="w-4 h-4" /> Add New Client
        </Link>
        )}
      </div>

      {/* Client header */}
      <header className="default_bg rounded-xl border border-white/40 p-4 md:p-5 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary_color/10 flex items-center justify-center border border-white/40 flex-shrink-0">
              {client.avatarUrl ? <img src={client.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover" /> : <FiUser className="w-7 h-7 text-primary_color" />}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-primary_color">{client.name}</h1>
              <p className="text-sm text-primary_color/70 mt-0.5">{client.clientCode} · {client.clientType}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${client.status === 'Active' ? 'bg-primary_color/20 text-primary_color' : client.status === 'Qualified' ? 'bg-primary_color/15 text-primary_color' : 'default_bg text-primary_color/80 border border-white/40'}`}>
                  {client.status}
                </span>
                {(client.tags || []).map(tag => <span key={tag} className="inline-flex px-2.5 py-1 rounded-full text-xs default_bg text-primary_color/80 border border-white/40">{tag}</span>)}
              </div>
            </div>
          </div>
          {isAdminOrSuperAdmin && !myAssignment && (
          <div className="flex flex-wrap items-center gap-2">
            {deleteConfirm ? (
              <>
                <button type="button" onClick={handleDeleteClient} className="tertiary_button text-sm py-3">Confirm delete</button>
                <button type="button" onClick={() => setDeleteConfirm(false)} className="secondary_button text-sm py-3">Cancel</button>
              </>
            ) : (
              <button type="button" onClick={() => setDeleteConfirm(true)} className="secondary_button text-sm py-3">Delete client</button>
            )}
          </div>
          )}
        </div>
      </header>

      {/* Tabs nav - only show tabs user has read permission for */}
      <nav className="border-b border-white/40 mb-4">
        <div className="flex gap-1 overflow-x-auto pb-px">
          {visibleNavItems?.map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} type="button" onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === t.id ? 'border-primary_color text-primary_color' : 'border-transparent text-primary_color/70 hover:text-primary_color'}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />{t.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Content */}
      <main className={`default_bg rounded-xl p-4 md:p-5 min-h-[320px] ${activeTab === 'serviceCharges' ? '' : 'border border-white/40'}`}>
        <>
        {visibleNavItems.length === 0 ? (
          <div className="py-12 text-center text-primary_color/70">
            <FiUser className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>You don&apos;t have permission to view any sections of this client.</p>
          </div>
        ) : (
        <>
        {activeTab === 'info' && (
          <>
          <fieldset className="space-y-5 border-0 p-0 m-0" disabled={!isAdminOrSuperAdmin || !canUpdate('info')}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary_color">Info</h2>
              {isAdminOrSuperAdmin && canUpdate('info') && (
              <button type="button" onClick={handleSaveClientInfo} disabled={savingInfo} className="primary_button py-2 px-4 text-sm disabled:opacity-70 flex items-center gap-2">
              {savingInfo ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : null}
              {savingInfo ? 'Saving...' : 'Save changes'}
            </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {canViewInfoField('name') && (
              <div>
                <label className="block text-sm font-medium text-primary_color mb-1">Name / Company</label>
                <Input value={infoForm.name} onChange={e => setInfoForm(f => ({ ...f, name: e.target.value }))} className="w-full py-2 text-sm" placeholder="Full name or company" />
              </div>
              )}
              {canViewInfoField('clientType') && (
              <div>
                <label className="block text-sm font-medium text-primary_color mb-1">Client type</label>
                <select value={infoForm.clientType} onChange={e => setInfoForm(f => ({ ...f, clientType: e.target.value }))} className="w-full default_bg border border-gray-200 rounded-lg px-3 py-2 text-sm text-primary_color">
                  {CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              )}
            </div>
            {canViewInfoField('emails') && (
            <div>
              <label className="block text-sm font-medium text-primary_color mb-1">Emails</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {infoForm.emails.map((email, i) => (
                  <div key={i} className="flex gap-2">
                    <Input type="email" value={email} onChange={e => setEmailInfo(i, e.target.value)} className="flex-1 py-2 text-sm" placeholder="email@example.com" />
                    {infoForm.emails.length > 1 ? <button type="button" onClick={() => removeEmailInfo(i)} className="secondary_button p-2 shrink-0" aria-label="Remove"><FiTrash2 className="w-4 h-4" /></button> : null}
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <button type="button" onClick={addEmailInfo} className="secondary_button text-sm py-2 px-3"><FiPlus className="w-4 h-4 inline mr-1" /> Add email</button>
                </div>
              </div>
            </div>
            )}
            {canViewInfoField('phone') && (
            <div>
              <label className="block text-sm font-medium text-primary_color mb-1">Phones</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {infoForm.phones.map((phone, i) => (
                  <div key={i} className="flex gap-2">
                    <Input type="tel" value={phone} onChange={e => setPhoneInfo(i, e.target.value)} className="flex-1 py-2 text-sm" placeholder="+233 XX XXX XXXX" />
                    {infoForm.phones.length > 1 ? <button type="button" onClick={() => removePhoneInfo(i)} className="secondary_button p-2 shrink-0" aria-label="Remove"><FiTrash2 className="w-4 h-4" /></button> : null}
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <button type="button" onClick={addPhoneInfo} className="secondary_button text-sm py-2 px-3"><FiPlus className="w-4 h-4 inline mr-1" /> Add phone</button>
                </div>
              </div>
            </div>
            )}
            {canViewInfoField('address') && (
            <div>
              <label className="block text-sm font-medium text-primary_color mb-1">Location / Address</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary_color/50 z-10" />
                <input
                  type="text"
                  value={addressQuery !== '' ? addressQuery : (infoForm.address?.fullAddress || infoForm.address?.full_address || '')}
                  onChange={e => { const v = e.target.value; setAddressQuery(v); setInfoForm(f => ({ ...f, address: { ...f.address, fullAddress: v } })) }}
                  placeholder={gmPlacesLoaded ? 'Search address (Google Maps)' : 'Loading...'}
                  disabled={!gmPlacesLoaded}
                  className="w-full pl-9 pr-9 py-2 text-sm default_bg border border-gray-200 rounded-lg text-primary_color placeholder:text-primary_color/50"
                />
                {(infoForm.address?.fullAddress || infoForm.address?.full_address) && (
                  <button type="button" onClick={() => { setInfoForm(f => ({ ...f, address: {} })); setAddressQuery('') }} className="absolute right-2 top-1/2 -translate-y-1/2 text-primary_color/70 hover:text-primary_color p-1" title="Clear address"><FiX className="w-4 h-4" /></button>
                )}
                {addressSuggestions.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto py-1">
                    {addressSuggestions.map(p => (
                      <li key={p.place_id}>
                        <button type="button" onClick={() => onAddressSuggestionSelect(p, (addr) => setInfoForm(f => ({ ...f, address: { ...f.address, ...addr } })))} className="w-full text-left px-4 py-2 text-sm text-primary_color hover:bg-gray-100">
                          {p.description}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {canViewInfoField('firstContactDate') && (
              <div>
                <label className="block text-sm font-medium text-primary_color mb-1">First contact date</label>
                <Input type="date" value={infoForm.firstContactDate} onChange={e => setInfoForm(f => ({ ...f, firstContactDate: e.target.value }))} className="w-full py-2 text-sm" />
              </div>
              )}
              {canViewInfoField('secondContactDate') && (
              <div>
                <label className="block text-sm font-medium text-primary_color mb-1">Converted to client date</label>
                <Input type="date" value={infoForm.convertedDate} onChange={e => setInfoForm(f => ({ ...f, convertedDate: e.target.value }))} className="w-full py-2 text-sm" />
              </div>
              )}
              {canViewInfoField('sourceUser') && (
              <div>
                <label className="block text-sm font-medium text-primary_color mb-1">Source user (who brought the client)</label>
                <select value={infoForm.sourceUserId} onChange={e => setInfoForm(f => ({ ...f, sourceUserId: e.target.value }))} className="w-full default_bg border border-gray-200 rounded-lg px-3 py-2 text-sm text-primary_color">
                  <option value="">— None —</option>
                  {assignableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              )}
              <div>
                <label className="block text-sm font-medium text-primary_color mb-1">Status</label>
                <select value={infoForm.status} onChange={e => setInfoForm(f => ({ ...f, status: e.target.value }))} className="w-full default_bg border border-gray-200 rounded-lg px-3 py-2 text-sm text-primary_color">{CLIENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary_color mb-1">Source channel</label>
                <select value={infoForm.sourceChannel} onChange={e => setInfoForm(f => ({ ...f, sourceChannel: e.target.value }))} className="w-full default_bg border border-gray-200 rounded-lg px-3 py-2 text-sm text-primary_color">{CLIENT_SOURCE_CHANNELS.map(s => <option key={s} value={s}>{s}</option>)}</select>
              </div>
            </div>
            {canViewInfoField('totalUnitsSold') && (
            <div className="grid grid-cols-2 gap-6 text-sm border-t border-white/30 pt-4">
              <div>
                <p className="text-primary_color/70 font-medium mb-1">Total income</p>
                <p className="text-primary_color font-medium">{(client.totalIncomeUsd || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-primary_color/70 font-medium mb-1">Total units</p>
                <p className="text-primary_color font-medium">{(client.units || []).length}</p>
              </div>
            </div>
            )}
            {canViewInfoField('notes') && (
            <div>
              <label className="block text-sm font-medium text-primary_color mb-1">Notes</label>
              <textarea value={infoForm.notes} onChange={e => setInfoForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full default_bg border border-gray-200 rounded-lg px-3 py-2 text-sm text-primary_color placeholder:text-primary_color/50" placeholder="Internal notes..." />
            </div>
            )}
            {canViewInfoField('notes') && (
            <div>
              <label className="block text-sm font-medium text-primary_color mb-1">Tags (comma-separated)</label>
              <Input value={infoForm.tags} onChange={e => setInfoForm(f => ({ ...f, tags: e.target.value }))} className="w-full py-2 text-sm" placeholder="e.g. VIP, Investor" />
            </div>
            )}
          </fieldset>
            {canRead('userAssignment') && (
            <div className="w-full pt-4 border-t border-white/30">
              <label className="block text-sm font-medium text-primary_color mb-2">Assigned users</label>
              {canAssignUser() && (
              <div className="relative min-h-[42px]">
                <div className="relative flex-1 min-w-[180px]">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary_color/50" />
                  <input
                    type="text"
                    placeholder="Search to assign..."
                    value={assignSearch}
                    onChange={e => { setAssignSearch(e.target.value); setAssignDropdownOpen(true) }}
                    onFocus={() => setAssignDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setAssignDropdownOpen(false), 150)}
                    className="w-full pl-9 pr-3 py-2 text-sm default_bg border border-gray-200 rounded-lg text-primary_color placeholder:text-primary_color/50"
                  />
                </div>
                {assignDropdownOpen && assignableUsersFiltered.length > 0 && (
                  <ul className="absolute top-full left-0 right-0 mt-1 z-20 bg-white rounded-lg border border-gray-200 shadow-lg py-2 max-h-48 overflow-y-auto text-sm">
                    {assignableUsersFiltered.map(u => (
                      <li
                        key={u.id}
                        className="flex flex-col px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors text-gray-900 text-sm"
                        onMouseDown={(e) => { e.preventDefault(); handleAssignUser(u) }}
                      >
                        <span className="font-medium">{u.name}</span>
                        <span className="text-gray-600">{u.role || 'Team member'}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              )}
              <ul className="flex flex-wrap gap-3 text-sm mt-3">
                {(client.assignedUsers || []).map(u => (
                  <li key={u.id} className="inline-flex items-center gap-2 px-3 py-2 default_bg rounded-lg border border-white/40 text-sm">
                    <div>
                      <p className="font-medium text-primary_color">{u.name}</p>
                      <p className="text-sm text-primary_color/70">{u.role || '—'}</p>
                    </div>
                    <div className="flex items-center gap-0.5 ml-1">
                      {canManageUserAssignment() && (
                        <button type="button" onClick={() => openPermissionsEditor(u)} className="text-primary_color/70 hover:text-primary_color p-1" aria-label="Manage permissions" title="Manage permissions"><FiSettings className="w-4 h-4" /></button>
                      )}
                      {canUnassignUser() && (
                        <button type="button" onClick={() => handleUnassignUser(u.id, u.name)} className="text-primary_color/70 hover:text-red-500 p-1" aria-label="Remove"><FiTrash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            )}
          </>
        )}

        {activeTab === 'units' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-primary_color">Units / Properties</h2>
            {(client.units || []).length === 0 ? <p className="text-sm text-primary_color/70">No units assigned.</p> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {(client.units || []).map(u => (
                  <div key={u.id} className="break-inside-avoid">
                    <UnitCard
                      unit={u}
                      developerSlug={params?.slug}
                      accountType="developer"
                    />
                    {u.saleDate && (
                      <p className="text-xs text-primary_color/70 mt-1 pl-1">Sold on {u.saleDate}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary_color">Financial transactions</h2>
              {canCreate('transactions') && (
              <button type="button" onClick={() => { setEditingTransactionId(null); setNewTransaction({ unitId: '', unitName: '', amount: '', transactionType: 'Deposit', transactionDate: '', paymentMethod: '', reference: '', status: 'Completed', attachments: [] }); setOpenModal('transaction'); }} className="primary_button text-sm py-2 px-3"><FiPlus className="w-3.5 h-3.5 inline mr-1" /> Add transaction</button>
              )}
            </div>
            {(client.purchaseTransactions || []).length === 0 ? <p className="text-sm text-primary_color/70">No transactions yet. Add one to get started.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-0">
                  <thead><tr className="border-b text-left text-xs font-medium text-primary_color/70 uppercase"><th className="px-3 py-2">Date</th><th className="px-3 py-2">Unit</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Method</th><th className="px-3 py-2">Ref</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 w-20"></th></tr></thead>
                  <tbody className="divide-y divide-gray-200 text-primary_color">
                    {(client.purchaseTransactions || []).map(tx => {
                      const u = (client.units || []).find(x => x.id === tx.unitId)
                      const curr = u?.currency || 'GHS'
                      const txDate = tx.transactionDate?.slice?.(0, 10) || tx.transactionDate
                      return (
                        <tr key={tx.id}>
                          <td className="px-3 py-2">{formatPeriodDate(txDate)}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {getUnitImage(u) ? <img src={getUnitImage(u)} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded bg-gray-200 flex-shrink-0" />}
                              <div>
                                <p className="font-medium">{tx.unitName || u?.title || '—'}</p>
                                <p className="text-xs text-primary_color/70">{getUnitLocation(u)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2">{tx.transactionType}</td>
                          <td className="px-3 py-2 font-medium">{curr} {tx.amount?.toLocaleString()}</td>
                          <td className="px-3 py-2">{tx.paymentMethod || '—'}</td>
                          <td className="px-3 py-2">{tx.reference || '—'}</td>
                          <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded text-xs ${tx.status === 'Completed' ? 'bg-primary_color/20 text-primary_color' : 'default_bg text-primary_color/80'}`}>{tx.status}</span></td>
                          <td className="px-3 py-2">
                            {(canUpdate('transactions') || canDelete('transactions')) && (
                            <div className="flex gap-1">
                              {canUpdate('transactions') && (
                              <button type="button" onClick={() => { setEditingTransactionId(tx.id); setNewTransaction({ unitId: tx.unitId, unitName: tx.unitName, amount: String(tx.amount || ''), transactionType: tx.transactionType || 'Deposit', transactionDate: txDate || '', paymentMethod: tx.paymentMethod || '', reference: tx.reference || '', status: tx.status || 'Completed', attachments: tx.attachments || [] }); setOpenModal('transaction'); }} className="text-primary_color/70 hover:text-primary_color" title="Edit"><FiEdit2 className="w-3.5 h-3.5" /></button>
                              )}
                              {canDelete('transactions') && (
                              <button type="button" onClick={() => handleDeleteTransaction(tx.id)} className="text-primary_color/70 hover:text-primary_color" title="Delete"><FiTrash2 className="w-3.5 h-3.5" /></button>
                              )}
                            </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'serviceCharges' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary_color">Service charges</h2>
              {canCreate('serviceCharges') && (
              <button type="button" onClick={() => { setEditingServiceChargeId(null); setNewServiceCharge({ unitId: '', unitName: '', amount: '', period: '', periodStart: '', periodEnd: '', dueDate: '', status: 'Pending', paidAt: '', billingReference: '' }); setOpenModal('serviceCharge'); }} className="primary_button text-sm py-2 px-3"><FiPlus className="w-3.5 h-3.5 inline mr-1" /> Add service charge</button>
              )}
            </div>
            {(client.serviceCharges || []).length === 0 ? <p className="text-sm text-primary_color/70">No service charges yet. Add one to get started.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-0">
                  <thead><tr className="border-b text-left text-sm font-medium text-primary_color/70"><th className="px-3 py-2">Unit</th><th className="px-3 py-2">Period</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Next due</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Paid at</th><th className="px-3 py-2 w-20"></th></tr></thead>
                  <tbody className="divide-y divide-gray-200 text-primary_color">
                    {(client.serviceCharges || []).map(sc => {
                      const u = sc.unitDetails || (client.units || []).find(x => String(x?.id) === String(sc.unitId))
                      const curr = u?.currency || (client.units || []).find(x => String(x?.id) === String(sc.unitId))?.currency || 'GHS'
                      const unitName = sc.unitName || u?.title || '—'
                      const unitLocation = u ? getUnitLocation(u) : '—'
                      const unitImg = u ? getUnitImage(u) : null
                      const nextDue = sc.nextDueDate ? (() => { const d = new Date(sc.nextDueDate + 'T00:00:00'); d.setHours(0, 0, 0, 0); return d })() : null
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const isOverdue = nextDue && sc.status !== 'Paid' && nextDue < today
                      const isDueSoon = nextDue && sc.status !== 'Paid' && nextDue >= today && (() => { const week = new Date(today); week.setDate(week.getDate() + 7); return nextDue <= week })()
                      return (
                        <tr key={sc.id}>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {unitImg ? <img src={unitImg} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded bg-gray-200 flex-shrink-0" />}
                              <div>
                                <p className="font-medium">{unitName}</p>
                                <p className="text-xs text-primary_color/70">{unitLocation}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2">{sc.periodStart && sc.periodEnd ? `${formatPeriodDate(sc.periodStart)} – ${formatPeriodDate(sc.periodEnd)}` : (sc.period || '—')}</td>
                          <td className="px-3 py-2 font-medium">{curr} {sc.amount?.toLocaleString()}</td>
                          <td className="px-3 py-2">
                            {sc.nextDueDate ? (
                              <span className={isOverdue ? 'text-red-600 font-medium' : isDueSoon ? 'text-amber-700' : ''}>
                                {formatPeriodDate(sc.nextDueDate)}
                                {isOverdue && ' (overdue)'}
                                {isDueSoon && !isOverdue && ' (due soon)'}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded text-sm ${sc.status === 'Paid' ? 'bg-primary_color/20 text-primary_color' : 'default_bg text-primary_color/80'}`}>{sc.status}</span></td>
                          <td className="px-3 py-2">{sc.paidAt ? formatPeriodDate(sc.paidAt) : '—'}</td>
                          <td className="px-3 py-2">
                            {(canUpdate('serviceCharges') || canDelete('serviceCharges')) && (
                            <div className="flex gap-1">
                              {canUpdate('serviceCharges') && (
                              <button type="button" onClick={() => { setEditingServiceChargeId(sc.id); setNewServiceCharge({ unitId: sc.unitId ?? '', unitName: sc.unitName ?? '', amount: String(sc.amount || ''), periodStart: sc.periodStart || '', periodEnd: sc.periodEnd || '', status: sc.status || 'Pending', paidAt: sc.paidAt || '', billingReference: sc.billingReference || '' }); setOpenModal('serviceCharge'); }} className="text-primary_color/70 hover:text-primary_color" title="Edit"><FiEdit2 className="w-3.5 h-3.5" /></button>
                              )}
                              {canDelete('serviceCharges') && (
                              <button type="button" onClick={() => setDeleteServiceChargeId(sc.id)} className="text-primary_color/70 hover:text-primary_color" title="Delete"><FiTrash2 className="w-3.5 h-3.5" /></button>
                              )}
                            </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'engagement' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary_color">Engagement log</h2>
              {canCreate('engagement') && (
              <button type="button" onClick={() => { setEditingEngagementId(null); setNewEngagement({ heading: '', note: '', isReminder: false, date: '', time: '', status: 'Pending' }); setOpenModal('engagement'); }} className="primary_button text-sm py-2 px-3"><FiPlus className="w-3.5 h-3.5 inline mr-1" /> Add entry</button>
              )}
            </div>
            {(client.engagementLog || []).length === 0 ? <p className="text-sm text-primary_color/70">No entries yet. Add one to get started.</p> : (
              <ul className="space-y-2 text-sm">
                {(client.engagementLog || []).map(eng => (
                  <li key={eng.id} className="border-l-2 border-primary_color/30 pl-3 py-2 flex justify-between items-start gap-2">
                    <div>
                      <p className="font-medium text-primary_color">{eng.heading}</p>
                      <p className="text-primary_color/80 mt-0.5">{eng.note}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-primary_color/70">
                        <span><FiClock className="w-3.5 h-3.5 inline mr-0.5" />{eng.dateTime?.replace('T', ' ')}</span>
                        {eng.isReminder && <span className="bg-primary_color/20 text-primary_color px-1.5 py-0.5 rounded text-sm">Reminder</span>}
                        <span className={`px-1.5 py-0.5 rounded text-sm ${eng.status === 'Completed' ? 'bg-primary_color/20 text-primary_color' : 'default_bg text-primary_color/80'}`}>{eng.status}</span>
                      </div>
                    </div>
                    {(canUpdate('engagement') || canDelete('engagement')) && (
                    <div className="flex gap-1 flex-shrink-0">
                      {canUpdate('engagement') && (
                      <button type="button" onClick={() => { setEditingEngagementId(eng.id); setNewEngagement({ heading: eng.heading, note: eng.note, isReminder: !!eng.isReminder, date: eng.dateTime?.split('T')[0] || '', time: eng.dateTime?.split('T')[1]?.slice(0, 5) || '', status: eng.status || 'Pending' }); setOpenModal('engagement'); }} className="text-primary_color/70 hover:text-primary_color" title="Edit"><FiEdit2 className="w-3.5 h-3.5" /></button>
                      )}
                      {canDelete('engagement') && (
                      <button type="button" onClick={() => handleDeleteEngagement(eng.id)} className="text-primary_color/70 hover:text-primary_color" title="Delete"><FiTrash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary_color">Documents</h2>
              {canCreate('documents') && (
              <button type="button" onClick={() => setOpenModal('document')} className="primary_button text-sm py-2 px-3"><FiUpload className="w-3.5 h-3.5 inline mr-1" /> Add document</button>
              )}
            </div>
            {(client.documents || []).length === 0 ? <p className="text-sm text-primary_color/70">No documents yet. Add one to get started.</p> : (
              <ul className="space-y-1.5 text-sm">
                {(client.documents || []).map((doc, i) => <li key={i} className="flex items-center justify-between py-2 border-b border-white/20"><span className="text-primary_color">{doc.fileName}</span><span><a href={doc.fileUrl} className="text-primary_color/80 hover:underline mr-2">View</a>{canDelete('documents') && <button type="button" onClick={() => handleDeleteDocument(doc.id)} className="text-primary_color/70 hover:text-primary_color" title="Delete"><FiTrash2 className="w-3.5 h-3.5 inline" /></button>}</span></li>)}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'messaging' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-primary_color">Messaging chain</h2>
            <p className="text-sm text-primary_color/70">Emails between team and client</p>
            {(client.messagingChain || []).length === 0 ? <p className="text-sm text-primary_color/70">No messages yet.</p> : (
              <div className="space-y-2 text-sm">
                {(client.messagingChain || []).map(msg => (
                  <div key={msg.id} className={`rounded-lg border p-3 ${msg.from === 'team' ? 'default_bg border-primary_color/20 ml-0 mr-6' : 'default_bg border-white/40 mr-0 ml-6'}`}>
                    <div className="flex items-center justify-between mb-1"><span className="font-medium text-primary_color">{msg.senderName}</span><span className={`text-xs px-1.5 py-0.5 rounded ${msg.from === 'team' ? 'bg-primary_color/20 text-primary_color' : 'default_bg text-primary_color/80'}`}>{msg.from === 'team' ? 'Team' : 'Client'}</span></div>
                    <p className="font-medium text-primary_color/90">{msg.subject}</p>
                    <p className="text-primary_color/80 mt-1">{msg.body}</p>
                    <p className="text-xs text-primary_color/60 mt-1">{msg.dateTime?.replace('T', ' ')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </>
        )}
        </>
      </main>

      {/* Modal overlay */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => { if (openModal === 'engagement') closeModal(); else { setOpenModal(null); if (openModal === 'permissions') setEditingPermissionsUserId(null); if (openModal === 'transaction') setEditingTransactionId(null); if (openModal === 'serviceCharge') { setEditingServiceChargeId(null); setServiceChargeUnitDropdownOpen(false); } } }}>
          <div className={`bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto ${openModal === 'serviceCharge' ? 'border-0' : 'border border-gray-200'}`} onClick={e => e.stopPropagation()}>
            {openModal === 'transaction' && (
              <>
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-primary_color">{editingTransactionId ? 'Edit transaction' : 'Add transaction'}</h3>
                  <button type="button" onClick={() => { setOpenModal(null); setEditingTransactionId(null); }} className="p-1.5 rounded-lg text-primary_color/70 hover:text-primary_color hover:bg-primary_color/10"><FiX className="w-5 h-5" /></button>
                </div>
                <div className="p-4 space-y-3 text-sm bg-white">
                  <p className="text-primary_color/70 text-sm">Assign to one of this client&apos;s units.</p>
                  <div>
                    <label className="block text-sm font-medium text-primary_color mb-2">Unit / Property</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      <button type="button" onClick={() => setNewTransaction(prev => ({ ...prev, unitId: '', unitName: '' }))} className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${!newTransaction.unitId ? 'bg-primary_color/10 ring-1 ring-primary_color/30' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        <div className="w-12 h-12 rounded bg-gray-200 flex-shrink-0 flex items-center justify-center text-primary_color/50 text-xs">—</div>
                        <div className="min-w-0 flex-1"><p className="font-medium text-primary_color">None (optional)</p></div>
                      </button>
                      {(client?.units || []).map(u => (
                        <button key={u.id} type="button" onClick={() => setNewTransaction(prev => ({ ...prev, unitId: u.id, unitName: u.title || u.name || '' }))} className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${newTransaction.unitId === u.id ? 'bg-primary_color/10 ring-1 ring-primary_color/30' : 'bg-gray-50 hover:bg-gray-100'}`}>
                          {getUnitImage(u) ? <img src={getUnitImage(u)} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" /> : <div className="w-12 h-12 rounded bg-gray-200 flex-shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-primary_color truncate">{u.title || u.name || 'Unit'}</p>
                            <p className="text-xs text-primary_color/70 truncate">{getUnitLocation(u)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium text-primary_color mb-1">Amount ({(client?.units || []).find(u => u.id === newTransaction.unitId)?.currency || 'GHS'})</label><Input type="number" value={newTransaction.amount} onChange={e => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))} className="w-full py-2 border-gray-200" placeholder="0" /></div>
                    <div><label className="block text-sm font-medium text-primary_color mb-1">Date</label><Input type="date" value={newTransaction.transactionDate} onChange={e => setNewTransaction(prev => ({ ...prev, transactionDate: e.target.value }))} className="w-full py-2 border-gray-200" /></div>
                    <div><label className="block text-sm font-medium text-primary_color mb-1">Type</label><select value={newTransaction.transactionType} onChange={e => setNewTransaction(prev => ({ ...prev, transactionType: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-primary_color">{TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-primary_color mb-1">Status</label><select value={newTransaction.status} onChange={e => setNewTransaction(prev => ({ ...prev, status: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-primary_color">{TRANSACTION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                    <div className="col-span-2"><label className="block text-sm font-medium text-primary_color mb-1">Payment method</label><Input value={newTransaction.paymentMethod} onChange={e => setNewTransaction(prev => ({ ...prev, paymentMethod: e.target.value }))} className="w-full py-2 border-gray-200" placeholder="e.g. Bank transfer" /></div>
                    <div className="col-span-2"><label className="block text-sm font-medium text-primary_color mb-1">Reference</label><Input value={newTransaction.reference} onChange={e => setNewTransaction(prev => ({ ...prev, reference: e.target.value }))} className="w-full py-2 border-gray-200" /></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary_color mb-1">Attachments (images, PDF, doc, ppt)</label>
                    <input type="file" accept="image/*,.pdf,.doc,.docx,.ppt,.pptx" multiple onChange={handleTransactionFileChange} className="w-full text-sm text-primary_color file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary_color/10 file:text-primary_color" />
                    {(newTransaction.attachments || []).length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm text-primary_color">
                        {(newTransaction.attachments || []).map((name, idx) => (
                          <li key={idx} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded border border-gray-200">
                            <span className="truncate">{name}</span>
                            <button type="button" onClick={() => removeTransactionAttachment(idx)} className="text-primary_color/70 hover:text-primary_color p-1" aria-label="Remove"><FiTrash2 className="w-4 h-4" /></button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 p-4 border-t border-gray-200 bg-white">
                  <button type="button" onClick={() => { setOpenModal(null); setEditingTransactionId(null); }} className="secondary_button py-2 px-4 text-sm">Cancel</button>
                  {editingTransactionId ? (
                    <button type="button" onClick={handleUpdateTransaction} disabled={!newTransaction.amount || !newTransaction.transactionDate || savingTransaction} className="primary_button py-2 px-4 text-sm disabled:opacity-50">{savingTransaction ? 'Saving...' : 'Update'}</button>
                  ) : (
                    <button type="button" onClick={handleAddTransaction} disabled={!newTransaction.amount || !newTransaction.transactionDate || savingTransaction} className="primary_button py-2 px-4 text-sm disabled:opacity-50">{savingTransaction ? 'Saving...' : 'Save transaction'}</button>
                  )}
                </div>
              </>
            )}
            {openModal === 'serviceCharge' && (
              <>
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-primary_color">{editingServiceChargeId ? 'Edit service charge' : 'Add service charge'}</h3>
                  <button type="button" onClick={() => { setOpenModal(null); setEditingServiceChargeId(null); setServiceChargeUnitDropdownOpen(false); }} className="p-1.5 rounded-lg text-primary_color/70 hover:text-primary_color hover:bg-primary_color/10"><FiX className="w-5 h-5" /></button>
                </div>
                <div className="p-4 space-y-3 text-sm bg-white">
                  <div className="relative w-full max-w-full">
                    <label className="block text-sm font-medium text-primary_color mb-2">Unit / Property (required)</label>
                    <button
                      type="button"
                      onClick={() => setServiceChargeUnitDropdownOpen(prev => !prev)}
                      className="w-full max-w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-left flex items-center gap-3 min-w-0 overflow-hidden"
                    >
                      {(() => {
                        const sel = (client?.units || []).find(u => String(u.id) === String(newServiceCharge.unitId))
                        if (!sel) return <span className="text-primary_color/70">Select a unit</span>
                        return (
                          <>
                            {getUnitImage(sel) ? <img src={getUnitImage(sel)} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded bg-gray-200 flex-shrink-0" />}
                            <div className="min-w-0 flex-1 text-left truncate">
                              <p className="font-medium text-primary_color truncate">{sel.title || sel.name || 'Unit'}</p>
                              <p className="text-xs text-primary_color/70 truncate">{getUnitLocation(sel)}</p>
                            </div>
                          </>
                        )
                      })()}
                    </button>
                    {serviceChargeUnitDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setServiceChargeUnitDropdownOpen(false)} />
                        <div className="absolute left-0 right-0 top-full mt-1 z-50 max-w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                          <div className="max-h-48 overflow-y-auto">
                            {(client?.units || []).map(u => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => { setNewServiceCharge(prev => ({ ...prev, unitId: u.id, unitName: u.title || u.name || '' })); setServiceChargeUnitDropdownOpen(false) }}
                                className={`w-full flex items-center gap-3 p-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 ${String(newServiceCharge.unitId) === String(u.id) ? 'bg-primary_color/10' : ''}`}
                              >
                                {getUnitImage(u) ? <img src={getUnitImage(u)} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" /> : <div className="w-12 h-12 rounded bg-gray-200 flex-shrink-0" />}
                                <div className="min-w-0 flex-1 overflow-hidden">
                                  <p className="font-medium text-primary_color truncate">{u.title || u.name || 'Unit'}</p>
                                  <p className="text-xs text-primary_color/70 truncate">{getUnitLocation(u)}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    {(client?.units || []).length === 0 && (
                      <p className="text-xs text-primary_color/60 mt-1">No units linked. Add units in the Units tab first.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary_color mb-1">Amount ({(client?.units || []).find(u => String(u.id) === String(newServiceCharge.unitId))?.currency || 'GHS'})</label>
                    <Input type="number" value={newServiceCharge.amount} onChange={e => setNewServiceCharge(prev => ({ ...prev, amount: e.target.value }))} className="w-full py-2 border-gray-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium text-primary_color mb-1">Period start</label><Input type="date" value={newServiceCharge.periodStart} onChange={e => setNewServiceCharge(prev => ({ ...prev, periodStart: e.target.value }))} className="w-full py-2 border-gray-200" /></div>
                    <div><label className="block text-sm font-medium text-primary_color mb-1">Period end</label><Input type="date" value={newServiceCharge.periodEnd} onChange={e => setNewServiceCharge(prev => ({ ...prev, periodEnd: e.target.value }))} className="w-full py-2 border-gray-200" /></div>
                  </div>
                  {(() => { const s = newServiceCharge.periodStart; const e = newServiceCharge.periodEnd; const months = s && e ? Math.max(0, (new Date(e).getFullYear() - new Date(s).getFullYear()) * 12 + (new Date(e).getMonth() - new Date(s).getMonth()) + Math.round((new Date(e).getDate() - new Date(s).getDate()) / 30)) : null; return months != null ? <div><label className="block text-sm font-medium text-primary_color mb-1">Period</label><div className="py-2 px-3 bg-gray-50 rounded-lg text-primary_color">{months} {months === 1 ? 'month' : 'months'}</div></div> : null })()}
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium text-primary_color mb-1">Status</label><select value={newServiceCharge.status} onChange={e => setNewServiceCharge(prev => ({ ...prev, status: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-primary_color">{SERVICE_CHARGE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-primary_color mb-1">Paid at</label><Input type="date" value={newServiceCharge.paidAt} onChange={e => setNewServiceCharge(prev => ({ ...prev, paidAt: e.target.value }))} className="w-full py-2 border-gray-200" /></div>
                    <div className="col-span-2"><label className="block text-sm font-medium text-primary_color mb-1">Billing reference</label><Input value={newServiceCharge.billingReference} onChange={e => setNewServiceCharge(prev => ({ ...prev, billingReference: e.target.value }))} className="w-full py-2 border-gray-200" /></div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 p-4 border-t border-gray-200 bg-white">
                  <button type="button" onClick={() => { setOpenModal(null); setEditingServiceChargeId(null); setServiceChargeUnitDropdownOpen(false); }} className="secondary_button py-2 px-4 text-sm" disabled={savingServiceCharge}>Cancel</button>
                  {editingServiceChargeId ? (
                    <button type="button" onClick={handleUpdateServiceCharge} disabled={!newServiceCharge.amount || !newServiceCharge.unitId || savingServiceCharge} className="primary_button py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed">{savingServiceCharge ? 'Saving...' : 'Update'}</button>
                  ) : (
                    <button type="button" onClick={handleAddServiceCharge} disabled={!newServiceCharge.amount || !newServiceCharge.unitId || savingServiceCharge} className="primary_button py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed">{savingServiceCharge ? 'Saving...' : 'Save'}</button>
                  )}
                </div>
              </>
            )}
            {openModal === 'document' && (
              <>
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-primary_color">Add document</h3>
                  <button type="button" onClick={() => setOpenModal(null)} className="p-1.5 rounded-lg text-primary_color/70 hover:text-primary_color hover:bg-primary_color/10"><FiX className="w-5 h-5" /></button>
                </div>
                <div className="p-4 space-y-3 text-sm bg-white">
                  <div><label className="block text-sm font-medium text-primary_color mb-1">File name</label><Input value={newDocument.fileName} onChange={e => setNewDocument(prev => ({ ...prev, fileName: e.target.value }))} className="w-full py-2 border-gray-200" placeholder="e.g. Contract.pdf" /></div>
                  <div><label className="block text-sm font-medium text-primary_color mb-1">File URL (optional)</label><Input value={newDocument.fileUrl} onChange={e => setNewDocument(prev => ({ ...prev, fileUrl: e.target.value }))} className="w-full py-2 border-gray-200" placeholder="#" /></div>
                </div>
                <div className="flex justify-end gap-2 p-4 border-t border-gray-200 bg-white">
                  <button type="button" onClick={() => setOpenModal(null)} className="secondary_button py-2 px-4 text-sm">Cancel</button>
                  <button type="button" onClick={handleAddDocument} disabled={!newDocument.fileName.trim()} className="primary_button py-2 px-4 text-sm disabled:opacity-50">Save</button>
                </div>
              </>
            )}
            {openModal === 'engagement' && (
              <>
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-primary_color">{editingEngagementId ? 'Edit entry' : 'Add engagement entry'}</h3>
                  <button type="button" onClick={closeModal} className="p-1.5 rounded-lg text-primary_color/70 hover:text-primary_color hover:bg-primary_color/10"><FiX className="w-5 h-5" /></button>
                </div>
                <div className="p-4 space-y-3 text-sm bg-white">
                  <div><label className="block text-sm font-medium text-primary_color mb-1">Heading</label><Input value={newEngagement.heading} onChange={e => setNewEngagement(prev => ({ ...prev, heading: e.target.value }))} className="w-full py-2 border-gray-200" placeholder="e.g. Follow-up call" /></div>
                  <div><label className="block text-sm font-medium text-primary_color mb-1">Note</label><textarea value={newEngagement.note} onChange={e => setNewEngagement(prev => ({ ...prev, note: e.target.value }))} rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-primary_color placeholder:text-primary_color/50" placeholder="Details..." /></div>
                  <div className="flex flex-wrap gap-4 items-center">
                    <label className="flex items-center gap-2 text-sm text-primary_color cursor-pointer"><input type="checkbox" checked={newEngagement.isReminder} onChange={e => setNewEngagement(prev => ({ ...prev, isReminder: e.target.checked }))} className="rounded" />Set as reminder</label>
                    <div><label className="block text-sm font-medium text-primary_color mb-1">Date</label><Input type="date" value={newEngagement.date} onChange={e => setNewEngagement(prev => ({ ...prev, date: e.target.value }))} className="py-2 border-gray-200" /></div>
                    <div><label className="block text-sm font-medium text-primary_color mb-1">Time</label><Input type="time" value={newEngagement.time} onChange={e => setNewEngagement(prev => ({ ...prev, time: e.target.value }))} className="py-2 border-gray-200" /></div>
                    <div><label className="block text-sm font-medium text-primary_color mb-1">Status</label><select value={newEngagement.status} onChange={e => setNewEngagement(prev => ({ ...prev, status: e.target.value }))} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-primary_color">{ENGAGEMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 p-4 border-t border-gray-200 bg-white">
                  <button type="button" onClick={closeModal} className="secondary_button py-2 px-4 text-sm">Cancel</button>
                  {editingEngagementId ? (
                    <button type="button" onClick={() => { const dateTime = newEngagement.date && newEngagement.time ? `${newEngagement.date}T${newEngagement.time}` : newEngagement.date ? `${newEngagement.date}T09:00:00` : null; handleUpdateEngagement({ heading: newEngagement.heading, note: newEngagement.note, isReminder: newEngagement.isReminder, status: newEngagement.status, ...(dateTime ? { dateTime } : {}) }); }} disabled={!newEngagement.heading.trim()} className="primary_button py-2 px-4 text-sm disabled:opacity-50">Save changes</button>
                  ) : (
                    <button type="button" onClick={handleAddEngagement} disabled={!newEngagement.heading.trim()} className="primary_button py-2 px-4 text-sm disabled:opacity-50">Save entry</button>
                  )}
                </div>
              </>
            )}
            {openModal === 'permissions' && editingPermissionsUserId && (() => {
              const editingUser = (client?.assignedUsers || []).find(u => u.id === editingPermissionsUserId)
              if (!editingUser) return null
              const crudSections = ['documents', 'serviceCharges', 'transactions', 'userAssignment', 'engagement', 'messaging']
              const sectionOrder = ['info', 'units', 'documents', 'serviceCharges', 'transactions', 'userAssignment', 'engagement', 'messaging']
              const withExport = ['serviceCharges', 'transactions']
              const toggleCrud = (sectionId, key) => {
                const current = permissionForm[sectionId] || (withExport.includes(sectionId) ? defaultCrudWithExport() : defaultCrud())
                setPermissionForm(prev => ({ ...prev, [sectionId]: { ...(prev[sectionId] || current), [key]: !current[key] } }))
              }
              const getCrud = (sectionId) => permissionForm[sectionId] || (withExport.includes(sectionId) ? defaultCrudWithExport() : defaultCrud())
              const sectionLabels = { documents: 'Documents', serviceCharges: 'Service charges', transactions: 'Transactions', userAssignment: 'User assignment', engagement: 'Engagement', messaging: 'Messaging' }
              return (
                <>
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-primary_color">Permissions</h3>
                    <button type="button" onClick={() => { setOpenModal(null); setEditingPermissionsUserId(null); }} className="p-1.5 rounded-lg text-primary_color/70 hover:text-primary_color hover:bg-primary_color/10"><FiX className="w-5 h-5" /></button>
                  </div>
                  <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-3">
                    <div className="text-sm">
                      <span className="font-medium text-primary_color/70">Assigned user: </span>
                      <span className="text-primary_color font-medium">{editingUser.name}</span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-primary_color/70 mb-1">Role</label>
                      <select value={editingRole} onChange={e => setEditingRole(e.target.value)} className="w-full px-3 py-2 text-sm default_bg border border-gray-200 rounded-lg text-primary_color focus:outline-none focus:ring-2 focus:ring-primary_color/30">
                        {ASSIGNMENT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="p-4 max-h-[60vh] overflow-y-auto">
                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                      {sectionOrder.map(sectionId => {
                        const isExpanded = expandedPermissionSections[sectionId]
                        const label = sectionId === 'info' ? 'Info' : sectionId === 'units' ? 'Units' : sectionLabels[sectionId]
                        return (
                          <div key={sectionId}>
                            <div className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => togglePermissionSection(sectionId)}>
                              {isExpanded ? <FiChevronDown className="w-5 h-5 text-gray-400 shrink-0" /> : <FiChevronRight className="w-5 h-5 text-gray-400 shrink-0" />}
                              <span className="font-semibold text-primary_color text-sm">{label}</span>
                            </div>
                            {isExpanded && (
                              <div className="p-4 bg-gray-50 space-y-3">
                                {sectionId === 'info' ? (
                                  INFO_FIELDS.map(field => (
                                    <div key={field} className="flex items-center justify-between gap-4">
                                      <span className="text-sm text-primary_color">{field === 'firstContactDate' ? 'First contact date' : field === 'secondContactDate' ? 'Converted to client date' : field === 'totalUnitsSold' ? 'Total units sold' : field === 'sourceUser' ? 'Source user' : field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}</span>
                                      <div className="flex gap-4">
                                        {['none', 'view'].map(v => (
                                          <label key={v} className="flex items-center gap-1.5 text-sm text-primary_color cursor-pointer">
                                            <input type="radio" name={`info-${field}`} checked={(permissionForm.info?.[field] || 'none') === v} onChange={() => setPermissionForm(prev => ({ ...prev, info: { ...(prev.info || {}), [field]: v } }))} className="text-primary_color" />
                                            {v === 'none' ? 'None' : 'View'}
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  ))
                                ) : sectionId === 'units' ? (
                                  <div className="flex gap-4">
                                    {['none', 'view'].map(v => (
                                      <label key={v} className="flex items-center gap-1.5 text-sm text-primary_color cursor-pointer">
                                        <input type="radio" name="units" checked={(permissionForm.units || 'none') === v} onChange={() => setPermissionForm(prev => ({ ...prev, units: v }))} className="text-primary_color" />
                                        {v === 'none' ? 'None' : 'View'}
                                      </label>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {['create', 'read', 'update', 'delete', ...(withExport.includes(sectionId) ? ['export'] : [])].map(key => (
                                      <label key={key} className="flex items-center gap-3 text-sm text-primary_color cursor-pointer">
                                        <input type="checkbox" checked={!!(getCrud(sectionId)[key])} onChange={() => toggleCrud(sectionId, key)} className="rounded text-primary_color" />
                                        <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 p-4 border-t border-gray-200 bg-white">
                    <button type="button" onClick={() => { setOpenModal(null); setEditingPermissionsUserId(null); }} className="secondary_button py-2 px-4 text-sm">Cancel</button>
                    <button type="button" onClick={() => handleUpdateUserPermissions(editingPermissionsUserId, permissionForm, editingRole)} className="primary_button py-2 px-4 text-sm">Save role & permissions</button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Delete service charge confirmation */}
      {deleteServiceChargeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteServiceChargeId(null)}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-primary_color mb-2">Delete service charge</h3>
            <p className="text-sm text-primary_color/80 mb-6">Are you sure you want to delete this service charge? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteServiceChargeId(null)} className="secondary_button py-2 px-4 text-sm">Cancel</button>
              <button type="button" onClick={() => handleDeleteServiceCharge(deleteServiceChargeId)} className="tertiary_button py-2 px-4 text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

export default SingleClientPage
