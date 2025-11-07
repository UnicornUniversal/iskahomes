import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import SearchBar from '../developers/SearchBar'
import { FiUser, FiBell, FiSettings } from 'react-icons/fi'

const HomeSeekerHeader = () => {
  const { user } = useAuth()
  
  return (
    <>
    <div className='w-full flex flex-col w-full items-start justify-between  bg-gradient-to-r from-blue-50 to-indigo-50 p-4 lg:p-6 rounded-2xl border border-blue-100'>
      
        <div className='w-full lg:w-auto mb-4 lg:mb-0'>
            <h5 className='text-blue-600 font-medium text-sm lg:text-base'>Welcome back,</h5>
            <h1 className='text-2xl lg:text-[3em] text-blue-900 font-bold'>
              {user?.profile?.name || user?.email || 'Property Seeker'}
            </h1>
            {/* <p className='text-blue-700 mt-2 text-sm lg:text-base'>Find your perfect home today</p> */}
        </div>
        
        <div className='w-full  flex flex-col sm:flex-row items-start sm:items-center gap-4'>
            <div className='w-full '>
                <SearchBar />
            </div>
            <div className='flex space-x-2'>
                <button className='p-2 lg:p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-blue-100'>
                    <FiBell className='w-4 h-4 lg:w-5 lg:h-5 text-blue-600' />
                </button>
                <button className='p-2 lg:p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-blue-100'>
                    <FiSettings className='w-4 h-4 lg:w-5 lg:h-5 text-blue-600' />
                </button>
                <div className='p-2 lg:p-3 bg-blue-600 rounded-xl shadow-sm'>
                    <FiUser className='w-4 h-4 lg:w-5 lg:h-5 text-white' />
                </div>
            </div>
        </div>

    </div>
    </>
  )
}

export default HomeSeekerHeader 