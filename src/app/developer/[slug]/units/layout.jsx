'use client'
import React from 'react'
import ListingNav from '@/app/components/Listing/ListingNav'

const UnitsLayout = ({ children }) => {
  return (
    <>
      <ListingNav />
      {children}
    </>
  )
}

export default UnitsLayout