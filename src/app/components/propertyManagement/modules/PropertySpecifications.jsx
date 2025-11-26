"use client"
import React, { useState, useEffect, memo } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { CustomSelect } from '../../ui/custom-select'
import { cn } from '@/lib/utils'
import { usePropertyTypes } from '@/hooks/useCachedData'

// Component for Houses and Apartments specifications
const HousesApartmentsSpecs = ({ specifications, updateFormData, purposeData }) => {
  const handleInputChange = (field, value) => {
    updateFormData({
      specifications: {
        ...specifications,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Apartments & Houses Specifications</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Bedrooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bedrooms *
          </label>
          <Input
            type="number"
            min="0"
            value={specifications?.bedrooms || ''}
            onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value) || 0)}
            placeholder="Number of bedrooms"
            required
          />
        </div>

        {/* Bathrooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bathrooms *
          </label>
          <Input
            type="number"
            min="0"
            step="0.5"
            value={specifications?.bathrooms || ''}
            onChange={(e) => handleInputChange('bathrooms', parseFloat(e.target.value) || 0)}
            placeholder="Number of bathrooms"
            required
          />
        </div>

        {/* Floor Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Floor Level
          </label>
          <Input
            type="number"
            min="0"
            value={specifications?.floor_level || ''}
            onChange={(e) => handleInputChange('floor_level', parseInt(e.target.value) || 0)}
            placeholder="Floor number"
          />
        </div>

        {/* Furnishing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Furnishing Status
          </label>
          <CustomSelect
            value={specifications?.furnishing || ''}
            onChange={(e) => handleInputChange('furnishing', e.target.value)}
            options={[
              { value: '', label: 'Select furnishing' },
              { value: 'furnished', label: 'Furnished' },
              { value: 'semi-furnished', label: 'Semi-Furnished' },
              { value: 'unfurnished', label: 'Unfurnished' }
            ]}
            placeholder="Select furnishing"
          />
        </div>

        {/* Property Age */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Age
          </label>
          <CustomSelect
            value={specifications?.property_age || ''}
            onChange={(e) => handleInputChange('property_age', e.target.value)}
            options={[
              { value: '', label: 'Select age' },
              { value: 'new', label: 'New Construction' },
              { value: '1-5', label: '1-5 Years' },
              { value: '6-10', label: '6-10 Years' },
              { value: '11-20', label: '11-20 Years' },
              { value: '20+', label: '20+ Years' }
            ]}
            placeholder="Select age"
          />
        </div>

        {/* Living Rooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Living Rooms *
          </label>
          <Input
            type="number"
            min="0"
            value={specifications?.living_rooms || ''}
            onChange={(e) => handleInputChange('living_rooms', parseInt(e.target.value) || 0)}
            placeholder="Number of living rooms"
            required
          />
        </div>

        {/* Kitchen Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kitchen Type *
          </label>
          <CustomSelect
            value={specifications?.kitchen_type || ''}
            onChange={(e) => handleInputChange('kitchen_type', e.target.value)}
            options={[
              { value: '', label: 'Select kitchen type' },
              { value: 'open_kitchen', label: 'Open Kitchen' },
              { value: 'closed_kitchen', label: 'Closed Kitchen' },
              { value: 'kitchenette', label: 'Kitchenette' },
              { value: 'no_kitchen', label: 'No Kitchen' }
            ]}
            placeholder="Select kitchen type"
            required
          />
        </div>

        {/* Property Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Condition *
          </label>
          <CustomSelect
            value={specifications?.property_condition || ''}
            onChange={(e) => handleInputChange('property_condition', e.target.value)}
            options={[
              { value: '', label: 'Select condition' },
              { value: 'excellent', label: 'Excellent' },
              { value: 'good', label: 'Good' },
              { value: 'fair', label: 'Fair' },
              { value: 'needs_renovation', label: 'Needs Renovation' }
            ]}
            placeholder="Select condition"
            required
          />
        </div>

        {/* Shared Electricity Meter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shared Electricity Meter *
          </label>
          <CustomSelect
            value={specifications?.shared_electricity_meter || ''}
            onChange={(e) => handleInputChange('shared_electricity_meter', e.target.value)}
            options={[
              { value: '', label: 'Select electricity meter' },
              { value: 'shared', label: 'Shared Meter' },
              { value: 'individual', label: 'Individual Meter' },
              { value: 'prepaid', label: 'Prepaid Meter' }
            ]}
            placeholder="Select electricity meter"
            required
          />
        </div>

        {/* Compound Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Compound Type *
          </label>
          <CustomSelect
            value={specifications?.compound_type || ''}
            onChange={(e) => handleInputChange('compound_type', e.target.value)}
            options={[
              { value: '', label: 'Select compound type' },
              { value: 'gated_community', label: 'Gated Community' },
              { value: 'open_compound', label: 'Open Compound' },
              { value: 'shared_compound', label: 'Shared Compound' },
              { value: 'private_compound', label: 'Private Compound' }
            ]}
            placeholder="Select compound type"
            required
          />
        </div>

        {/* Building Style */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Building Style *
          </label>
          <CustomSelect
            value={specifications?.building_style || ''}
            onChange={(e) => handleInputChange('building_style', e.target.value)}
            options={[
              { value: '', label: 'Select building style' },
              { value: 'modern', label: 'Modern' },
              { value: 'traditional', label: 'Traditional' },
              { value: 'colonial', label: 'Colonial' },
              { value: 'contemporary', label: 'Contemporary' },
              { value: 'mediterranean', label: 'Mediterranean' },
              { value: 'minimalist', label: 'Minimalist' },
              { value: 'villa', label: 'Villa Style' }
            ]}
            placeholder="Select building style"
            required
          />
        </div>

        {/* Number of Balconies */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Balconies
          </label>
          <Input
            type="number"
            min="0"
            value={specifications?.number_of_balconies || ''}
            onChange={(e) => handleInputChange('number_of_balconies', parseInt(e.target.value) || 0)}
            placeholder="Number of balconies"
          />
        </div>

        {/* Guest Room */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Guest Room
          </label>
          <CustomSelect
            value={specifications?.guest_room || ''}
            onChange={(e) => handleInputChange('guest_room', e.target.value)}
            options={[
              { value: '', label: 'Select guest room' },
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            placeholder="Select guest room"
          />
        </div>

        {/* Guest Washroom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Guest Washroom
          </label>
          <CustomSelect
            value={specifications?.guest_washroom || ''}
            onChange={(e) => handleInputChange('guest_washroom', e.target.value)}
            options={[
              { value: '', label: 'Select guest washroom' },
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            placeholder="Select guest washroom"
          />
        </div>
      </div>
    </div>
  );
};

// Component for Offices specifications
const OfficesSpecs = ({ specifications, updateFormData, purposeData }) => {
  const handleInputChange = (field, value) => {
    updateFormData({
      specifications: {
        ...specifications,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Office Specifications</h4>
      
      {/* General Information */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h5 className="text-md font-semibold text-gray-900 mb-4">General Information</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Floor Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Floor Number
            </label>
            <Input
              type="number"
              value={specifications?.floor_number || ''}
              onChange={(e) => handleInputChange('floor_number', parseInt(e.target.value) || '')}
              placeholder="Floor number"
            />
          </div>

          {/* Parking Space */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parking Space
            </label>
            <Input
              type="number"
              min="0"
              value={specifications?.parking_space || ''}
              onChange={(e) => handleInputChange('parking_space', parseInt(e.target.value) || '')}
              placeholder="Number of parking spaces"
            />
          </div>

          {/* Available Units */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Units *
            </label>
            <CustomSelect
              value={specifications?.available_units || ''}
              onChange={(e) => handleInputChange('available_units', e.target.value)}
              options={[
                { value: '', label: 'Select available units' },
                { value: 'full_floor', label: 'Full Floor' },
                { value: 'partial_units', label: 'Partial Units' },
                { value: 'coworking_space', label: 'Co-working Space' }
              ]}
              placeholder="Select available units"
              required
            />
          </div>

          {/* Furnishing Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Furnishing Status *
            </label>
            <CustomSelect
              value={specifications?.furnishing_status || ''}
              onChange={(e) => handleInputChange('furnishing_status', e.target.value)}
              options={[
                { value: '', label: 'Select furnishing status' },
                { value: 'fully_furnished', label: 'Fully Furnished' },
                { value: 'semi_furnished', label: 'Semi Furnished' },
                { value: 'unfurnished', label: 'Unfurnished' }
              ]}
              placeholder="Select furnishing status"
              required
            />
          </div>
        </div>
      </div>

      {/* Layout Section */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h5 className="text-md font-semibold text-gray-900 mb-4">Layout Features</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Reception Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reception Area
            </label>
            <CustomSelect
              value={specifications?.reception_area || ''}
              onChange={(e) => handleInputChange('reception_area', e.target.value)}
              options={[
                { value: '', label: 'Select reception area' },
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              placeholder="Select reception area"
            />
          </div>

          {/* Meeting Rooms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Rooms
            </label>
            <Input
              type="number"
              min="0"
              value={specifications?.meeting_rooms || ''}
              onChange={(e) => handleInputChange('meeting_rooms', parseInt(e.target.value) || '')}
              placeholder="Number of meeting rooms"
            />
          </div>

          {/* Conference Rooms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conference Rooms
            </label>
            <Input
              type="number"
              min="0"
              value={specifications?.conference_rooms || ''}
              onChange={(e) => handleInputChange('conference_rooms', parseInt(e.target.value) || '')}
              placeholder="Number of conference rooms"
            />
          </div>

          {/* Pantry/Cafeteria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pantry/Cafeteria
            </label>
            <CustomSelect
              value={specifications?.pantry_cafeteria || ''}
              onChange={(e) => handleInputChange('pantry_cafeteria', e.target.value)}
              options={[
                { value: '', label: 'Select pantry/cafeteria' },
                { value: 'pantry', label: 'Pantry' },
                { value: 'cafeteria', label: 'Cafeteria' },
                { value: 'both', label: 'Both' },
                { value: 'none', label: 'None' }
              ]}
              placeholder="Select pantry/cafeteria"
            />
          </div>

          {/* Washrooms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Washrooms
            </label>
            <Input
              type="number"
              min="0"
              value={specifications?.washrooms || ''}
              onChange={(e) => handleInputChange('washrooms', parseInt(e.target.value) || '')}
              placeholder="Number of washrooms"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Component for Warehouses specifications
const WarehousesSpecs = ({ specifications, updateFormData, purposeData }) => {
  const handleInputChange = (field, value) => {
    updateFormData({
      specifications: {
        ...specifications,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Warehouse Specifications</h4>
      
      {/* General Information */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h5 className="text-md font-semibold text-gray-900 mb-4">General Information</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Warehouse Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warehouse Type *
            </label>
            <CustomSelect
              value={specifications?.warehouse_type || ''}
              onChange={(e) => handleInputChange('warehouse_type', e.target.value)}
              options={[
                { value: '', label: 'Select warehouse type' },
                { value: 'dry_storage', label: 'Dry Storage' },
                { value: 'cold_storage', label: 'Cold Storage' },
                { value: 'bonded', label: 'Bonded Warehouse' },
                { value: 'distribution', label: 'Distribution Center' },
                { value: 'open_yard', label: 'Open Yard' }
              ]}
              placeholder="Select warehouse type"
              required
            />
          </div>
        </div>
      </div>

      {/* Construction Details */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h5 className="text-md font-semibold text-gray-900 mb-4">Construction Details</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Construction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Construction Type *
            </label>
            <CustomSelect
              value={specifications?.construction_type || ''}
              onChange={(e) => handleInputChange('construction_type', e.target.value)}
              options={[
                { value: '', label: 'Select construction type' },
                { value: 'rcc_peb', label: 'RCC + Pre-Engineered Building (PEB)' },
                { value: 'rcc_only', label: 'RCC Only' },
                { value: 'peb_only', label: 'PEB Only' },
                { value: 'steel_frame', label: 'Steel Frame' }
              ]}
              placeholder="Select construction type"
              required
            />
          </div>

          {/* Clear Height */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clear Height (ft) *
            </label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={specifications?.clear_height || ''}
              onChange={(e) => handleInputChange('clear_height', parseFloat(e.target.value) || '')}
              placeholder="Clear height in feet"
              required
            />
          </div>

          {/* Flooring Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Flooring Type *
            </label>
            <CustomSelect
              value={specifications?.flooring_type || ''}
              onChange={(e) => handleInputChange('flooring_type', e.target.value)}
              options={[
                { value: '', label: 'Select flooring type' },
                { value: 'tremix', label: 'Tremix' },
                { value: 'vdf_industrial', label: 'VDF Industrial Flooring' },
                { value: 'concrete', label: 'Concrete' },
                { value: 'epoxy', label: 'Epoxy Coated' }
              ]}
              placeholder="Select flooring type"
              required
            />
          </div>

          {/* Floor Load Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Floor Load Capacity (tons/sq m) *
            </label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={specifications?.floor_load_capacity || ''}
              onChange={(e) => handleInputChange('floor_load_capacity', parseFloat(e.target.value) || '')}
              placeholder="Floor load capacity"
              required
            />
          </div>

          {/* Column Grid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Column Grid (m x m)
            </label>
            <Input
              type="text"
              value={specifications?.column_grid || ''}
              onChange={(e) => handleInputChange('column_grid', e.target.value)}
              placeholder="e.g., 10 x 20"
            />
          </div>

          {/* Roofing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roofing *
            </label>
            <CustomSelect
              value={specifications?.roofing || ''}
              onChange={(e) => handleInputChange('roofing', e.target.value)}
              options={[
                { value: '', label: 'Select roofing' },
                { value: 'galvalume_insulated', label: 'Galvalume sheet with insulation' },
                { value: 'galvalume', label: 'Galvalume sheet' },
                { value: 'metal_sheet', label: 'Metal sheet' },
                { value: 'concrete', label: 'Concrete' }
              ]}
              placeholder="Select roofing"
              required
            />
          </div>
        </div>
      </div>

      {/* Ventilation & Lighting */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h5 className="text-md font-semibold text-gray-900 mb-4">Ventilation & Lighting</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Ventilation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ventilation *
            </label>
            <CustomSelect
              value={specifications?.ventilation || ''}
              onChange={(e) => handleInputChange('ventilation', e.target.value)}
              options={[
                { value: '', label: 'Select ventilation' },
                { value: 'turbo_ridge_exhaust', label: 'Turbo ventilators + Ridge Vents + Exhaust Fans' },
                { value: 'natural', label: 'Natural ventilation' },
                { value: 'mechanical', label: 'Mechanical ventilation' },
                { value: 'mixed', label: 'Mixed ventilation' }
              ]}
              placeholder="Select ventilation"
              required
            />
          </div>

          {/* Natural Lighting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Natural Lighting *
            </label>
            <CustomSelect
              value={specifications?.natural_lighting || ''}
              onChange={(e) => handleInputChange('natural_lighting', e.target.value)}
              options={[
                { value: '', label: 'Select natural lighting' },
                { value: 'polycarbonate', label: 'Polycarbonate sheets for daylight' },
                { value: 'skylights', label: 'Skylights' },
                { value: 'windows', label: 'Windows' },
                { value: 'minimal', label: 'Minimal natural lighting' }
              ]}
              placeholder="Select natural lighting"
              required
            />
          </div>
        </div>
      </div>

      {/* Loading & Access */}
      <div className="bg-purple-50 p-4 rounded-lg">
        <h5 className="text-md font-semibold text-gray-900 mb-4">Loading & Access</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Dock Doors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dock Doors *
            </label>
            <Input
              type="number"
              min="0"
              value={specifications?.dock_doors || ''}
              onChange={(e) => handleInputChange('dock_doors', parseInt(e.target.value) || '')}
              placeholder="Number of loading bays"
              required
            />
          </div>

          {/* Dock Levelers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dock Levelers
            </label>
            <CustomSelect
              value={specifications?.dock_levelers || ''}
              onChange={(e) => handleInputChange('dock_levelers', e.target.value)}
              options={[
                { value: '', label: 'Select dock levelers' },
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              placeholder="Select dock levelers"
            />
          </div>

          {/* Ramps */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ramps
            </label>
            <CustomSelect
              value={specifications?.ramps || ''}
              onChange={(e) => handleInputChange('ramps', e.target.value)}
              options={[
                { value: '', label: 'Select ramps' },
                { value: 'yes', label: 'Yes (for forklift/container access)' },
                { value: 'no', label: 'No' }
              ]}
              placeholder="Select ramps"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Component for Event Centers specifications
const EventCentersSpecs = ({ specifications, updateFormData, purposeData }) => {
  const handleInputChange = (field, value) => {
    updateFormData({
      specifications: {
        ...specifications,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Event Center Specifications</h4>
      
      {/* General Information */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h5 className="text-md font-semibold text-gray-900 mb-4">General Information</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Availability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Availability *
            </label>
            <CustomSelect
              value={specifications?.availability || ''}
              onChange={(e) => handleInputChange('availability', e.target.value)}
              options={[
                { value: '', label: 'Select availability' },
                { value: 'available', label: 'Available' },
                { value: 'booked', label: 'Booked' },
                { value: 'maintenance', label: 'Under Maintenance' }
              ]}
              placeholder="Select availability"
              required
            />
          </div>
        </div>
      </div>

      {/* Layout Section */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h5 className="text-md font-semibold text-gray-900 mb-4">Layout Features</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Main Hall Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Hall Capacity *
            </label>
            <Input
              type="number"
              min="0"
              value={specifications?.main_hall_capacity || ''}
              onChange={(e) => handleInputChange('main_hall_capacity', parseInt(e.target.value) || '')}
              placeholder="Main hall capacity"
              required
            />
          </div>

          {/* Number of Halls */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Halls *
            </label>
            <Input
              type="number"
              min="0"
              value={specifications?.number_of_halls || ''}
              onChange={(e) => handleInputChange('number_of_halls', parseInt(e.target.value) || '')}
              placeholder="Number of halls"
              required
            />
          </div>

          {/* Stage Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stage Area
            </label>
            <select
              value={specifications?.stage_area || ''}
              onChange={(e) => handleInputChange('stage_area', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select stage area</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {/* Pre Function Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pre Function Area
            </label>
            <select
              value={specifications?.pre_function_area || ''}
              onChange={(e) => handleInputChange('pre_function_area', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select pre function area</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {/* Lounge/Reception Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lounge/Reception Area
            </label>
            <select
              value={specifications?.lounge_reception_area || ''}
              onChange={(e) => handleInputChange('lounge_reception_area', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select lounge/reception area</option>
              <option value="lounge">Lounge</option>
              <option value="reception">Reception</option>
              <option value="both">Both</option>
              <option value="none">None</option>
            </select>
          </div>

          {/* Dining Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dining Area
            </label>
            <select
              value={specifications?.dining_area || ''}
              onChange={(e) => handleInputChange('dining_area', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select dining area</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {/* Kitchen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kitchen *
            </label>
            <select
              value={specifications?.kitchen || ''}
              onChange={(e) => handleInputChange('kitchen', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select kitchen</option>
              <option value="service_kitchen">Service Kitchen</option>
              <option value="fully_equipped">Fully Equipped</option>
              <option value="bare">Bare</option>
              <option value="none">None</option>
            </select>
          </div>

          {/* Washrooms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Washrooms
            </label>
            <Input
              type="number"
              min="0"
              value={specifications?.washrooms || ''}
              onChange={(e) => handleInputChange('washrooms', parseInt(e.target.value) || '')}
              placeholder="Number of washrooms"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Component for Land specifications
const LandSpecs = ({ specifications, updateFormData, purposeData }) => {
  const handleInputChange = (field, value) => {
    updateFormData({
      specifications: {
        ...specifications,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Land Specifications</h4>
      
      {/* Land Details */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h5 className="text-md font-semibold text-gray-900 mb-4">Land Details</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Plot Dimensions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plot Dimensions
            </label>
            <Input
              type="text"
              value={specifications?.plot_dimensions || ''}
              onChange={(e) => handleInputChange('plot_dimensions', e.target.value)}
              placeholder="e.g., 100 ft x 100 ft"
            />
          </div>

          {/* Plot Shape */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plot Shape *
            </label>
            <select
              value={specifications?.plot_shape || ''}
              onChange={(e) => handleInputChange('plot_shape', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select plot shape</option>
              <option value="square">Square</option>
              <option value="rectangular">Rectangular</option>
              <option value="irregular">Irregular</option>
            </select>
          </div>

          {/* Topography */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topography *
            </label>
            <select
              value={specifications?.topography || ''}
              onChange={(e) => handleInputChange('topography', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select topography</option>
              <option value="flat">Flat</option>
              <option value="sloped">Sloped</option>
              <option value="undulating">Undulating</option>
              <option value="steep">Steep</option>
            </select>
          </div>

          {/* Soil Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Soil Type *
            </label>
            <select
              value={specifications?.soil_type || ''}
              onChange={(e) => handleInputChange('soil_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select soil type</option>
              <option value="clay">Clay</option>
              <option value="loam">Loam</option>
              <option value="laterite">Laterite</option>
              <option value="sandy">Sandy</option>
              <option value="rocky">Rocky</option>
            </select>
          </div>

          {/* Drainage Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Drainage Condition *
            </label>
            <select
              value={specifications?.drainage_condition || ''}
              onChange={(e) => handleInputChange('drainage_condition', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select drainage condition</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>

          {/* Flood Risk */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Flood Risk *
            </label>
            <select
              value={specifications?.flood_risk || ''}
              onChange={(e) => handleInputChange('flood_risk', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select flood risk</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Elevation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Elevation (meters above sea level)
            </label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={specifications?.elevation || ''}
              onChange={(e) => handleInputChange('elevation', parseFloat(e.target.value) || '')}
              placeholder="Height above sea level"
            />
          </div>
        </div>
      </div>

    </div>
  );
};

const PropertySpecifications = ({ selectedTypeIds, specifications, updateFormData, isEditMode, purposeData }) => {
  const [selectedPropertyType, setSelectedPropertyType] = useState(null);
  
  // Get all types data from the hook
  const { data: allTypes = [], loading: typesLoading } = usePropertyTypes();

  console.log('🔍 PropertySpecifications - selectedTypeIds received:', selectedTypeIds);
  console.log('🔍 PropertySpecifications - allTypes data:', allTypes);
  console.log('🔍 PropertySpecifications - selectedPropertyType:', selectedPropertyType);

  // Get the selected property type from selectedTypeIds prop
  // This effect handles both initial load (when editing) and user selection changes
  useEffect(() => {
    console.log('🔍 useEffect triggered:', { selectedTypeIds, allTypesLength: allTypes.length });
    
    // Wait for types to load before processing
    if (typesLoading || allTypes.length === 0) {
      console.log('🔍 Waiting for types to load...');
      return;
    }
    
    if (selectedTypeIds && selectedTypeIds.length > 0) {
      // Find the actual type object from allTypes using the selected ID
      const selectedTypeId = selectedTypeIds[0]; // Get the first selected type ID
      console.log('🔍 Looking for type with ID:', selectedTypeId);
      
      const selectedType = allTypes.find(type => type.id === selectedTypeId);
      console.log('🔍 Found selected type:', selectedType);
      
      if (selectedType) {
        setSelectedPropertyType(selectedType);
      } else {
        console.log('🔍 No matching type found, clearing selection');
        setSelectedPropertyType(null);
      }
    } else {
      console.log('🔍 No selectedTypeIds, clearing selection');
      // If no type is selected, clear the selection
      setSelectedPropertyType(null);
    }
  }, [selectedTypeIds, allTypes, typesLoading]);


  const renderSpecificationComponent = () => {
    if (!selectedPropertyType) {
      return (
        <div className="text-center py-12 text-gray-500">
          <div className="text-lg mb-2">🏗️</div>
          <p>Please select a property type first to see specifications</p>
        </div>
      );
    }

    // Use both ID and name for matching to be more flexible
    const propertyTypeId = selectedPropertyType.id;
    const propertyTypeName = selectedPropertyType.name?.toLowerCase().trim();

    console.log('🔍 Rendering specs for:', { propertyTypeId, propertyTypeName });

    // Render specifications based on property type ID or name
    switch (propertyTypeId) {
      case 'a389610d-1d0a-440b-a3c4-91f392ebd27c': // Land
        return <LandSpecs specifications={specifications} updateFormData={updateFormData} purposeData={purposeData} />;
      
      case '16f02534-40e4-445f-94f2-2a01531b8503': // Apartments and Houses
        return <HousesApartmentsSpecs specifications={specifications} updateFormData={updateFormData} purposeData={purposeData} />;
      
      case 'fc7d2abc-e19e-40bc-942b-5c1b1561565c': // Offices
        return <OfficesSpecs specifications={specifications} updateFormData={updateFormData} purposeData={purposeData} />;
      
      case '0f2df1a6-86ad-4690-82f6-e9358b973fd7': // Warehouses
        return <WarehousesSpecs specifications={specifications} updateFormData={updateFormData} purposeData={purposeData} />;
      
      case '40ae5053-1143-4c74-8f29-8a3e467e9b43': // Event Centers
        return <EventCentersSpecs specifications={specifications} updateFormData={updateFormData} purposeData={purposeData} />;
      
      default:
        // Fallback: try to match by name if ID doesn't match
        if (propertyTypeName?.includes('land')) {
          return <LandSpecs specifications={specifications} updateFormData={updateFormData} purposeData={purposeData} />;
        } else if (propertyTypeName?.includes('apartment') || propertyTypeName?.includes('house')) {
          return <HousesApartmentsSpecs specifications={specifications} updateFormData={updateFormData} purposeData={purposeData} />;
        } else if (propertyTypeName?.includes('office')) {
          return <OfficesSpecs specifications={specifications} updateFormData={updateFormData} purposeData={purposeData} />;
        } else if (propertyTypeName?.includes('warehouse')) {
          return <WarehousesSpecs specifications={specifications} updateFormData={updateFormData} purposeData={purposeData} />;
        } else if (propertyTypeName?.includes('event')) {
          return <EventCentersSpecs specifications={specifications} updateFormData={updateFormData} purposeData={purposeData} />;
        }
        
        return (
          <div className="text-center py-12 text-gray-500">
            <div className="text-lg mb-2">❓</div>
            <p>Specifications for "{selectedPropertyType.name}" are not yet available</p>
            <p className="text-sm mt-2">Property Type ID: {propertyTypeId}</p>
            <p className="text-sm mt-1">Property Type Name: {propertyTypeName}</p>
          </div>
        );
    }
  };

  return (
    <div className="">
      <div className="mb-6">
        {/* <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Specifications</h2>
        <p className="text-gray-600">
          {isEditMode ? 'Update the property specifications' : 'Specify detailed characteristics of your property based on its type'}
        </p> */}
        {selectedPropertyType && (
          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Selected Property Type:</span> {selectedPropertyType.name}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {renderSpecificationComponent()}
      </div>
    </div>
  );
};

// Custom comparison function for React.memo
const arePropsEqual = (prevProps, nextProps) => {
  // Only re-render if selectedTypeIds, specifications, or purposeData change
  return (
    JSON.stringify(prevProps.selectedTypeIds) === JSON.stringify(nextProps.selectedTypeIds) &&
    JSON.stringify(prevProps.specifications) === JSON.stringify(nextProps.specifications) &&
    JSON.stringify(prevProps.purposeData) === JSON.stringify(nextProps.purposeData) &&
    prevProps.isEditMode === nextProps.isEditMode
  );
};

export default memo(PropertySpecifications, arePropsEqual);