import React from 'react'
import AllUnits from '@/app/components/developers/units/AllUnits'
import DeveloperNav from '@/app/components/developers/DeveloperNav'
const page = () => {
  return (
    <div className='normal_div'>
      <DeveloperNav active={4} />
      <AllUnits />
    </div>
  )
}

export default page
