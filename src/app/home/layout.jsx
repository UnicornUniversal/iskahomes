import React from 'react'
import Nav from '@/app/components/Nav'
const HomeLayout = ({ children }) => {
  return (
    <div>
      <Nav />
      <div className="md:mt-[5em] ">
      {children}
      </div>
   
    </div>
  )
}
export default HomeLayout
