import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { cn } from '@/lib/utils'
// React Icons imports
import { FaDumbbell, FaCar, FaHome, FaGlassMartiniAlt, FaPaintBrush, FaBook, FaSwimmer, FaSpa, FaUtensils, FaCoffee, FaChild, FaSeedling, FaTableTennis, FaBasketballBall, FaLock, FaUserTie, FaWifi, FaTshirt, FaBoxOpen, FaDog, FaBicycle, FaCity, FaBriefcase, FaFilm, FaWineBottle, FaGolfBall, FaShip, FaHelicopter } from 'react-icons/fa'
import { FaElevator } from "react-icons/fa6";

const DevelopmentAmenities = ({ developmentData, isEditMode }) => {
  const [formData, setFormData] = useState({
    amenities: [],
    customAmenities: []
  })

  const [newCustomAmenity, setNewCustomAmenity] = useState('')

  // Populate form data when developmentData is available (edit mode)
  useEffect(() => {
    if (developmentData && isEditMode) {
      // Generate sample amenities based on development type for demo purposes
      let sampleAmenities = [];
      let sampleCustomAmenities = [];
      
      if (developmentData.developmentType === 'Residential') {
        sampleAmenities = ['gym', 'parking', 'security', 'elevator', 'wifi'];
        sampleCustomAmenities = ['Community Garden', 'Children\'s Play Area'];
      } else if (developmentData.developmentType === 'Commercial') {
        sampleAmenities = ['parking', 'security', 'elevator', 'wifi', 'business-center'];
        sampleCustomAmenities = ['Conference Rooms', 'Reception Services'];
      } else if (developmentData.developmentType === 'Mixed-Use') {
        sampleAmenities = ['gym', 'parking', 'security', 'elevator', 'wifi', 'restaurant', 'cafe'];
        sampleCustomAmenities = ['Shopping Center', 'Fitness Center'];
      }
      
      setFormData({
        amenities: sampleAmenities,
        customAmenities: sampleCustomAmenities
      });
    }
  }, [developmentData, isEditMode]);

  const predefinedAmenities = [
    { id: 'gym', name: 'Gym', icon: <FaDumbbell />, description: 'Fitness center with modern equipment' },
    { id: 'parking', name: 'Parking Space', icon: <FaCar />, description: 'Designated parking areas' },
    { id: 'garage', name: 'Garage', icon: <FaHome />, description: 'Private garage spaces' },
    { id: 'bar', name: 'Bar', icon: <FaGlassMartiniAlt />, description: 'On-site bar and lounge' },
    { id: 'art-studio', name: 'Art Studio', icon: <FaPaintBrush />, description: 'Creative workspace for artists' },
    { id: 'library', name: 'Library', icon: <FaBook />, description: 'Quiet reading and study area' },
    { id: 'pool', name: 'Swimming Pool', icon: <FaSwimmer />, description: 'Outdoor or indoor swimming pool' },
    { id: 'spa', name: 'Spa & Wellness', icon: <FaSpa />, description: 'Relaxation and wellness center' },
    { id: 'restaurant', name: 'Restaurant', icon: <FaUtensils />, description: 'Fine dining restaurant' },
    { id: 'cafe', name: 'Café', icon: <FaCoffee />, description: 'Casual coffee shop' },
    { id: 'playground', name: 'Playground', icon: <FaChild />, description: "Children's play area" },
    { id: 'garden', name: 'Garden', icon: <FaSeedling />, description: 'Landscaped gardens and green spaces' },
    { id: 'tennis', name: 'Tennis Court', icon: <FaTableTennis />, description: 'Tennis facilities' },
    { id: 'basketball', name: 'Basketball Court', icon: <FaBasketballBall />, description: 'Basketball court' },
    { id: 'security', name: '24/7 Security', icon: <FaLock />, description: 'Round-the-clock security service' },
    { id: 'concierge', name: 'Concierge', icon: <FaUserTie />, description: 'Concierge services' },
    { id: 'elevator', name: 'Elevator', icon: <FaElevator />, description: 'Modern elevator system' },
    { id: 'wifi', name: 'High-Speed WiFi', icon: <FaWifi />, description: 'High-speed internet access' },
    { id: 'laundry', name: 'Laundry Room', icon: <FaTshirt />, description: 'On-site laundry facilities' },
    { id: 'storage', name: 'Storage Units', icon: <FaBoxOpen />, description: 'Additional storage space' },
    { id: 'pet-friendly', name: 'Pet Friendly', icon: <FaDog />, description: 'Pet-friendly policies' },
    { id: 'bike-storage', name: 'Bike Storage', icon: <FaBicycle />, description: 'Secure bicycle storage' },
    { id: 'rooftop', name: 'Rooftop Terrace', icon: <FaCity />, description: 'Rooftop gathering space' },
    { id: 'business-center', name: 'Business Center', icon: <FaBriefcase />, description: 'Professional workspace' },
    { id: 'movie-room', name: 'Movie Room', icon: <FaFilm />, description: 'Private cinema room' },
    { id: 'wine-cellar', name: 'Wine Cellar', icon: <FaWineBottle />, description: 'Temperature-controlled wine storage' },
    { id: 'golf', name: 'Golf Course', icon: <FaGolfBall />, description: 'Golf course access' },
    { id: 'marina', name: 'Marina', icon: <FaShip />, description: 'Boat docking facilities' },
    { id: 'helipad', name: 'Helipad', icon: <FaHelicopter />, description: 'Private helicopter landing pad' }
  ]

  const handleAmenityToggle = (amenityId) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId]
    }))
  }

  const handleCustomAmenityAdd = () => {
    if (newCustomAmenity.trim()) {
      setFormData(prev => ({
        ...prev,
        customAmenities: [...prev.customAmenities, newCustomAmenity.trim()]
      }))
      setNewCustomAmenity('')
    }
  }

  const handleCustomAmenityRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      customAmenities: prev.customAmenities.filter((_, i) => i !== index)
    }))
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCustomAmenityAdd()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Development Amenities Data:', formData)
    // Handle form submission - differentiate between add and edit
    if (isEditMode) {
      console.log('Updating amenities for existing development...');
      // Add your update logic here
    } else {
      console.log('Saving amenities for new development...');
      // Add your create logic here
    }
  }

  const getSelectedAmenities = () => {
    return predefinedAmenities.filter(amenity => 
      formData.amenities.includes(amenity.id)
    )
  }

  return (
    <div className="w-full  p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Development Amenities</h2>
        <p className="text-gray-600">
          {isEditMode ? 'Update the amenities available in your development' : 'Select the amenities available in your development project'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Predefined Amenities */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Amenities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predefinedAmenities.map(amenity => (
              <label
                key={amenity.id}
                className={cn(
                  "flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50",
                  formData.amenities.includes(amenity.id)
                    ? "border-primary bg-primary/5"
                    : "border-gray-200"
                )}
              >
                <input
                  type="checkbox"
                  checked={formData.amenities.includes(amenity.id)}
                  onChange={() => handleAmenityToggle(amenity.id)}
                  className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{amenity.icon}</span>
                    <span className="font-medium text-gray-900">{amenity.name}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{amenity.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Custom Amenities */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Custom Amenities</h3>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Add a custom amenity..."
                value={newCustomAmenity}
                onChange={(e) => setNewCustomAmenity(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCustomAmenityAdd}
                disabled={!newCustomAmenity.trim()}
              >
                Add
              </Button>
            </div>

            {/* Custom Amenities List */}
            {formData.customAmenities.length > 0 && (
              <div className="space-y-2">
                {formData.customAmenities.map((amenity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-gray-900">{amenity}</span>
                    <button
                      type="button"
                      onClick={() => handleCustomAmenityRemove(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Amenities Summary */}
        {formData.amenities.length > 0 || formData.customAmenities.length > 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Selected Amenities Summary</h3>
            <div className="space-y-2">
              {getSelectedAmenities().map(amenity => (
                <div key={amenity.id} className="flex items-center space-x-2">
                  <span className="text-lg">{amenity.icon}</span>
                  <span className="text-blue-800">{amenity.name}</span>
                </div>
              ))}
              {formData.customAmenities.map((amenity, index) => (
                <div key={`custom-${index}`} className="flex items-center space-x-2">
                  <span className="text-lg">✨</span>
                  <span className="text-blue-800">{amenity}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-blue-600 mt-3">
              Total: {formData.amenities.length + formData.customAmenities.length} amenities selected
            </p>
          </div>
        ) : null}

        {/* Submit Button */}
        <div className="flex justify-end pt-6">
          <Button type="submit" className="px-8">
            {isEditMode ? 'Update Amenities' : 'Save & Continue'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default DevelopmentAmenities
