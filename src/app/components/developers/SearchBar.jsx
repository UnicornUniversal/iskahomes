import React from 'react'
import { FiSearch } from 'react-icons/fi'   

const SearchBar = () => {
  return (
    <div className='flex items-center w-full max-w-[500px]  gap-2 bg-primary_color px-4 rounded-full p-2' >
      <input type="text" placeholder='Search Property'  className='w-full focus:outline-none text-white text-[0.7em] ' />
      <button className='bg-primary_color rounded-full p-2'><FiSearch /></button>
    </div>
  )
}

export default SearchBar
