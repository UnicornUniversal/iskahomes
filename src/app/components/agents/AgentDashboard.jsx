import React from 'react'
import DataCard from './DataCard'
import Leads from './DataInfo/Leads'
import LatestAppoinments from './DataInfo/LatestAppoinments'

const AgentDashboard = () => {
  return (
    <div className='w-full flex flex-col gap-4'>
<div className='w-full flex gap-4'>

  <DataCard title="Total Properties" value="30" link="/properties" linkText="View All" />
  <DataCard title="Total Leads" value="300k" link="/leads" linkText="View All" />
  <DataCard title="Total Closed Deals" value="50" link="/appointments" linkText="View All" />
  <DataCard title="Total Revenue" value="Gh 100,000" link="/clients" linkText="View All" />
 
</div>
<Leads />
<LatestAppoinments />




    </div>
  )
}

export default AgentDashboard
