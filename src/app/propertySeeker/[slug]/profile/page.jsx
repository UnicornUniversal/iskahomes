'use client'

import React, { useState, useEffect } from 'react'
import HomeSeekerHeader from '../../../components/homeSeeker/HomeSeekerHeader'
import { useAuth } from '@/contexts/AuthContext'
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit, FiSave, FiX, FiCamera, FiShield, FiSettings, FiHome, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'

const HomeSeekerProfile = () => {
    const { user, propertySeekerToken } = useAuth()
    const [isEditing, setIsEditing] = useState(false)
    const [activeTab, setActiveTab] = useState('personal')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [userData, setUserData] = useState(null)
    const [formData, setFormData] = useState(null)
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    })
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [changingPassword, setChangingPassword] = useState(false)
    const [passwordError, setPasswordError] = useState('')

    // Fetch property seeker profile data
    useEffect(() => {
        const fetchProfile = async () => {
            if (!propertySeekerToken) return

            setLoading(true)
            try {
                const response = await fetch('/api/property-seekers/profile', {
                    headers: {
                        'Authorization': `Bearer ${propertySeekerToken}`
                    }
                })

                if (response.ok) {
                    const { data } = await response.json()
                    setUserData(data)
                    setFormData(data)
                } else {
                    console.error('Failed to fetch profile')
                }
            } catch (error) {
                console.error('Error fetching profile:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [propertySeekerToken])

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleArrayChange = (field, value) => {
        // Convert comma-separated string to array
        const arrayValue = value ? value.split(',').map(item => item.trim()).filter(item => item) : []
        setFormData(prev => ({
            ...prev,
            [field]: arrayValue
        }))
    }

    const handleNotificationChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            notification_preferences: {
                ...(prev.notification_preferences || {}),
                [field]: value
            }
        }))
    }

    const handleSave = async () => {
        if (!propertySeekerToken) return

        setSaving(true)
        try {
            const updatePayload = {
                name: formData.name,
                phone: formData.phone,
                bio: formData.bio,
                preferred_locations: formData.preferred_locations || [],
                preferred_property_types: formData.preferred_property_types || [],
                preferred_property_categories: formData.preferred_property_categories || [],
                preferred_property_purposes: formData.preferred_property_purposes || [],
                budget_min: formData.budget_min || null,
                budget_max: formData.budget_max || null,
                budget_currency: formData.budget_currency || 'GHS',
                preferred_bedrooms_min: formData.preferred_bedrooms_min || null,
                preferred_bedrooms_max: formData.preferred_bedrooms_max || null,
                preferred_bathrooms_min: formData.preferred_bathrooms_min || null,
                preferred_area_min: formData.preferred_area_min || null,
                preferred_area_max: formData.preferred_area_max || null,
                notification_preferences: formData.notification_preferences || {}
            }

            const response = await fetch('/api/property-seekers/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${propertySeekerToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatePayload)
            })

            if (response.ok) {
                const { data } = await response.json()
                setUserData(data)
                setFormData(data)
        setIsEditing(false)
                alert('Profile updated successfully!')
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to update profile')
            }
        } catch (error) {
            console.error('Error saving profile:', error)
            alert('Error saving profile')
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setFormData(userData)
        setIsEditing(false)
    }

    const handlePasswordChange = async () => {
        if (!propertySeekerToken) return

        setPasswordError('')

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match!')
            return
        }

        if (passwordData.newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters long!')
            return
        }

        setChangingPassword(true)
        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${propertySeekerToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            })

            if (response.ok) {
                alert('Password changed successfully!')
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                })
                setChangingPassword(false)
            } else {
                const error = await response.json()
                setPasswordError(error.error || 'Failed to change password')
            }
        } catch (error) {
            console.error('Error changing password:', error)
            setPasswordError('Error changing password')
        } finally {
            setChangingPassword(false)
        }
    }

    const tabs = [
        { id: 'personal', label: 'Personal Information', icon: FiUser },
        { id: 'contact', label: 'Contact Details', icon: FiMail },
        { id: 'preferences', label: 'Search Preferences', icon: FiHome },
        { id: 'settings', label: 'Settings', icon: FiSettings },
        { id: 'security', label: 'Security', icon: FiShield }
    ]

    if (loading) {
        return (
            <>
                <HomeSeekerHeader />
                <div className="mt-6 lg:mt-8 flex items-center justify-center min-h-[400px]">
                    <p className="text-primary_color/60">Loading profile...</p>
                </div>
            </>
        )
    }

    if (!userData || !formData) {
        return (
            <>
                <HomeSeekerHeader />
                <div className="mt-6 lg:mt-8 flex items-center justify-center min-h-[400px]">
                    <p className="text-primary_color/60">Failed to load profile</p>
                </div>
            </>
        )
    }

    // Parse notification preferences if it's a string
    const notificationPrefs = typeof formData.notification_preferences === 'string' 
        ? JSON.parse(formData.notification_preferences || '{}')
        : (formData.notification_preferences || {})

    // Format created date
    const createdDate = formData.created_at 
        ? new Date(formData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'N/A'

    return (
<>
            <HomeSeekerHeader />
            
            <div className="mt-6 lg:mt-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl lg:text-3xl font-bold text-primary_color mb-2 flex items-center gap-3">
                            <div className="p-2 bg-primary_color/10 rounded-lg">
                                <FiUser className="w-6 h-6 text-primary_color" />
                            </div>
                            Profile Settings
                        </h2>
                        <p className="text-primary_color/60 text-sm">Manage your account information</p>
                    </div>
                    <div className="flex gap-3">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary_color text-white rounded-xl hover:bg-primary_color/90 transition-colors shadow-lg shadow-primary_color/20 font-medium disabled:opacity-50"
                                        >
                                            <FiSave className="w-4 h-4" />
                                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                    className="flex items-center gap-2 px-4 py-2 default_bg text-primary_color rounded-xl hover:bg-primary_color/10 transition-colors border border-primary_color/10 font-medium"
                                        >
                                            <FiX className="w-4 h-4" />
                                            <span>Cancel</span>
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary_color text-white rounded-xl hover:bg-primary_color/90 transition-colors shadow-lg shadow-primary_color/20 font-medium"
                                    >
                                        <FiEdit className="w-4 h-4" />
                                        <span>Edit Profile</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Profile Header */}
                <div className="default_bg rounded-2xl shadow-lg border border-primary_color/10 p-6 lg:p-8 mb-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                <div className="relative">
                                    <img
                                src={formData.profile_picture || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150'}
                                        alt="Profile"
                                className="w-24 h-24 lg:w-28 lg:h-28 rounded-2xl object-cover border-4 border-primary_color/20 shadow-lg"
                                    />
                                    {isEditing && (
                                <button className="absolute bottom-0 right-0 bg-primary_color text-white p-2.5 rounded-xl shadow-lg hover:bg-primary_color/90 transition-colors border-2 border-white">
                                            <FiCamera className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h3 className="text-2xl lg:text-3xl font-bold text-primary_color mb-2">
                                {formData.name || 'Property Seeker'}
                                    </h3>
                            {formData.bio && (
                                <p className="text-primary_color/70 text-base mb-1">{formData.bio}</p>
                            )}
                            <p className="text-sm text-primary_color/60">Property Seeker since {createdDate}</p>
                            {formData.is_verified && (
                                <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                    Verified
                                </span>
                            )}
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                <div className="default_bg rounded-2xl shadow-lg border border-primary_color/10 overflow-hidden">
                    <div className="border-b border-primary_color/10">
                        <nav className="flex flex-wrap gap-2 px-4 lg:px-6 pt-4">
                                    {tabs.map((tab) => {
                                        const IconComponent = tab.icon
                                        return (
                                    <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 ${
                                                    activeTab === tab.id
                                                ? 'bg-primary_color text-white shadow-lg shadow-primary_color/20'
                                                : 'text-primary_color hover:bg-primary_color/10'
                                                }`}
                                            >
                                                <IconComponent className="w-4 h-4" />
                                                <span>{tab.label}</span>
                                    </button>
                                        )
                                    })}
                                </nav>
                            </div>

                    <div className="p-6 lg:p-8">
                                {activeTab === 'personal' && (
                                    <div className="space-y-6">
                                <h3 className="text-xl font-bold text-primary_color mb-6 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-primary_color rounded-full"></div>
                                    Personal Information
                                </h3>
                                        <div className="grid md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-primary_color mb-2">Full Name</label>
                                                <input
                                                    type="text"
                                            value={formData.name || ''}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                                    disabled={!isEditing}
                                            className="w-full px-4 py-3 border border-primary_color/20 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-primary_color outline-none default_bg text-primary_color disabled:opacity-50"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-primary_color mb-2">Bio</label>
                                        <textarea
                                            value={formData.bio || ''}
                                            onChange={(e) => handleInputChange('bio', e.target.value)}
                                                    disabled={!isEditing}
                                            rows={4}
                                            className="w-full px-4 py-3 border border-primary_color/20 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-primary_color outline-none default_bg text-primary_color disabled:opacity-50"
                                            placeholder="Tell us about yourself..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'contact' && (
                                    <div className="space-y-6">
                                <h3 className="text-xl font-bold text-primary_color mb-6 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-primary_color rounded-full"></div>
                                    Contact Details
                                </h3>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                        <label className="block text-sm font-medium text-primary_color mb-2">Email Address</label>
                                                <input
                                                    type="email"
                                            value={formData.email || ''}
                                            disabled
                                            className="w-full px-4 py-3 border border-primary_color/20 rounded-xl default_bg text-primary_color/50 opacity-50 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-primary_color/60 mt-1">Email cannot be changed</p>
                                            </div>
                                            <div>
                                        <label className="block text-sm font-medium text-primary_color mb-2">Phone Number</label>
                                                <input
                                                    type="tel"
                                            value={formData.phone || ''}
                                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                                    disabled={!isEditing}
                                            className="w-full px-4 py-3 border border-primary_color/20 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-primary_color outline-none default_bg text-primary_color disabled:opacity-50"
                                        />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'preferences' && (
                                    <div className="space-y-6">
                                <h3 className="text-xl font-bold text-primary_color mb-6 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-primary_color rounded-full"></div>
                                    Search Preferences
                                </h3>
                                        
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                        <label className="block text-sm font-medium text-primary_color mb-2">Preferred Locations</label>
                                                <textarea
                                            value={(formData.preferred_locations || []).join(', ')}
                                            onChange={(e) => handleArrayChange('preferred_locations', e.target.value)}
                                                    disabled={!isEditing}
                                                    rows={3}
                                            className="w-full px-4 py-3 border border-primary_color/20 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-primary_color outline-none default_bg text-primary_color disabled:opacity-50"
                                                    placeholder="East Legon, Airport Residential, Cantonments"
                                                />
                                            </div>
                                            <div>
                                        <label className="block text-sm font-medium text-primary_color mb-2">Property Types</label>
                                                <textarea
                                            value={(formData.preferred_property_types || []).join(', ')}
                                            onChange={(e) => handleArrayChange('preferred_property_types', e.target.value)}
                                                    disabled={!isEditing}
                                                    rows={3}
                                            className="w-full px-4 py-3 border border-primary_color/20 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-primary_color outline-none default_bg text-primary_color disabled:opacity-50"
                                                    placeholder="Apartment, Villa, Townhouse"
                                                />
                                            </div>
                                            <div>
                                        <label className="block text-sm font-medium text-primary_color mb-2">Budget Range ({formData.budget_currency || 'GHS'})</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={formData.budget_min || ''}
                                                onChange={(e) => handleInputChange('budget_min', e.target.value ? parseFloat(e.target.value) : null)}
                                                disabled={!isEditing}
                                                className="flex-1 px-4 py-3 border border-primary_color/20 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-primary_color outline-none default_bg text-primary_color disabled:opacity-50"
                                                placeholder="Min"
                                            />
                                            <span className="text-primary_color/60 font-medium">to</span>
                                            <input
                                                type="number"
                                                value={formData.budget_max || ''}
                                                onChange={(e) => handleInputChange('budget_max', e.target.value ? parseFloat(e.target.value) : null)}
                                                disabled={!isEditing}
                                                className="flex-1 px-4 py-3 border border-primary_color/20 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-primary_color outline-none default_bg text-primary_color disabled:opacity-50"
                                                placeholder="Max"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary_color mb-2">Bedrooms</label>
                                        <div className="flex items-center gap-3">
                                                    <input
                                                        type="number"
                                                value={formData.preferred_bedrooms_min || ''}
                                                onChange={(e) => handleInputChange('preferred_bedrooms_min', e.target.value ? parseInt(e.target.value) : null)}
                                                        disabled={!isEditing}
                                                className="flex-1 px-4 py-3 border border-primary_color/20 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-primary_color outline-none default_bg text-primary_color disabled:opacity-50"
                                                        placeholder="Min"
                                                    />
                                            <span className="text-primary_color/60 font-medium">to</span>
                                                    <input
                                                        type="number"
                                                value={formData.preferred_bedrooms_max || ''}
                                                onChange={(e) => handleInputChange('preferred_bedrooms_max', e.target.value ? parseInt(e.target.value) : null)}
                                                        disabled={!isEditing}
                                                className="flex-1 px-4 py-3 border border-primary_color/20 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-primary_color outline-none default_bg text-primary_color disabled:opacity-50"
                                                        placeholder="Max"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                        <label className="block text-sm font-medium text-primary_color mb-2">Bathrooms (Min)</label>
                                                <input
                                            type="number"
                                            value={formData.preferred_bathrooms_min || ''}
                                            onChange={(e) => handleInputChange('preferred_bathrooms_min', e.target.value ? parseInt(e.target.value) : null)}
                                                    disabled={!isEditing}
                                            className="w-full px-4 py-3 border border-primary_color/20 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-primary_color outline-none default_bg text-primary_color disabled:opacity-50"
                                            placeholder="Minimum bathrooms"
                                                />
                                            </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary_color mb-2">Area (sq ft)</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={formData.preferred_area_min || ''}
                                                onChange={(e) => handleInputChange('preferred_area_min', e.target.value ? parseFloat(e.target.value) : null)}
                                                disabled={!isEditing}
                                                className="flex-1 px-4 py-3 border border-primary_color/20 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-primary_color outline-none default_bg text-primary_color disabled:opacity-50"
                                                placeholder="Min"
                                            />
                                            <span className="text-primary_color/60 font-medium">to</span>
                                            <input
                                                type="number"
                                                value={formData.preferred_area_max || ''}
                                                onChange={(e) => handleInputChange('preferred_area_max', e.target.value ? parseFloat(e.target.value) : null)}
                                                disabled={!isEditing}
                                                className="flex-1 px-4 py-3 border border-primary_color/20 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-primary_color outline-none default_bg text-primary_color disabled:opacity-50"
                                                placeholder="Max"
                                            />
                                        </div>
                                    </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'settings' && (
                                    <div className="space-y-6">
                                <h3 className="text-xl font-bold text-primary_color mb-6 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-primary_color rounded-full"></div>
                                    Notification Preferences
                                </h3>
                                        <div className="space-y-4">
                                    <div className="flex items-center justify-between default_bg p-4 rounded-xl border border-primary_color/10">
                                        <div>
                                            <h4 className="font-bold text-primary_color">Email Notifications</h4>
                                            <p className="text-sm text-primary_color/60">Receive updates via email</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={notificationPrefs.email_notifications || false}
                                                onChange={(e) => handleNotificationChange('email_notifications', e.target.checked)}
                                                disabled={!isEditing}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary_color/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary_color"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between default_bg p-4 rounded-xl border border-primary_color/10">
                                        <div>
                                            <h4 className="font-bold text-primary_color">SMS Notifications</h4>
                                            <p className="text-sm text-primary_color/60">Receive updates via SMS</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={notificationPrefs.sms_notifications || false}
                                                onChange={(e) => handleNotificationChange('sms_notifications', e.target.checked)}
                                                disabled={!isEditing}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary_color/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary_color"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between default_bg p-4 rounded-xl border border-primary_color/10">
                                        <div>
                                            <h4 className="font-bold text-primary_color">Push Notifications</h4>
                                            <p className="text-sm text-primary_color/60">Receive updates via push notifications</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={notificationPrefs.push_notifications || false}
                                                onChange={(e) => handleNotificationChange('push_notifications', e.target.checked)}
                                                disabled={!isEditing}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary_color/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary_color"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between default_bg p-4 rounded-xl border border-primary_color/10">
                                                <div>
                                            <h4 className="font-bold text-primary_color">Price Drops</h4>
                                            <p className="text-sm text-primary_color/60">Get notified when prices drop</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                checked={notificationPrefs.price_drops || false}
                                                onChange={(e) => handleNotificationChange('price_drops', e.target.checked)}
                                                        disabled={!isEditing}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary_color/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary_color"></div>
                                                </label>
                                            </div>
                                    <div className="flex items-center justify-between default_bg p-4 rounded-xl border border-primary_color/10">
                                                <div>
                                            <h4 className="font-bold text-primary_color">New Listings</h4>
                                            <p className="text-sm text-primary_color/60">Get notified about new listings</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                checked={notificationPrefs.new_listings || false}
                                                onChange={(e) => handleNotificationChange('new_listings', e.target.checked)}
                                                        disabled={!isEditing}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary_color/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary_color"></div>
                                                </label>
                                            </div>
                                    <div className="flex items-center justify-between default_bg p-4 rounded-xl border border-primary_color/10">
                                                <div>
                                            <h4 className="font-bold text-primary_color">Saved Searches</h4>
                                            <p className="text-sm text-primary_color/60">Get notified about saved searches</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                checked={notificationPrefs.saved_searches || false}
                                                onChange={(e) => handleNotificationChange('saved_searches', e.target.checked)}
                                                        disabled={!isEditing}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary_color/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary_color"></div>
                                                </label>
                                            </div>
                                        </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-primary_color mb-6 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-primary_color rounded-full"></div>
                                    Security Settings
                                </h3>
                                            <div className="space-y-4">
                                    <div className="default_bg border border-secondary_color/20 rounded-xl p-5 bg-secondary_color/5">
                                        <h4 className="font-bold text-primary_color mb-2">Change Password</h4>
                                        <p className="text-sm text-primary_color/70 mb-4">Keep your account secure by using a strong password.</p>
                                        
                                        <div className="space-y-4 mt-4">
                                                {passwordError && (
                                                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                                        {passwordError}
                                                    </div>
                                                )}
                                                <div>
                                                    <label className="block text-sm font-medium text-primary_color mb-2">Current Password</label>
                                                    <div className="relative">
                                                        <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary_color/50 w-5 h-5" />
                                                        <input
                                                            type={showPassword.current ? 'text' : 'password'}
                                                            value={passwordData.currentPassword}
                                                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                                            className="w-full pl-10 pr-12 py-3 border border-primary_color/20 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-primary_color outline-none default_bg text-primary_color"
                                                            placeholder="Enter current password"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary_color/50 hover:text-primary_color"
                                                        >
                                                            {showPassword.current ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-primary_color mb-2">New Password</label>
                                                    <div className="relative">
                                                        <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary_color/50 w-5 h-5" />
                                                        <input
                                                            type={showPassword.new ? 'text' : 'password'}
                                                            value={passwordData.newPassword}
                                                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                                            className="w-full pl-10 pr-12 py-3 border border-primary_color/20 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-primary_color outline-none default_bg text-primary_color"
                                                            placeholder="Enter new password"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary_color/50 hover:text-primary_color"
                                                        >
                                                            {showPassword.new ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-primary_color mb-2">Confirm New Password</label>
                                                    <div className="relative">
                                                        <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary_color/50 w-5 h-5" />
                                                        <input
                                                            type={showPassword.confirm ? 'text' : 'password'}
                                                            value={passwordData.confirmPassword}
                                                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                            className="w-full pl-10 pr-12 py-3 border border-primary_color/20 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-primary_color outline-none default_bg text-primary_color"
                                                            placeholder="Confirm new password"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary_color/50 hover:text-primary_color"
                                                        >
                                                            {showPassword.confirm ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={handlePasswordChange}
                                                        disabled={changingPassword}
                                                        className="flex-1 px-4 py-2 bg-secondary_color text-white rounded-xl hover:bg-secondary_color/90 transition-colors font-medium shadow-lg shadow-secondary_color/20 disabled:opacity-50"
                                                    >
                                                        {changingPassword ? 'Changing...' : 'Update Password'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                                                            setPasswordError('')
                                                        }}
                                                        className="px-4 py-2 default_bg text-primary_color rounded-xl hover:bg-primary_color/10 transition-colors border border-primary_color/10 font-medium"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    </>
    )
}

export default HomeSeekerProfile 
