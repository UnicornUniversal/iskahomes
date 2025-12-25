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
  const { user, developerToken, propertySeekerToken, agentToken, agencyToken } = useAuth();

  // Get the appropriate token based on user type
  const token = user?.user_type === 'developer' ? developerToken 
              : user?.user_type === 'agent' ? agentToken
              : user?.user_type === 'agency' ? agencyToken
              : propertySeekerToken;

  // Fetch conversations and subscribe to realtime updates
  const currentUserId = user?.user_type === 'developer' ? (user?.id || user?.profile?.developer_id)
                      : user?.user_type === 'agent' ? (user?.id || user?.profile?.agent_id)
                      : user?.user_type === 'agency' ? (user?.id || user?.profile?.agency_id)
                      : user?.id;

  useEffect(() => {
    if (!token || !user || !currentUserId) return;

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
          // Sort conversations by last_message_at to ensure proper order
          const sortedConversations = (data.conversations || []).sort((a, b) => {
            const timeA = new Date(a.last_message_at || a.created_at || 0).getTime();
            const timeB = new Date(b.last_message_at || b.created_at || 0).getTime();
            return timeB - timeA; // Newest first
          });
          setConversations(sortedConversations);
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
      }, 500); // Wait 500ms before refreshing (faster updates)
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
      const channelName = `conversations-realtime-${currentUserId}`;
      console.log(`📡 Setting up realtime channel: ${channelName}`);

      const handleConversationChange = (payload, type) => {
        console.log(`💬 Conversation ${type}:`, payload);
        debouncedRefresh();
      };

      const handleMessageInsert = (payload, direction) => {
        console.log(`📨 Message ${direction} current user:`, payload);
        debouncedRefresh();
      };

      channel = supabase.channel(channelName);

      const conversationEvents = [
        { event: 'INSERT', filter: `user1_id=eq.${currentUserId}`, label: 'insert (user1)' },
        { event: 'INSERT', filter: `user2_id=eq.${currentUserId}`, label: 'insert (user2)' },
        { event: 'UPDATE', filter: `user1_id=eq.${currentUserId}`, label: 'update (user1)' },
        { event: 'UPDATE', filter: `user2_id=eq.${currentUserId}`, label: 'update (user2)' }
      ];

      conversationEvents.forEach(({ event, filter, label }) => {
        channel = channel.on(
          'postgres_changes',
          {
            event,
            schema: 'public',
            table: 'conversations',
            filter
          },
          (payload) => handleConversationChange(payload, label)
        );
      });

      const messageEvents = [
        { filter: `sender_id=eq.${currentUserId}`, label: ' sent by' },
        { filter: `receiver_id=eq.${currentUserId}`, label: ' received by' }
      ];

      messageEvents.forEach(({ filter, label }) => {
        channel = channel.on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter
          },
          (payload) => handleMessageInsert(payload, label)
        );
      });

      channel = channel.subscribe((status) => {
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
  }, [token, user, currentUserId]);

  const filteredChats = conversations
    .filter(conv => {
      // If no search query, show all conversations
      if (!searchQuery) return true;
      
      // Use other_user from SQL function (snake_case from database)
      const otherUser = conv.other_user || conv.otherUser;
      
      // If otherUser or name doesn't exist, don't filter it out (show it)
      if (!otherUser || !otherUser.name) return true;
      
      // Filter by name
      return otherUser.name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      // Sort by last_message_at in descending order (newest first)
      const timeA = new Date(a.last_message_at || a.created_at || 0).getTime();
      const timeB = new Date(b.last_message_at || b.created_at || 0).getTime();
      return timeB - timeA;
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
    <div className="w-full h-full default_bg border-r border-primary_color/10 flex flex-col shadow-lg rounded-xl overflow-hidden min-h-0">
      {/* Header */}
      <div className="p-4 border-b border-primary_color/10 default_bg">
        <h2 className="text-xl font-bold text-primary_color">Chats</h2>
        <p className="text-sm text-primary_color/60 mt-1">{conversations.length} conversations</p>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-primary_color/10 default_bg">
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
                className="flex items-center p-3 rounded-lg border border-primary_color/10 animate-pulse"
              >
                {/* Avatar Skeleton */}
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-primary_color/10 rounded-full"></div>
                </div>
                
                {/* Content Skeleton */}
                <div className="ml-3 flex-1 min-w-0">
                  {/* Name Skeleton */}
                  <div className="h-4 bg-primary_color/10 rounded w-3/4 mb-2"></div>
                  {/* Message Skeleton */}
                  <div className="h-3 bg-primary_color/10 rounded w-full mb-1"></div>
                  {/* Time Skeleton */}
                  <div className="h-3 bg-primary_color/10 rounded w-1/4"></div>
                </div>
                
                {/* Unread Badge Skeleton */}
                <div className="ml-2">
                  <div className="h-5 w-5 bg-primary_color/10 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-primary_color/60">No conversations yet</p>
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
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors border ${
                  selectedChatId === conv.id
                    ? 'bg-primary_color/10 border-primary_color/30 shadow-sm'
                    : 'border-transparent hover:bg-primary_color/5'
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
                    <h3 className={`text-sm font-medium truncate w-32 md:w-40 lg:w-48 ${
                      selectedChatId === conv.id ? 'text-primary_color' : 'text-primary_color'
                    }`}>
                      {(conv.other_user || conv.otherUser)?.name || 'Unknown User'}
                    </h3>
                  </div>
                  <p className="text-xs text-primary_color/70 truncate w-32 md:w-40 lg:w-48">
                    {conv.last_message_text || 'No messages yet'}
                  </p>
                  <span className="text-xs text-primary_color/50 flex-shrink-0">
                    {formatTimestamp(conv.last_message_at)}
                  </span>
                </div>

                <div className="ml-2 flex flex-col items-end">
                  {(conv.my_unread_count || conv.myUnreadCount) > 0 && (
                    <div className="bg-secondary_color text-white text-xs rounded-full h-5 w-5 flex items-center justify-center mb-1 font-bold">
                      {conv.my_unread_count || conv.myUnreadCount}
                    </div>
                  )}
                  <MoreVertical className="h-4 w-4 text-primary_color/50" />
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
