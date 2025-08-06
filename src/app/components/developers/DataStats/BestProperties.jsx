import React from 'react'

const BestProperties = () => {
  return (
    <div className='bg-white rounded-sm p-4 shadow-md'>
      <h3 className='text-[1.5em] font-bold'>Best Properties</h3>
      <p className='text-[0.8em] text-gray-500'>These are the best properties in the company</p>
      <div className='flex gap-4'>
        <div className='bg-gray-50 rounded-sm p-4 shadow-md'>
          <h4 className='text-[1.2em] font-bold'>Property 1</h4>
        </div>
      </div>
    </div>
  )
}

export default BestProperties
