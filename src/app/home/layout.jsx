import React from 'react'
import Nav from '@/app/components/Nav'
import Footer from '@/app/components/Footer'

const HomeLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <div className="md:mt-[4em] flex-grow">
      {children}
      </div>
      <Footer />
    </div>
  )
}
export default HomeLayout
