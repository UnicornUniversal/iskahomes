import React from 'react'
import DeveloperNav from '@/app/components/developers/DeveloperNav'
import Appointments from '@/app/components/developers/Appointments'

const page = () => {
  return (
    <div className='w-full flex '>
        <DeveloperNav active={5} />

      
      <Appointments />
    </div>
  )
}

export default page
