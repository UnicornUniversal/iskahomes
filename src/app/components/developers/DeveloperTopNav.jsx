'use client'

import React, { useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import { FiChevronDown, FiSearch } from 'react-icons/fi'

const DeveloperTopNav = ({ onSearch }) => {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const profileImage = useMemo(() => {
    const image =
      user?.profile?.profile_image &&
      (typeof user.profile.profile_image === 'string'
        ? user.profile.profile_image
        : user.profile.profile_image.url)
    return image || '/images/default-avatar.png'
  }, [user])

  const developerName = user?.profile?.name || user?.profile?.company_name || 'Developer'
  const accountStatus = user?.profile?.account_status || 'active'
  const email = user?.profile?.email || user?.email || 'N/A'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (typeof onSearch === 'function') {
      onSearch(query.trim())
    }
  }

  return (
    <div className="fixed top-0   w-full  left-1/2 -translate-x-1/2    overflow-y z-100 backdrop-blur-mdw-full shadow-sm bg-white/20 backdrop-blur-sm">
      <div className="">
        <div className="mx-auto flex  items-center justify-between px-4 py-4 text-primary_color">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3">
       <img src="/iska-dark.png" alt="logo" className='w-[100px]'></img>
            <div>
            
            </div>
          </div>

          {/* Search */}
          <form
            onSubmit={handleSubmit}
            className="hidden w-full max-w-md md:flex items-center"
          >
            <div className="flex w-full items-center rounded-full bg-primary_color px-4 py-2 border-white focus-within:ring-2 focus-within:ring-white/70">
              <FiSearch className="mr-2 text-white" />
              <input
                type="text"
                placeholder="Search units or developments..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/10 focus:outline-none"
              />
            </div>
          </form>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setOpen((prev) => !prev)}
              className="flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur transition hover:bg-white/20"
            >
              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/20">
                <Image
                  src={profileImage}
                  alt={developerName}
                  fill
                  sizes="40px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="hidden text-left text-sm md:block">
                <p className='text-[0.8em]'>Welcome, </p>
                <p className="font-semibold leading-tight text-sm">{developerName}</p>
                {/* <p className="text-xs uppercase tracking-wide text-white/70">{accountStatus}</p> */}
              </div>
              <FiChevronDown className={`transition ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-gray-100 bg-white p-4 text-gray-800 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full border border-gray-200">
                    <Image
                      src={profileImage}
                      alt={developerName}
                      fill
                      sizes="48px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className='text-[0.7em]'>
                    <p className=" font-semibold">{developerName}</p>
                   <p className=' '> {user?.profile?.email || user?.email || 'N/A'}</p>
                   <p className="font-medium  ">{accountStatus}</p>
                    {/* <p className="text-xs uppercase tracking-wide text-gray-500">{accountStatus}</p> */}
                  </div>
                </div>
          
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeveloperTopNav
