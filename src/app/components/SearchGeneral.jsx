'use client'
import Link from 'next/link'

import React from 'react'

const SearchGeneral = () => {
  return (
  <div className = "w-full">
  <label htmlFor="search" className='text-primary_color text-sm font-medium'>Search For Properties</label>
  
  <div className="flex items-center bg-[#f8f8f8] p-[1em] rounded-md w-full  mx-auto">
      {/* Dropdown */}
      <select 
        className="bg-white px-3 py-2 rounded-md text-[#19505b] font-medium mr-2 text-sm min-w-[110px] focus:outline-none"
        suppressHydrationWarning={true}
      >
        <option>Rent</option>
        <option>Buy</option>
        <option>Lease</option>
        <option>All Properties</option>
      </select>
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search the property you want"
        className="flex-1 px-3 py-2 rounded-md bg-white text-[#19505b] focus:outline-none mr-2 text-sm"
        suppressHydrationWarning={true}
      />
      {/* Search Button */}
    <Link href="/home/exploreProperties">
    <button 
        className="bg-orange-500 hover:bg-orange-600 p-3 rounded-md flex items-center justify-center"
        suppressHydrationWarning={true}
      >
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white"><circle cx="11" cy="11" r="7" strokeWidth="2"/><path strokeWidth="2" strokeLinecap="round" d="M20 20l-3.5-3.5"/></svg>
      </button>
    </Link>
    </div></div>
  )
}

export default SearchGeneral
