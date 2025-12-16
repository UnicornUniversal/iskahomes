'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { MessageSquare, Clock, Loader2, Image as ImageIcon, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const RecentMessages = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchMessages = async () => {
      try {
        const userType = user?.profile?.account_type || 'developer'
        const response = await fetch(`/api/messages/recent?user_id=${user.id}&user_type=${userType}&limit=7`)
        if (response.ok) {
          const result = await response.json()
          if (isMounted) {
            setMessages(result.data || [])
          }
        }
      } catch (error) {
        console.error('Error fetching recent messages:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchMessages()

    return () => {
      isMounted = false
    }
  }, [user?.id, user?.profile?.account_type])

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const truncateText = (text, maxLength = 50) => {
    if (!text) return 'No message'
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base">Unread Messages</h3>
        {messages.length > 0 && (
          <span className="text-sm">{messages.length}</span>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-5 h-5" />
          </div>
          <p className="text-sm">No unread messages</p>
        </div>
      ) : (
        <div className="flex flex-col flex-1">
          <div className="space-y-3">
            {messages.map((message) => (
              <Link
                key={message.id}
                href={`/developer/${user.slug}/messages`}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-white/20 hover:border-gray-200 hover:bg-gray-50 transition-all group"
              >
                {message.otherUserProfileImage ? (
                  <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                    <Image
                      src={message.otherUserProfileImage}
                      alt={message.otherUserName}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : message.listing?.image ? (
                  <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                    <Image
                      src={message.listing.image}
                      alt={message.listing.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm">
                      {message.otherUserName || 'User'}
                    </div>
                    <div className="flex items-center text-xs flex-shrink-0">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{formatTimeAgo(message.lastMessageAt)}</span>
                    </div>
                  </div>
                  <div className="text-xs">
                    {message.isSender && <span>You: </span>}
                    {truncateText(message.lastMessage, 40)}
                  </div>
                </div>
                
                <ChevronRight className="w-4 h-4 transition-colors flex-shrink-0 mt-1" />
              </Link>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100 flex justify-center">
            <Link
              href={`/developer/${user.slug}/messages`}
              className="flex items-center justify-center gap-1 text-xs transition-colors"
            >
              View All Messages
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecentMessages
