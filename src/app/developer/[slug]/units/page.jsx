import React from 'react'
import AllUnits from '@/app/components/developers/units/AllUnits'
import ListingNav from '@/app/components/Listing/ListingNav'
const page = () => {
  return (
    <div className='w-full h-full overflow-y-auto'>
      {/* <ListingNav /> */}
      <AllUnits />
    </div>
  )
}

export default page
