import React from 'react'
import Link from 'next/link'
const DataCard = (props) => {
  return (
    <div className='bg-gradient-to-b  from-primary_color to-[#718E97] rounded-sm p-4  shadow-md w-full'>
        <p className='text-[0.8em] text-white'>{props.title}</p>
        <h3 className='text-[3em] text-white font-bold'>{props.value}</h3>
        <Link href={props.link} className='text-white text-[0.8em] underline'>{props.linkText}</Link>
    </div>
  )
}

export default DataCard
