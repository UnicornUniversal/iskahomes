'use client'
import React from 'react'
import ListingNav from '@/app/components/Listing/ListingNav'
const UnitsLayout = ({ children }) => {
  return (
    <div>
      <ListingNav />
      {children}
    </div>
  )
}

export default UnitsLayout