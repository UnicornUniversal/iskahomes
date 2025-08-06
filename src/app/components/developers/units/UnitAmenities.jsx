import React, { useState } from 'react'
import { FaSnowflake, FaBuilding, FaBath, FaUtensils, FaTshirt, FaMobileAlt, FaSeedling, FaFan, FaFire, FaDoorOpen, FaCar, FaDog, FaCouch, FaBoxOpen } from 'react-icons/fa'

const unitAmenitiesList = [
  { id: 'ac', name: 'Air Conditioning', icon: <FaSnowflake /> },
  { id: 'balcony', name: 'Balcony', icon: <FaBuilding /> },
  { id: 'ensuite', name: 'Ensuite Bathroom', icon: <FaBath /> },
  { id: 'kitchen-appliances', name: 'Kitchen Appliances', icon: <FaUtensils /> },
  { id: 'wardrobes', name: 'Built-in Wardrobes', icon: <FaTshirt /> },
  { id: 'smart-home', name: 'Smart Home System', icon: <FaMobileAlt /> },
  { id: 'private-garden', name: 'Private Garden', icon: <FaSeedling /> },
  { id: 'laundry', name: 'In-unit Laundry', icon: <FaTshirt /> },
  { id: 'ceiling-fan', name: 'Ceiling Fan', icon: <FaFan /> },
  { id: 'fireplace', name: 'Fireplace', icon: <FaFire /> },
  { id: 'walk-in-closet', name: 'Walk-in Closet', icon: <FaDoorOpen /> },
  { id: 'private-parking', name: 'Private Parking', icon: <FaCar /> },
  { id: 'pet-friendly', name: 'Pet Friendly', icon: <FaDog /> },
  { id: 'furnished', name: 'Furnished', icon: <FaCouch /> },
  { id: 'unfurnished', name: 'Unfurnished', icon: <FaBoxOpen /> },
]

const UnitAmenities = () => {
  const [selected, setSelected] = useState([])
  const [customAmenities, setCustomAmenities] = useState([])
  const [newCustom, setNewCustom] = useState('')

  const handleToggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleAddCustom = () => {
    if (newCustom.trim()) {
      setCustomAmenities(prev => [...prev, newCustom.trim()])
      setNewCustom('')
    }
  }

  const handleRemoveCustom = (idx) => {
    setCustomAmenities(prev => prev.filter((_, i) => i !== idx))
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddCustom()
    }
  }

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Unit Amenities</h3>
        <p className="text-gray-600">Select the amenities available in this unit.</p>
      </div>
      {/* Predefined Amenities */}
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Available Amenities</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unitAmenitiesList.map(amenity => (
            <label
              key={amenity.id}
              className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${selected.includes(amenity.id) ? 'border-primary_color bg-primary_color/5' : 'border-gray-200'}`}
            >
              <input
                type="checkbox"
                checked={selected.includes(amenity.id)}
                onChange={() => handleToggle(amenity.id)}
                className="mt-1 rounded border-gray-300 text-primary_color focus:ring-primary_color"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{amenity.icon}</span>
                  <span className="font-medium text-gray-900">{amenity.name}</span>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
      {/* Custom Amenities */}
      <div className="mt-8">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Additional Custom Amenities</h4>
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            placeholder="Add a custom amenity..."
            value={newCustom}
            onChange={e => setNewCustom(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleAddCustom}
            disabled={!newCustom.trim()}
            className="bg-gray-100 px-3 py-2 rounded-lg text-gray-700 border border-gray-300 hover:bg-gray-200"
          >
            Add
          </button>
        </div>
        {customAmenities.length > 0 && (
          <div className="space-y-2">
            {customAmenities.map((amenity, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-900">{amenity}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCustom(idx)}
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
      {/* Selected Amenities Summary */}
      {(selected.length > 0 || customAmenities.length > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
          <h4 className="text-lg font-semibold text-blue-900 mb-3">Selected Amenities Summary</h4>
          <div className="space-y-2">
            {unitAmenitiesList.filter(a => selected.includes(a.id)).map(a => (
              <div key={a.id} className="flex items-center space-x-2">
                <span className="text-lg">{a.icon}</span>
                <span className="text-blue-800">{a.name}</span>
              </div>
            ))}
            {customAmenities.map((amenity, idx) => (
              <div key={`custom-${idx}`} className="flex items-center space-x-2">
                <span className="text-lg">✨</span>
                <span className="text-blue-800">{amenity}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-blue-600 mt-3">
            Total: {selected.length + customAmenities.length} amenities selected
          </p>
        </div>
      )}
    </div>
  )
}

export default UnitAmenities
