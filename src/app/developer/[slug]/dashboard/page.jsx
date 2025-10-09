'use client'
import React from 'react'
import DeveloperNav from '@/app/components/developers/DeveloperNav'
import DeveloperHeader from '@/app/components/developers/DeveloperHeader'
import DataCard from '@/app/components/developers/DataCard'
import StatisticsView from '@/app/components/developers/DataStats/StatisticsView'
import PropertiesByCategories from '@/app/components/developers/DataStats/PropertiesByCategories'
import BestProperties from '@/app/components/developers/DataStats/BestProperties'
import PropertiesByType from '@/app/components/developers/DataStats/PropertiesByType'
import PropertiesByStatus from '@/app/components/developers/DataStats/PropertiesByStatus'
import LatestAppointments from '@/app/components/developers/LatestAppointments'
import PropertiesBySubType from '@/app/components/developers/DataStats/PropertiesBySubType'
const page = () => {
  return (
    <div className='flex  w-full gap-[3em]'>
      <DeveloperNav  active={1}/>
      <div className='w-full flex flex-col gap-4'>
        <DeveloperHeader />

        <div className='flex gap-4'>
      <DataCard title='Total Units' value='100' link='/developer/properties' linkText='View All' />
      <DataCard title='Total Developments' value='100' link='/developer/properties' linkText='View All' />
     <DataCard title='Total Leads' value='100' link='/developer/properties' linkText='View All' />
      <DataCard title='Closed Deals' value='100' link='/developer/properties' linkText='View All' />
       </div>
  
        <div className='w-full flex flex-col gap-4'>
    
          <StatisticsView />

          
         


          <div className='w-full flex  gap-4'>
            <PropertiesByCategories />
            <PropertiesBySubType />
            {/* <PropertiesByStatus /> */}
           
            <PropertiesByType />
          </div>
          <BestProperties />

          <LatestAppointments />
        
        </div> 
  
    

     <div>
      
     </div>







      </div>
     
    </div>
  )
}

export default page
