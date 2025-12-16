'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
    FiHome, 
    FiCalendar, 
    FiHeart, 
    FiMessageSquare, 
    FiUser, 
    FiLogOut,
    FiMenu,
    FiX
    // FiFileText
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
        // {
        //     label: 'Applications',
        //     href: `/propertySeeker/${userId}/applications`,
        //     icon: FiFileText,
        //     pathMatch: '/applications'
        // },
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
            {/* Mobile Menu Toggle Button */}
            <button
                onClick={toggleMobileMenu}
                className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-primary_color text-white rounded-xl shadow-lg hover:bg-primary_color/90 transition-all duration-300 hover:scale-105"
                aria-label="Toggle navigation menu"
            >
                {isMobileMenuOpen ? (
                    <FiX className="w-5 h-5" />
                ) : (
                    <FiMenu className="w-5 h-5" />
                )}
            </button>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                    onClick={toggleMobileMenu}
                />
            )}

            {/* Navigation Menu */}
            <nav className={`fixed lg:sticky lg:top-0 flex flex-col default_bg min-h-screen py-6 lg:py-8 w-[85vw] max-w-[280px] px-4 lg:px-6 shadow-xl border-r border-primary_color/10 z-50 transition-transform duration-300 ease-in-out ${
                isMobileMenuOpen 
                    ? 'translate-x-0' 
                    : '-translate-x-full lg:translate-x-0'
            }`}>
                {/* Logo/Header Section */}
                <div className="mb-8 pb-6 border-b border-primary_color/10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary_color to-primary_color/80 flex items-center justify-center shadow-lg">
                            <FiHome className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h5 className="text-xs font-semibold text-primary_color/70 uppercase tracking-wider">Property Seeker</h5>
                            <h3 className="text-lg font-bold text-primary_color">Dashboard</h3>
                        </div>
                    </div>
                    <div className="w-16 h-1 bg-gradient-to-r from-primary_color to-secondary_color rounded-full"></div>
                </div>
                
                {/* Navigation Items */}
                <div className="space-y-1.5 flex-1">
                    {navItems.map((item, index) => {
                        const IconComponent = item.icon
                        const isActive = pathname?.includes(item.pathMatch)
                        
                        return (
                            <a
                                key={index}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`group relative flex items-center space-x-3 px-4 w-full py-3 rounded-xl transition-all duration-300 ${
                                    isActive
                                        ? 'bg-primary_color text-white shadow-lg shadow-primary_color/30'
                                        : 'text-primary_color hover:bg-primary_color/10 hover:text-primary_color'
                                }`}
                            >
                                {/* Active indicator */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-10 bg-secondary_color rounded-r-full"></div>
                                )}
                                
                                {/* Icon */}
                                <div className={`flex-shrink-0 transition-all duration-300 ${
                                    isActive 
                                        ? 'text-white' 
                                        : 'text-primary_color/60 group-hover:text-primary_color'
                                }`}>
                                    {IconComponent && (
                                        <IconComponent className="w-5 h-5" />
                                    )}
                                </div>
                                
                                {/* Label */}
                                <span className={`text-sm font-medium transition-all duration-300 ${
                                    isActive 
                                        ? 'text-white' 
                                        : 'text-primary_color group-hover:text-primary_color'
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

                {/* Logout Button */}
                <div className="mt-6 pt-6 border-t border-primary_color/10">
                    <button
                        onClick={() => {
                            setIsMobileMenuOpen(false)
                            logout()
                        }}
                        className="group relative flex items-center space-x-3 px-4 w-full py-3 rounded-xl transition-all duration-300 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white hover:shadow-lg hover:shadow-red-500/30"
                    >
                        <FiLogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">Logout</span>
                    </button>
                </div>
            </nav>
        </>
    )
}

export default HomeSeekerNav 