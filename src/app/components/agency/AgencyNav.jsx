'use client'

import React, { useState, useEffect } from 'react'
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
    FiTrendingUp,
    FiLogOut,
    FiShield,
    FiActivity,
    FiChevronDown,
    FiChevronRight,
    FiGitBranch,
    FiPercent
} from 'react-icons/fi'
import { userCanAccessRoute, userHasPermission } from '@/lib/permissionHelpers'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'

const AgencyNav = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [openSubmenus, setOpenSubmenus] = useState({ Leads: false, Sales: false })
    const [isClient, setIsClient] = useState(false)
    const pathname = usePathname()
    const { user, logout } = useAuth()

    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        if (pathname?.includes('/leads')) {
            setOpenSubmenus((prev) => ({ ...prev, Leads: true }))
        }
        if (pathname?.includes('/sales')) {
            setOpenSubmenus((prev) => ({ ...prev, Sales: true }))
        }
    }, [pathname])

    // Extract slug from pathname or user profile (team members use organization_slug)
    const getSlugFromPath = () => {
        const parts = pathname?.split('/') || []
        if (parts.length >= 3 && parts[1] === 'agency') {
            return parts[2]
        }
        return null
    }

    const slug = isClient
        ? (user?.profile?.organization_slug || getSlugFromPath() || user?.profile?.slug || 'agency')
        : (getSlugFromPath() || 'agency')

    const canAccess = (routeCategory) => {
        if (user?.user_type === 'agent') return true
        if (user?.user_type === 'agency' || user?.user_type === 'team_member') {
            return userCanAccessRoute(user, routeCategory)
        }
        return true
    }

    const allNavItems = [
        {
            label: 'Dashboard',
            href: `/agency/${slug}/dashboard`,
            icon: FiHome,
            permission: 'dashboard'
        },
        {
            label: 'Agents',
            href: `/agency/${slug}/agents`,
            icon: FiUsers,
            permission: 'agents'
        },
        {
            label: 'Properties',
            href: `/agency/${slug}/properties`,
            icon: FiMapPin,
            permission: 'listings'
        },
        {
            label: 'Appointments',
            href: `/agency/${slug}/appointments`,
            icon: FiCalendar,
            permission: 'appointments'
        },
        {
            label: 'Messages',
            href: `/agency/${slug}/messages`,
            icon: FiMessageSquare,
            permission: 'messages'
        },
        {
            label: 'Leads',
            href: `/agency/${slug}/leads`,
            icon: FiTrendingUp,
            hasSubmenu: true,
            permission: 'leads',
            submenu: [
                {
                    label: 'Lead Management',
                    href: `/agency/${slug}/leads`,
                    icon: FiTrendingUp,
                    permission: 'leads.view'
                },
                {
                    label: 'Leads Pipeline',
                    href: `/agency/${slug}/leads/leadsPipeline`,
                    icon: FiGitBranch,
                    permission: 'leads.update_status'
                }
            ]
        },
        {
            label: 'Analytics',
            href: `/agency/${slug}/analytics/overview`,
            icon: FiBarChart2,
            permission: 'analytics'
        },
        {
            label: 'Sales',
            href: `/agency/${slug}/sales`,
            icon: FiCreditCard,
            hasSubmenu: true,
            permission: 'sales',
            submenu: [
                {
                    label: 'Sales Statistics',
                    href: `/agency/${slug}/sales`,
                    icon: FiTrendingUp,
                    permission: 'sales.view'
                },
                {
                    label: 'Commission Rates',
                    href: `/agency/${slug}/sales/commissionRate`,
                    icon: FiPercent,
                    permission: 'agents.manage_commission'
                }
            ]
        },
        {
            label: 'Subscriptions',
            href: `/agency/${slug}/subscriptions`,
            icon: FiCreditCard,
            permission: 'subscriptions'
        },
        {
            label: 'Team',
            href: `/agency/${slug}/team`,
            icon: FiShield,
            permission: 'team'
        },
        {
            label: 'Audit',
            href: `/agency/${slug}/audit`,
            icon: FiActivity,
            permission: 'audit_trail'
        },
        {
            label: 'Profile',
            href: `/agency/${slug}/profile`,
            icon: FiUser,
            permission: 'profile'
        }
    ]

    const navItems = allNavItems
        .map((item) => {
            if (!item.hasSubmenu || !item.submenu) return item
            return {
                ...item,
                submenu: item.submenu.filter((subItem) => {
                    if (!subItem.permission) return true
                    return userHasPermission(user, subItem.permission)
                })
            }
        })
        .filter((item) => {
            if (user?.user_type === 'agent') return true
            if (user?.user_type === 'agency' || user?.user_type === 'team_member') {
                if (!canAccess(item.permission)) return false
                if (item.hasSubmenu && item.submenu) {
                    return item.submenu.length > 0
                }
                return true
            }
            return true
        })

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }

    const isActive = (href) => {
        if (href.includes('/dashboard')) {
            return pathname === href
        }
        return pathname === href || pathname?.startsWith(href + '/')
    }

    const toggleSubmenu = (label) => {
        setOpenSubmenus((prev) => ({ ...prev, [label]: !prev[label] }))
    }

    const isSubmenuSectionActive = (label) => {
        if (label === 'Leads') return pathname?.includes(`/agency/${slug}/leads`)
        if (label === 'Sales') return pathname?.includes(`/agency/${slug}/sales`)
        return false
    }

    const isSubItemActive = (subItem, parentLabel) => {
        const leadsBase = `/agency/${slug}/leads`
        const pipelineHref = `${leadsBase}/leadsPipeline`
        const salesBase = `/agency/${slug}/sales`
        const commissionHref = `${salesBase}/commissionRate`

        if (parentLabel === 'Leads') {
            if (subItem.href === leadsBase) {
                return (
                    pathname === leadsBase ||
                    (pathname?.startsWith(`${leadsBase}/`) && !pathname?.startsWith(pipelineHref))
                )
            }
            if (subItem.href === pipelineHref) {
                return pathname === pipelineHref || pathname?.startsWith(`${pipelineHref}/`)
            }
        }

        if (parentLabel === 'Sales') {
            if (subItem.href === salesBase) {
                return pathname === salesBase
            }
            if (subItem.href === commissionHref) {
                return pathname === commissionHref || pathname?.startsWith(`${commissionHref}/`)
            }
        }

        return pathname === subItem.href
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
            {/* Mobile Menu Toggle Button */}
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

            {/* Navigation Menu */}
            <nav className={`fixed lg:sticky lg:top-0 flex flex-col bg-white min-h-screen py-8 w-[85vw] max-w-[280px] px-6 h-screen max-h-screen shadow-lg border-r border-gray-100 z-50 transition-transform duration-300 ease-in-out ${
                isMobileMenuOpen 
                    ? 'translate-x-0' 
                    : '-translate-x-full lg:translate-x-0'
            }`}>
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
                    <h5 className="text-sm text-gray-500 mb-2 font-medium">Agency</h5>
                    <h3 className="text-2xl font-bold text-primary_color mb-2">Dashboard</h3>
                    <div className="w-12 h-1 bg-secondary_color rounded-full"></div>
                </div>
                
                {/* Scrollable nav area */}
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                <div className="space-y-2 w-full">
                    {navItems.map((item, index) => {
                        const IconComponent = item.icon
                        const hasSubmenu = item.hasSubmenu && item.submenu?.length
                        const isSubmenuOpen = openSubmenus[item.label]
                        const sectionActive = hasSubmenu
                            ? isSubmenuSectionActive(item.label)
                            : isActive(item.href)

                        return (
                            <div key={index}>
                                {hasSubmenu ? (
                                    <button
                                        type="button"
                                        onClick={() => toggleSubmenu(item.label)}
                                        className={`group relative text-sm flex items-center space-x-3 px-4 w-full py-3 rounded-xl transition-all duration-300 ease-in-out ${
                                            sectionActive
                                                ? 'bg-primary_color text-white shadow-lg shadow-primary_color/25'
                                                : 'text-gray-600 hover:text-primary_color hover:bg-primary_color/5'
                                        }`}
                                    >
                                        {sectionActive && (
                                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-secondary_color rounded-r-full" />
                                        )}
                                        <div className={`flex-shrink-0 ${sectionActive ? 'text-white' : 'text-gray-400 group-hover:text-primary_color'}`}>
                                            <IconComponent className="w-5 h-5" />
                                        </div>
                                        <span className={`font-medium flex-1 text-left ${sectionActive ? 'text-white' : 'text-gray-700 group-hover:text-primary_color'}`}>
                                            {item.label}
                                        </span>
                                        <div className={sectionActive ? 'text-white' : 'text-gray-400'}>
                                            {isSubmenuOpen ? (
                                                <FiChevronDown className="w-4 h-4" />
                                            ) : (
                                                <FiChevronRight className="w-4 h-4" />
                                            )}
                                        </div>
                                    </button>
                                ) : (
                                    <Link
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`group relative text-sm flex items-center space-x-3 px-4 w-full py-3 rounded-xl transition-all duration-300 ease-in-out ${
                                            isActive(item.href)
                                                ? 'bg-primary_color text-white shadow-lg shadow-primary_color/25'
                                                : 'text-gray-600 hover:text-primary_color hover:bg-primary_color/5'
                                        }`}
                                    >
                                        {isActive(item.href) && (
                                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-secondary_color rounded-r-full" />
                                        )}
                                        <div className={`flex-shrink-0 ${isActive(item.href) ? 'text-white' : 'text-gray-400 group-hover:text-primary_color'}`}>
                                            <IconComponent className="w-5 h-5" />
                                        </div>
                                        <span className={`font-medium ${isActive(item.href) ? 'text-white' : 'text-gray-700 group-hover:text-primary_color'}`}>
                                            {item.label}
                                        </span>
                                    </Link>
                                )}

                                {hasSubmenu && isSubmenuOpen && (
                                    <div className="ml-6 mt-1 space-y-1">
                                        {item.submenu.map((subItem, subIndex) => {
                                            const SubIcon = subItem.icon
                                            const subActive = isSubItemActive(subItem, item.label)
                                            return (
                                                <Link
                                                    key={subIndex}
                                                    href={subItem.href}
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className={`text-sm flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-300 ${
                                                        subActive
                                                            ? 'bg-primary_color/10 text-primary_color border-l-2 border-primary_color'
                                                            : 'text-gray-500 hover:text-primary_color hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <SubIcon className={`w-4 h-4 flex-shrink-0 ${subActive ? 'text-primary_color' : 'text-gray-400'}`} />
                                                    <span className={`font-medium ${subActive ? 'text-primary_color' : ''}`}>
                                                        {subItem.label}
                                                    </span>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Logout Button */}
                <div className="mt-4 mb-4">
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="group relative text-sm flex items-center space-x-3 px-4 w-full py-3 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 bg-red-600 hover:bg-red-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {/* Icon */}
                        <FiLogOut className="w-5 h-5" />
                        {/* Label */}
                        <span className="font-medium">
                            {isLoggingOut ? 'Logging out...' : 'Logout'}
                        </span>
                    </button>
                </div>

                {/* Agency Info Footer */}
                {/* <div className="pt-6 pb-4 border-t border-gray-200">
                    <div className="px-4 py-3 bg-primary_color/5 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Agency Name</p>
                        <p className="text-sm font-semibold text-primary_color">Premier Realty</p>
                    </div>
                </div> */}
                </div>
            </nav>
        </>
    )
}

export default AgencyNav

