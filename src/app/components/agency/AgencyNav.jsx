'use client'

import React, { useState } from 'react'
import { 
    FiHome, 
    FiUsers, 
    FiMapPin, 
    FiMenu,
    FiX,
    FiBarChart2,
    FiCreditCard,
    FiCalendar,
    FiUser,
    FiMessageSquare,
    FiTrendingUp
} from 'react-icons/fi'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const AgencyNav = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const pathname = usePathname()

    // Extract slug from pathname (e.g., /agency/premier-realty/dashboard -> premier-realty)
    const getSlug = () => {
        const parts = pathname?.split('/') || []
        if (parts.length >= 3 && parts[1] === 'agency') {
            return parts[2]
        }
        return 'premier-realty' // fallback
    }

    const slug = getSlug()

    const navItems = [
        {
            label: 'Dashboard',
            href: `/agency/${slug}/dashboard`,
            icon: FiHome
        },
        {
            label: 'Agents',
            href: `/agency/${slug}/agents`,
            icon: FiUsers
        },
        {
            label: 'Properties',
            href: `/agency/${slug}/properties`,
            icon: FiMapPin
        },
        {
            label: 'Appointments',
            href: `/agency/${slug}/appointments`,
            icon: FiCalendar
        },
        {
            label: 'Messages',
            href: `/agency/${slug}/messages`,
            icon: FiMessageSquare
        },
        {
            label: 'Leads',
            href: `/agency/${slug}/leads`,
            icon: FiTrendingUp
        },
        {
            label: 'Analytics',
            href: `/agency/${slug}/analytics/overview`,
            icon: FiBarChart2
        },
        {
            label: 'Sales',
            href: `/agency/${slug}/sales`,
            icon: FiCreditCard
        },
        {
            label: 'Profile',
            href: `/agency/${slug}/profile`,
            icon: FiUser
        }
    ]

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }

    const isActive = (href) => {
        // Special handling for dashboard - exact match only
        if (href.includes('/dashboard')) {
            return pathname === href
        }
        // For other routes, check if pathname starts with href
        return pathname === href || pathname?.startsWith(href + '/')
    }

    return (
        <>
            {/* Mobile Menu Toggle Button */}
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
                    className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                    onClick={toggleMobileMenu}
                />
            )}

            {/* Navigation Menu */}
            <nav className={`fixed lg:sticky lg:top-0 flex flex-col bg-white min-h-screen py-8 w-[85vw] max-w-[280px] px-6 h-screen max-h-screen shadow-lg border-r border-gray-100 z-50 transition-transform duration-300 ease-in-out ${
                isMobileMenuOpen 
                    ? 'translate-x-0' 
                    : '-translate-x-full lg:translate-x-0'
            }`}>
                <div className="mb-8">
                    <h5 className="text-sm text-gray-500 mb-2 font-medium">Agency</h5>
                    <h3 className="text-2xl font-bold text-primary_color mb-2">Dashboard</h3>
                    <div className="w-12 h-1 bg-secondary_color rounded-full"></div>
                </div>
                
                <div className="space-y-2 w-full flex-1">
                    {navItems.map((item, index) => {
                        const IconComponent = item.icon
                        const active = isActive(item.href)
                        
                        return (
                            <Link
                                key={index}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`group relative text-sm flex items-center space-x-3 px-4 w-full py-3 rounded-xl transition-all duration-300 ease-in-out ${
                                    active
                                        ? 'bg-primary_color text-white shadow-lg shadow-primary_color/25'
                                        : 'text-gray-600 hover:text-primary_color hover:bg-primary_color/5'
                                }`}
                            >
                                {/* Active indicator */}
                                {active && (
                                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-secondary_color rounded-r-full"></div>
                                )}
                                
                                {/* Icon */}
                                <div className={`flex-shrink-0 transition-all duration-300 ${
                                    active 
                                        ? 'text-white' 
                                        : 'text-gray-400 group-hover:text-primary_color'
                                }`}>
                                    <IconComponent className="w-5 h-5" />
                                </div>
                                
                                {/* Label */}
                                <span className={`font-medium transition-all duration-300 ${
                                    active 
                                        ? 'text-white' 
                                        : 'text-gray-700 group-hover:text-primary_color'
                                }`}>
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </div>

                {/* Agency Info Footer */}
                <div className="mt-auto pt-6 border-t border-gray-200">
                    <div className="px-4 py-3 bg-primary_color/5 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Agency Name</p>
                        <p className="text-sm font-semibold text-primary_color">Premier Realty</p>
                    </div>
                </div>
            </nav>
        </>
    )
}

export default AgencyNav

