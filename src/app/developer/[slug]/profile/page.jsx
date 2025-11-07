"use client"
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiEdit3, 
  FiSave, 
  FiX, 
  FiCamera, 
  FiLock, 
  FiEye, 
  FiEyeOff,
  FiHome,
  FiGlobe,
  FiCalendar,
  FiFacebook,
  FiInstagram,
  FiLinkedin,
  FiUpload,
  FiPlus,
  FiTrash2,
  FiFileText,
  FiMap,
  FiChevronDown,
} from 'react-icons/fi'
import dynamic from 'next/dynamic'
import { Wrapper } from '@googlemaps/react-wrapper'
import countryToCurrency from 'country-to-currency'
import DeveloperNav from '../../../components/developers/DeveloperNav'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'

// Google Map Component for Location Modal
const GoogleMapViewer = React.memo(({ center, zoom, coordinates, onMapClick }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const isInitializedRef = useRef(false)
  const listenersRef = useRef([])

  // Cleanup function
  const cleanup = useCallback(() => {
    listenersRef.current.forEach(listener => {
      if (listener && listener.remove) {
        listener.remove()
      }
    })
    listenersRef.current = []

    if (markerRef.current) {
      markerRef.current.setMap(null)
      markerRef.current = null
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current = null
    }
    
    isInitializedRef.current = false
  }, [])

  // Memoized handlers
  const handleMapClick = useCallback((e) => {
    onMapClick?.(e.latLng.lat(), e.latLng.lng())
  }, [onMapClick])

  const handleMarkerDrag = useCallback((e) => {
    onMapClick?.(e.latLng.lat(), e.latLng.lng())
  }, [onMapClick])

  // Initialize map only once
  useEffect(() => {
    if (!mapRef.current || isInitializedRef.current || !window.google?.maps) return

    const newMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: center[0], lng: center[1] },
      zoom: zoom,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    })

    const clickListener = newMap.addListener('click', handleMapClick)
    listenersRef.current.push(clickListener)

    mapInstanceRef.current = newMap
    isInitializedRef.current = true

    return cleanup
  }, [center, zoom, handleMapClick, cleanup])

  // Update map center and zoom
  useEffect(() => {
    if (mapInstanceRef.current && isInitializedRef.current) {
      const currentCenter = mapInstanceRef.current.getCenter()
      const currentZoom = mapInstanceRef.current.getZoom()
      
      if (!currentCenter || 
          Math.abs(currentCenter.lat() - center[0]) > 0.0001 || 
          Math.abs(currentCenter.lng() - center[1]) > 0.0001 ||
          currentZoom !== zoom) {
        mapInstanceRef.current.setCenter({ lat: center[0], lng: center[1] })
        mapInstanceRef.current.setZoom(zoom)
      }
    }
  }, [center, zoom])

  // Update marker when coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current || !coordinates) return

    const [lat, lng] = Array.isArray(coordinates) ? coordinates : [coordinates[0], coordinates[1]]
    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)

    if (isNaN(latNum) || isNaN(lngNum)) return

    const shouldUpdateMarker = !markerRef.current || 
      Math.abs(markerRef.current.getPosition().lat() - latNum) > 0.0001 ||
      Math.abs(markerRef.current.getPosition().lng() - lngNum) > 0.0001

    if (shouldUpdateMarker) {
      if (markerRef.current) {
        markerRef.current.setMap(null)
      }

      const newMarker = new window.google.maps.Marker({
        position: { lat: latNum, lng: lngNum },
        map: mapInstanceRef.current,
        title: 'Location',
        draggable: true,
      })

      const dragListener = newMarker.addListener('dragend', handleMarkerDrag)
      listenersRef.current.push(dragListener)

      markerRef.current = newMarker
    }
  }, [coordinates, handleMarkerDrag])

  return <div ref={mapRef} className="w-full h-full" />
})

GoogleMapViewer.displayName = 'GoogleMapViewer'

