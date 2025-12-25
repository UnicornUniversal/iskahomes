'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
    FiHome, 
    FiCalendar, 
    FiMapPin, 
    FiMessageSquare, 
    FiUser, 
    FiLogOut,
    FiMenu,
    FiX,
    FiTrendingUp
} from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'

const AgentNav = ({ active }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const pathname = usePathname()
    const params = useParams()
    const { logout } = useAuth()
    
    // Get slug from params or pathname
    const getSlug = () => {
        if (params?.slug) return params.slug
        const parts = pathname?.split('/') || []
        if (parts.length >= 3 && parts[1] === 'agents') {
            return parts[2]
        }
        return user?.profile?.slug || ''
    }

    const slug = getSlug()

    const navItems = [
        {
            label: 'Dashboard',
            href: `/agents/${slug}/dashboard`,
            icon: FiHome
        },
        {
            label: 'Properties',
            href: `/agents/${slug}/properties`,
            icon: FiMapPin
        },
        {
            label: 'Appointments',
            href: `/agents/${slug}/appointments`,
            icon: FiCalendar
        },
        {
            label: 'Messages',
            href: `/agents/${slug}/messages`,
            icon: FiMessageSquare
        },
        {
            label: 'Leads',
            href: `/agents/${slug}/leads`,
            icon: FiTrendingUp
        },
        {
            label: 'Profile',
            href: `/agents/${slug}/profile`,
            icon: FiUser
        }
    ]

    // Determine active item from pathname
    const getActiveIndex = () => {
        if (!pathname) return active || 1
        for (let i = 0; i < navItems.length; i++) {
            if (pathname.includes(navItems[i].href.split('/').pop())) {
                return i + 1
            }
        }
        return active || 1
    }

    const activeIndex = getActiveIndex()

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }

    return (
        <>
            {/* Mobile Menu Toggle Button - Only visible on mobile */}
            <button
                onClick={toggleMobileMenu}
                className="lg:hidden fixed top-4 left-4 z-10 p-2 bg-primary_color text-white rounded-lg shadow-lg hover:bg-primary_color/90 transition-all duration-300"
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
                    className="lg:hidden fixed inset-0  bg-opacity-10 z-40"
                    onClick={toggleMobileMenu}
                />
            )}

            {/* Navigation Menu */}
            <nav className={`fixed lg:relative   flex flex-col bg-gradient-to-b from-white  to-gray-50 min-h-screen py-8 w-[85vw] max-w-[300px] px-[1em] shadow-lg border-r border-gray-100 z-50 transition-transform duration-300 ease-in-out ${
                isMobileMenuOpen 
                    ? 'translate-x-0' 
                    : '-translate-x-full lg:translate-x-0'
            }`}>
                <div className="mb-8">
                    <h5 className="mb-2">Agent</h5>
                    <h3 className="mb-2">Dashboard</h3>
                    <div className="w-12 h-1 bg-primary_color rounded-full"></div>
                </div>
                
                <div className="space-y-2 w-full">
                    {navItems.map((item, index) => {
                        const IconComponent = item.icon
                        const isActive = activeIndex === index + 1
                        
                        return (
                            <Link
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
                            </Link>
                        )
                    })}
                </div>

                {/* Logout */}
                <br/>
                <div className="mb-4 space-y-2 w-full rounded-xl shadow-primary_red/25 bg-primary_red cursor-pointer">
                    <button
                        onClick={() => {
                            setIsMobileMenuOpen(false)
                            logout()
                        }}
                        className="group relative text-[0.8em] flex items-center space-x-3 px-4 w-full py-3 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105"
                    >
                        {/* Icon */}
                        <FiLogOut color='white' className="w-5 h-5" />
                        {/* Label */}
                        <span className="font-medium transition-all duration-300 text-white">
                            Logout
                        </span>
                    </button>
                </div>

                <br/>
                
              
            </nav>
        </>
    )
}

export default AgentNav
