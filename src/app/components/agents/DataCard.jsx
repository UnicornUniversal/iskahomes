'use client'
import React from 'react'
import Link from 'next/link'
const DataCard = (props) => {
  return (
 
       <div className='rounded-sm p-4  shadow-md w-full'>
        <p className='text-[0.8em] '>{props.title}</p>
        <h3 className='text-[2em]  font-bold'>{props.value}</h3>
      {props.link && <Link href={props.link} className=' text-[0.8em] underline'>{props.linkText}</Link>}
    </div>
   
  )
}

export default DataCard