const ProfilePage = () => {
  const { user, developerToken } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [propertyCategories, setPropertyCategories] = useState([])
  const [showSpecializationDropdown, setShowSpecializationDropdown] = useState(false)
  const [newCustomSpecialization, setNewCustomSpecialization] = useState('')


  // Developer data from database
  const [developerData, setDeveloperData] = useState({
    name: '',
    email: '',
    phone: '',
    secondary_email: '',
    secondary_phone: '',
    tertiary_email: '',
    tertiary_phone: '',
    website: '',
    address: '',
    city: '',
    region: '',
    country: '',
    postal_code: '',
    description: '',
    founded_year: '',
    company_size: '',
    license_number: '',
    profile_image: '',
    cover_image: '',
    specialization: { database: [], custom: [] },
    social_media: {
      facebook: '',
      instagram: '',
      linkedin: '',
      tiktok: ''
    },
    customer_care: [],
    registration_files: [],
    locations: [],
    company_statistics: []
  })

  // Google Places + multi-location and company statistics (frontend-only for now)
  const [gmIsLoaded, setGmIsLoaded] = useState(false)
  const autocompleteServiceRef = useRef(null)
  const placesServiceRef = useRef(null)

  // Locations modal state
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [locationModalMode, setLocationModalMode] = useState('add') // 'add' | 'edit'
  const [editingLocationIndex, setEditingLocationIndex] = useState(null)
  const [modalPlaceQuery, setModalPlaceQuery] = useState('')
  const [modalPlaceSuggestions, setModalPlaceSuggestions] = useState([])
  const [modalForm, setModalForm] = useState({
    id: '',
    place_id: '',
    description: '',
    address: '',
    country: '',
    region: '',
    city: '',
    latitude: 0,
    longitude: 0,
    currency: 'GHS', // Stores currency code
    currency_name: 'Ghanaian Cedi', // Stores currency name for display
    primary_location: false
  })
  const [modalMapCenter, setModalMapCenter] = useState([7.9465, -1.0232]) // Ghana coordinates
  const [modalMapZoom, setModalMapZoom] = useState(6)
  const modalAutocompleteTimerRef = useRef(null)
  const modalMapCenterRef = useRef([7.9465, -1.0232])
  const modalMapZoomRef = useRef(6)

  // Currency list (no npm needed)
  const supportedCurrencies = [
    { code: 'GHS', name: 'Ghanaian Cedi' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'NGN', name: 'Nigerian Naira' },
    { code: 'ZAR', name: 'South African Rand' },
    { code: 'KES', name: 'Kenyan Shilling' },
    { code: 'XOF', name: 'West African CFA Franc' },
    { code: 'XAF', name: 'Central African CFA Franc' },
  ]

  const [formData, setFormData] = useState({ ...developerData })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Fetch developer profile data
  const fetchDeveloperProfile = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/developers/profile', {
        headers: {
          'Authorization': `Bearer ${developerToken}`
        }
      })

      if (response.ok) {
        const { data } = await response.json()
        
        // Normalize data to ensure no null values and handle field name differences
        const normalizedData = {
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          secondary_email: data.secondary_email || '',
          secondary_phone: data.secondary_phone || '',
          tertiary_email: data.tertiary_email || '',
          tertiary_phone: data.tertiary_phone || '',
          website: data.website || '',
          address: data.address || '',
          city: data.city || '',
          region: data.region || '',
          country: data.country || '',
          postal_code: data.postal_code || '',
          description: data.description || '',
          founded_year: data.founded_year || data.founded || '',
          company_size: data.company_size || data.employees || '',
          license_number: data.license_number || data.license || '',
          profile_image: data.profile_image || '',
          cover_image: data.cover_image || '',
          specialization: data.specialization || { database: [], custom: [] },
          social_media: Array.isArray(data.social_media) ? {
            facebook: '',
            instagram: '',
            linkedin: '',
            tiktok: ''
          } : (data.social_media || {
            facebook: '',
            instagram: '',
            linkedin: '',
            tiktok: ''
          }),
          customer_care: data.customer_care || [],
          registration_files: data.registration_files || [],
          // New structures
          locations: Array.isArray(data.locations) ? data.locations : [],
          company_statistics: Array.isArray(data.company_statistics) ? data.company_statistics : [],
          // Additional fields for display
          account_status: data.account_status || 'active',
          created_at: data.created_at || null,
          profile_completion_percentage: data.profile_completion_percentage || 0
        }
        
        // Store full data for account info
        setDeveloperData({ ...normalizedData, account_status: data.account_status, created_at: data.created_at, profile_completion_percentage: data.profile_completion_percentage })
        setFormData(normalizedData)
      } else {
        toast.error('Failed to fetch profile data')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Error fetching profile data')
    } finally {
      setLoading(false)
    }
  }

  // Fetch property categories for specialization
  const fetchPropertyCategories = async () => {
    try {
      const response = await fetch('/api/property-categories')
      if (response.ok) {
        const { data } = await response.json()
        setPropertyCategories(data)
      }
    } catch (error) {
      console.error('Error fetching property categories:', error)
    }
  }

  // Initialize Google Maps Places script once on client
  useEffect(() => {
    if (typeof window === 'undefined') return
    const initPlaces = () => {
      try {
        // eslint-disable-next-line no-undef
        const hasPlaces = !!(window.google && window.google.maps && window.google.maps.places)
        if (!hasPlaces) return
        // eslint-disable-next-line no-undef
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
        // eslint-disable-next-line no-undef
        placesServiceRef.current = new window.google.maps.places.PlacesService(document.createElement('div'))
        setGmIsLoaded(true)
      } catch (e) {
        console.error('Failed initializing Google Places:', e)
      }
    }

    if (window.google?.maps?.places) {
      initPlaces()
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API
    if (!apiKey) {
      console.warn('NEXT_PUBLIC_GOOGLE_MAPS_API is not set; Places Autocomplete disabled')
      return
    }

    const existing = document.getElementById('gmaps-script')
    if (existing) {
      const handle = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(handle)
          initPlaces()
        }
      }, 100)
      return () => clearInterval(handle)
    }

    const s = document.createElement('script')
    s.id = 'gmaps-script'
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    s.async = true
    s.defer = true
    s.onload = initPlaces
    document.head.appendChild(s)
  }, [])

  // Modal autocomplete handler
  const handleModalPlaceInputChange = (value) => {
    setModalPlaceQuery(value)
    if (!gmIsLoaded || !autocompleteServiceRef.current) return
    if (modalAutocompleteTimerRef.current) clearTimeout(modalAutocompleteTimerRef.current)
    modalAutocompleteTimerRef.current = setTimeout(() => {
      try {
        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: value,
          },
          (predictions, status) => {
            // eslint-disable-next-line no-undef
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setModalPlaceSuggestions(predictions.slice(0, 6))
            } else {
              setModalPlaceSuggestions([])
            }
          }
        )
      } catch (e) {
        console.error('Autocomplete error:', e)
        setModalPlaceSuggestions([])
      }
    }, 250)
  }

  const parseAddressComponents = (addressComponents) => {
    const get = (type, returnShort = false) => {
      const comp = addressComponents?.find(c => c.types?.includes(type))
      if (!comp) return ''
      return returnShort ? comp.short_name : comp.long_name
    }
    const country = get('country')
    const countryCode = get('country', true) // ISO 3166-1 alpha-2 code (e.g., 'GH', 'US')
    const region = get('administrative_area_level_1') || get('administrative_area_level_2')
    const city = get('locality') || get('sublocality') || get('postal_town')
    return { country, countryCode, region, city }
  }

  const handleModalSuggestionClick = (prediction) => {
    if (!placesServiceRef.current) return
    try {
      placesServiceRef.current.getDetails(
        { placeId: prediction.place_id, fields: ['address_components', 'formatted_address', 'geometry'] },
        (place, status) => {
          // eslint-disable-next-line no-undef
          if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) return
          const lat = place.geometry?.location?.lat?.()
          const lng = place.geometry?.location?.lng?.()
          const { country, countryCode, region, city } = parseAddressComponents(place.address_components)
          const newLat = typeof lat === 'number' ? lat : 0
          const newLng = typeof lng === 'number' ? lng : 0
          
          // Auto-select currency based on country code
          let autoCurrency = 'GHS' // Default to Ghanaian Cedi
          let autoCurrencyName = 'Ghanaian Cedi'
          if (countryCode && countryToCurrency[countryCode]) {
            autoCurrency = countryToCurrency[countryCode]
            // Find currency name from our supported currencies list
            const currencyInfo = supportedCurrencies.find(c => c.code === autoCurrency)
            if (currencyInfo) {
              autoCurrencyName = currencyInfo.name
            }
          }
          
          setModalForm(prev => ({
            ...prev,
            place_id: prediction.place_id,
            description: prediction.description || place.formatted_address || '',
            address: place.formatted_address || '',
            country: country || '',
            region: region || '',
            city: city || '',
            latitude: newLat,
            longitude: newLng,
            currency: autoCurrency,
            currency_name: autoCurrencyName,
          }))
          setModalPlaceQuery(prediction.description || place.formatted_address || '')
          setModalPlaceSuggestions([])
          // Update map center when location is selected (only on autocomplete selection, not on input)
          if (newLat !== 0 && newLng !== 0) {
            const newCenter = [newLat, newLng]
            modalMapCenterRef.current = newCenter
            modalMapZoomRef.current = 15
            setModalMapCenter(newCenter)
            setModalMapZoom(15)
          }
        }
      )
    } catch (e) {
      console.error('Places details error:', e)
    }
  }

  const handleModalMapClick = (lat, lng) => {
    setModalForm(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }))
    const newCenter = [lat, lng]
    modalMapCenterRef.current = newCenter
    modalMapZoomRef.current = 15
    setModalMapCenter(newCenter)
    setModalMapZoom(15)
  }

  // Modal handlers
  const openLocationModal = (mode = 'add', index = null) => {
    setLocationModalMode(mode)
    setEditingLocationIndex(index)
    if (mode === 'edit' && index !== null && formData.locations?.[index]) {
      const loc = formData.locations[index]
      const lat = loc.latitude || 0
      const lng = loc.longitude || 0
      const currencyCode = loc.currency || 'GHS'
      const currencyInfo = supportedCurrencies.find(c => c.code === currencyCode)
      setModalForm({
        id: loc.id || '',
        place_id: loc.place_id || '',
        description: loc.description || loc.address || '',
        address: loc.address || '',
        country: loc.country || '',
        region: loc.region || '',
        city: loc.city || '',
        latitude: lat,
        longitude: lng,
        currency: currencyCode,
        currency_name: loc.currency_name || currencyInfo?.name || 'Ghanaian Cedi',
        primary_location: loc.primary_location || false
      })
      setModalPlaceQuery(loc.description || loc.address || '')
      // Set map center for existing location
      if (lat !== 0 && lng !== 0) {
        const newCenter = [lat, lng]
        modalMapCenterRef.current = newCenter
        modalMapZoomRef.current = 15
        setModalMapCenter(newCenter)
        setModalMapZoom(15)
      } else {
        const defaultCenter = [7.9465, -1.0232]
        modalMapCenterRef.current = defaultCenter
        modalMapZoomRef.current = 6
        setModalMapCenter(defaultCenter)
        setModalMapZoom(6)
      }
    } else {
      setModalForm({
        id: '',
        place_id: '',
        description: '',
        address: '',
        country: '',
        region: '',
        city: '',
        latitude: 0,
        longitude: 0,
        currency: 'GHS',
        currency_name: 'Ghanaian Cedi',
        primary_location: false
      })
      setModalPlaceQuery('')
      const defaultCenter = [7.9465, -1.0232]
      modalMapCenterRef.current = defaultCenter
      modalMapZoomRef.current = 6
      setModalMapCenter(defaultCenter)
      setModalMapZoom(6)
    }
    setShowLocationModal(true)
  }

  const closeLocationModal = () => {
    setShowLocationModal(false)
    setModalForm({
      id: '',
      place_id: '',
      description: '',
      address: '',
      country: '',
      region: '',
      city: '',
      latitude: 0,
      longitude: 0,
      currency: 'GHS',
      currency_name: 'Ghanaian Cedi',
      primary_location: false
    })
    setModalPlaceQuery('')
    setModalPlaceSuggestions([])
    setEditingLocationIndex(null)
  }

  const saveLocation = () => {
    if (!modalForm.address || !modalForm.city) {
      toast.error('Please select a location from Google Maps')
      return
    }

    const hasPrimaryLocation = Array.isArray(formData.locations) && formData.locations.some(l => l?.primary_location && (!editingLocationIndex || formData.locations.indexOf(l) !== editingLocationIndex))

    if (modalForm.primary_location && hasPrimaryLocation) {
      toast.error('A primary location already exists. Please remove it first.')
      return
    }

    const locationToSave = {
      ...modalForm,
      id: modalForm.id || `loc_${Date.now()}`,
    }

    if (locationModalMode === 'add') {
      setFormData(prev => ({
        ...prev,
        locations: Array.isArray(prev.locations) ? [...prev.locations, locationToSave] : [locationToSave]
      }))
      toast.success('Location added successfully')
    } else {
      setFormData(prev => ({
        ...prev,
        locations: prev.locations.map((loc, i) => i === editingLocationIndex ? locationToSave : loc)
      }))
      toast.success('Location updated successfully')
    }
    closeLocationModal()
  }

  const removeLocationAt = (index) => {
    const target = formData.locations?.[index]
    if (target?.primary_location) {
      toast.error('Cannot remove primary location')
      return
    }
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }))
    toast.success('Location removed')
  }

  // Company statistics helpers
  const addCompanyStat = () => {
    setFormData(prev => ({
      ...prev,
      company_statistics: [...(prev.company_statistics || []), { label: '', value: '' }]
    }))
  }
  const removeCompanyStat = (index) => {
    setFormData(prev => ({
      ...prev,
      company_statistics: (prev.company_statistics || []).filter((_, i) => i !== index)
    }))
  }
  const updateCompanyStat = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      company_statistics: (prev.company_statistics || []).map((row, i) => i === index ? { ...row, [field]: value } : row)
    }))
  }

  // Helper function to ensure safe values for inputs
  const getSafeValue = (value) => {
    return value === null || value === undefined ? '' : value
  }

  // Helper function to calculate time on platform
  const getTimeOnPlatform = (createdAt) => {
    if (!createdAt) return 'N/A'
    const created = new Date(createdAt)
    const now = new Date()
    const diffInMs = now - created
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays < 1) return 'Less than a day'
    if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''}`
    if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30)
      return `${months} month${months > 1 ? 's' : ''}`
    }
    const years = Math.floor(diffInDays / 365)
    const remainingMonths = Math.floor((diffInDays % 365) / 30)
    if (remainingMonths === 0) {
      return `${years} year${years > 1 ? 's' : ''}`
    }
    return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`
  }

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value || '' // Ensure value is never null
    }))
  }

  // Load data on component mount
  useEffect(() => {
    if (user) {
      fetchDeveloperProfile()
      fetchPropertyCategories()
    }
  }, [user])

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!user) {
      toast.error('Please log in to save changes')
      return
    }

    setSaving(true)
    try {
      
      // Check if there are file uploads
      const hasFileUploads = formData.profile_image instanceof File || 
                            formData.cover_image instanceof File || 
                            formData.registration_files.some(file => file instanceof File)

      let response
      if (hasFileUploads) {
        // Handle file uploads with FormData
        const formDataToSend = new FormData()
        formDataToSend.append('data', JSON.stringify(formData))

        if (formData.profile_image instanceof File) {
          formDataToSend.append('profileImage', formData.profile_image)
        }
        if (formData.cover_image instanceof File) {
          formDataToSend.append('coverImage', formData.cover_image)
        }
        if (formData.registration_files.length > 0) {
          formData.registration_files.forEach(file => {
            if (file instanceof File) {
              formDataToSend.append('registrationFiles', file)
            }
          })
        }

        response = await fetch('/api/developers/profile', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${developerToken}`
          },
          body: formDataToSend
        })
      } else {
        // Handle JSON data
        response = await fetch('/api/developers/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${developerToken}`
          },
          body: JSON.stringify(formData)
        })
      }

      if (response.ok) {
        const { data } = await response.json()
        // The backend returns the complete developer record with all fields including created_at, account_status, etc.
        // Map company_locations to locations if needed, and ensure all fields are preserved
        const normalizedResponseData = {
          ...data,
          locations: data.locations || (data.company_locations || []),
          account_status: data.account_status || 'active',
          created_at: data.created_at,
          profile_completion_percentage: data.profile_completion_percentage || 0
        }
        
        // Update developerData with complete response data
        setDeveloperData(normalizedResponseData)
        
        // Also update formData with the normalized data (excluding protected fields)
        const { created_at, account_status, developer_id, id, profile_completion_percentage, company_locations, ...formDataFields } = normalizedResponseData
        setFormData({
          ...formDataFields,
          locations: normalizedResponseData.locations
        })
        
        toast.success('Profile updated successfully!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Error saving profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordUpdate = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!')
      return
    }
    // In a real app, this would update the password
    console.log('Updating password:', passwordData)
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    alert('Password updated successfully!')
  }

  const handleImageUpload = (event, type) => {
    const file = event.target.files[0]
    if (file) {
      // Check file size (2MB = 2 * 1024 * 1024 bytes)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB')
        return
      }
      
      // Store the File object for upload
      setFormData(prev => ({
        ...prev,
        [type]: file
      }))
    }
  }


  const handleSocialMediaChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [platform]: value || '' // Ensure value is never null
      }
    }))
  }

  const addCustomerCareRep = () => {
    setFormData(prev => ({
      ...prev,
      customer_care: [...prev.customer_care, { name: '', phone: '' }]
    }))
  }

  const removeCustomerCareRep = (index) => {
    setFormData(prev => ({
      ...prev,
      customer_care: prev.customer_care.filter((_, i) => i !== index)
    }))
  }

  const updateCustomerCareRep = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      customer_care: prev.customer_care.map((rep, i) => 
        i === index ? { ...rep, [field]: value || '' } : rep
      )
    }))
  }

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files)
    const validFiles = files.filter(file => {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 5MB.`)
        return false
      }
      return true
    })

    setFormData(prev => ({
      ...prev,
      registration_files: [...prev.registration_files, ...validFiles]
    }))
  }

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      registration_files: prev.registration_files.filter((_, i) => i !== index)
    }))
  }

  // Specialization management functions
  const addDatabaseSpecialization = (category) => {
    const specialization = {
      id: category.id,
      name: category.name,
      type: 'database'
    }
    
    setFormData(prev => ({
      ...prev,
      specialization: {
        ...prev.specialization,
        database: [...prev.specialization.database, specialization]
      }
    }))
    setShowSpecializationDropdown(false)
  }

  const addCustomSpecialization = () => {
    if (!newCustomSpecialization.trim()) {
      toast.error('Please enter a specialization name')
      return
    }

    const specialization = {
      id: `custom_${Date.now()}`,
      name: newCustomSpecialization.trim(),
      type: 'custom'
    }
    
    setFormData(prev => ({
      ...prev,
      specialization: {
        ...prev.specialization,
        custom: [...prev.specialization.custom, specialization]
      }
    }))
    setNewCustomSpecialization('')
  }

  const removeSpecialization = (index, type) => {
    setFormData(prev => ({
      ...prev,
      specialization: {
        ...prev.specialization,
        [type]: prev.specialization[type].filter((_, i) => i !== index)
      }
    }))
  }

  if (loading) {
    return (
      
     
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile data...</p>
          </div>
        </div>
 
    )
  }

  return (
  
    
      
      <div className="flex-1 p-6  relative">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your developer profile and account settings</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl p-1 mb-6 shadow-sm border border-gray-100">
          <div className="flex space-x-1">
            {[
              { id: 'profile', label: 'Profile Information', icon: FiUser },
              { id: 'password', label: 'Change Password', icon: FiLock }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Information Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Cover Photo */}
            <div className="relative h-80 bg-gradient-to-r from-primary_color to-blue-600 rounded-t-2xl overflow-hidden">
              {formData.cover_image ? (
                <img
                  src={formData.cover_image instanceof File ? URL.createObjectURL(formData.cover_image) : (typeof formData.cover_image === 'object' ? formData.cover_image.url : formData.cover_image)}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center !text-white">
                    <FiCamera className="w-16 h-16 mx-auto mb-4 opacity-70" />
                    <p className="text-xl font-medium">Set Cover Image</p>
                    <p className="text-sm opacity-80">Upload a cover photo for your profile</p>
                  </div>
                </div>
              )}
              <label className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 cursor-pointer shadow-lg hover:bg-white transition-colors z-10">
                <FiCamera className="w-4 h-4 text-gray-600" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'cover_image')}
                  className="hidden"
                />
              </label>
            </div>

            {/* Profile Header */}
            <div className="relative px-6 pb-6">
              <div className="flex items-end justify-between -mt-12">
                <div className="flex items-end gap-4">
                  <div className="relative">
                    {formData.profile_image ? (
                      <img
                        src={formData.profile_image instanceof File ? URL.createObjectURL(formData.profile_image) : (typeof formData.profile_image === 'object' ? formData.profile_image.url : formData.profile_image)}
                        alt="Developer Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                        <div className="text-center text-white">
                          <FiUser className="w-8 h-8 mx-auto mb-1 opacity-70" />
                          <p className="text-xs font-medium">Set Profile Photo</p>
                        </div>
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 cursor-pointer shadow-lg hover:bg-gray-50 transition-colors">
                      <FiCamera className="w-4 h-4 text-gray-600" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'profile_image')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Company Info Below Cover */}
              <div className="mt-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{formData.name || 'Company Name'}</h2>
                <p className="text-primary_color font-medium mb-2">Real Estate Developer</p>
                
                {/* Account Status, Time on Platform, and Profile Completion */}
                <div className="flex flex-wrap items-center gap-4 mb-3">
                  {/* Account Status */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      developerData.account_status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : developerData.account_status === 'suspended' 
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {developerData.account_status || 'active'}
                    </span>
                  </div>
                  
                  {/* Time on Platform */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">On platform:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {getTimeOnPlatform(developerData.created_at)}
                    </span>
                  </div>
                  
                  {/* Profile Completion */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Profile:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            (developerData.profile_completion_percentage || 0) >= 100 
                              ? 'bg-green-500' 
                              : (developerData.profile_completion_percentage || 0) >= 60 
                              ? 'bg-blue-500' 
                              : (developerData.profile_completion_percentage || 0) >= 40 
                              ? 'bg-yellow-500' 
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${developerData.profile_completion_percentage || 0}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold ${
                        (developerData.profile_completion_percentage || 0) >= 100 
                          ? 'text-green-600' 
                          : (developerData.profile_completion_percentage || 0) >= 60 
                          ? 'text-blue-600' 
                          : (developerData.profile_completion_percentage || 0) >= 40 
                          ? 'text-yellow-600' 
                          : 'text-red-600'
                      }`}>
                        {developerData.profile_completion_percentage || 0}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {[...(formData.specialization?.database || []), ...(formData.specialization?.custom || [])].map((spec, index) => (
                    <span key={index} className="bg-primary_color/10 text-primary_color px-3 py-1 rounded-full text-sm font-medium">
                      {spec.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-8">
              
              {/* Section 1: Company Information */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FiHome className="w-6 h-6 text-primary_color" />
                  Company Information
                </h3>
                
                {/* Basic Company Details */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Basic Details</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                      <div className="relative">
                        <FiHome className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                      <div className="relative">
                        <FiGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Email Addresses */}
                    <div className="space-y-4">
                      <h5 className="text-md font-medium text-gray-700 flex items-center gap-2">
                        <FiMail className="w-4 h-4 text-primary_color" />
                        Email Addresses
                      </h5>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Primary Email</label>
                          <div className="relative">
                            <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Secondary Email</label>
                          <div className="relative">
                            <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="email"
                              value={getSafeValue(formData.secondary_email)}
                              onChange={(e) => handleInputChange('secondary_email', e.target.value)}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                              placeholder="support@company.com"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Tertiary Email</label>
                          <div className="relative">
                            <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="email"
                              value={getSafeValue(formData.tertiary_email)}
                              onChange={(e) => handleInputChange('tertiary_email', e.target.value)}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                              placeholder="sales@company.com"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Phone Numbers */}
                    <div className="space-y-4">
                      <h5 className="text-md font-medium text-gray-700 flex items-center gap-2">
                        <FiPhone className="w-4 h-4 text-primary_color" />
                        Phone Numbers
                      </h5>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Primary Phone</label>
                          <div className="relative">
                            <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Secondary Phone</label>
                          <div className="relative">
                            <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="tel"
                              value={getSafeValue(formData.secondary_phone)}
                              onChange={(e) => handleInputChange('secondary_phone', e.target.value)}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                              placeholder="+233 30 111 2225"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Tertiary Phone</label>
                          <div className="relative">
                            <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="tel"
                              value={getSafeValue(formData.tertiary_phone)}
                              onChange={(e) => handleInputChange('tertiary_phone', e.target.value)}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                              placeholder="+233 30 111 2226"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Details */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Company Details</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Founded Year</label>
                      <div className="relative">
                        <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={formData.founded_year}
                          onChange={(e) => handleInputChange('founded_year', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                      <select
                        value={formData.company_size}
                        onChange={(e) => handleInputChange('company_size', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                      >
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="50-100">50-100 employees</option>
                        <option value="100+">100+ employees</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50 resize-none"
                      placeholder="Describe your company and services..."
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Property Specialization */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FiMap className="w-6 h-6 text-primary_color" />
                    Property Specialization
                  </h3>
                  <div className="flex gap-2">
                    <div className="relative">
                      <button
                        onClick={() => setShowSpecializationDropdown(!showSpecializationDropdown)}
                        className="bg-primary_color text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <FiPlus className="w-4 h-4" />
                        Add from Database
                        <FiChevronDown className="w-4 h-4" />
                      </button>
                      {showSpecializationDropdown && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
                          {propertyCategories.map((category) => (
                            <button
                              key={category.id}
                              onClick={() => addDatabaseSpecialization(category)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{category.name}</div>
                              {category.description && (
                                <div className="text-sm text-gray-500">{category.description}</div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Database Specializations */}
                {formData.specialization?.database?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Database Specializations</h4>
                    <div className="space-y-2">
                      {formData.specialization.database.map((spec, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="font-medium text-gray-900">{spec.name}</span>
                          </div>
                          <button
                            onClick={() => removeSpecialization(index, 'database')}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Specializations */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Custom Specializations</h4>
                  
                  {/* Add Custom Specialization */}
                  <div className="mb-4 flex gap-2">
                    <input
                      type="text"
                      value={newCustomSpecialization}
                      onChange={(e) => setNewCustomSpecialization(e.target.value)}
                      placeholder="Enter custom specialization..."
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    />
                    <button
                      onClick={addCustomSpecialization}
                      className="bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <FiPlus className="w-4 h-4" />
                      Add
                    </button>
                  </div>

                  {/* Custom Specializations List */}
                  {formData.specialization?.custom?.length > 0 && (
                    <div className="space-y-2">
                      {formData.specialization.custom.map((spec, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="font-medium text-gray-900">{spec.name}</span>
                          </div>
                          <button
                            onClick={() => removeSpecialization(index, 'custom')}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty State */}
                  {(!formData.specialization?.database?.length && !formData.specialization?.custom?.length) && (
                    <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-200">
                      <FiMap className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No specializations added yet</p>
                      <p className="text-sm">Add specializations from the database or create custom ones</p>
                    </div>
                  )}
                </div>
              </div>

            {/* Section 2.5: Company Locations */}
              <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FiMapPin className="w-6 h-6 text-primary_color" />
                  Company Locations
                </h3>
                <button
                  onClick={() => openLocationModal('add')}
                  className="bg-primary_color text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FiPlus className="w-4 h-4" />
                  Add Location
                </button>
                  </div>
                  
              {/* Locations list */}
              <div className="space-y-3">
                {(formData.locations || []).length === 0 && (
                  <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-200">
                    <FiMapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No locations added yet</p>
                    <p className="text-sm">Click "Add Location" to add your company locations using Google Maps</p>
                  </div>
                )}

                {(formData.locations || []).map((loc, index) => {
                  const isPrimary = !!loc.primary_location
                  const currencyName = loc.currency_name || supportedCurrencies.find(c => c.code === loc.currency)?.name || 'Not set'
                  const currencyCode = loc.currency || 'GHS'
                  return (
                    <div
                      key={loc.id || index}
                      className={`p-4 rounded-xl border ${isPrimary ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'} flex items-start justify-between gap-4`}
                    >
                      <div className="flex-1">
                        {isPrimary && (
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white mb-2">Primary Location</span>
                        )}
                        <div className="font-semibold text-gray-900 break-words mb-1">{loc.description || loc.address || 'Selected Location'}</div>
                        {loc.address && loc.address !== (loc.description || '') && (
                          <div className="text-sm text-gray-700 mb-1">{loc.address}</div>
                        )}
                        <div className="text-sm text-gray-600 mt-1">
                          {[loc.city, loc.region, loc.country].filter(Boolean).join(', ')}
                    </div>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="text-xs text-gray-500">Lat: {loc.latitude} · Lng: {loc.longitude}</div>
                          <div className="text-xs font-medium text-gray-700">
                            Currency: {currencyName} ({currencyCode})
                  </div>
                    </div>
                    </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openLocationModal('edit', index)}
                    className="px-3 py-2 rounded-lg text-sm font-medium border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
                  >
                    <FiEdit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeLocationAt(index)}
                    disabled={isPrimary}
                    className="px-3 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
                    </div>
                  )
                })}
                </div>
              </div>

              {/* Section 4: Social Media */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FiGlobe className="w-6 h-6 text-primary_color" />
                  Social Media Presence
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                    <div className="relative">
                      <FiFacebook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
                      <input
                        type="url"
                        value={getSafeValue(formData.social_media.facebook)}
                        onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                        placeholder="https://facebook.com/yourpage"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                    <div className="relative">
                      <FiInstagram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-600 w-5 h-5" />
                      <input
                        type="url"
                        value={formData.social_media.instagram}
                        onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                        placeholder="https://instagram.com/yourpage"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                    <div className="relative">
                      <FiLinkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-700 w-5 h-5" />
                      <input
                        type="url"
                        value={formData.social_media.linkedin}
                        onChange={(e) => handleSocialMediaChange('linkedin', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                        placeholder="https://linkedin.com/company/yourcompany"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">TikTok</label>
                    <div className="relative">
                      <FiGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                      <input
                        type="url"
                        value={formData.social_media.tiktok}
                        onChange={(e) => handleSocialMediaChange('tiktok', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                        placeholder="https://tiktok.com/@yourpage"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Customer Care Team */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FiUser className="w-6 h-6 text-primary_color" />
                    Customer Care Team
                  </h3>
                  <button
                    onClick={addCustomerCareRep}
                    className="bg-primary_color text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add Representative
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.customer_care.map((rep, index) => (
                    <div key={index} className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                          type="text"
                          value={getSafeValue(rep.name)}
                          onChange={(e) => updateCustomerCareRep(index, 'name', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                          placeholder="Representative name"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <div className="relative">
                          <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="tel"
                            value={getSafeValue(rep.phone)}
                            onChange={(e) => updateCustomerCareRep(index, 'phone', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                            placeholder="+233 30 111 2222"
                          />
                        </div>
                      </div>
                      {formData.customer_care.length > 1 && (
                        <button
                          onClick={() => removeCustomerCareRep(index)}
                          className="bg-red-100 text-red-600 p-3 rounded-xl hover:bg-red-200 transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 6: Registration & Documentation */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FiFileText className="w-6 h-6 text-primary_color" />
                    Registration & Documentation
                  </h3>
                  <label className="bg-primary_color text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer">
                    <FiUpload className="w-4 h-4" />
                    Upload Files
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                
                {/* License Number */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => handleInputChange('license_number', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                    placeholder="Enter your business license number"
                  />
                </div>
                
                {/* File Uploads */}
                <div className="space-y-3">
                  {formData.registration_files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <FiFileText className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">{file.name || file.filename}</p>
                          <p className="text-sm text-gray-500">
                            {file instanceof File ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / 1024).toFixed(1)} KB`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formData.registration_files.length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-200">
                      <FiFileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No registration documents uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 5.5: Company Statistics */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FiFileText className="w-6 h-6 text-primary_color" />
                  Company Statistics
                </h3>
                <button
                  onClick={addCompanyStat}
                  className="bg-primary_color text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FiPlus className="w-4 h-4" />
                  Add Statistic
                </button>
              </div>

              {(formData.company_statistics || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-200">
                  <FiFileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No company statistics added</p>
                  <p className="text-sm">Add metrics like Employees, Projects Completed, Awards, etc.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(formData.company_statistics || []).map((row, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end bg-white border border-gray-200 rounded-xl p-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
                        <input
                          type="text"
                          value={row.label || ''}
                          onChange={(e) => updateCompanyStat(index, 'label', e.target.value)}
                          placeholder="e.g., Employees"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                        <input
                          type="text"
                          value={row.value || ''}
                          onChange={(e) => updateCompanyStat(index, 'value', e.target.value)}
                          placeholder="e.g., 250+"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                        />
                      </div>
                      <div className="flex md:justify-end">
                        <button
                          onClick={() => removeCompanyStat(index)}
                          className="bg-red-100 text-red-600 px-4 py-3 rounded-xl hover:bg-red-200 transition-colors flex items-center gap-2"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button at the End */}
            <div className="sticky bottom-6 mt-10 px-6 py-4 z-10">
              <div className="flex items-center justify-center">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary_color text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <FiSave className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Location Modal */}
            {showLocationModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" >
                <div className="bg-white mt-20 rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                    <h3 className="text-xl font-bold text-gray-900">
                      {locationModalMode === 'add' ? 'Add New Location' : 'Edit Location'}
                    </h3>
                    <button
                      onClick={closeLocationModal}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FiX className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Google Places Autocomplete */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search Location (Google Maps)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={modalPlaceQuery}
                          onChange={(e) => handleModalPlaceInputChange(e.target.value)}
                          placeholder={gmIsLoaded ? 'Type an address or area' : 'Loading Google Places...'}
                          disabled={!gmIsLoaded}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                        />
                        {gmIsLoaded && modalPlaceQuery && modalPlaceSuggestions.length > 0 && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            {modalPlaceSuggestions.map((p) => (
                              <button
                                key={p.place_id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleModalSuggestionClick(p)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{p.structured_formatting?.main_text || p.description}</div>
                                <div className="text-sm text-gray-500">{p.structured_formatting?.secondary_text || ''}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Interactive Map */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Map Selector - Click on the map to set location
                      </label>
                      <p className="text-sm text-gray-500 mb-3">
                        Use the pin on the map or search above to select your location. You can also click directly on the map to set coordinates. Drag the marker to fine-tune the position.
                      </p>
                      <div className="h-96 rounded-lg overflow-hidden border border-gray-300">
                        <Wrapper
                          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API}
                          libraries={['places']}
                          render={(status) => {
                            if (status === 'LOADING') {
                              return (
                                <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    <p className="text-gray-600">Loading Google Maps...</p>
                                  </div>
                                </div>
                              )
                            }
                            
                            if (status === 'FAILURE') {
                              return (
                                <div className="h-full bg-red-50 rounded-lg flex items-center justify-center">
                                  <p className="text-red-600">Failed to load Google Maps. Please check your API key.</p>
                                </div>
                              )
                            }
                            
                            return (
                              <GoogleMapViewer
                                center={modalMapCenter}
                                zoom={modalMapZoom}
                                coordinates={modalForm.latitude !== 0 && modalForm.longitude !== 0 ? [modalForm.latitude, modalForm.longitude] : null}
                                onMapClick={handleModalMapClick}
                              />
                            )
                          }}
                        />
                      </div>
                      {modalForm.latitude !== 0 && modalForm.longitude !== 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Current Location:</span>
                            <span className="font-mono text-blue-700">
                              {modalForm.latitude.toFixed(6)}, {modalForm.longitude.toFixed(6)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location Name/Description</label>
                      <input
                        type="text"
                        value={modalForm.description}
                        onChange={(e) => setModalForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200"
                        placeholder="e.g., Main Office, Branch Office, etc."
                      />
                    </div>

                    {/* Location Details (auto-filled from Google) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                        <input
                          type="text"
                          value={modalForm.country}
                          disabled
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Region/State</label>
                        <input
                          type="text"
                          value={modalForm.region}
                          disabled
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <input
                          type="text"
                          value={modalForm.city}
                          disabled
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Currency <span className="text-xs text-gray-500">(Auto-selected based on country)</span>
                        </label>
                        <input
                          type="text"
                          value={modalForm.currency_name ? `${modalForm.currency_name} (${modalForm.currency})` : (modalForm.currency || 'Not set')}
                          disabled
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Address</label>
                      <textarea
                        value={modalForm.address}
                        onChange={(e) => setModalForm(prev => ({ ...prev, address: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Full address..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          value={modalForm.latitude}
                          onChange={(e) => {
                            const lat = parseFloat(e.target.value) || 0
                            setModalForm(prev => ({ ...prev, latitude: lat }))
                            if (lat !== 0 && modalForm.longitude !== 0) {
                              setModalMapCenter([lat, modalForm.longitude])
                              setModalMapZoom(15)
                            }
                          }}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          value={modalForm.longitude}
                          onChange={(e) => {
                            const lng = parseFloat(e.target.value) || 0
                            setModalForm(prev => ({ ...prev, longitude: lng }))
                            if (modalForm.latitude !== 0 && lng !== 0) {
                              setModalMapCenter([modalForm.latitude, lng])
                              setModalMapZoom(15)
                            }
                          }}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Primary Location Checkbox */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="primaryLocation"
                        checked={modalForm.primary_location}
                        onChange={(e) => {
                          const hasPrimary = Array.isArray(formData.locations) && formData.locations.some(l => l?.primary_location && (!editingLocationIndex || formData.locations.indexOf(l) !== editingLocationIndex))
                          if (e.target.checked && hasPrimary) {
                            toast.error('A primary location already exists. Please remove it first.')
                            return
                          }
                          setModalForm(prev => ({ ...prev, primary_location: e.target.checked }))
                        }}
                        disabled={Array.isArray(formData.locations) && formData.locations.some(l => l?.primary_location && (!editingLocationIndex || formData.locations.indexOf(l) !== editingLocationIndex))}
                        className="w-4 h-4 text-primary_color border-gray-300 rounded focus:ring-primary_color"
                      />
                      <label htmlFor="primaryLocation" className="text-sm font-medium text-gray-700">
                        Set as primary location (locked once set)
                      </label>
                    </div>

                    {/* Modal Actions - At the bottom */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                      <button
                        onClick={closeLocationModal}
                        className="px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveLocation}
                        className="px-4 py-2 rounded-lg font-medium bg-primary_color text-white hover:bg-blue-700 transition-colors"
                      >
                        {locationModalMode === 'add' ? 'Add Location' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Change Password Tab */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h3>
            
            <div className="max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2  transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handlePasswordUpdate}
                className="w-full bg-primary_color text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <FiSave className="w-4 h-4" />
                Update Password
              </button>
            </div>
          </div>
        )}
      </div>
   
  )
}

export default ProfilePage
