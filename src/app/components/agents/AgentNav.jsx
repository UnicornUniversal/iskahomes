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
    FiTrendingUp,
    FiDollarSign
} from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'

const AgentNav = ({ active }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const pathname = usePathname()
    const params = useParams()
    const { user, logout } = useAuth()
    
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
            label: 'Sales',
            href: `/agents/${slug}/sales`,
            icon: FiDollarSign
        },
        {
            label: 'Profile',
            href: `/agents/${slug}/profile`,
            icon: FiUser
        }
    ]

    const isNavActive = (href) => {
        if (!pathname) return false
        return pathname === href || pathname.startsWith(`${href}/`)
    }

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }

    const handleLogout = async () => {
        if (isLoggingOut) return; // Prevent multiple clicks
        
        setIsLoggingOut(true);
        setIsMobileMenuOpen(false);
        
        // Show loading toast
        const loadingToastId = toast.loading('Logging out...', {
            position: "top-center",
            autoClose: false,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: false,
        });
        
        try {
            const result = await logout();
            if (result.success) {
                // Show success toast
                toast.update(loadingToastId, {
                    render: 'Logged out successfully!',
                    type: 'success',
                    autoClose: 2000,
                    isLoading: false,
                });
                
                // Redirect to home page after successful logout
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } else {
                console.error('Logout failed:', result.error);
                
                // Show error toast but still redirect
                toast.update(loadingToastId, {
                    render: 'Logout completed with warnings',
                    type: 'warning',
                    autoClose: 2000,
                    isLoading: false,
                });
                
                // Still redirect even if logout had issues to prevent stuck state
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            }
        } catch (error) {
            console.error('Logout error:', error);
            
            // Show error toast but still redirect
            toast.update(loadingToastId, {
                render: 'Logout completed with errors',
                type: 'error',
                autoClose: 2000,
                isLoading: false,
            });
            
            // Still redirect even if logout had issues to prevent stuck state
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } finally {
            setIsLoggingOut(false);
        }
    }

    return (
        <>
            {/* Mobile Menu Toggle Button - Only visible on mobile */}
            <button
                onClick={toggleMobileMenu}
                className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-primary_color text-white rounded-lg shadow-lg hover:bg-primary_color/90 transition-all duration-300"
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
                    className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                    onClick={toggleMobileMenu}
                />
            )}

            {/* Navigation — fixed drawer on mobile; sticky sidebar in flex layout on desktop (agency pattern) */}
            <nav
                className={`fixed lg:sticky lg:top-0 flex-shrink-0 flex flex-col bg-gradient-to-b from-white to-gray-50 h-screen max-h-screen py-8 w-[85vw] max-w-[280px] px-6 shadow-lg border-r border-gray-100 z-50 transition-transform duration-300 ease-in-out overflow-hidden ${
                    isMobileMenuOpen
                        ? 'translate-x-0'
                        : '-translate-x-full lg:translate-x-0'
                }`}
            >
                {/* Logo - first element, links to homepage */}
                <div className="mb-6 flex-shrink-0">
                    <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                        <img src="/ISKA Logo.png" alt="ISKA Homes" className="max-w-[120px] w-24" />
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

                <div className="mb-8 flex-shrink-0">
                    <h5 className="mb-2">Agent</h5>
                    <h3 className="mb-2">Dashboard</h3>
                    <div className="w-12 h-1 bg-primary_color rounded-full"></div>
                </div>
                
                <div className="space-y-2 w-full flex-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {navItems.map((item, index) => {
                        const IconComponent = item.icon
                        const isActive = isNavActive(item.href)
                        
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
                <div className="mt-4 flex-shrink-0 space-y-2 w-full rounded-xl shadow-primary_red/25 bg-primary_red">
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="group relative text-[0.8em] flex items-center space-x-3 px-4 w-full py-3 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {/* Icon */}
                        <FiLogOut color='white' className="w-5 h-5" />
                        {/* Label */}
                        <span className="font-medium transition-all duration-300 text-white">
                            {isLoggingOut ? 'Logging out...' : 'Logout'}
                        </span>
                    </button>
                </div>
            </nav>
        </>
    )
}

export default AgentNav
