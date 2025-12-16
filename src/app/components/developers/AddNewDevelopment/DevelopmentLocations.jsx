"use client"
import React, { useState, useEffect, useRef } from 'react'
import PropertyLocation from '@/app/components/propertyManagement/modules/PropertyLocation'
import { toast } from 'react-toastify'
import { Plus, X, Edit3, MapPin, Star } from 'lucide-react'

const DevelopmentLocations = ({ formData, updateFormData, isEditMode }) => {
  const [locations, setLocations] = useState([])
  const [editingIndex, setEditingIndex] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const modalRef = useRef(null)
  const [currentLocation, setCurrentLocation] = useState({
    country: '',
    state: '',
    city: '',
    town: '',
    fullAddress: '',
    coordinates: {
      latitude: '',
      longitude: ''
    },
    additionalInformation: '',
    isPrimary: false
  })
  
  // Handle click outside modal to close
  useEffect(() => {
    if (!showModal) return
    
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleCancel()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showModal])

  // Initialize locations from formData
  useEffect(() => {
    if (formData.development_locations && Array.isArray(formData.development_locations)) {
      setLocations(formData.development_locations)
    } else if (formData.development_locations === null || formData.development_locations === undefined) {
      setLocations([])
    }
  }, [formData.development_locations])

  const handleLocationUpdate = (locationData) => {
    setCurrentLocation(locationData)
  }

  const handleAddLocation = () => {
    if (!currentLocation.fullAddress && !currentLocation.city) {
      toast.error('Please provide at least a city or full address')
      return
    }

    const newLocation = {
      ...currentLocation,
      id: Date.now().toString() // Temporary ID
    }

    let updatedLocations = [...locations]
    
    // If this is marked as primary, remove primary flag from others
    if (newLocation.isPrimary) {
      updatedLocations = updatedLocations.map(loc => ({ ...loc, isPrimary: false }))
    }
    
    // If this is the first location, make it primary automatically
    if (updatedLocations.length === 0) {
      newLocation.isPrimary = true
    }
    
    updatedLocations.push(newLocation)
    setLocations(updatedLocations)
    
    // Update development_locations
    updateFormData({ development_locations: updatedLocations })
    
    // If this is primary (or first location), update main location fields
    if (newLocation.isPrimary || updatedLocations.length === 1) {
      updateFormData({
        location: {
          country: newLocation.country,
          state: newLocation.state,
          city: newLocation.city,
          town: newLocation.town,
          fullAddress: newLocation.fullAddress,
          coordinates: {
            latitude: newLocation.coordinates.latitude,
            longitude: newLocation.coordinates.longitude
          },
          additionalInformation: newLocation.additionalInformation
        }
      })
    }
    
    // Reset form and close modal
    setCurrentLocation({
      country: '',
      state: '',
      city: '',
      town: '',
      fullAddress: '',
      coordinates: {
        latitude: '',
        longitude: ''
      },
      additionalInformation: '',
      isPrimary: false
    })
    setShowModal(false)
    toast.success('Location added successfully')
  }

  const handleEditLocation = (index) => {
    setEditingIndex(index)
    setCurrentLocation({ ...locations[index], isPrimary: locations[index].isPrimary || false })
    setShowModal(true)
  }

  const handleUpdateLocation = () => {
    if (!currentLocation.fullAddress && !currentLocation.city) {
      toast.error('Please provide at least a city or full address')
      return
    }

    const updatedLocations = [...locations]
    
    // If this location is marked as primary, remove primary flag from others
    if (currentLocation.isPrimary) {
      updatedLocations.forEach((loc, idx) => {
        if (idx !== editingIndex) {
          loc.isPrimary = false
        }
      })
    }
    
    updatedLocations[editingIndex] = currentLocation
    setLocations(updatedLocations)
    updateFormData({ development_locations: updatedLocations })
    
    // If this is primary, update main location fields
    if (currentLocation.isPrimary) {
      updateFormData({
        location: {
          country: currentLocation.country,
          state: currentLocation.state,
          city: currentLocation.city,
          town: currentLocation.town,
          fullAddress: currentLocation.fullAddress,
          coordinates: {
            latitude: currentLocation.coordinates.latitude,
            longitude: currentLocation.coordinates.longitude
          },
          additionalInformation: currentLocation.additionalInformation
        }
      })
    }
    
    // Reset form and close modal
    setCurrentLocation({
      country: '',
      state: '',
      city: '',
      town: '',
      fullAddress: '',
      coordinates: {
        latitude: '',
        longitude: ''
      },
      additionalInformation: '',
      isPrimary: false
    })
    setEditingIndex(null)
    setShowModal(false)
    toast.success('Location updated successfully')
  }
  
  const handleSetPrimary = (index) => {
    const updatedLocations = locations.map((loc, idx) => ({
      ...loc,
      isPrimary: idx === index
    }))
    
    setLocations(updatedLocations)
    updateFormData({ development_locations: updatedLocations })
    
    // Update main location fields with primary location
    const primaryLocation = updatedLocations[index]
    updateFormData({
      location: {
        country: primaryLocation.country,
        state: primaryLocation.state,
        city: primaryLocation.city,
        town: primaryLocation.town,
        fullAddress: primaryLocation.fullAddress,
        coordinates: {
          latitude: primaryLocation.coordinates?.latitude || '',
          longitude: primaryLocation.coordinates?.longitude || ''
        },
        additionalInformation: primaryLocation.additionalInformation || ''
      }
    })
    
    toast.success('Primary location updated')
  }

  const handleDeleteLocation = (index) => {
    if (confirm('Are you sure you want to delete this location?')) {
      const locationToDelete = locations[index]
      const updatedLocations = locations.filter((_, i) => i !== index)
      
      // If deleted location was primary and there are other locations, make first one primary
      if (locationToDelete.isPrimary && updatedLocations.length > 0) {
        updatedLocations[0].isPrimary = true
        // Update main location fields with new primary
        const newPrimary = updatedLocations[0]
        updateFormData({
          location: {
            country: newPrimary.country,
            state: newPrimary.state,
            city: newPrimary.city,
            town: newPrimary.town,
            fullAddress: newPrimary.fullAddress,
            coordinates: {
              latitude: newPrimary.coordinates?.latitude || '',
              longitude: newPrimary.coordinates?.longitude || ''
            },
            additionalInformation: newPrimary.additionalInformation || ''
          }
        })
      } else if (updatedLocations.length === 0) {
        // Clear main location if no locations left
        updateFormData({
          location: {
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
          }
        })
      }
      
      setLocations(updatedLocations)
      updateFormData({ development_locations: updatedLocations })
      toast.success('Location deleted successfully')
    }
  }

  const handleCancel = () => {
    setCurrentLocation({
      country: '',
      state: '',
      city: '',
      town: '',
      fullAddress: '',
      coordinates: {
        latitude: '',
        longitude: ''
      },
      additionalInformation: '',
      isPrimary: false
    })
    setEditingIndex(null)
    setShowModal(false)
  }
  
  const handleOpenModal = () => {
    setCurrentLocation({
      country: '',
      state: '',
      city: '',
      town: '',
      fullAddress: '',
      coordinates: {
        latitude: '',
        longitude: ''
      },
      additionalInformation: '',
      isPrimary: locations.length === 0 // First location is primary by default
    })
    setEditingIndex(null)
    setShowModal(true)
  }

  return (
    <>
      <div className="w-full space-y-6">
        <div className="mb-6">
          <h2 className="mb-2">Development Locations</h2>
          <p>
            {isEditMode 
              ? 'Manage multiple locations for your development. The primary location will be used as the main development location.' 
              : 'Add multiple locations where your development is located. The first location will be set as primary.'}
          </p>
        </div>

        {/* Primary Location Display */}
        {locations.length > 0 && locations.some(loc => loc.isPrimary) && (
          <div className="secondary_bg p-4 rounded-lg border-2 border-primary_color">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-primary_color fill-primary_color" />
              <h3 className="text-lg font-semibold text-primary_color">Primary Location</h3>
            </div>
            {(() => {
              const primaryLocation = locations.find(loc => loc.isPrimary) || locations[0]
              return (
                <div>
                  {primaryLocation.fullAddress && (
                    <p className="text-sm mb-1">
                      <span className="font-medium">Address:</span> {primaryLocation.fullAddress}
                    </p>
                  )}
                  <p className="text-sm mb-1">
                    {[
                      primaryLocation.town,
                      primaryLocation.city,
                      primaryLocation.state,
                      primaryLocation.country
                    ].filter(Boolean).join(', ') || 'Location details not set'}
                  </p>
                </div>
              )
            })()}
          </div>
        )}

        {/* Existing Locations List */}
        {locations.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">All Locations ({locations.length})</h3>
            {locations.map((location, index) => (
              <div
                key={location.id || index}
                className={`secondary_bg p-4 rounded-lg border ${
                  location.isPrimary ? 'border-primary_color border-2' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {location.isPrimary && (
                        <Star className="w-5 h-5 text-primary_color fill-primary_color" />
                      )}
                      <MapPin className="w-5 h-5 text-primary_color" />
                      <h4 className="font-semibold text-primary_color">
                        {location.isPrimary ? 'Primary Location' : `Location ${index + 1}`}
                      </h4>
                    </div>
                    {location.fullAddress && (
                      <p className="text-sm mb-1">
                        <span className="font-medium">Address:</span> {location.fullAddress}
                      </p>
                    )}
                    <p className="text-sm mb-1">
                      {[
                        location.town,
                        location.city,
                        location.state,
                        location.country
                      ].filter(Boolean).join(', ') || 'Location details not set'}
                    </p>
                    {location.coordinates?.latitude && location.coordinates?.longitude && (
                      <p className="text-xs text-gray-500 mt-1">
                        Coordinates: {location.coordinates.latitude}, {location.coordinates.longitude}
                      </p>
                    )}
                    {location.additionalInformation && (
                      <p className="text-sm mt-2 text-gray-600">
                        {location.additionalInformation}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!location.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(index)}
                        className="secondary_button p-2"
                        title="Set as primary"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEditLocation(index)}
                      className="secondary_button p-2"
                      title="Edit location"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLocation(index)}
                      className="tertiary_button p-2"
                      title="Delete location"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Location Button */}
        <button
          type="button"
          onClick={handleOpenModal}
          className="primary_button flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Location
        </button>
      </div>

      {/* Modal for Add/Edit Location */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pt-24" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)' }}>
          <div ref={modalRef} className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] overflow-y-auto border border-gray-200 z-[10000]">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingIndex !== null ? 'Edit Location' : 'Add New Location'}
              </h3>
              <button
                type="button"
                onClick={handleCancel}
                className="tertiary_button p-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <PropertyLocation
                formData={{ location: currentLocation }}
                updateFormData={(data) => {
                  if (data.location) {
                    handleLocationUpdate(data.location)
                  }
                }}
                isEditMode={isEditMode}
              />
              
              {/* Primary Location Checkbox */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={currentLocation.isPrimary || false}
                  onChange={(e) => setCurrentLocation({ ...currentLocation, isPrimary: e.target.checked })}
                  className="w-4 h-4 text-primary_color border-gray-300 rounded focus:ring-primary_color"
                />
                <label htmlFor="isPrimary" className="text-sm font-medium flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary_color" />
                  Set as primary location (will populate main development location fields)
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={editingIndex !== null ? handleUpdateLocation : handleAddLocation}
                  className="primary_button"
                >
                  {editingIndex !== null ? 'Update Location' : 'Add Location'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="secondary_button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DevelopmentLocations

