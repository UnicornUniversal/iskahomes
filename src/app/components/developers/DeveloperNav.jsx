'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
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
    FiX
} from 'react-icons/fi'

const DeveloperNav = ({ active }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const pathname = usePathname()
    const { user, logout } = useAuth()
    
    // Get the developer slug from user profile or use user ID as fallback
    const developerSlug = user?.profile?.slug || user?.id || 'developer'

    const navItems = [
        {
            label: 'Dashboard',
            href: `/developer/${developerSlug}/dashboard`,
            icon: FiHome
        },
        {
            label: 'Messages',
            href: `/developer/${developerSlug}/messages`,
            icon: FiMessageSquare
        },
        {
            label: 'Developments',
            href: `/developer/${developerSlug}/developments`,
            icon: FiMapPin
        },
        {
            label: 'Units',
            href: `/developer/${developerSlug}/units`,
            icon: FiGrid
        },
        {
            label: 'Appointments',
            href: `/developer/${developerSlug}/appointments`,
            icon: FiCalendar
        },
        // {
        //     label: 'Agents',
        //     href: `/developer/${developerSlug}/agents`,
        //     icon: FiUsers
        // },
        // {
        //     label: 'Favorites',
        //     href: `/developer/${developerSlug}/favorites`,
        //     icon: FiHeart
        // },
        {
            label: 'Profile',
            href: `/developer/${developerSlug}/profile`,
            icon: FiUser
        },
        {
            label: 'Subscriptions',
            href: `/developer/${developerSlug}/subscriptions`,
            icon: FiCreditCard
        },
    ]

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed)
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
            <nav className={`fixed rounded-sm border-primary_color lg:relative flex flex-col bg-gradient-to-b from-white max-h-screen to-gray-50 min-h-screen py-8 px-[1em] shadow-lg border-r border-gray-100 z-50 transition-all duration-300 ease-in-out ${
                isMobileMenuOpen 
                    ? 'translate-x-0' 
                    : '-translate-x-full lg:translate-x-0'
            } ${
                isCollapsed ? 'w-[85vw] max-w-[80px] lg:w-[80px]' : 'w-[85vw] max-w-[300px] lg:w-[300px]'
            }`}>
                <div className="mb-8 flex items-center justify-between">
                    {!isCollapsed && (
                        <div>
                            <h5 className="mb-2">Developer </h5>
                            <h3 className="mb-2">Dashboard</h3>
                            <div className="w-12 h-1 bg-primary_color rounded-full"></div>
                        </div>
                    )}
                    
                    {/* Collapse Toggle Button - Only visible on desktop */}
                    <button
                        onClick={toggleCollapse}
                        className="hidden lg:flex items-center justify-center w-8 h-8 bg-primary_color/10 hover:bg-primary_color/20 text-primary_color rounded-lg transition-all duration-300"
                        aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
                    >
                        {isCollapsed ? (
                            <FiMenu className="w-4 h-4" />
                        ) : (
                            <FiX className="w-4 h-4" />
                        )}
                    </button>
                </div>
                
                <div className="space-y-2 w-full">
                    {navItems.map((item, index) => {
                        const IconComponent = item.icon
                        const isActive = pathname === item.href || (active === index + 1)
                        
                        return (
                            <a
                                key={index}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`group relative text-[0.8em] flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} w-full py-3 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 ${
                                    isActive
                                        ? 'bg-primary_color text-white shadow-lg shadow-primary_color/25 border-l-4 border-white'
                                        : 'text-gray-600 hover:text-primary_color hover:bg-white hover:shadow-md'
                                }`}
                                title={isCollapsed ? item.label : undefined}
                            >
                                {/* Active indicator */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full animate-pulse"></div>
                                )}
                                
                                {/* Active background glow */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary_color/20 to-transparent rounded-xl"></div>
                                )}
                                
                                {/* Icon */}
                                <div className={`flex-shrink-0 transition-all duration-300 relative z-10 ${
                                    isActive 
                                        ? 'text-white' 
                                        : 'text-gray-400 group-hover:text-primary_color'
                                }`}>
                                    {IconComponent && (
                                        <IconComponent className={`w-5 h-5 transition-all duration-300 ${
                                            isActive ? 'scale-110' : 'group-hover:scale-105'
                                        }`} />
                                    )}
                                </div>
                                
                                {/* Label */}
                                {!isCollapsed && (
                                    <span className={`font-medium transition-all duration-300 relative z-10 ${
                                        isActive 
                                            ? 'text-white font-semibold' 
                                            : 'text-gray-700 group-hover:text-primary_color'
                                    }`}>
                                        {item.label}
                                    </span>
                                )}
                                
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
                <div className="mb-4 space-y-2 w-full rounded-xl shadow-primary_color/25 bg-primary_color cursor-pointer">
                    <button
                        onClick={() => {
                            logout()
                            setIsMobileMenuOpen(false)
                        }}
                        className={`group relative text-[0.8em] flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} w-full py-3 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105`}
                        title={isCollapsed ? "Logout" : undefined}
                    >
                        {/* Icon */}
                        <FiLogOut color='white' className="w-5 h-5" />
                        {/* Label */}
                        {!isCollapsed && (
                            <span className={`font-medium transition-all duration-300 text-white`}>
                                Logout
                            </span>
                        )}
                    </button>
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
