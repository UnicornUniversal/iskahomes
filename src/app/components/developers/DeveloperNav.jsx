'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'
import { userCanAccessRoute, userHasPermission } from '@/lib/permissionHelpers'
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
    FiBarChart2,
    FiTrendingUp,
    FiChevronDown,
    FiChevronRight,
    FiChevronLeft,
    FiChevronUp,
    FiShield
} from 'react-icons/fi'
import Link from 'next/link'

const DeveloperNav = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(true)
    const [isMobile, setIsMobile] = useState(false)
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [isClient, setIsClient] = useState(false)
    const pathname = usePathname()
    const { user, logout } = useAuth()
    
    // Ensure client-side rendering to prevent hydration issues
    useEffect(() => {
        setIsClient(true)
        
        // Check if device is mobile
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024) // lg breakpoint
        }
        
        checkMobile()
        window.addEventListener('resize', checkMobile)
        
        return () => window.removeEventListener('resize', checkMobile)
    }, [])
    
    // Get the developer slug from user profile or use user ID as fallback
    // Only use this after client-side hydration to prevent mismatches
    // For team members, use organization_slug; for developers, use slug
    const developerSlug = isClient ? (
      user?.profile?.organization_slug || 
      user?.profile?.slug || 
      user?.id || 
      'developer'
    ) : 'developer'

    // Helper function to check if user can access route (only for developers/agencies, not agents)
    const canAccess = (routeCategory) => {
        // Agents don't have permissions system
        if (user?.user_type === 'agent') return true
        // For developers and team members, check permissions
        if (user?.user_type === 'developer' || user?.user_type === 'team_member' || user?.user_type === 'agency') {
            return userCanAccessRoute(user, routeCategory)
        }
        return true
    }

    // Build nav items with permission checks
    const allNavItems = [
        {
            label: 'Dashboard',
            href: `/developer/${developerSlug}/dashboard`,
            icon: FiHome,
            permission: 'dashboard'
        },
        {
            label: 'Messages',
            href: `/developer/${developerSlug}/messages`,
            icon: FiMessageSquare,
            permission: 'messages'
        },
        {
            label: 'Leads',
            href: `/developer/${developerSlug}/leads`,
            icon: FiUsers,
            permission: 'leads'
        },
        {
            label: 'Developments',
            href: `/developer/${developerSlug}/developments`,
            icon: FiMapPin,
            permission: 'developments'
        },
        {
            label: 'Units',
            href: `/developer/${developerSlug}/units`,
            icon: FiGrid,
            permission: 'units'
        },
        {
            label: 'Appointments',
            href: `/developer/${developerSlug}/appointments`,
            icon: FiCalendar,
            permission: 'appointments'
        },
        {
            label: 'Team',
            href: `/developer/${developerSlug}/team`,
            icon: FiShield,
            permission: 'team'
        },
        {
            label: 'Sales',
            href: `/developer/${developerSlug}/sales`,
            icon: FiTrendingUp,
            permission: 'sales'
        },
        {
            label: 'Analytics',
            href: `/developer/${developerSlug}/analytics`,
            icon: FiBarChart2,
            hasSubmenu: true,
            permission: 'analytics',
            submenu: [
                {
                    label: 'Properties',
                    href: `/developer/${developerSlug}/analytics/properties`,
                    icon: FiMapPin,
                    permission: 'analytics.view_properties'
                },
                {
                    label: 'Leads',
                    href: `/developer/${developerSlug}/analytics/leads`,
                    icon: FiMessageSquare,
                    permission: 'analytics.view_leads'
                },
                {
                    label: 'Profile & Brand',
                    href: `/developer/${developerSlug}/analytics/profile`,
                    icon: FiUser,
                    permission: 'analytics.view_profile_brand'
                },
            ]
        },
        {
            label: 'Profile',
            href: `/developer/${developerSlug}/profile`,
            icon: FiUser,
            permission: 'profile'
        },
        {
            label: 'Subscriptions',
            href: `/developer/${developerSlug}/subscriptions`,
            icon: FiCreditCard,
            permission: 'subscriptions'
        },
        {
            label: 'Logout',
            href: '#',
            icon: FiLogOut,
            isLogout: true
        },
    ]

    // Filter nav items based on permissions (only for developers/agencies/team members)
    const navItems = allNavItems.filter(item => {
        // Always show logout
        if (item.isLogout) return true
        
        // For agents, show all items (no permission system)
        if (user?.user_type === 'agent') return true
        
        // For developers, agencies, and team members, check permissions
        if (user?.user_type === 'developer' || user?.user_type === 'team_member' || user?.user_type === 'agency') {
            // Check main route permission
            if (!canAccess(item.permission)) return false
            
            // Filter submenu items if it's analytics
            if (item.hasSubmenu && item.submenu) {
                item.submenu = item.submenu.filter(subItem => {
                    if (subItem.permission) {
                        return userHasPermission(user, subItem.permission)
                    }
                    return true
                })
                // Only show analytics if it has at least one submenu item
                return item.submenu.length > 0
            }
            
            return true
        }
        
        // Default: show item
        return true
    })

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
        // On mobile, when opening menu, set collapsed to false
        if (!isMobileMenuOpen && isMobile) {
            setIsCollapsed(false)
        }
    }

    // Handle hover for expand/collapse on desktop
    const handleMouseEnter = () => {
        if (!isMobile) {
            setIsCollapsed(false)
        }
    }

    const handleMouseLeave = () => {
        if (!isMobile) {
            setIsCollapsed(true)
        }
    }

    const toggleAnalytics = () => {
        setIsAnalyticsOpen(!isAnalyticsOpen)
    }

    const handleLogout = async () => {
        if (isLoggingOut) return; // Prevent multiple clicks
        
        setIsLoggingOut(true);
        
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
            setIsMobileMenuOpen(false);
        }
    }

    // Check if any analytics submenu item is active
    const isAnalyticsActive = pathname.startsWith(`/developer/${developerSlug}/analytics`)

    // Auto-open analytics submenu when on analytics pages
    useEffect(() => {
        if (isAnalyticsActive) {
            setIsAnalyticsOpen(true)
        }
    }, [isAnalyticsActive])

    // Update CSS custom property for navigation width
    useEffect(() => {
        if (isClient) {
            // Only set nav width on large devices (lg and up)
            if (window.innerWidth >= 1024) {
                const navWidth = isCollapsed ? '80px' : '300px'
                document.documentElement.style.setProperty('--nav-width', navWidth)
            } else {
                // Set to 0 on small and medium devices
                document.documentElement.style.setProperty('--nav-width', '0px')
            }
        }
    }, [isCollapsed, isClient, isMobile])

    return (
        <>
            {/* Only render after client-side hydration to prevent hydration mismatches */}
            {!isClient ? (
                <div className="fixed rounded-sm border-primary_color lg:fixed flex flex-col bg-gradient-to-b from-white to-gray-50 h-auto lg:max-h-[calc(100vh-7rem)] py-4 pb-8 px-[1em] shadow-lg border border-gray-100 z-50 w-[85vw] min-w-[300px] max-w-[300px] lg:w-[300px] lg:min-w-[300px] top-16 bottom-2 lg:top-28 left-2 overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {/* <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h5 className="mb-2">Developer </h5>
                            <h3 className="mb-2">Dashboard</h3>
                            <div className="w-12 h-1 bg-primary_color rounded-full"></div>
                        </div>
                    </div> */}
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color"></div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Mobile Menu Toggle Button - Only visible on small and medium devices */}
                    <button
                        onClick={toggleMobileMenu}
                        className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-primary_color text-white rounded-lg shadow-lg hover:bg-primary_color/90 transition-all duration-300"
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
                            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                            onClick={toggleMobileMenu}
                        />
                    )}

                    {/* Navigation Menu - Only render on large devices or when mobile menu is open */}
                    {(isMobileMenuOpen || !isMobile) && (
                        <nav 
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            className={`fixed rounded-sm border-primary_color bg-white/95 lg:bg-gradient-to-b lg:from-white lg:to-gray-50 flex flex-col h-screen lg:h-auto lg:max-h-[calc(100vh-7rem)] py-4 pb-8 px-[1em] shadow-lg border border-gray-100 z-[60] transition-all duration-300 ease-in-out top-0 lg:top-28 left-0 lg:left-2 overflow-hidden lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
                                isMobileMenuOpen 
                                    ? 'translate-x-0' 
                                    : '-translate-x-full lg:translate-x-0'
                            } ${
                                isCollapsed ? 'w-[80vw] min-w-[80px] max-w-[80px] lg:w-[80px] lg:min-w-[80px]' : 'w-[80vw] min-w-[300px] max-w-[300px] lg:w-[300px] lg:min-w-[300px]'
                            }`}>
                {/* ISKA Logo - Only visible on small devices, bigger and left-aligned */}
                <div className="mb-4 lg:hidden flex items-center justify-start pt-4">
                    <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                        <img src="/iska-dark.png" alt="ISKA Logo" className='w-[100px]' />
                    </Link>
                </div>

                {/* Cancel Button - Upper right on mobile */}
                <button
                    onClick={toggleMobileMenu}
                    className="lg:hidden absolute top-4 right-4 flex items-center justify-center w-8 h-8 bg-primary_color/10 hover:bg-primary_color/20 text-primary_color rounded-lg transition-all duration-300"
                    aria-label="Close navigation"
                >
                    <FiX className="w-4 h-4" />
                </button>

                <div className="mb-4 flex items-center justify-between">
                    {!isCollapsed && (
                        <div>
                            <h5 className="mb-2">Developer </h5>
                            <h3 className="mb-2">Dashboard</h3>
                            <div className="w-12 h-1 bg-primary_color rounded-full"></div>
                        </div>
                    )}
                </div>
                
                <div className="space-y-2 w-full flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-h-0">
                    {navItems.map((item, index) => {
                        const IconComponent = item.icon
                        // Check if current pathname matches this nav item
                        const isActive = pathname === item.href
                        const isAnalyticsItem = item.hasSubmenu && item.label === 'Analytics'
                        const isLogoutItem = item.isLogout
                        
                        return (
                            <div key={index}>
                                {/* Main Navigation Item */}
                                {isLogoutItem ? (
                                    <button
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                        className={`group relative text-[0.8em] flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} w-full py-3 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 !text-gray-600 hover:!text-red-600 hover:!bg-red-50 hover:shadow-md ${
                                            isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                        title={isCollapsed ? (isLoggingOut ? "Logging out..." : "Logout") : undefined}
                                    >
                                        {/* Icon */}
                                        <FiLogOut className={`w-5 h-5 !text-gray-400 group-hover:!text-red-600 transition-all duration-300 ${
                                            isLoggingOut ? 'animate-spin' : ''
                                        }`} />
                                        {/* Label */}
                                        {!isCollapsed && (
                                            <span className={`font-medium transition-all duration-300 !text-gray-700 group-hover:!text-red-600`}>
                                                {isLoggingOut ? 'Logging out...' : 'Logout'}
                                            </span>
                                        )}
                                    </button>
                                ) : isAnalyticsItem ? (
                                    <button
                                        onClick={toggleAnalytics}
                                        className={`group relative text-[0.8em] flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} w-full py-3 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 ${
                                            isAnalyticsActive
                                                ? 'bg-primary_color text-white shadow-lg shadow-primary_color/25 border-l-4 border-white'
                                                : 'text-gray-600 hover:text-primary_color hover:bg-white hover:shadow-md'
                                        }`}
                                        title={isCollapsed ? item.label : undefined}
                                    >
                                        {/* Active indicator */}
                                        {isAnalyticsActive && (
                                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full animate-pulse"></div>
                                        )}
                                        
                                        {/* Active background glow */}
                                        {isAnalyticsActive && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-primary_color/20 to-transparent rounded-xl"></div>
                                        )}
                                        
                                        {/* Icon */}
                                        <div className={`flex-shrink-0 transition-all duration-300 relative z-10 ${
                                            isAnalyticsActive 
                                                ? 'text-white' 
                                                : 'text-gray-400 group-hover:text-primary_color'
                                        }`}>
                                            {IconComponent && (
                                                <IconComponent className={`w-5 h-5 transition-all duration-300 ${
                                                    isAnalyticsActive ? 'scale-110' : 'group-hover:scale-105'
                                                }`} />
                                            )}
                                        </div>
                                        
                                        {/* Label */}
                                        {!isCollapsed && (
                                            <span className={`font-medium transition-all duration-300 relative z-10 ${
                                                isAnalyticsActive 
                                                    ? 'text-white font-semibold' 
                                                    : 'text-gray-700 group-hover:text-primary_color'
                                            }`}>
                                                {item.label}
                                            </span>
                                        )}
                                        
                                        {/* Chevron Icon */}
                                        {!isCollapsed && (
                                            <div className={`ml-auto transition-all duration-300 ${
                                                isAnalyticsActive ? 'text-white' : 'text-gray-400'
                                            }`}>
                                                {isAnalyticsOpen ? (
                                                    <FiChevronDown className="w-4 h-4" />
                                                ) : (
                                                    <FiChevronRight className="w-4 h-4" />
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Hover effect */}
                                        {!isAnalyticsActive && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-primary_color/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        )}
                                    </button>
                                ) : (
                                    <a
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
                                )}

                                {/* Analytics Submenu */}
                                {isAnalyticsItem && isAnalyticsOpen && !isCollapsed && (
                                    <div className="ml-6 mt-2 space-y-1">
                                        {item.submenu.map((subItem, subIndex) => {
                                            const SubIconComponent = subItem.icon
                                            const isSubActive = pathname === subItem.href
                                            
                                            return (
                                                <a
                                                    key={subIndex}
                                                    href={subItem.href}
                                                    onClick={() => {
                                                        setIsMobileMenuOpen(false)
                                                        setIsAnalyticsOpen(false)
                                                    }}
                                                    className={`group relative text-[0.75em] flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 ${
                                                        isSubActive
                                                            ? 'bg-primary_color/10 text-primary_color border-l-2 border-primary_color'
                                                            : 'text-gray-500 hover:text-primary_color hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {/* Icon */}
                                                    <div className={`flex-shrink-0 transition-all duration-300 ${
                                                        isSubActive 
                                                            ? 'text-primary_color' 
                                                            : 'text-gray-400 group-hover:text-primary_color'
                                                    }`}>
                                                        {SubIconComponent && (
                                                            <SubIconComponent className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                    
                                                    {/* Label */}
                                                    <span className={`font-medium transition-all duration-300 ${
                                                        isSubActive 
                                                            ? 'text-primary_color font-semibold' 
                                                            : 'text-gray-600 group-hover:text-primary_color'
                                                    }`}>
                                                        {subItem.label}
                                                    </span>
                                                </a>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                
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
                    )}
                </>
            )}
        </>
    )
}

export default DeveloperNav
