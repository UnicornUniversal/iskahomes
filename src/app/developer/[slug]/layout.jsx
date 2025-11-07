'use client'

import React from 'react'
import DeveloperNav from '@/app/components/developers/DeveloperNav'
import Layout1 from '@/app/layout/Layout1'
export default function DeveloperLayout({ children }) {
  return (

    <>
    <Layout1>
    <div className='flex gap-4 overflow-hidden'>
    
      <DeveloperNav />
      <div className='flex-1 flex flex-col h-full overflow-hidden lg:transition-all lg:duration-300' style={{marginLeft: 'clamp(0px, var(--nav-width, 0px), 300px)'}}>
        {children}
      </div>
      
    </div>
    </Layout1>
    </>
  )
}

