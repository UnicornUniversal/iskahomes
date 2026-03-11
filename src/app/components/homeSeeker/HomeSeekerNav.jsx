'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'
import { 
    FiHome, 
    FiCalendar, 
    FiHeart, 
    FiMessageSquare, 
    FiUser, 
    FiLogOut,
    FiMenu,
    FiX
} from 'react-icons/fi'

const HomeSeekerNav = ({ pathname }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
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

    const handleLogout = async () => {
        if (isLoggingOut) return
        setIsLoggingOut(true)
        setIsMobileMenuOpen(false)

        const loadingToastId = toast.loading('Logging out...', {
            position: 'top-center',
            autoClose: false,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: false
        })

        try {
            const result = await logout()
            if (result.success) {
                toast.update(loadingToastId, {
                    render: 'Logged out successfully!',
                    type: 'success',
                    autoClose: 2000,
                    isLoading: false
                })
            } else {
                toast.update(loadingToastId, {
                    render: 'Logout completed with warnings',
                    type: 'warning',
                    autoClose: 2000,
                    isLoading: false
                })
            }
        } catch (error) {
            console.error('Logout error:', error)
            toast.update(loadingToastId, {
                render: 'Logout completed with errors',
                type: 'error',
                autoClose: 2000,
                isLoading: false
            })
        } finally {
            setIsLoggingOut(false)
            setTimeout(() => {
                window.location.href = '/'
            }, 1000)
        }
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
            <nav className={`fixed lg:sticky lg:top-0 flex flex-col bg-white min-h-screen py-6 lg:py-8 w-[85vw] max-w-[280px] px-4 lg:px-6 shadow-xl border-r border-gray-100 z-50 transition-transform duration-300 ease-in-out ${
                isMobileMenuOpen 
                    ? 'translate-x-0' 
                    : '-translate-x-full lg:translate-x-0'
            }`}>
                {/* ISKA Logo - first element, links to homepage (extra top padding on mobile so it doesn't overlap with toggle) */}
                <div className="mb-6 pt-14 lg:pt-0">
                    <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                        <img src="/iska-dark.png" alt="ISKA Homes" className="max-w-[120px] w-24" />
                    </Link>
                </div>

                {/* Close button - small/medium devices only */}
                <button
                    onClick={toggleMobileMenu}
                    className="lg:hidden absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Close navigation"
                >
                    <FiX className="w-5 h-5" />
                </button>

                {/* Header Section */}
                <div className="mb-8 pb-6 border-b border-gray-100">
                    <h5 className="text-xs font-semibold text-primary_color/70 uppercase tracking-wider mb-1">Property Seeker</h5>
                    <h3 className="text-lg font-bold text-primary_color">Dashboard</h3>
                    <div className="w-16 h-1 bg-gradient-to-r from-primary_color to-secondary_color rounded-full mt-2"></div>
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
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className={`group relative flex items-center space-x-3 px-4 w-full py-3 rounded-xl transition-all duration-300 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white hover:shadow-lg hover:shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <FiLogOut className={`w-5 h-5 ${isLoggingOut ? 'animate-spin' : ''}`} />
                        <span className="text-sm font-medium">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                    </button>
                </div>
            </nav>
        </>
    )
}

export default HomeSeekerNav 