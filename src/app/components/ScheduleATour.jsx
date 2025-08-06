"use client"
import React, { useState } from 'react'

const ScheduleATour = () => {
  const [mode, setMode] = useState('in-person');

  return (
    <div className='w-full h-auto max-h-[800px] bg-white rounded-xl shadow p-6 max-w-md mx-auto'>
      <h2 className='text-2xl font-bold text-primary_color mb-1'>Schedule a tour</h2>
      <p className='text-gray-500 mb-4'>Choose your preferred day</p>
      {/* Toggle */}
      <div className='flex gap-2 mb-4'>
        <button
          type='button'
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${mode === 'in-person' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}
          onClick={() => setMode('in-person')}
        >
          In Person
        </button>
        <button
          type='button'
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${mode === 'video' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}
          onClick={() => setMode('video')}
        >
          Video Chat
        </button>
      </div>
      <form className='flex flex-col gap-3'>
        <div>
          <label className='block text-primary_color text-sm font-semibold mb-1'>Date:</label>
          <input type='date' className='w-full p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary_color' />
        </div>
        <div>
          <label className='block text-primary_color text-sm font-semibold mb-1'>Time:</label>
          <input type='time' className='w-full p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary_color' />
        </div>
        <div>
          <label className='block text-primary_color text-sm font-semibold mb-1'>Name:</label>
          <input type='text' placeholder='Enter **************' className='w-full p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary_color' />
        </div>
        <div>
          <label className='block text-primary_color text-sm font-semibold mb-1'>Email:</label>
          <input type='email' placeholder='Email' className='w-full p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary_color' />
        </div>
        <div>
          <label className='block text-primary_color text-sm font-semibold mb-1'>Tel:</label>
          <input type='tel' placeholder='Phone' className='w-full p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary_color' />
        </div>
        <div>
          <label className='block text-primary_color text-sm font-semibold mb-1'>Message:</label>
          <textarea placeholder='Message' rows={3} className='w-full p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary_color resize-none' />
        </div>
        <button type='submit' className='w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-md transition-colors'>
          Book Meetings
        </button>
      </form>
    </div>
  )
}

export default ScheduleATour
