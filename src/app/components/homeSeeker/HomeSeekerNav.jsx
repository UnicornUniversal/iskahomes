'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
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
    FiX,
    FiFileText,
    FiBell,
    FiStar,
    FiDollarSign,
    FiCheckCircle
} from 'react-icons/fi'

const HomeSeekerNav = ({ pathname }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const { user, logout } = useAuth()

    // Get user ID from pathname or user context
    const userId = pathname?.split('/')[2] || user?.id || '67890'

    const navItems = [
        {
            label: 'Dashboard',
            href: `/propertySeeker/${userId}/dashboard`,
            icon: FiHome,
            pathMatch: '/dashboard'
        },
        {
            label: 'Saved Listings',
            href: `/propertySeeker/${userId}/saved-listings`,
            icon: FiHeart,
            pathMatch: '/saved-listings'
        },
        {
            label: 'Bookings',
            href: `/propertySeeker/${userId}/bookings`,
            icon: FiCalendar,
            pathMatch: '/bookings'
        },
        {
            label: 'Messages',
            href: `/propertySeeker/${userId}/messages`,
            icon: FiMessageSquare,
            pathMatch: '/messages'
        },
        {
            label: 'Profile',
            href: `/propertySeeker/${userId}/profile`,
            icon: FiUser,
            pathMatch: '/profile'
        }
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
            <nav className={`fixed lg:relative flex flex-col bg-gradient-to-b from-blue-50 max-h-screen to-indigo-50 min-h-screen py-8 w-[85vw] max-w-[300px] px-[1em] shadow-lg border-r border-blue-100 z-50 transition-transform duration-300 ease-in-out ${
                isMobileMenuOpen 
                    ? 'translate-x-0' 
                    : '-translate-x-full lg:translate-x-0'
            } lg:translate-x-0`}>
                <div className="mb-8">
                    <h5 className="mb-2 text-blue-600">propertySeeker</h5>
                    <h3 className="mb-2 text-blue-900">Dashboard</h3>
                    <div className="w-12 h-1 bg-blue-600 rounded-full"></div>
                </div>
                
                <div className="space-y-2 w-full">
                    {navItems.map((item, index) => {
                        const IconComponent = item.icon
                        const isActive = pathname?.includes(item.pathMatch)
                        
                        return (
                            <a
                                key={index}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`group relative text-[0.8em] flex items-center space-x-3 px-4 w-full py-3 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 ${
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                                        : 'text-blue-700 hover:text-blue-600 hover:bg-white hover:shadow-md'
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
                                        : 'text-blue-400 group-hover:text-blue-600'
                                }`}>
                                    {IconComponent && (
                                        <IconComponent className="w-5 h-5" />
                                    )}
                                </div>
                                
                                {/* Label */}
                                <span className={`font-medium transition-all duration-300 ${
                                    isActive 
                                        ? 'text-white' 
                                        : 'text-blue-800 group-hover:text-blue-600'
                                }`}>
                                    {item.label}
                                </span>
                                
                                {/* Hover effect */}
                                {!isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                )}
                            </a>
                        )
                    })}
                </div>

                {/* Logout */}
                <br/>
                <div className="mb-4 space-y-2 w-full rounded-xl shadow-red-500/25 bg-red-500 cursor-pointer">
                    <button
                        onClick={() => {
                            setIsMobileMenuOpen(false)
                            logout()
                        }}
                        className={`group relative text-[0.8em] flex items-center space-x-3 px-4 w-full py-3 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105`}
                    >
                        {/* Icon */}
                        <FiLogOut color='white' className="w-5 h-5" />
                        {/* Label */}
                        <span className={`font-medium transition-all duration-300 text-white`}>
                            Logout
                        </span>
                    </button>
                </div>

                <br/>
            </nav>
        </>
    )
}

export default HomeSeekerNav 