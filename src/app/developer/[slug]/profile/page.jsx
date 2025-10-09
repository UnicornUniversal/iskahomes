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

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('../../../components/propertyManagement/modules/MapComponent'), { 
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
})
import DeveloperNav from '../../../components/developers/DeveloperNav'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'

const ProfilePage = () => {
  const { user, developerToken } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [propertyCategories, setPropertyCategories] = useState([])
  const [showSpecializationDropdown, setShowSpecializationDropdown] = useState(false)
  const [newCustomSpecialization, setNewCustomSpecialization] = useState('')

  // Location data state
  const [locationData, setLocationData] = useState({
    country: '',
    state: '',
    city: '',
    town: '',
    fullAddress: '',
    coordinates: {
      latitude: '',
      longitude: ''
    },
    additionalInformation: ''
  })

  // GeoNames data
  const [countries, setCountries] = useState([])
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [towns, setTowns] = useState([])
  const [locationLoading, setLocationLoading] = useState({
    countries: false,
    states: false,
    cities: false,
    towns: false,
    coordinates: false
  })
  const [mapCenter, setMapCenter] = useState([7.9465, -1.0232]) // Ghana coordinates
  const [mapZoom, setMapZoom] = useState(6) // Zoom level for Ghana
  
  // Refs for dropdown management
  const cityDropdownRef = useRef(null)
  const townDropdownRef = useRef(null)
  
  // Debounce timer for coordinate fetching
  const coordinateFetchTimer = useRef(null)

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
    registration_files: []
  })

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
          registration_files: data.registration_files || []
        }
        
        setDeveloperData(normalizedData)
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

  // GeoNames API functions
  const fetchCountries = useCallback(async () => {
    setLocationLoading(prev => ({ ...prev, countries: true }))
    try {
      const response = await fetch('http://api.geonames.org/countryInfoJSON?username=iskahomes')
      if (response.ok) {
        const data = await response.json()
        const countryList = data.geonames.map(country => ({
          name: country.countryName,
          code: country.countryCode,
          geonameId: country.geonameId
        })).sort((a, b) => a.name.localeCompare(b.name))
        setCountries(countryList)
      }
    } catch (error) {
      console.error('Error fetching countries:', error)
    } finally {
      setLocationLoading(prev => ({ ...prev, countries: false }))
    }
  }, [])

  const fetchStates = useCallback(async (countryGeonameId) => {
    setLocationLoading(prev => ({ ...prev, states: true }))
    try {
      const response = await fetch(`http://api.geonames.org/childrenJSON?geonameId=${countryGeonameId}&username=iskahomes`)
      if (response.ok) {
        const data = await response.json()
        if (data.geonames && data.geonames.length > 0) {
          let stateList = data.geonames.map(state => ({
            name: state.name,
            geonameId: state.geonameId
          })).sort((a, b) => a.name.localeCompare(b.name))
          
          // Ensure saved state is included even if not in GeoNames results
          const savedState = locationData.state
          if (savedState && !stateList.some(s => s.name === savedState)) {
            stateList = [{ name: savedState, geonameId: null }, ...stateList]
          }
          
          setStates(stateList)
        }
      }
    } catch (error) {
      console.error('Error fetching states:', error)
    } finally {
      setLocationLoading(prev => ({ ...prev, states: false }))
    }
  }, [locationData.state])

  const fetchCities = useCallback(async (stateGeonameId) => {
    setLocationLoading(prev => ({ ...prev, cities: true }))
    try {
      const response = await fetch(`http://api.geonames.org/childrenJSON?geonameId=${stateGeonameId}&username=iskahomes`)
      if (response.ok) {
        const data = await response.json()
        if (data.geonames && data.geonames.length > 0) {
          let cityList = data.geonames.map(city => ({
            name: city.name,
            geonameId: city.geonameId,
            lat: city.lat,
            lng: city.lng
          })).sort((a, b) => a.name.localeCompare(b.name))
          
          // Ensure saved city is included even if not in GeoNames results
          const savedCity = locationData.city
          if (savedCity && !cityList.some(c => c.name === savedCity)) {
            cityList = [{ name: savedCity, geonameId: null, lat: null, lng: null }, ...cityList]
          }
          
          setCities(cityList)
        }
      }
    } catch (error) {
      console.error('Error fetching cities:', error)
    } finally {
      setLocationLoading(prev => ({ ...prev, cities: false }))
    }
  }, [locationData.city])

  const fetchTowns = useCallback(async (cityGeonameId) => {
    setLocationLoading(prev => ({ ...prev, towns: true }))
    try {
      const response = await fetch(`http://api.geonames.org/childrenJSON?geonameId=${cityGeonameId}&username=iskahomes`)
      if (response.ok) {
        const data = await response.json()
        if (data.geonames && data.geonames.length > 0) {
          let townList = data.geonames.map(town => ({
            name: town.name,
            geonameId: town.geonameId,
            lat: town.lat,
            lng: town.lng
          })).sort((a, b) => a.name.localeCompare(b.name))
          
          // Ensure saved town is included even if not in GeoNames results
          const savedTown = locationData.town
          if (savedTown && !townList.some(t => t.name === savedTown)) {
            townList = [{ name: savedTown, geonameId: null, lat: null, lng: null }, ...townList]
          }
          
          setTowns(townList)
        }
      }
    } catch (error) {
      console.error('Error fetching towns:', error)
    } finally {
      setLocationLoading(prev => ({ ...prev, towns: false }))
    }
  }, [locationData.town])

  // Fetch coordinates for a specific location
  const fetchCoordinates = async (locationName, countryName = '', stateName = '') => {
    try {
      let query = locationName
      if (stateName) query += `, ${stateName}`
      if (countryName) query += `, ${countryName}`
      
      const response = await fetch(`http://api.geonames.org/searchJSON?q=${encodeURIComponent(query)}&maxRows=1&username=iskahomes`)
      if (response.ok) {
        const data = await response.json()
        if (data.geonames && data.geonames.length > 0) {
          const location = data.geonames[0]
          return {
            latitude: location.lat,
            longitude: location.lng
          }
        }
      }
    } catch (error) {
      console.error('Error fetching coordinates:', error)
    }
    return null
  }

  // Auto-fetch coordinates when location changes
  const autoFetchCoordinates = async (country, state, city, town, currentLocationData) => {
    if (!city) return
    
    setLocationLoading(prev => ({ ...prev, coordinates: true }))
    
    try {
      // Try to get coordinates for the most specific location available
      let locationToSearch = city
      let countryForSearch = country
      let stateForSearch = state
      
      if (town) {
        locationToSearch = town
      }
      
      const coordinates = await fetchCoordinates(locationToSearch, countryForSearch, stateForSearch)
      
      if (coordinates) {
        const next = {
          ...currentLocationData,
          coordinates: {
            latitude: coordinates.latitude.toString(),
            longitude: coordinates.longitude.toString()
          }
        }
        setLocationData(next)
        
        // Update map center
        const lat = parseFloat(coordinates.latitude)
        const lng = parseFloat(coordinates.longitude)
        if (!isNaN(lat) && !isNaN(lng)) {
          setMapCenter([lat, lng])
          setMapZoom(15)
        }
        
        console.log('📍 Auto-fetched coordinates:', coordinates)
      }
    } catch (error) {
      console.error('Error auto-fetching coordinates:', error)
    } finally {
      setLocationLoading(prev => ({ ...prev, coordinates: false }))
    }
  }

  // Load data on component mount
  useEffect(() => {
    if (user) {
      fetchDeveloperProfile()
      fetchPropertyCategories()
      fetchCountries()
    }
  }, [user])

  // Initialize location data from formData
  useEffect(() => {
    if (formData.address || formData.city || formData.region || formData.country || formData.latitude || formData.longitude) {
      setLocationData({
        country: formData.country || '',
        state: formData.region || '',
        city: formData.city || '',
        town: '',
        fullAddress: formData.address || '',
        coordinates: {
          latitude: formData.latitude ? formData.latitude.toString() : '',
          longitude: formData.longitude ? formData.longitude.toString() : ''
        },
        additionalInformation: ''
      })
      
      // Set map center if coordinates exist
      if (formData.latitude && formData.longitude) {
        const lat = parseFloat(formData.latitude)
        const lng = parseFloat(formData.longitude)
        if (!isNaN(lat) && !isNaN(lng)) {
          setMapCenter([lat, lng])
          setMapZoom(15)
        }
      }
    }
  }, [formData])

  // Fetch states when country changes
  useEffect(() => {
    if (locationData.country) {
      const selectedCountry = countries.find(c => c.name === locationData.country)
      if (selectedCountry?.geonameId) {
        fetchStates(selectedCountry.geonameId)
      }
    } else {
      setStates([])
      setCities([])
      setTowns([])
    }
  }, [locationData.country, countries, fetchStates])

  // Fetch cities when state changes
  useEffect(() => {
    if (locationData.state) {
      const selectedState = states.find(s => s.name === locationData.state)
      if (selectedState?.geonameId) {
        fetchCities(selectedState.geonameId)
      }
    } else {
      setCities([])
      setTowns([])
    }
  }, [locationData.state, states, fetchCities])

  // Fetch towns when city changes
  useEffect(() => {
    if (locationData.city) {
      const selectedCity = cities.find(c => c.name === locationData.city)
      if (selectedCity?.geonameId) {
        fetchTowns(selectedCity.geonameId)
      }
    } else {
      setTowns([])
    }
  }, [locationData.city, cities, fetchTowns])

  // Helper function to ensure safe values for inputs
  const getSafeValue = (value) => {
    return value === null || value === undefined ? '' : value
  }

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value || '' // Ensure value is never null
    }))
  }

  // Location handling functions
  const handleLocationChange = async (field, value) => {
    const next = { ...locationData, [field]: value }
    
    // Reset dependent fields when parent changes
    if (field === 'country') {
      next.state = ''
      next.city = ''
      next.town = ''
      setStates([])
      setCities([])
      setTowns([])
      if (value) {
        const selectedCountry = countries.find(c => c.name === value)
        if (selectedCountry) {
          fetchStates(selectedCountry.geonameId)
        }
      }
    } else if (field === 'state') {
      next.city = ''
      next.town = ''
      setCities([])
      setTowns([])
      if (value) {
        const selectedState = states.find(s => s.name === value)
        if (selectedState) {
          fetchCities(selectedState.geonameId)
        }
      }
    } else if (field === 'city') {
      next.town = ''
      setTowns([])
      if (value) {
        const selectedCity = cities.find(c => c.name === value)
        if (selectedCity) {
          fetchTowns(selectedCity.geonameId)
        }
      }
    }
    
    // Set the location data once with all changes
    setLocationData(next)
    
    // Update form data with location fields
    setFormData(prev => ({
      ...prev,
      country: next.country,
      region: next.state,
      city: next.city,
      address: next.fullAddress,
      latitude: next.coordinates.latitude ? parseFloat(next.coordinates.latitude) : 0,
      longitude: next.coordinates.longitude ? parseFloat(next.coordinates.longitude) : 0
    }))
    
    // Auto-fetch coordinates after location change (debounced)
    if (coordinateFetchTimer.current) {
      clearTimeout(coordinateFetchTimer.current)
    }
    coordinateFetchTimer.current = setTimeout(async () => {
      await autoFetchCoordinates(next.country, next.state, next.city, next.town, next)
    }, 500) // Small delay to ensure state is updated
  }

  // Handle custom city/town input
  const handleCustomLocationInput = async (field, value) => {
    const next = { ...locationData, [field]: value }
    setLocationData(next)
    
    // Update form data with location fields
    setFormData(prev => ({
      ...prev,
      country: next.country,
      region: next.state,
      city: next.city,
      address: next.fullAddress,
      latitude: next.coordinates.latitude ? parseFloat(next.coordinates.latitude) : 0,
      longitude: next.coordinates.longitude ? parseFloat(next.coordinates.longitude) : 0
    }))
    
    // Auto-fetch coordinates for custom input (debounced)
    if (coordinateFetchTimer.current) {
      clearTimeout(coordinateFetchTimer.current)
    }
    coordinateFetchTimer.current = setTimeout(async () => {
      await autoFetchCoordinates(next.country, next.state, next.city, next.town, next)
    }, 1000) // Longer delay for custom input to allow user to finish typing
  }

  const handleCoordChange = (field, value) => {
    const next = {
      ...locationData,
      coordinates: { ...locationData.coordinates, [field]: value }
    }
    setLocationData(next)
    
    // Update form data with coordinates
    setFormData(prev => ({
      ...prev,
      latitude: next.coordinates.latitude ? parseFloat(next.coordinates.latitude) : 0,
      longitude: next.coordinates.longitude ? parseFloat(next.coordinates.longitude) : 0
    }))
    
    // Update map center if both coordinates are provided and valid
    if (next.coordinates.latitude && next.coordinates.longitude) {
      const lat = parseFloat(next.coordinates.latitude)
      const lng = parseFloat(next.coordinates.longitude)
      
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter([lat, lng])
        setMapZoom(15)
      }
    }
  }

  const handleMapClick = (lat, lng) => {
    const next = {
      ...locationData,
      coordinates: {
        latitude: lat.toString(),
        longitude: lng.toString()
      }
    }
    setLocationData(next)
    
    // Update form data with coordinates
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }))
    
    setMapCenter([lat, lng])
    setMapZoom(15)
  }

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
        setDeveloperData(data)
        setIsEditing(false)
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

  const handleCancel = () => {
    setFormData(developerData)
    setIsEditing(false)
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
      <div className="flex min-h-screen bg-gray-50">
        <DeveloperNav active={8} />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DeveloperNav active={8} />
      
      <div className="flex-1 p-6 ">
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
              {isEditing && (
                <label className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 cursor-pointer shadow-lg hover:bg-white transition-colors z-10">
                  <FiCamera className="w-4 h-4 text-gray-600" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'cover_image')}
                    className="hidden"
                  />
                </label>
              )}
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
                    {isEditing && (
                      <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 cursor-pointer shadow-lg hover:bg-gray-50 transition-colors">
                        <FiCamera className="w-4 h-4 text-gray-600" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'profile_image')}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pb-4">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary_color text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <FiSave className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <FiX className="w-4 h-4" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-primary_color text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <FiEdit3 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
              
              {/* Company Info Below Cover */}
              <div className="mt-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{formData.name || 'Company Name'}</h2>
                <p className="text-primary_color font-medium mb-2">Real Estate Developer</p>
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
                          disabled={!isEditing}
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
                          disabled={!isEditing}
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
                              disabled={!isEditing}
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
                              disabled={!isEditing}
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
                              disabled={!isEditing}
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
                              disabled={!isEditing}
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
                              disabled={!isEditing}
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
                              disabled={!isEditing}
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
                          disabled={!isEditing}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                      <select
                        value={formData.company_size}
                        onChange={(e) => handleInputChange('company_size', e.target.value)}
                        disabled={!isEditing}
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
                      disabled={!isEditing}
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
                  {isEditing && (
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
                  )}
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
                          {isEditing && (
                            <button
                              onClick={() => removeSpecialization(index, 'database')}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Specializations */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Custom Specializations</h4>
                  
                  {/* Add Custom Specialization */}
                  {isEditing && (
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
                  )}

                  {/* Custom Specializations List */}
                  {formData.specialization?.custom?.length > 0 && (
                    <div className="space-y-2">
                      {formData.specialization.custom.map((spec, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="font-medium text-gray-900">{spec.name}</span>
                          </div>
                          {isEditing && (
                            <button
                              onClick={() => removeSpecialization(index, 'custom')}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
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

              {/* Section 3: Location Information */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FiMapPin className="w-6 h-6 text-primary_color" />
                  Location Information
                </h3>
                
                {/* Location Dropdowns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <select
                      value={locationData.country}
                      onChange={(e) => handleLocationChange('country', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                    >
                      <option value="">Select country</option>
                      {locationLoading.countries ? (
                        <option disabled>Loading countries...</option>
                      ) : (
                        countries.map(country => (
                          <option key={country.geonameId} value={country.name}>{country.name}</option>
                        ))
                      )}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State/Region</label>
                    <select
                      value={locationData.state}
                      onChange={(e) => handleLocationChange('state', e.target.value)}
                      disabled={!isEditing || !locationData.country}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                    >
                      <option value="">Select state/region</option>
                      {locationLoading.states ? (
                        <option disabled>Loading states...</option>
                      ) : (
                        states.map(state => (
                          <option key={state.geonameId} value={state.name}>{state.name}</option>
                        ))
                      )}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={locationData.city}
                        onChange={(e) => handleCustomLocationInput('city', e.target.value)}
                        onFocus={() => {
                          // Show dropdown when focusing
                          cityDropdownRef.current?.classList.remove('hidden')
                        }}
                        onBlur={() => {
                          // Hide dropdown after a delay to allow selection
                          setTimeout(() => {
                            cityDropdownRef.current?.classList.add('hidden')
                          }, 200)
                        }}
                        disabled={!isEditing || !locationData.state}
                        placeholder="Type city name or select from list"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                      />
                      <div ref={cityDropdownRef} className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto hidden">
                        {locationLoading.cities ? (
                          <div className="px-4 py-3 text-gray-500">Loading cities...</div>
                        ) : (
                          cities.map(city => (
                            <div
                              key={city.geonameId || city.name}
                              onClick={() => {
                                handleLocationChange('city', city.name)
                                document.activeElement?.blur()
                              }}
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              {city.name}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Town/Area</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={locationData.town}
                        onChange={(e) => handleCustomLocationInput('town', e.target.value)}
                        onFocus={() => {
                          // Show dropdown when focusing
                          townDropdownRef.current?.classList.remove('hidden')
                        }}
                        onBlur={() => {
                          // Hide dropdown after a delay to allow selection
                          setTimeout(() => {
                            townDropdownRef.current?.classList.add('hidden')
                          }, 200)
                        }}
                        disabled={!isEditing || !locationData.city}
                        placeholder="Type town/area name or select from list"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                      />
                      <div ref={townDropdownRef} className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto hidden">
                        {locationLoading.towns ? (
                          <div className="px-4 py-3 text-gray-500">Loading towns...</div>
                        ) : (
                          towns.map(town => (
                            <div
                              key={town.geonameId || town.name}
                              onClick={() => {
                                handleLocationChange('town', town.name)
                                document.activeElement?.blur()
                              }}
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              {town.name}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full Address */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Address</label>
                  <textarea
                    value={locationData.fullAddress}
                    onChange={(e) => handleLocationChange('fullAddress', e.target.value)}
                    disabled={!isEditing}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50 resize-none"
                    placeholder="e.g., 123 Main Street, East Legon, Accra, Greater Accra Region, Ghana"
                  />
                </div>

                {/* Coordinates */}
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border border-gray-200 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Coordinates</label>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {locationLoading.coordinates ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary_color border-t-transparent"></div>
                          <span>Fetching coordinates...</span>
                        </>
                      ) : (
                        <>
                          <FiMapPin className="w-4 h-4" />
                          <span>Auto-filled from location selection</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g., 6.47876"
                        value={locationData.coordinates.latitude || ''}
                        onChange={(e) => handleCoordChange('latitude', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g., -2.49259"
                        value={locationData.coordinates.longitude || ''}
                        onChange={(e) => handleCoordChange('longitude', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Interactive Map */}
                {isEditing && (
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-200 mb-6">
                    <label className="block text-sm font-medium text-teal-900 mb-2">
                      Interactive Map
                    </label>
                    <p className="text-teal-700 text-sm mb-4">Click on the map to set the exact location of your company</p>
                    
                    <div className="h-96 rounded-lg overflow-hidden border border-teal-300">
                      <MapComponent
                        center={mapCenter}
                        zoom={mapZoom}
                        onMapClick={handleMapClick}
                        coordinates={locationData.coordinates}
                      />
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Location Information</label>
                  <textarea
                    rows={4}
                    placeholder="Any additional location details, landmarks, or directions..."
                    value={locationData.additionalInformation}
                    onChange={(e) => handleLocationChange('additionalInformation', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50 resize-none"
                  />
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
                        disabled={!isEditing}
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
                        disabled={!isEditing}
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
                        disabled={!isEditing}
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
                        disabled={!isEditing}
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
                  {isEditing && (
                    <button
                      onClick={addCustomerCareRep}
                      className="bg-primary_color text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <FiPlus className="w-4 h-4" />
                      Add Representative
                    </button>
                  )}
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
                          disabled={!isEditing}
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
                            disabled={!isEditing}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                            placeholder="+233 30 111 2222"
                          />
                        </div>
                      </div>
                      {isEditing && formData.customer_care.length > 1 && (
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
                  {isEditing && (
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
                  )}
                </div>
                
                {/* License Number */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => handleInputChange('license_number', e.target.value)}
                    disabled={!isEditing}
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
                      {isEditing && (
                        <button
                          onClick={() => removeFile(index)}
                          className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
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
    </div>
  )
}

export default ProfilePage
