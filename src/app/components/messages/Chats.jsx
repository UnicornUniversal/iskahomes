'use client'
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/app/components/ui/avatar';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Input } from '@/app/components/ui/input';
import { Search, MoreVertical } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const Chats = ({ onChatSelect, selectedChatId, onConversationDataChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, developerToken, propertySeekerToken } = useAuth();

  // Get the appropriate token based on user type
  const token = user?.user_type === 'developer' ? developerToken : propertySeekerToken;


  // Fetch conversations and subscribe to realtime updates
  useEffect(() => {
    if (!token || !user) return;

    let isFetching = false;
    let fetchTimeout = null;
    let pollInterval = null;

    const fetchConversations = async (silent = false) => {
      // Prevent multiple simultaneous fetches
      if (isFetching) {
        console.log('⏸️ Fetch already in progress, skipping...');
        return;
      }

      isFetching = true;
      try {
        const response = await fetch('/api/conversations', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setConversations(data.conversations || []);
        } else {
          if (!silent) console.error('Failed to fetch conversations');
        }
      } catch (error) {
        if (!silent) console.error('Error fetching conversations:', error);
      } finally {
        isFetching = false;
        if (!silent) setLoading(false);
      }
    };

    // Debounced refresh function
    const debouncedRefresh = () => {
      if (fetchTimeout) {
        clearTimeout(fetchTimeout);
      }
      fetchTimeout = setTimeout(() => {
        fetchConversations(true); // Silent refresh
      }, 1000); // Wait 1 second before refreshing
    };

    // Initial fetch
    fetchConversations();

    // Listen for manual refresh events (debounced)
    const handleRefresh = () => {
      console.log('🔄 Manual conversation refresh triggered (debounced)');
      debouncedRefresh();
    };
    
    window.addEventListener('refreshConversations', handleRefresh);

    // Subscribe to realtime conversation updates with error handling
    let channel = null;
    try {
      channel = supabase
        .channel(`conversations-realtime-${user?.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT', // Only listen to new conversations
            schema: 'public',
            table: 'conversations'
          },
          (payload) => {
            console.log('💬 New conversation created:', payload);
            debouncedRefresh(); // Debounced refresh
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE', // Only listen to updates
            schema: 'public',
            table: 'conversations',
            filter: `user1_id=eq.${user?.id} OR user2_id=eq.${user?.id}` // Only for user's conversations
          },
          (payload) => {
            // Only refresh if last_message_at changed (new message) or unread count changed significantly
            const oldData = payload.old;
            const newData = payload.new;
            
            // Check if it's a meaningful update (new message or unread count change)
            const hasNewMessage = newData.last_message_at !== oldData?.last_message_at;
            const unreadChanged = (newData.user1_unread_count !== oldData?.user1_unread_count) ||
                                 (newData.user2_unread_count !== oldData?.user2_unread_count);
            
            if (hasNewMessage || unreadChanged) {
              console.log('💬 Conversation updated (new message or unread change):', payload);
              debouncedRefresh(); // Debounced refresh
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Conversations subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to conversations channel');
            // Clear any polling if realtime works
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn(`⚠️ Conversations channel ${status} - using fallback polling (30s)`);
            // Fallback: Poll every 30 seconds (much less frequent) if realtime fails
            if (!pollInterval) {
              pollInterval = setInterval(() => {
                fetchConversations(true); // Silent polling
              }, 30000); // 30 seconds instead of 5
            }
          } else if (status === 'CLOSED') {
            console.log('🔒 Conversations channel subscription closed');
          }
        });
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
      // Fallback polling if subscription setup fails (30 seconds)
      if (!pollInterval) {
        pollInterval = setInterval(() => {
          fetchConversations(true); // Silent polling
        }, 30000); // 30 seconds
      }
      channel = { pollInterval };
    }

    // Cleanup: unsubscribe when component unmounts
    return () => {
      window.removeEventListener('refreshConversations', handleRefresh);
      if (fetchTimeout) {
        clearTimeout(fetchTimeout);
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (channel) {
        if (channel.pollInterval) {
          clearInterval(channel.pollInterval);
        }
        if (channel.unsubscribe) {
          channel.unsubscribe();
        }
        supabase.removeChannel(channel);
      }
    };
  }, [token, user]);

  const filteredChats = conversations.filter(conv => {
    // If no search query, show all conversations
    if (!searchQuery) return true;
    
    // Use other_user from SQL function (snake_case from database)
    const otherUser = conv.other_user || conv.otherUser;
    
    // If otherUser or name doesn't exist, don't filter it out (show it)
    if (!otherUser || !otherUser.name) return true;
    
    // Filter by name
    return otherUser.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Helper function to format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="w-80 border-r border-gray-200 bg-white flex flex-col h-screen shadow-sm rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-900">Chats</h2>
        <p className="text-sm text-gray-500 mt-1">{conversations.length} conversations</p>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            suppressHydrationWarning={true}
          />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-2 space-y-2">
            {/* Skeleton Loaders */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center p-3 rounded-lg border border-gray-100 animate-pulse"
              >
                {/* Avatar Skeleton */}
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                </div>
                
                {/* Content Skeleton */}
                <div className="ml-3 flex-1 min-w-0">
                  {/* Name Skeleton */}
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  {/* Message Skeleton */}
                  <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                  {/* Time Skeleton */}
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
                
                {/* Unread Badge Skeleton */}
                <div className="ml-2">
                  <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No conversations yet</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredChats.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  onChatSelect && onChatSelect(conv.id);
                  onConversationDataChange && onConversationDataChange(conv);
                }}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors border border-transparent ${
                  selectedChatId === conv.id
                    ? 'bg-blue-50 border-blue-400 shadow-sm'
                    : 'hover:bg-gray-100'
                }`}
                style={{ minHeight: 64 }}
              >
                <div className="relative flex-shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={(conv.other_user || conv.otherUser)?.profile_image} alt={(conv.other_user || conv.otherUser)?.name} />
                    <AvatarFallback>
                      {(conv.other_user || conv.otherUser)?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate w-32 md:w-40 lg:w-48">
                      {(conv.other_user || conv.otherUser)?.name || 'Unknown User'}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-600 truncate w-32 md:w-40 lg:w-48">
                    {conv.last_message_text || 'No messages yet'}
                  </p>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatTimestamp(conv.last_message_at)}
                  </span>
                </div>

                <div className="ml-2 flex flex-col items-end">
                  {(conv.my_unread_count || conv.myUnreadCount) > 0 && (
                    <div className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center mb-1">
                      {conv.my_unread_count || conv.myUnreadCount}
                    </div>
                  )}
                  <MoreVertical className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default Chats;
