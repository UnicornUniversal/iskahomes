'use client'

import React, { useState } from 'react'
import { 
    FiHome, 
    FiCalendar, 
    FiUsers, 
    FiMapPin, 
    FiHeart, 
    FiMessageSquare, 
    FiUser, 
    FiCreditCard, 
    FiGrid,
    FiLogOut,
    FiMenu,
    FiX
} from 'react-icons/fi'

const DeveloperNav = ({ active }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const navItems = [
        {
            label: 'Dashboard',
            href: '/developer/758594/dashboard',
            icon: FiHome
        },
        {
            label: 'Messages',
            href: '/developer/758594/messages',
            icon: FiMessageSquare
        },
        {
            label: 'Developments',
            href: '/developer/758594/developments',
            icon: FiMapPin
        },
          {
            label: 'Units',
            href: '/developer/758594/units',
            icon: FiGrid
        },
        {
            label: 'Appointments',
            href: '/developer/758594/appointments',
            icon: FiCalendar
        },
        // {
        //     label: 'Agents',
        //     href: '/developer/758594/agents',
        //     icon: FiUsers
        // },
     
        // {
        //     label: 'Favorites',
        //     href: '/developer/758594/favorites',
        //     icon: FiHeart
        // },
    
        {
            label: 'Profile',
            href: '/developer/758594/profile',
            icon: FiUser
        },
        {
            label: 'Subscriptions',
            href: '/developer/758594/subscriptions',
            icon: FiCreditCard
        },

     
      
    ]

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }

    return (
        <>
            {/* Mobile Menu Toggle Button - Only visible on mobile */}
            <button
                onClick={toggleMobileMenu}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary_color text-white rounded-lg shadow-lg hover:bg-primary_color/90 transition-all duration-300"
                aria-label="Toggle navigation menu"
            >
                {isMobileMenuOpen ? (
                    <FiX className="w-6 h-6" />
                ) : (
                    <FiMenu className="w-6 h-6" />
                )}
            </button>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="lg:hidden fixed inset-0 bg-primary_color/40 backdrop-blur-sm bg-opacity-10 z-40"
                    onClick={toggleMobileMenu}
                />
            )}

            {/* Navigation Menu */}
            <nav className={`fixed lg:relative flex flex-col bg-gradient-to-b from-white max-h-screen to-gray-50 min-h-screen py-8 w-[85vw] max-w-[300px] px-[1em] shadow-lg border-r border-gray-100 z-50 transition-transform duration-300 ease-in-out ${
                isMobileMenuOpen 
                    ? 'translate-x-0' 
                    : '-translate-x-full lg:translate-x-0'
            }`}>
                <div className="mb-8">
                    <h5 className="mb-2">Developer </h5>
                    <h3 className="mb-2">Dashboard</h3>
                    <div className="w-12 h-1 bg-primary_color rounded-full"></div>
                </div>
                
                <div className="space-y-2 w-full">
                    {navItems.map((item, index) => {
                        const IconComponent = item.icon
                        const isActive = active === index + 1
                        
                        return (
                            <a
                                key={index}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`group relative text-[0.8em] flex items-center space-x-3 px-4 w-full py-3 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 ${
                                    isActive
                                        ? 'bg-primary_color text-white shadow-lg shadow-primary_color/25'
                                        : 'text-gray-600 hover:text-primary_color hover:bg-white hover:shadow-md'
                                }`}
                            >
                                {/* Active indicator */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                                )}
                                
                                {/* Icon */}
                                <div className={`flex-shrink-0 transition-all duration-300 ${
                                    isActive 
                                        ? 'text-white' 
                                        : 'text-gray-400 group-hover:text-primary_color'
                                }`}>
                                    {IconComponent && (
                                        <IconComponent className="w-5 h-5" />
                                    )}
                                </div>
                                
                                {/* Label */}
                                <span className={`font-medium transition-all duration-300 ${
                                    isActive 
                                        ? 'text-white' 
                                        : 'text-gray-700 group-hover:text-primary_color'
                                }`}>
                                    {item.label}
                                </span>
                                
                                {/* Hover effect */}
                                {!isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary_color/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                )}
                            </a>
                        )
                    })}
                </div>

                {/* Logout */}
                <br/>
                <div className="mb-4 space-y-2 w-full rounded-xl shadow-primary_red/25 bg-primary_red cursor-pointer">
                    <a
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`group relative text-[0.8em] flex items-center space-x-3 px-4 w-full py-3 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105`}
                    >
                        {/* Icon */}
                        <FiLogOut color='white' className="w-5 h-5" />
                        {/* Label */}
                        <span className={`font-medium transition-all duration-300 text-text_color`}>
                            Logout
                        </span>
                    </a>
                </div>

                <br/>
                
                {/* Bottom section */}
                {/* <div className="mt-auto pt-8 border-t border-gray-200">
                    <div className="text-center">
                        <div className="w-8 h-8 bg-primary_color/10 rounded-full flex items-center justify-center mx-auto mb-2">
                            <FiUser className="w-4 h-4 text-primary_color" />
                        </div>
                        <p className="text-sm text-gray-500">Developer Account</p>
                    </div>
                </div> */}
            </nav>
        </>
    )
}

export default DeveloperNav
