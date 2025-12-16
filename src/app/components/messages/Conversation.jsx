'use client'
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/app/components/ui/avatar';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Send, MoreVertical, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const Conversation = ({ selectedChatId, onBack, conversationData, onConversationDataChange }) => {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(conversationData || null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [pagination, setPagination] = useState({ hasMore: false, offset: 0, limit: 50 });
  const scrollRef = useRef(null);
  const initialLoadRef = useRef(true);
  const { user, developerToken, propertySeekerToken } = useAuth();

  // Get the appropriate token based on user type
  const token = user?.user_type === 'developer' ? developerToken : propertySeekerToken;
  const currentUserId = user?.id || user?.profile?.developer_id;

  // Use conversationData from props if available, otherwise keep existing state
  useEffect(() => {
    if (conversationData) {
      setConversation(conversationData);
    }
  }, [conversationData]);

  // Fetch messages and subscribe to realtime updates
  useEffect(() => {
    if (!selectedChatId || !token) return;

    const fetchMessages = async (offset = 0, limit = 50, isLoadMore = false) => {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await fetch(`/api/messages?conversation_id=${selectedChatId}&limit=${limit}&offset=${offset}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const newMessages = data.messages || [];
          
          // Remove duplicates and sort messages by created_at to ensure chronological order (oldest first)
          const uniqueMessages = new Map();
          newMessages.forEach(msg => {
            if (msg.id && !uniqueMessages.has(msg.id)) {
              uniqueMessages.set(msg.id, msg);
            }
          });
          const sortedNewMessages = Array.from(uniqueMessages.values()).sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateA - dateB; // Oldest first
          });
          
          if (isLoadMore) {
            // Prepend older messages
            setMessages(prev => {
              // Remove duplicates from existing messages
              const existingMap = new Map();
              prev.forEach(msg => {
                if (msg.id) {
                  existingMap.set(msg.id, msg);
                }
              });
              // Add new messages
              sortedNewMessages.forEach(msg => {
                if (msg.id) {
                  existingMap.set(msg.id, msg);
                }
              });
              // Convert back to array and sort
              const combined = Array.from(existingMap.values());
              return combined.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateA - dateB;
              });
            });
          } else {
            // Initial load - show oldest first
            setMessages(sortedNewMessages);
          }
          
          // Update pagination state
          setPagination({
            hasMore: data.pagination?.hasMore || false,
            offset: offset + sortedNewMessages.length,
            limit
          });
          
          // Mark conversation as read (only on initial load)
          if (!isLoadMore) {
            try {
              const readResponse = await fetch(`/api/conversations/${selectedChatId}/read`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (readResponse.ok) {
                // Trigger conversation list refresh (debounced in Chats component)
                window.dispatchEvent(new CustomEvent('refreshConversations'));
              }
            } catch (readError) {
              console.error('Error marking conversation as read:', readError);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    // Reset state when conversation changes
    initialLoadRef.current = true;
    setMessages([]);
    setPagination({ hasMore: false, offset: 0, limit: 50 });

    // Initial fetch
    fetchMessages(0, 50, false);

    // Subscribe to realtime messages
    let channel = null;
    try {
      channel = supabase
        .channel(`messages-${selectedChatId}`)
        .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedChatId}`
        },
        (payload) => {
          console.log('💬 Realtime message event:', payload);
          
          if (payload.eventType === 'INSERT') {
            // New message added - append to end (most recent)
            console.log('📨 New message received:', payload.new);
            
            // Check if message already exists to prevent duplicates
            setMessages(prev => {
              // Use Map to ensure no duplicates
              const messageMap = new Map();
              prev.forEach(msg => {
                if (msg.id) {
                  messageMap.set(msg.id, msg);
                }
              });
              
              // Check if message already exists
              if (payload.new.id && messageMap.has(payload.new.id)) {
                console.log('⚠️ Message already exists, skipping duplicate');
                return prev;
              }
              
              // Add temporary message with loading state
              const tempMessage = {
                ...payload.new,
                sender_name: 'Loading...',
                sender_profile_image: null,
                _isLoading: true
              };
              
              if (tempMessage.id) {
                messageMap.set(tempMessage.id, tempMessage);
              }
              
              // Convert back to array and sort to maintain chronological order
              const updated = Array.from(messageMap.values());
              return updated.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateA - dateB; // Oldest first
              });
            });

            // Fetch sender info and update the message
            const fetchSenderName = async () => {
              try {
                let senderName = 'User';
                let senderImage = null;
                
                if (payload.new.sender_type === 'property_seeker') {
                  const { data } = await supabase
                    .from('property_seekers')
                    .select('id, name, profile_picture')
                    .eq('id', payload.new.sender_id)
                    .single();
                  if (data) {
                    senderName = data.name || 'Property Seeker';
                    senderImage = data.profile_picture;
                  }
                } else if (payload.new.sender_type === 'developer') {
                  const { data } = await supabase
                    .from('developers')
                    .select('developer_id, name, profile_image')
                    .eq('developer_id', payload.new.sender_id)
                    .single();
                  if (data) {
                    senderName = data.name || 'Developer';
                    senderImage = data.profile_image;
                  }
                } else if (payload.new.sender_type === 'agent') {
                  const { data } = await supabase
                    .from('agents')
                    .select('agent_id, name, profile_image')
                    .eq('agent_id', payload.new.sender_id)
                    .single();
                  if (data) {
                    senderName = data.name || 'Agent';
                    senderImage = data.profile_image;
                  }
                }
                
                // Update the message with actual sender info
                setMessages(prev => {
                  // Check if message still exists (might have been removed or replaced)
                  const messageExists = prev.some(msg => msg.id === payload.new.id);
                  if (!messageExists) {
                    console.log('⚠️ Message no longer exists, skipping update');
                    return prev;
                  }
                  return prev.map(msg => 
                    msg.id === payload.new.id 
                      ? { ...msg, sender_name: senderName, sender_profile_image: senderImage, _isLoading: false }
                      : msg
                  );
                });
              } catch (err) {
                console.error('Error fetching sender name:', err);
                setMessages(prev => {
                  const messageExists = prev.some(msg => msg.id === payload.new.id);
                  if (!messageExists) {
                    return prev;
                  }
                  return prev.map(msg => 
                    msg.id === payload.new.id 
                      ? { ...msg, sender_name: 'User', _isLoading: false }
                      : msg
                  );
                });
              }
            };
            
            fetchSenderName();
          } else if (payload.eventType === 'UPDATE') {
            // Message updated (e.g., edited)
            console.log('✏️ Message updated:', payload.new);
            setMessages(prev => {
              const messageExists = prev.some(msg => msg.id === payload.new.id);
              if (!messageExists) {
                console.log('⚠️ Message not found for update, skipping');
                return prev;
              }
              return prev.map(msg => 
                msg.id === payload.new.id ? payload.new : msg
              );
            });
          } else if (payload.eventType === 'DELETE') {
            // Message deleted
            console.log('🗑️ Message deleted:', payload.old);
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          }
        }
      )
        .subscribe((status) => {
          console.log('📡 Realtime subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to messages channel');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Channel subscription error');
          } else if (status === 'TIMED_OUT') {
            console.error('⏰ Channel subscription timed out');
          } else if (status === 'CLOSED') {
            console.log('🔒 Channel subscription closed');
          }
        });
    } catch (error) {
      console.error('❌ Error setting up realtime subscription:', error);
      channel = null;
    }

    // Cleanup: unsubscribe when component unmounts or chat changes
    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.error('Error removing channel:', error);
        }
      }
    };
  }, [selectedChatId, token]);

  // Load more messages when scrolling to top
  const handleScroll = () => {
    if (!scrollRef.current || loadingMore || !pagination.hasMore) return;

    const { scrollTop } = scrollRef.current;
    // Load more when user scrolls within 200px of the top
    if (scrollTop < 200) {
      loadMoreMessages();
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !pagination.hasMore || !selectedChatId || !token) return;

    setLoadingMore(true);
    const previousScrollHeight = scrollRef.current?.scrollHeight || 0;
    
    try {
      // Fetch next page
      const response = await fetch(`/api/messages?conversation_id=${selectedChatId}&limit=${pagination.limit}&offset=${pagination.offset}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages || [];
        
        // Remove duplicates and sort messages by created_at to ensure chronological order
        const uniqueNewMessages = new Map();
        newMessages.forEach(msg => {
          if (msg.id && !uniqueNewMessages.has(msg.id)) {
            uniqueNewMessages.set(msg.id, msg);
          }
        });
        const sortedNewMessages = Array.from(uniqueNewMessages.values()).sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateA - dateB; // Oldest first
        });
        
        if (sortedNewMessages.length > 0) {
          // Prepend older messages and re-sort to maintain order
          setMessages(prev => {
            // Remove duplicates from existing messages
            const existingMap = new Map();
            prev.forEach(msg => {
              if (msg.id) {
                existingMap.set(msg.id, msg);
              }
            });
            // Add new messages
            sortedNewMessages.forEach(msg => {
              if (msg.id) {
                existingMap.set(msg.id, msg);
              }
            });
            // Convert back to array and sort
            const combined = Array.from(existingMap.values());
            return combined.sort((a, b) => {
              const dateA = new Date(a.created_at || 0);
              const dateB = new Date(b.created_at || 0);
              return dateA - dateB;
            });
          });
          
          // Update pagination
          setPagination({
            hasMore: data.pagination?.hasMore || false,
            offset: pagination.offset + sortedNewMessages.length,
            limit: pagination.limit
          });

          // Restore scroll position after loading (prevent jump)
          setTimeout(() => {
            if (scrollRef.current) {
              const newScrollHeight = scrollRef.current.scrollHeight;
              scrollRef.current.scrollTop = newScrollHeight - previousScrollHeight;
            }
          }, 0);
        }
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // Handle auto-scroll behavior for initial load and new messages without visible jump
  useLayoutEffect(() => {
    if (!scrollRef.current || messages.length === 0) {
      return;
    }

    if (initialLoadRef.current) {
      scrollToBottom();
      initialLoadRef.current = false;
      return;
    }

    if (loadingMore) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;

    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages, loadingMore]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatId || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId: selectedChatId,
          messageText: newMessage,
          messageType: 'text'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📤 Message sent successfully:', data.message);
        setNewMessage('');
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get other user info from conversation
  const getOtherUser = () => {
    if (!conversation || !user) return null;

    const isUser1 = conversation.user1_id === currentUserId && conversation.user1_type === user.user_type;
    return {
      id: isUser1 ? conversation.user2_id : conversation.user1_id,
      type: isUser1 ? conversation.user2_type : conversation.user1_type
    };
  };

  const otherUser = getOtherUser();

  // Format timestamp
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get other user's name for avatar
  const getOtherUserName = () => {
    const otherUserData = conversation?.other_user || conversation?.otherUser;
    if (!otherUserData) return 'User';
    return otherUserData.name || 'User';
  };

  // Get other user's profile image
  const getOtherUserImage = () => {
    const otherUserData = conversation?.other_user || conversation?.otherUser;
    if (!otherUserData) return '';
    return otherUserData.profile_image || '';
  };

  if (!selectedChatId) {
    return (
      <div className="flex-1 flex items-center h-full justify-center default_bg rounded-xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary_color/10 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary_color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-primary_color mb-2">Select a conversation</h3>
          <p className="text-primary_color/60">Choose a chat from the list to start messaging</p>
        </div>
      </div>
    );
  }

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center default_bg rounded-xl h-full">
        <p className="text-primary_color/60">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full default_bg rounded-xl shadow-lg border border-primary_color/10">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-primary_color/10 default_bg rounded-t-xl flex-shrink-0">
        <div className="flex items-center min-w-0">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden mr-2"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={getOtherUserImage()} alt={getOtherUserName()} />
            <AvatarFallback>
              {getOtherUserName().split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3 min-w-0">
            <h3 className="text-lg font-bold text-primary_color truncate max-w-xs md:max-w-sm lg:max-w-md">
              {getOtherUserName()}
            </h3>
            <p className="text-sm text-primary_color/60 truncate capitalize">
              {(conversation?.other_user?.user_type || conversation?.otherUser?.user_type || 'user').replace('_', ' ')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="text-primary_color hover:bg-primary_color/10">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 default_bg" 
        ref={scrollRef} 
        style={{ minHeight: 0 }}
        onScroll={handleScroll}
      >
        {loading && messages.length === 0 ? (
          <div className="space-y-4">
            {/* Skeleton Loaders for Messages */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} animate-pulse`}>
                <div className={`flex max-w-xs md:max-w-md ${i % 2 === 0 ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar Skeleton */}
                  {i % 2 !== 0 && (
                    <div className="h-8 w-8 bg-primary_color/10 rounded-full mt-1 flex-shrink-0"></div>
                  )}
                  {/* Message Bubble Skeleton */}
                  <div className={`ml-2 px-4 py-3 rounded-lg ${i % 2 === 0 ? 'bg-primary_color/10' : 'bg-primary_color/5'}`}>
                    <div className="h-4 bg-primary_color/20 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-primary_color/20 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-primary_color/20 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-primary_color/60">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pagination.hasMore && (
              <div className="flex justify-center py-2">
                {loadingMore ? (
                  <p className="text-sm text-gray-500">Loading older messages...</p>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMoreMessages}
                    className="text-sm"
                  >
                    Load Older Messages
                  </Button>
                )}
              </div>
            )}
            {messages.map((message) => {
              const isMine = message.sender_id === currentUserId && message.sender_type === user?.user_type;
              const senderName = message.sender_name || 'User';
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-xs md:max-w-md lg:max-w-2xl ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isMine && (
                      <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                        <AvatarImage src={message.sender_profile_image || getOtherUserImage()} alt={senderName} />
                        <AvatarFallback>
                          {senderName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`ml-2 px-4 py-2 rounded-lg message-bubble break-words max-w-[80vw] md:max-w-md lg:max-w-2xl shadow-lg ${
                        isMine
                          ? 'bg-primary_color !text-white'
                          : 'default_bg border border-primary_color/10 text-primary_color'
                      }`}
                      style={{ wordBreak: 'break-word' }}
                    >
                      {!isMine && (
                        <p className="text-xs font-medium mb-1 text-primary_color/70">
                          {senderName}
                        </p>
                      )}
                      <p className={`text-sm break-words ${isMine ? '!text-white' : 'text-primary_color'}`}>
                        {message.message_text}
                      </p>
                      <p className={`text-xs mt-1 ${isMine ? '!text-white opacity-90' : 'text-primary_color/60'}`}>
                        {formatMessageTime(message.created_at)}
                        {message.is_edited && ' (edited)'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-primary_color/10 default_bg rounded-b-xl flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            disabled={sending}
            suppressHydrationWarning={true}
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim() || sending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Conversation;
