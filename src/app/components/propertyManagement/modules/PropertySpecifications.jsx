"use client"
import React, { useState, useEffect, memo } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { cn } from '@/lib/utils'

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

        {/* Living Rooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Living Rooms
          </label>
          <Input
            type="number"
            min="0"
            value={specifications?.living_rooms || ''}
            onChange={(e) => handleInputChange('living_rooms', parseInt(e.target.value) || 0)}
            placeholder="Number of living rooms"
          />
        </div>

        {/* Kitchen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kitchen
          </label>
          <Input
            type="number"
            min="0"
            value={specifications?.kitchen || ''}
            onChange={(e) => handleInputChange('kitchen', parseInt(e.target.value) || 0)}
            placeholder="Number of kitchens"
          />
        </div>

        {/* Toilets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Toilets *
          </label>
          <Input
            type="number"
            min="0"
            value={specifications?.toilets || ''}
            onChange={(e) => handleInputChange('toilets', parseInt(e.target.value) || 0)}
            placeholder="Number of toilets"
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
          <select
            value={specifications?.furnishing || ''}
            onChange={(e) => handleInputChange('furnishing', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select furnishing</option>
            <option value="furnished">Furnished</option>
            <option value="semi-furnished">Semi-Furnished</option>
            <option value="unfurnished">Unfurnished</option>
          </select>
        </div>

        {/* Property Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Size (sq ft) *
          </label>
          <Input
            type="number"
            min="0"
            value={specifications?.property_size || ''}
            onChange={(e) => handleInputChange('property_size', parseFloat(e.target.value) || 0)}
            placeholder="Total property size"
            required
          />
        </div>

        {/* Property Age */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Age
          </label>
          <select
            value={specifications?.property_age || ''}
            onChange={(e) => handleInputChange('property_age', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select property age</option>
            <option value="new">New Construction (0-2 years)</option>
            <option value="recent">Recent (2-5 years)</option>
            <option value="established">Established (5-15 years)</option>
            <option value="mature">Mature (15+ years)</option>
          </select>
        </div>

        {/* Property Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Condition
          </label>
          <select
            value={specifications?.condition || ''}
            onChange={(e) => handleInputChange('condition', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select condition</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="needs-renovation">Needs Renovation</option>
          </select>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Office Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Office Type *
          </label>
          <select
            value={specifications?.office_type || ''}
            onChange={(e) => handleInputChange('office_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select office type</option>
            <option value="private">Private Office</option>
            <option value="shared">Shared Office</option>
            <option value="co-working">Co-working Space</option>
            <option value="executive">Executive Suite</option>
            <option value="virtual">Virtual Office</option>
          </select>
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Capacity (People) *
          </label>
          <Input
            type="number"
            min="1"
            value={specifications?.capacity || ''}
            onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
            placeholder="Maximum capacity"
            required
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
            onChange={(e) => handleInputChange('meeting_rooms', parseInt(e.target.value) || 0)}
            placeholder="Number of meeting rooms"
          />
        </div>

        {/* Reception Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reception Area
          </label>
          <select
            value={specifications?.reception_area || ''}
            onChange={(e) => handleInputChange('reception_area', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select reception</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        {/* Parking Spaces */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Parking Spaces
          </label>
          <Input
            type="number"
            min="0"
            value={specifications?.parking_spaces || ''}
            onChange={(e) => handleInputChange('parking_spaces', parseInt(e.target.value) || 0)}
            placeholder="Number of parking spaces"
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

        {/* Air Conditioning */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Air Conditioning
          </label>
          <select
            value={specifications?.air_conditioning || ''}
            onChange={(e) => handleInputChange('air_conditioning', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select AC</option>
            <option value="central">Central AC</option>
            <option value="individual">Individual Units</option>
            <option value="none">No AC</option>
          </select>
        </div>

        {/* Internet */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Internet Connection
          </label>
          <select
            value={specifications?.internet || ''}
            onChange={(e) => handleInputChange('internet', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select internet</option>
            <option value="fiber">Fiber Optic</option>
            <option value="broadband">Broadband</option>
            <option value="wifi">WiFi</option>
            <option value="none">No Internet</option>
          </select>
        </div>

        {/* Security */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Security Features
          </label>
          <select
            value={specifications?.security || ''}
            onChange={(e) => handleInputChange('security', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select security</option>
            <option value="24-7">24/7 Security</option>
            <option value="business-hours">Business Hours Only</option>
            <option value="cctv">CCTV Only</option>
            <option value="none">No Security</option>
          </select>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Warehouse Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Warehouse Type *
          </label>
          <select
            value={specifications?.warehouse_type || ''}
            onChange={(e) => handleInputChange('warehouse_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select warehouse type</option>
            <option value="dry-storage">Dry Storage</option>
            <option value="cold-storage">Cold Storage</option>
            <option value="bonded">Bonded Warehouse</option>
            <option value="distribution">Distribution Center</option>
            <option value="open-yard">Open Yard</option>
          </select>
        </div>

        {/* Ceiling Height */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ceiling Height (ft) *
          </label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={specifications?.ceiling_height || ''}
            onChange={(e) => handleInputChange('ceiling_height', parseFloat(e.target.value) || 0)}
            placeholder="Ceiling height in feet"
            required
          />
        </div>

        {/* Loading Docks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loading Docks
          </label>
          <Input
            type="number"
            min="0"
            value={specifications?.loading_docks || ''}
            onChange={(e) => handleInputChange('loading_docks', parseInt(e.target.value) || 0)}
            placeholder="Number of loading docks"
          />
        </div>

        {/* Floor Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Floor Type
          </label>
          <select
            value={specifications?.floor_type || ''}
            onChange={(e) => handleInputChange('floor_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select floor type</option>
            <option value="concrete">Concrete</option>
            <option value="epoxy">Epoxy Coated</option>
            <option value="steel">Steel</option>
            <option value="dirt">Dirt Floor</option>
          </select>
        </div>

        {/* Temperature Control */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Temperature Control
          </label>
          <select
            value={specifications?.temperature_control || ''}
            onChange={(e) => handleInputChange('temperature_control', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select temperature control</option>
            <option value="climate-controlled">Climate Controlled</option>
            <option value="refrigerated">Refrigerated</option>
            <option value="frozen">Frozen Storage</option>
            <option value="ambient">Ambient Temperature</option>
          </select>
        </div>

        {/* Security */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Security Features
          </label>
          <select
            value={specifications?.security || ''}
            onChange={(e) => handleInputChange('security', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select security</option>
            <option value="24-7">24/7 Security</option>
            <option value="cctv">CCTV Surveillance</option>
            <option value="alarm">Alarm System</option>
            <option value="basic">Basic Security</option>
          </select>
        </div>

        {/* Access */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Access Type
          </label>
          <select
            value={specifications?.access_type || ''}
            onChange={(e) => handleInputChange('access_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select access</option>
            <option value="ground-level">Ground Level</option>
            <option value="dock-level">Dock Level</option>
            <option value="grade-level">Grade Level</option>
            <option value="ramp">Ramp Access</option>
          </select>
        </div>

        {/* Power Supply */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Power Supply
          </label>
          <select
            value={specifications?.power_supply || ''}
            onChange={(e) => handleInputChange('power_supply', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select power supply</option>
            <option value="three-phase">Three Phase</option>
            <option value="single-phase">Single Phase</option>
            <option value="generator">Generator Backup</option>
            <option value="solar">Solar Power</option>
          </select>
        </div>

        {/* Office Space */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Office Space Available
          </label>
          <select
            value={specifications?.office_space || ''}
            onChange={(e) => handleInputChange('office_space', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select office space</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Event Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Type *
          </label>
          <select
            value={specifications?.event_type || ''}
            onChange={(e) => handleInputChange('event_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select event type</option>
            <option value="wedding">Wedding Hall</option>
            <option value="conference">Conference Center</option>
            <option value="concert">Concert Venue</option>
            <option value="party">Party Hall</option>
            <option value="exhibition">Exhibition Space</option>
          </select>
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Capacity (People) *
          </label>
          <Input
            type="number"
            min="1"
            value={specifications?.capacity || ''}
            onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
            placeholder="Maximum capacity"
            required
          />
        </div>

        {/* Stage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stage Available
          </label>
          <select
            value={specifications?.stage || ''}
            onChange={(e) => handleInputChange('stage', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select stage</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        {/* Sound System */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sound System
          </label>
          <select
            value={specifications?.sound_system || ''}
            onChange={(e) => handleInputChange('sound_system', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select sound system</option>
            <option value="professional">Professional</option>
            <option value="basic">Basic</option>
            <option value="none">No Sound System</option>
          </select>
        </div>

        {/* Lighting */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lighting System
          </label>
          <select
            value={specifications?.lighting || ''}
            onChange={(e) => handleInputChange('lighting', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select lighting</option>
            <option value="professional">Professional</option>
            <option value="basic">Basic</option>
            <option value="natural">Natural Light Only</option>
          </select>
        </div>

        {/* Catering */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catering Available
          </label>
          <select
            value={specifications?.catering || ''}
            onChange={(e) => handleInputChange('catering', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select catering</option>
            <option value="in-house">In-house Catering</option>
            <option value="external">External Catering Allowed</option>
            <option value="none">No Catering</option>
          </select>
        </div>

        {/* Parking */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Parking Spaces
          </label>
          <Input
            type="number"
            min="0"
            value={specifications?.parking_spaces || ''}
            onChange={(e) => handleInputChange('parking_spaces', parseInt(e.target.value) || 0)}
            placeholder="Number of parking spaces"
          />
        </div>

        {/* Air Conditioning */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Air Conditioning
          </label>
          <select
            value={specifications?.air_conditioning || ''}
            onChange={(e) => handleInputChange('air_conditioning', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select AC</option>
            <option value="central">Central AC</option>
            <option value="individual">Individual Units</option>
            <option value="none">No AC</option>
          </select>
        </div>

        {/* Accessibility */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Accessibility Features
          </label>
          <select
            value={specifications?.accessibility || ''}
            onChange={(e) => handleInputChange('accessibility', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select accessibility</option>
            <option value="wheelchair-accessible">Wheelchair Accessible</option>
            <option value="partial">Partially Accessible</option>
            <option value="none">Not Accessible</option>
          </select>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Land Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Land Type *
          </label>
          <select
            value={specifications?.land_type || ''}
            onChange={(e) => handleInputChange('land_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select land type</option>
            <option value="residential">Residential Plot</option>
            <option value="commercial">Commercial Plot</option>
            <option value="agricultural">Agricultural Land</option>
            <option value="industrial">Industrial Land</option>
            <option value="mixed-use">Mixed Use</option>
          </select>
        </div>

        {/* Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Area (sq ft) *
          </label>
          <Input
            type="number"
            min="0"
            value={specifications?.area || ''}
            onChange={(e) => handleInputChange('area', parseFloat(e.target.value) || 0)}
            placeholder="Land area in square feet"
            required
          />
        </div>

        {/* Topography */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Topography
          </label>
          <select
            value={specifications?.topography || ''}
            onChange={(e) => handleInputChange('topography', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select topography</option>
            <option value="flat">Flat</option>
            <option value="hilly">Hilly</option>
            <option value="sloping">Sloping</option>
            <option value="waterlogged">Waterlogged</option>
          </select>
        </div>

        {/* Soil Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Soil Type
          </label>
          <select
            value={specifications?.soil_type || ''}
            onChange={(e) => handleInputChange('soil_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select soil type</option>
            <option value="clay">Clay</option>
            <option value="sandy">Sandy</option>
            <option value="loamy">Loamy</option>
            <option value="rocky">Rocky</option>
          </select>
        </div>

        {/* Road Access */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Road Access
          </label>
          <select
            value={specifications?.road_access || ''}
            onChange={(e) => handleInputChange('road_access', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select road access</option>
            <option value="tarred">Tarred Road</option>
            <option value="gravel">Gravel Road</option>
            <option value="dirt">Dirt Road</option>
            <option value="none">No Road Access</option>
          </select>
        </div>

        {/* Utilities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Utilities Available
          </label>
          <select
            value={specifications?.utilities || ''}
            onChange={(e) => handleInputChange('utilities', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select utilities</option>
            <option value="all">All Utilities</option>
            <option value="electricity-water">Electricity & Water</option>
            <option value="electricity">Electricity Only</option>
            <option value="water">Water Only</option>
            <option value="none">No Utilities</option>
          </select>
        </div>

        {/* Zoning */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zoning
          </label>
          <select
            value={specifications?.zoning || ''}
            onChange={(e) => handleInputChange('zoning', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select zoning</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
            <option value="agricultural">Agricultural</option>
            <option value="mixed">Mixed Use</option>
          </select>
        </div>

        {/* Survey */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Survey Available
          </label>
          <select
            value={specifications?.survey || ''}
            onChange={(e) => handleInputChange('survey', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select survey</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        {/* Title Deed */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title Deed Available
          </label>
          <select
            value={specifications?.title_deed || ''}
            onChange={(e) => handleInputChange('title_deed', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select title deed</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const PropertySpecifications = ({ types, specifications, updateFormData, isEditMode, purposeData }) => {
  const [selectedPropertyType, setSelectedPropertyType] = useState(null);

  console.log('🔍 PropertySpecifications props:', { types, specifications, isEditMode });

  // Get the selected property type from types prop
  useEffect(() => {
    console.log('🔍 PropertySpecifications useEffect - types changed:', types);
    if (types && types.length > 0) {
      // Fetch the property type details to get the name
      fetchPropertyTypeDetails(types[0]);
    } else {
      setSelectedPropertyType(null);
    }
  }, [types]);

  const fetchPropertyTypeDetails = async (typeId) => {
    try {
      const response = await fetch(`/api/admin/property-types/${typeId}`);
      if (response.ok) {
        const result = await response.json();
        setSelectedPropertyType(result.data);
      } else {
        setSelectedPropertyType(null);
      }
    } catch (error) {
      setSelectedPropertyType(null);
    }
  };

  const renderSpecificationComponent = () => {
    if (!selectedPropertyType) {
      return (
        <div className="text-center py-12 text-gray-500">
          <div className="text-lg mb-2">🏗️</div>
          <p>Please select a property type first to see specifications</p>
        </div>
      );
    }

    // Use exact property type IDs for reliable matching
    const propertyTypeId = selectedPropertyType.id;

    // Render specifications based on both property type and purpose
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
        return (
          <div className="text-center py-12 text-gray-500">
            <div className="text-lg mb-2">❓</div>
            <p>Specifications for "{selectedPropertyType.name}" are not yet available</p>
            <p className="text-sm mt-2">Property Type ID: {propertyTypeId}</p>
          </div>
        );
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Specifications</h2>
        <p className="text-gray-600">
          {isEditMode ? 'Update the property specifications' : 'Specify detailed characteristics of your property based on its type'}
        </p>
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
  // Only re-render if types, specifications, or purposeData change
  return (
    JSON.stringify(prevProps.types) === JSON.stringify(nextProps.types) &&
    JSON.stringify(prevProps.specifications) === JSON.stringify(nextProps.specifications) &&
    JSON.stringify(prevProps.purposeData) === JSON.stringify(nextProps.purposeData) &&
    prevProps.isEditMode === nextProps.isEditMode
  );
};

export default memo(PropertySpecifications, arePropsEqual);
