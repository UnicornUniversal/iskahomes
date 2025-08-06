import React from 'react'

const DataCard = (props) => {
  return (
    <div className='bg-white/90  rounded-sm  shadow-xl rounded-rounded border border-primary_color p-4'>
     
     <p className='md:text-[0.6em]'>{props.title}</p>
      <h2 className='text-primary_color'>{props.data}</h2>
    
     
    </div>
  )
}

export default DataCard
