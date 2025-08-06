import React from 'react'
import SearchBar from '../developers/SearchBar'

const HomeOwnerHeader = () => {
  return (
    <>
    <div className='w-full flex-col lg:flex-row flex justify-between  items-center '>
      
        <div className='w-full md:w-2/3'>
            <h5>Welcome,</h5>
            <h1 className='text-[4em]'>John Smith</h1>
        </div>
        <SearchBar />

    </div>
    </>
  )
}

export default HomeOwnerHeader 