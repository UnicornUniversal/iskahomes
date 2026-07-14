'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Nav from '@/app/components/Nav'
import Footer from '@/app/components/Footer'

const AUTH_ROUTES = ['/home/signin', '/home/signup']

const HomeLayout = ({ children }) => {
  const pathname = usePathname()
  const isAuthRoute = AUTH_ROUTES.includes(pathname)
  const hideFooter = pathname === '/home/exploreProperties'

  // Auth pages render their own full-height shell with a minimal legal footer.
  if (isAuthRoute) {
    return children
  }

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
