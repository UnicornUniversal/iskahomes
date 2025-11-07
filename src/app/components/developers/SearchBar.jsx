'use client'

import React, { useState } from 'react'
import { Search, X } from 'lucide-react'

const SearchBar = ({ onSearch, loading }) => {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    onSearch(searchTerm)
  }

  const handleClear = () => {
    setSearchTerm('')
    onSearch('')
  }

  return (
    <div className="w-full  gradient_bg ">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative flex items-center justify-around   rounded-lg  focus:border-transparent outline-none ">
          <Search className=" text-gray-400 w-5 h-5 ml-2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search units and developments"
            className="w-full pl-2 focus:outline-none focus:ring-0 focus:border-none  py-3 transition-all duration-200"
            disabled={loading}
            suppressHydrationWarning
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          suppressHydrationWarning
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
    </div>
  )
}

export default SearchBar