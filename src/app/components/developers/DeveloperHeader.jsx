import React from 'react'
import SearchBar from './SearchBar'
const DeveloperHeader = () => {
  return (
    <>
    <div className=' w-full flex justify-between items-end'>
      
        <div className='w-full md:w-2/3'>
            <h5>Welcome,</h5>
            <h1 className='text-[4em] '>Trasacco Valley </h1>
        </div>
        <SearchBar />


      
    </div>
    </>
  )
}

export default DeveloperHeader
