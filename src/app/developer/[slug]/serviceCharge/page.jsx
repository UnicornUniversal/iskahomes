import React from 'react'
import TotalServiceCharge from '@/app/components/developers/DataStats/TotalServiceCharge'

const ServiceChargePage = () => {
  return (
    <div className="w-full flex flex-col gap-4 h-full overflow-y-auto">
      <TotalServiceCharge />
    </div>
  )
}

export default ServiceChargePage
