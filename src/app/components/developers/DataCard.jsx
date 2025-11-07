import React from 'react'
import Link from 'next/link'

const DataCard = ({ title, value, link, linkText, icon: Icon }) => {
  return (
    <div className='bg-white/60 border border-[#E0B29A] rounded-lg p-6 shadow-sm w-full'>
      <div className='flex items-center gap-3 mb-4'>
        <div className='w-7 h-7 rounded-lg border-2 border-[#17637C] flex items-center justify-center'>
          {Icon && <Icon className='w-3 h-3 text-[#17637C]' />}
        </div>
        <p className='!text-sm text-[#17637C] font-medium'>{title}</p>
      </div>
      <h3 className='text-[2em] text-primary_color '>{value}</h3>
      {/* {link && linkText && (
        <Link href={link} className='text-primary_color text-[0.8em] underline hover:no-underline'>
          {linkText}
        </Link>
      )} */}
    </div>
  )
}

export default DataCard
