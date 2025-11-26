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
      <div className=" border border-gray-200 rounded-lg p-6 flex-1">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className=" secondary_bg border border-gray-200 rounded-lg p-6 flex-1">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary_color/10 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h3 className="text-base font-semibold">Unread Messages</h3>
        </div>
        {messages.length > 0 && (
          <span className="text-xs">{messages.length}</span>
        )}
      </div>

      <div className="space-y-2">
        {messages.map((message) => (
          <Link
            key={message.id}
            href={`/developer/${user.slug}/messages`}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary_color/20 hover:bg-gray-50/50 transition-all group"
          >
            {message.listing?.image ? (
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
              <div className="font-medium text-sm truncate mb-0.5">
                {message.listing?.title || message.subject || 'General Inquiry'}
              </div>
              <div className="text-xs truncate">
                {message.isSender && <span>You: </span>}
                {truncateText(message.lastMessage, 40)}
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center text-xs">
                <Clock className="w-3 h-3 mr-1" />
                <span>{formatTimeAgo(message.lastMessageAt)}</span>
              </div>
              <ChevronRight className="w-4 h-4 transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      {messages.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-6 h-6" />
          </div>
          <p className="text-sm">No unread messages</p>
        </div>
      )}

      {messages.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <Link
            href={`/developer/${user.slug}/messages`}
            className="flex items-center justify-center gap-1 text-sm font-medium transition-colors"
          >
            View All Messages
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}

export default RecentMessages
