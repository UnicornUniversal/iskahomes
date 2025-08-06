import React from 'react'
import DeveloperNav from '@/app/components/developers/DeveloperNav'
import DevelopmentCard from '@/app/components/developers/DevelopmentCard'
import DeveloperHeader from '@/app/components/developers/DeveloperHeader'
import { developments } from '@/app/components/Data/Data'
import Link from 'next/link'

const page = () => {
  return (
    <div className='normal_div'>
      <DeveloperNav active={3} />
      <div className='w-full  flex flex-col gap-4 p-6'>
        {/* <DeveloperHeader /> */}
    <div className='flex justify-between items-center'>
      <h2 className="font-bold">Manage your Developments</h2>
      <Link href='/developer/46775/developments/addNewDevelopment'>
      <button className='bg-primary_color text-white px-4 py-2 rounded-md'>Add Development</button>
      </Link>
    </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6'>
          {developments.map((development) => (
            <DevelopmentCard key={development.id} development={development} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default page
