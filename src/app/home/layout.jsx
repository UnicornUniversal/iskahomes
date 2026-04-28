'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Nav from '@/app/components/Nav'
import Footer from '@/app/components/Footer'

const HomeLayout = ({ children }) => {
  const pathname = usePathname()
  const hideFooter = pathname === '/home/exploreProperties'

  return (
    <div>
      <Nav />
      <div className="md:mt-[4em] ">
      {children}
      </div>
      {!hideFooter && <Footer />}
    </div>
  )
}
export default HomeLayout
