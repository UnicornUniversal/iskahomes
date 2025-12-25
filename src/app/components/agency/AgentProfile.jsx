'use client'

import React, { useState, useEffect } from 'react'
import { FiUser, FiMail, FiPhone, FiCalendar, FiCheckCircle, FiXCircle, FiFileText, FiMapPin, FiCamera, FiEdit3, FiSave, FiX, FiLock, FiEye, FiEyeOff, FiPlus, FiTrash2, FiAward, FiGlobe as FiGlobeIcon } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'
import Image from 'next/image'

export default function AgentProfile({ agent, loading, isEditable = false, onUpdate }) {
  const { user, agentToken, agencyToken } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({})
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [achievements, setAchievements] = useState([])
  const [languages, setLanguages] = useState([])
  const [newAchievement, setNewAchievement] = useState('')
  const [newLanguage, setNewLanguage] = useState('')
  const [profileImageFile, setProfileImageFile] = useState(null)
  const [coverImageFile, setCoverImageFile] = useState(null)
  const [profileImagePreview, setProfileImagePreview] = useState(null)
  const [coverImagePreview, setCoverImagePreview] = useState(null)

  // Initialize form data when agent data changes
  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name || '',
        email: agent.email || '',
        phone: agent.phone || '',
        secondary_email: agent.secondary_email || '',
        secondary_phone: agent.secondary_phone || '',
        bio: agent.bio || '',
        description: agent.description || '',
        license_number: agent.license_number || agent.licence_number || '',
        social_media: agent.social_media || {}
      })

      // Parse achievements and languages from JSONB
      if (agent.achievements) {
        try {
          const parsed = typeof agent.achievements === 'string' 
            ? JSON.parse(agent.achievements) 
            : agent.achievements
          setAchievements(Array.isArray(parsed) ? parsed : [])
        } catch (e) {
          setAchievements([])
        }
      } else {
        setAchievements([])
      }

      if (agent.languages) {
        try {
          const parsed = typeof agent.languages === 'string' 
            ? JSON.parse(agent.languages) 
            : agent.languages
          setLanguages(Array.isArray(parsed) ? parsed : [])
        } catch (e) {
          setLanguages([])
        }
      } else {
        setLanguages([])
      }

      // Set image previews
      if (agent.profile_image) {
        const img = typeof agent.profile_image === 'string' 
          ? { url: agent.profile_image } 
          : agent.profile_image
        setProfileImagePreview(img.url || img)
      }

      if (agent.cover_image) {
        const img = typeof agent.cover_image === 'string' 
          ? { url: agent.cover_image } 
          : agent.cover_image
        setCoverImagePreview(img.url || img)
      }
    }
  }, [agent])

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'AG'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric' 
    })
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    if (type === 'profile') {
      setProfileImageFile(file)
      setProfileImagePreview(URL.createObjectURL(file))
    } else {
      setCoverImageFile(file)
      setCoverImagePreview(URL.createObjectURL(file))
    }
  }

  const handleAddAchievement = () => {
    if (!newAchievement.trim()) return
    setAchievements(prev => [...prev, newAchievement.trim()])
    setNewAchievement('')
  }

  const handleRemoveAchievement = (index) => {
    setAchievements(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddLanguage = () => {
    if (!newLanguage.trim()) return
    setLanguages(prev => [...prev, newLanguage.trim()])
    setNewLanguage('')
  }

  const handleRemoveLanguage = (index) => {
    setLanguages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSaveProfile = async () => {
    if (!isEditable) return

    setSaving(true)
    try {
      const token = agentToken || user?.token
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const updateData = {
        ...formData,
        achievements: achievements,
        languages: languages
      }

      // Handle file uploads
      const formDataToSend = new FormData()
      formDataToSend.append('data', JSON.stringify(updateData))

      if (profileImageFile) {
        formDataToSend.append('profileImage', profileImageFile)
      }

      if (coverImageFile) {
        formDataToSend.append('coverImage', coverImageFile)
      }

      const response = await fetch('/api/agents/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Profile updated successfully!')
        setIsEditing(false)
        if (onUpdate) {
          onUpdate(result.data)
        }
      } else {
        toast.error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Error saving profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!isEditable) return

    setPasswordError('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match!')
      return
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long!')
      return
    }

    setSaving(true)
    try {
      const token = agentToken || user?.token
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      if (response.ok) {
        toast.success('Password changed successfully!')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setIsChangingPassword(false)
      } else {
        const error = await response.json()
        setPasswordError(error.error || 'Failed to change password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      setPasswordError('Error changing password')
    } finally {
      setSaving(false)
    }
  }

  const handleDecommission = async () => {
    if (!agencyToken || !user?.id) return

    if (!confirm('Are you sure you want to decommission this agent? This action cannot be undone.')) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/agencies/agents/${agent.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${agencyToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          commission_status: false,
          agent_status: 'inactive'
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Agent decommissioned successfully')
        if (onUpdate) {
          onUpdate(result.data)
        }
      } else {
        toast.error(result.error || 'Failed to decommission agent')
      }
    } catch (error) {
      console.error('Error decommissioning agent:', error)
      toast.error('Error decommissioning agent')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="w-full flex flex-col gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="opacity-60">Agent not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Cover Image */}
      <div className="relative h-64 bg-white/60 rounded-xl overflow-hidden">
        {coverImagePreview ? (
          <img
            src={coverImagePreview}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center opacity-60">
              <FiCamera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium opacity-75">Cover Image</p>
            </div>
          </div>
        )}
        {isEditable && isEditing && (
          <label className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 cursor-pointer shadow-lg hover:bg-white transition-colors z-10">
            <FiCamera className="w-4 h-4 text-primary_color" />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'cover')}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Agent Info Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 -mt-20 relative z-10">
        <div className="flex items-start space-x-4">
          <div className="relative">
            {profileImagePreview ? (
              <div className="w-24 h-24 rounded-full overflow-hidden border-[10px] border-primary_color shadow-lg">
                <img
                  src={profileImagePreview}
                  alt={agent.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0 border-[10px] border-primary_color shadow-lg">
                <span className="text-2xl font-semibold opacity-60">
                  {getInitials(agent.name)}
                </span>
              </div>
            )}
            {isEditable && isEditing && (
              <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 cursor-pointer shadow-lg hover:bg-gray-50 transition-colors border-2 border-primary_color">
                <FiCamera className="w-4 h-4 text-primary_color" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'profile')}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-primary_color mb-1">{agent.name}</h2>
                <div className="flex flex-col gap-1">
                  {agent.email && (
                    <div className="flex items-center gap-2 text-sm opacity-60">
                      <FiMail className="w-4 h-4" />
                      <span>{agent.email}</span>
                    </div>
                  )}
                  {agent.phone && (
                    <div className="flex items-center gap-2 text-sm opacity-60">
                      <FiPhone className="w-4 h-4" />
                      <span>{agent.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEditable && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="primary_button flex items-center gap-2"
                  >
                    <FiEdit3 className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
                {isEditable && isEditing && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="primary_button flex items-center gap-2 disabled:opacity-50"
                    >
                      <FiSave className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        // Reset form data
                        if (agent) {
                          setFormData({
                            name: agent.name || '',
                            email: agent.email || '',
                            phone: agent.phone || '',
                            secondary_email: agent.secondary_email || '',
                            secondary_phone: agent.secondary_phone || '',
                            bio: agent.bio || '',
                            description: agent.description || '',
                            license_number: agent.license_number || agent.licence_number || '',
                            social_media: agent.social_media || {}
                          })
                          setProfileImageFile(null)
                          setCoverImageFile(null)
                          if (agent.profile_image) {
                            const img = typeof agent.profile_image === 'string' 
                              ? { url: agent.profile_image } 
                              : agent.profile_image
                            setProfileImagePreview(img.url || img)
                          }
                          if (agent.cover_image) {
                            const img = typeof agent.cover_image === 'string' 
                              ? { url: agent.cover_image } 
                              : agent.cover_image
                            setCoverImagePreview(img.url || img)
                          }
                        }
                      }}
                      className="secondary_button flex items-center gap-2"
                    >
                      <FiX className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}
                {!isEditable && agencyToken && (
                  <button
                    onClick={handleDecommission}
                    disabled={saving}
                    className="secondary_button flex items-center gap-2 disabled:opacity-50"
                  >
                    <FiXCircle className="w-4 h-4" />
                    {saving ? 'Processing...' : 'Decommission Agent'}
                  </button>
                )}
                <div>
                  {agent.agent_status === 'active' ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary_color/10">
                      <FiCheckCircle className="w-4 h-4 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary_color/10">
                      <FiXCircle className="w-4 h-4 mr-1" />
                      {agent.agent_status || 'Inactive'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bio Section - Always show */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">About</h3>
        {isEditable && isEditing ? (
          <textarea
            value={formData.bio || ''}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
            placeholder="Tell clients about your experience and expertise..."
          />
        ) : (
          agent.bio ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{agent.bio}</p>
          ) : (
            <p className="text-sm italic opacity-60">No bio available</p>
          )
        )}
      </div>

      {/* Description Section - Always show */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
        {isEditable && isEditing ? (
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
            placeholder="Add a detailed description..."
          />
        ) : (
          agent.description ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{agent.description}</p>
          ) : (
            <p className="text-sm italic opacity-60">No description available</p>
          )
        )}
      </div>

      {/* Achievements Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Achievements</h3>
          {isEditable && isEditing && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newAchievement}
                onChange={(e) => setNewAchievement(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddAchievement()}
                placeholder="Add achievement..."
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary_color focus:border-transparent"
              />
              <button
                onClick={handleAddAchievement}
                className="primary_button p-2"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        {achievements.length > 0 ? (
          <div className="space-y-2">
            {achievements.map((achievement, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-primary_color/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <FiAward className="w-4 h-4" />
                  <span className="text-sm">{achievement}</span>
                </div>
                {isEditable && isEditing && (
                  <button
                    onClick={() => handleRemoveAchievement(index)}
                    className="p-1 hover:bg-secondary_color/10 rounded transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
            <p className="text-sm italic opacity-60">No achievements added yet</p>
        )}
      </div>

      {/* Languages Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Languages</h3>
          {isEditable && isEditing && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
                placeholder="Add language..."
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary_color focus:border-transparent"
              />
              <button
                onClick={handleAddLanguage}
                className="primary_button p-2"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        {languages.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {languages.map((language, index) => (
              <div key={index} className="flex items-center gap-2 px-3 py-1 bg-secondary_color/10 rounded-full text-sm">
                <FiGlobeIcon className="w-3 h-3" />
                <span>{language}</span>
                {isEditable && isEditing && (
                  <button
                    onClick={() => handleRemoveLanguage(index)}
                    className="ml-1 hover:opacity-70"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm italic opacity-60">No languages added yet</p>
        )}
      </div>

      {/* Agent Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm opacity-60 mb-1 flex items-center gap-2">
              <FiUser className="w-4 h-4" />
              Full Name
            </p>
            {isEditable && isEditing ? (
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary_color focus:border-transparent"
              />
            ) : (
              <p className="text-sm font-medium">
                {agent.name || 'N/A'}
              </p>
            )}
          </div>
          
          <div>
            <p className="text-sm opacity-60 mb-1 flex items-center gap-2">
              <FiCalendar className="w-4 h-4" />
              Joined Date
            </p>
            <p className="text-sm font-medium">
              {formatDate(agent.invitation_accepted_at || agent.created_at)}
            </p>
          </div>

          {/* Location - Always show */}
          <div>
            <p className="text-sm opacity-60 mb-1 flex items-center gap-2">
              <FiMapPin className="w-4 h-4" />
              Location
            </p>
            {agent.location_data ? (
              <p className="text-sm font-medium">
                {agent.location_data.description || agent.location_data.address || 
                 `${agent.location_data.city || ''}, ${agent.location_data.country || ''}`.trim() || 
                 'Location assigned'}
              </p>
            ) : agent.location_id ? (
              <p className="text-sm font-medium">Location ID: {agent.location_id}</p>
            ) : (
                <p className="text-sm italic opacity-60">No location assigned (uses agency primary location)</p>
            )}
          </div>

          {/* License Number - Always show */}
          <div>
            <p className="text-sm opacity-60 mb-1 flex items-center gap-2">
              <FiFileText className="w-4 h-4" />
              License Number
            </p>
            {isEditable && isEditing ? (
              <input
                type="text"
                value={formData.license_number || ''}
                onChange={(e) => handleInputChange('license_number', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary_color focus:border-transparent"
              />
            ) : (
              agent.license_number || agent.licence_number ? (
                <p className="text-sm font-medium">{agent.license_number || agent.licence_number}</p>
              ) : (
                <p className="text-sm italic opacity-60">No license number</p>
              )
            )}
          </div>

          {/* Secondary Email */}
          <div>
            <p className="text-sm opacity-60 mb-1 flex items-center gap-2">
              <FiMail className="w-4 h-4" />
              Secondary Email
            </p>
            {isEditable && isEditing ? (
              <input
                type="email"
                value={formData.secondary_email || ''}
                onChange={(e) => handleInputChange('secondary_email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary_color focus:border-transparent"
                placeholder="Optional"
              />
            ) : (
              agent.secondary_email ? (
                <p className="text-sm font-medium">{agent.secondary_email}</p>
              ) : (
                <p className="text-sm italic opacity-60">No secondary email</p>
              )
            )}
          </div>

          {/* Secondary Phone */}
          <div>
            <p className="text-sm opacity-60 mb-1 flex items-center gap-2">
              <FiPhone className="w-4 h-4" />
              Secondary Phone
            </p>
            {isEditable && isEditing ? (
              <input
                type="tel"
                value={formData.secondary_phone || ''}
                onChange={(e) => handleInputChange('secondary_phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary_color focus:border-transparent"
                placeholder="Optional"
              />
            ) : (
              agent.secondary_phone ? (
                <p className="text-sm font-medium">{agent.secondary_phone}</p>
              ) : (
                <p className="text-sm italic opacity-60">No secondary phone</p>
              )
            )}
          </div>

        </div>
      </div>

      {/* Commission Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">Commission Settings</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-60 mb-1">Commission Status</p>
            <p className="text-sm font-medium">
              {agent.commission_status ? (
                <span>Eligible for Commission</span>
              ) : (
                <span>Not Eligible for Commission</span>
              )}
            </p>
          </div>
          {agent.commission_status ? (
            <FiCheckCircle className="w-6 h-6" />
          ) : (
            <FiXCircle className="w-6 h-6" />
          )}
        </div>
      </div>

      {/* Change Password - Only for agent viewing */}
      {isEditable && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Change Password</h3>
            {!isChangingPassword ? (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="secondary_button flex items-center gap-2"
              >
                <FiLock className="w-4 h-4" />
                Change Password
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="primary_button flex items-center gap-2 disabled:opacity-50"
                >
                  <FiSave className="w-4 h-4" />
                  Update Password
                </button>
                <button
                  onClick={() => {
                    setIsChangingPassword(false)
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                    setPasswordError('')
                  }}
                  className="secondary_button flex items-center gap-2"
                >
                  <FiX className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>

          {isChangingPassword && (
            <div className="space-y-4">
              {passwordError && (
                <div className="bg-secondary_color/10 border border-secondary_color/20 rounded-lg p-3">
                  <p className="text-sm">{passwordError}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-40 w-5 h-5" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-40 hover:opacity-60"
                  >
                    {showCurrentPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-40 w-5 h-5" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-40 hover:opacity-60"
                  >
                    {showNewPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-40 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-40 hover:opacity-60"
                  >
                    {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="bg-primary_color/10 border border-primary_color/20 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Password requirements:</strong> At least 8 characters long, including uppercase, lowercase, and numbers.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
