'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { 
    FiHome, 
    FiUsers, 
    FiMapPin, 
    FiSettings,
    FiChevronDown,
    FiChevronRight,
    FiLogOut,
    FiMenu,
    FiX,
    FiUser,
    FiTag,
    FiTarget,
    FiLayers,
    FiGrid,
    FiCheckCircle,
    FiStar,
    FiPackage,
    FiDollarSign,
    FiCreditCard,
    FiClock,
    FiList
} from 'react-icons/fi'

const AdminNav = ({ active }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [expandedSections, setExpandedSections] = useState({
        userManagement: false,
        propertyCategories: false,
        subscriptionsManagement: false
    })
    const pathname = usePathname()


    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }))
    }

    const navItems = [
        {
            label: 'Dashboard',
            href: '/admin/dashboard',
            icon: FiHome,
            type: 'single'
        },
        {
            label: 'User Management',
            icon: FiUsers,
            type: 'section',
            key: 'userManagement',
            children: [
                {
                    label: 'Property Seekers',
                    href: '/admin/users/property-seekers',
                    icon: FiUser,
                    type: 'single'
                },
                {
                    label: 'Developers',
                    href: '/admin/users/developers',
                    icon: FiHome,
                    type: 'single'
                },
                {
                    label: 'Agents',
                    href: '/admin/users/agents',
                    icon: FiUsers,
                    type: 'single'
                }
            ]
        },
        {
            label: 'Properties',
            href: '/admin/properties',
            icon: FiMapPin,
            type: 'single'
        },
        {
            label: 'Subscriptions Management',
            icon: FiDollarSign,
            type: 'section',
            key: 'subscriptionsManagement',
            children: [
                {
                    label: 'Packages',
                    href: '/admin/subscriptions-management/packages',
                    icon: FiPackage,
                    type: 'single'
                },
                {
                    label: 'Subscriptions',
                    href: '/admin/subscriptions-management/subscriptions',
                    icon: FiCheckCircle,
                    type: 'single'
                },
                {
                    label: 'Subscription Requests',
                    href: '/admin/subscriptions-management/subscriptions-requests',
                    icon: FiClock,
                    type: 'single'
                },
                {
                    label: 'Subscription History',
                    href: '/admin/subscriptions-management/subscription-history',
                    icon: FiList,
                    type: 'single'
                }
            ]
        },
        {
            label: 'Property Categories',
            icon: FiSettings,
            type: 'section',
            key: 'propertyCategories',
            children: [
                {
                    label: 'Purpose',
                    href: '/admin/categories/purpose',
                    icon: FiTarget,
                    type: 'single'
                },
                {
                    label: 'Property Type',
                    href: '/admin/categories/property-type',
                    icon: FiLayers,
                    type: 'single'
                },
                {
                    label: 'Property Category',
                    href: '/admin/categories/property-category',
                    icon: FiGrid,
                    type: 'single'
                },
                {
                    label: 'Property Sub-type',
                    href: '/admin/categories/property-subtype',
                    icon: FiTag,
                    type: 'single'
                },
                {
                    label: 'Property Status',
                    href: '/admin/categories/property-status',
                    icon: FiCheckCircle,
                    type: 'single'
                },
                {
                    label: 'Property Amenities',
                    href: '/admin/categories/property-amenities',
                    icon: FiStar,
                    type: 'single'
                }
            ]
        }
    ]

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }

    const isActiveRoute = (href) => {
        return pathname === href
    }

    const isSubRouteActive = (sectionKey) => {
        const section = navItems.find(item => item.key === sectionKey)
        if (!section || !section.children) return false
        
        return section.children.some(child => pathname === child.href)
    }

    // Auto-expand sections when their sub-routes are active
    useEffect(() => {
        const newExpandedSections = { ...expandedSections }
        let hasChanges = false
        
        navItems.forEach(item => {
            if (item.type === 'section' && item.key) {
                const hasActiveSubRoute = isSubRouteActive(item.key)
                if (hasActiveSubRoute && !expandedSections[item.key]) {
                    newExpandedSections[item.key] = true
                    hasChanges = true
                }
            }
        })
        
        if (hasChanges) {
            setExpandedSections(newExpandedSections)
        }
    }, [pathname])

    const renderNavItem = (item, index, level = 0) => {
        // Fallback for missing type
        if (!item.type) item.type = 'single'
        
        if (item.type === 'single') {
            const isActive = isActiveRoute(item.href)
            const IconComponent = item.icon
            
            return (
                <a
                    key={index}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`group relative text-[0.8em] flex items-center space-x-3 px-4 w-full py-3 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 ${
                        isActive
                            ? 'bg-primary_color text-white shadow-lg shadow-primary_color/25 border-l-4 border-white'
                            : 'text-gray-600 hover:text-primary_color hover:bg-white hover:shadow-md'
                    }`}
                    style={{ paddingLeft: `${level * 20 + 16}px` }}
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
                    <span className={`font-medium transition-all duration-300 relative z-10 ${
                        isActive 
                            ? 'text-white font-semibold' 
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
        }

        if (item.type === 'section') {
            const isExpanded = expandedSections[item.key]
            const hasActiveSubRoute = isSubRouteActive(item.key)
            const IconComponent = item.icon
            
  return (
                <div key={index}>
                    {/* Section Header */}
                    <button
                        onClick={() => toggleSection(item.key)}
                        className={`group relative text-[0.8em] flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 ${
                            hasActiveSubRoute
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 border-l-4 border-white'
                                : 'text-gray-600 hover:text-blue-600 hover:bg-white hover:shadow-md'
                        }`}
                        style={{ paddingLeft: `${level * 20 + 16}px` }}
                    >
                        {/* Active indicator for section */}
                        {hasActiveSubRoute && (
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full animate-pulse"></div>
                        )}
                        
                        {/* Active background glow for section */}
                        {hasActiveSubRoute && (
                            <div className="absolute inset-0 bg-gradient-to-r from-primary_color/20 to-transparent rounded-xl"></div>
                        )}
                        
                        <div className="flex items-center space-x-3 relative z-10">
                            {/* Icon */}
                            <div className={`flex-shrink-0 transition-all duration-300 ${
                                hasActiveSubRoute 
                                    ? 'text-white' 
                                    : 'text-gray-400 group-hover:text-primary_color'
                            }`}>
                                {IconComponent && (
                                    <IconComponent className={`w-5 h-5 transition-all duration-300 ${
                                        hasActiveSubRoute ? 'scale-110' : 'group-hover:scale-105'
                                    }`} />
                                )}
                            </div>
                            
                            {/* Label */}
                            <span className={`font-medium transition-all duration-300 ${
                                hasActiveSubRoute 
                                    ? 'text-white font-semibold' 
                                    : 'text-gray-700 group-hover:text-primary_color'
                            }`}>
                                {item.label}
                            </span>
                        </div>
                        
                        {/* Chevron */}
                        <div className={`transition-all duration-300 relative z-10 ${
                            hasActiveSubRoute 
                                ? 'text-white' 
                                : 'text-gray-400 group-hover:text-primary_color'
                        }`}>
                            {isExpanded ? (
                                <FiChevronDown className="w-4 h-4" />
                            ) : (
                                <FiChevronRight className="w-4 h-4" />
                            )}
                        </div>
                    </button>
                    
                    {/* Section Children */}
                    {isExpanded && (
                        <div className="ml-4 mt-2 space-y-1">
                            {item.children.map((child, childIndex) => 
                                renderNavItem(child, `${index}-${childIndex}`, level + 1)
                            )}
                        </div>
                    )}
    </div>
            )
        }

        return null
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
            <nav className={`fixed lg:relative flex flex-col bg-gradient-to-b from-white  to-gray-50 min-h-screen py-8 w-[85vw] max-w-[300px] px-[1em] shadow-lg border-r border-gray-100 z-50 transition-transform duration-300 ease-in-out ${
                isMobileMenuOpen 
                    ? 'translate-x-0' 
                    : '-translate-x-full lg:translate-x-0'
            }`}>
                <div className="mb-8">
                    <h5 className="mb-2">Admin</h5>
                    <h3 className="mb-2">Dashboard</h3>
                    <div className="w-12 h-1 bg-primary_color rounded-full"></div>
                </div>
                
                <div className="space-y-2 w-full">
                    {navItems.map((item, index) => renderNavItem(item, index))}
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
            </nav>
        </>
  )
}

export default AdminNav
