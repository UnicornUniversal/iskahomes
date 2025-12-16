'use client'

import React, { useState } from 'react'
import Layout1 from '../../../../layout/Layout1'
import HomeOwnerHeader from '@/app/components/homeOwner/HomeOwnerHeader'
import HomeOwnerNav from '@/app/components/homeOwner/HomeOwnerNav'
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit, FiSave, FiX, FiCamera, FiShield, FiSettings } from 'react-icons/fi'

const HomeOwnerProfile = () => {
    const [isEditing, setIsEditing] = useState(false)
    const [activeTab, setActiveTab] = useState('personal')

    // Dummy user data
    const [userData, setUserData] = useState({
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@email.com",
        phone: "+233 24 123 4567",
        address: "123 Main Street, East Legon, Accra",
        dateOfBirth: "1985-03-15",
        occupation: "Software Engineer",
        company: "Tech Solutions Ltd",
        emergencyContact: {
            name: "Jane Smith",
            relationship: "Spouse",
            phone: "+233 20 987 6543"
        },
        preferences: {
            notifications: {
                email: true,
                sms: false,
                push: true
            },
            privacy: {
                profileVisibility: "public",
                contactVisibility: "agents_only"
            }
        }
    })

    const [formData, setFormData] = useState(userData)

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleNestedChange = (parent, field, value) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: value
            }
        }))
    }

    const handleSave = () => {
        setUserData(formData)
        setIsEditing(false)
        // Here you would typically make an API call to save the data
    }

    const handleCancel = () => {
        setFormData(userData)
        setIsEditing(false)
    }

    const tabs = [
        { id: 'personal', label: 'Personal Information', icon: FiUser },
        { id: 'contact', label: 'Contact Details', icon: FiMail },
        { id: 'preferences', label: 'Preferences', icon: FiSettings },
        { id: 'security', label: 'Security', icon: FiShield }
    ]

    return (
        <Layout1>
            <div className="flex">
                <HomeOwnerNav active={5} />
                <div className="flex-1 p-8">
                    <HomeOwnerHeader />
                    
                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Profile Settings</h2>
                            <div className="flex space-x-3">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={handleSave}
                                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <FiSave className="w-4 h-4" />
                                            <span>Save Changes</span>
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                        >
                                            <FiX className="w-4 h-4" />
                                            <span>Cancel</span>
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center space-x-2 px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors"
                                    >
                                        <FiEdit className="w-4 h-4" />
                                        <span>Edit Profile</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Profile Header */}
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                            <div className="flex items-center space-x-6">
                                <div className="relative">
                                    <img
                                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
                                        alt="Profile"
                                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                                    />
                                    {isEditing && (
                                        <button className="absolute bottom-0 right-0 bg-primary_color text-white p-2 rounded-full shadow-lg hover:bg-primary_color/90 transition-colors">
                                            <FiCamera className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800">
                                        {userData.firstName} {userData.lastName}
                                    </h3>
                                    <p className="text-gray-600">{userData.occupation} at {userData.company}</p>
                                    <p className="text-sm text-gray-500">HomeOwner since January 2023</p>
                                </div>
                            </div>
                        </div>
<br/>
                        {/* Tabs */}
                        <div className="bg-white rounded-xl shadow-lg">
                            <div className="border-b border-gray-200">
                                <nav className="flex space-x-8 px-6">
                                    {tabs.map((tab) => {
                                        const IconComponent = tab.icon
                                        return (
                                            <span
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`flex cursor-pointer items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                                    activeTab === tab.id
                                                        ? 'border-primary_color text-primary_color'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                }`}
                                            >
                                                <IconComponent className="w-4 h-4" />
                                                <span>{tab.label}</span>
                                            </span>
                                        )
                                    })}
                                </nav>
                                <br/>
                            </div>

                            <div className="p-6">
                                {activeTab === 'personal' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.firstName}
                                                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                                                    disabled={!isEditing}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent disabled:bg-gray-100"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.lastName}
                                                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                                                    disabled={!isEditing}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent disabled:bg-gray-100"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                                                <input
                                                    type="date"
                                                    value={formData.dateOfBirth}
                                                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                                    disabled={!isEditing}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent disabled:bg-gray-100"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                                                <input
                                                    type="text"
                                                    value={formData.occupation}
                                                    onChange={(e) => handleInputChange('occupation', e.target.value)}
                                                    disabled={!isEditing}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent disabled:bg-gray-100"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                                                <input
                                                    type="text"
                                                    value={formData.company}
                                                    onChange={(e) => handleInputChange('company', e.target.value)}
                                                    disabled={!isEditing}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent disabled:bg-gray-100"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'contact' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Details</h3>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                                    disabled={!isEditing}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent disabled:bg-gray-100"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                                    disabled={!isEditing}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent disabled:bg-gray-100"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                                <textarea
                                                    value={formData.address}
                                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                                    disabled={!isEditing}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent disabled:bg-gray-100"
                                                />
                                            </div>
                                        </div>

                                        <div className="border-t pt-6">
                                            <h4 className="text-md font-semibold text-gray-800 mb-4">Emergency Contact</h4>
                                            <div className="grid md:grid-cols-3 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                                    <input
                                                        type="text"
                                                        value={formData.emergencyContact.name}
                                                        onChange={(e) => handleNestedChange('emergencyContact', 'name', e.target.value)}
                                                        disabled={!isEditing}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent disabled:bg-gray-100"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                                                    <input
                                                        type="text"
                                                        value={formData.emergencyContact.relationship}
                                                        onChange={(e) => handleNestedChange('emergencyContact', 'relationship', e.target.value)}
                                                        disabled={!isEditing}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent disabled:bg-gray-100"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                                    <input
                                                        type="tel"
                                                        value={formData.emergencyContact.phone}
                                                        onChange={(e) => handleNestedChange('emergencyContact', 'phone', e.target.value)}
                                                        disabled={!isEditing}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent disabled:bg-gray-100"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'preferences' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Preferences</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium text-gray-800">Email Notifications</h4>
                                                    <p className="text-sm text-gray-600">Receive updates via email</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.preferences.notifications.email}
                                                        onChange={(e) => handleNestedChange('preferences', 'notifications', {
                                                            ...formData.preferences.notifications,
                                                            email: e.target.checked
                                                        })}
                                                        disabled={!isEditing}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary_color/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary_color"></div>
                                                </label>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium text-gray-800">SMS Notifications</h4>
                                                    <p className="text-sm text-gray-600">Receive updates via SMS</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.preferences.notifications.sms}
                                                        onChange={(e) => handleNestedChange('preferences', 'notifications', {
                                                            ...formData.preferences.notifications,
                                                            sms: e.target.checked
                                                        })}
                                                        disabled={!isEditing}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary_color/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary_color"></div>
                                                </label>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium text-gray-800">Push Notifications</h4>
                                                    <p className="text-sm text-gray-600">Receive updates via push notifications</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.preferences.notifications.push}
                                                        onChange={(e) => handleNestedChange('preferences', 'notifications', {
                                                            ...formData.preferences.notifications,
                                                            push: e.target.checked
                                                        })}
                                                        disabled={!isEditing}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary_color/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary_color"></div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="border-t pt-6">
                                            <h4 className="text-md font-semibold text-gray-800 mb-4">Privacy Settings</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Visibility</label>
                                                    <select
                                                        value={formData.preferences.privacy.profileVisibility}
                                                        onChange={(e) => handleNestedChange('preferences', 'privacy', {
                                                            ...formData.preferences.privacy,
                                                            profileVisibility: e.target.value
                                                        })}
                                                        disabled={!isEditing}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent disabled:bg-gray-100"
                                                    >
                                                        <option value="public">Public</option>
                                                        <option value="private">Private</option>
                                                        <option value="agents_only">Agents Only</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Visibility</label>
                                                    <select
                                                        value={formData.preferences.privacy.contactVisibility}
                                                        onChange={(e) => handleNestedChange('preferences', 'privacy', {
                                                            ...formData.preferences.privacy,
                                                            contactVisibility: e.target.value
                                                        })}
                                                        disabled={!isEditing}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent disabled:bg-gray-100"
                                                    >
                                                        <option value="public">Public</option>
                                                        <option value="agents_only">Agents Only</option>
                                                        <option value="private">Private</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'security' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Security Settings</h3>
                                        <div className="space-y-4">
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                <h4 className="font-medium text-yellow-800 mb-2">Change Password</h4>
                                                <p className="text-sm text-yellow-700 mb-3">Keep your account secure by using a strong password.</p>
                                                <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                                                    Change Password
                                                </button>
                                            </div>
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <h4 className="font-medium text-blue-800 mb-2">Two-Factor Authentication</h4>
                                                <p className="text-sm text-blue-700 mb-3">Add an extra layer of security to your account.</p>
                                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                                    Enable 2FA
                                                </button>
                                            </div>
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                                <h4 className="font-medium text-red-800 mb-2">Delete Account</h4>
                                                <p className="text-sm text-red-700 mb-3">Permanently delete your account and all associated data.</p>
                                                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                                    Delete Account
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout1>
    )
}

export default HomeOwnerProfile 