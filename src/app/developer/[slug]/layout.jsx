'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import DeveloperNav from '@/app/components/developers/DeveloperNav'
import Layout1 from '@/app/layout/Layout1'
import DeveloperTopNav from '@/app/components/developers/DeveloperTopNav'

export default function DeveloperLayout({ children }) {
  const pathname = usePathname()
  
  // Check if we're adding a new unit
  const isAddingNewUnit = pathname?.includes('/units/addNewUnit')
  
  return (
    <>
      {!isAddingNewUnit && <DeveloperTopNav />}

    
    <div className='flex gap-[1em] md:px-[1em] overflow-hidden template_body_bg'>
    
      <DeveloperNav />
      <div className='flex-1 flex flex-col p-2  default_bg md:!p-[2em] mt-[3em] h-full md:mt-[7em] overflow-hidden lg:transition-all lg:duration-300' style={{marginLeft: 'clamp(0px, var(--nav-width, 0px), 300px)'}}>
    

        {children}
      </div>
      
    </div>
  
    </>
  )
}

