import React, { useState } from 'react';

const Filter = ({ filters, setFilters,  totalProperties }) => {
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      purpose: '',
      sector: '',
      category: '',
      location: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className=" bg-none backdrop-blur-xs p-4 rounded-md shadow-sm  inline-block">
      <div className=" ">
        <label className='text-primary_color  text-sm font-medium mb-2 block'>Filter Properties</label>
        {/* <span className="text-sm w-full  text-gray-600 mt-2 inline-block text-center">
         { totalProperties} properties
        </span> */}
        <div className="flex items-center flex-wrap   bg-[#f8f8f8] p-[1em] rounded-md gap-2">
          {/* Purpose Dropdown */}
          <select 
            value={filters.purpose}
            onChange={(e) => handleFilterChange('purpose', e.target.value)}
            className="bg-white px-3 py-2 rounded-md text-[#19505b] font-medium text-xs md:text-sm  min-w-[120px] focus:outline-none border border-gray-200"
          >
            <option value="">All Purposes</option>
            <option value="Buy">Buy</option>
            <option value="Rent">Rent</option>
            <option value="Lease">Lease</option>
          </select>

          {/* Sector Dropdown */}
          <select 
            value={filters.sector}
            onChange={(e) => handleFilterChange('sector', e.target.value)}
            className="bg-white px-3 py-2 rounded-md text-[#19505b] font-medium text-xs md:text-sm min-w-[120px] focus:outline-none border border-gray-200"
          >
            <option value="">All Sectors</option>
            <option value="Apartment">Apartment</option>
            <option value="House">House</option>
            <option value="Offices">Offices</option>
            <option value="Land">Land</option>
          </select>

          {/* Category Dropdown */}
          <select 
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="bg-white px-3 py-2 rounded-md text-[#19505b] font-medium text-xs md:text-sm  min-w-[120px] focus:outline-none border border-gray-200"
          >
            <option value="">All Categories</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
          </select>

          {/* Location Dropdown */}
          <select 
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="bg-white px-3 py-2 rounded-md text-[#19505b] font-medium text-xs md:text-sm  min-w-[120px] focus:outline-none border border-gray-200"
          >
            <option value="">All Locations</option>
            <option value="Accra">Accra</option>
            <option value="Kumasi">Kumasi</option>
            <option value="Takoradi">Takoradi</option>
            <option value="Cape Coast">Cape Coast</option>
            <option value="Ho">Ho</option>
            <option value="Koforidua">Koforidua</option>
            <option value="Tamale">Tamale</option>
            <option value="Sekondi">Sekondi</option>
            <option value="Tema">Tema</option>
            <option value="Sogakope">Sogakope</option>
            <option value="Elmina">Elmina</option>
            <option value="Aburi">Aburi</option>
            <option value="East Legon">East Legon</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-md text-white text-sm font-medium transition-colors"
            >
              Clear All
            </button>
          )}

          <button className='bg-secondary_color text-white px-4 py-2 rounded-md text-xs md:text-sm  font-medium transition-colors'>
            Explore All
          </button>
        </div>
        
        <span className="text-sm   text-gray-600 mt-2 inline-block text-center">
        Total:  { totalProperties} properties
        </span>
      
      </div>
    </div>
  );
};

export default Filter;
