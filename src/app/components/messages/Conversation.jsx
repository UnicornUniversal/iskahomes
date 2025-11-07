'use client'
import React, { useState, useRef, useEffect } from 'react';
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
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const { user, developerToken, propertySeekerToken } = useAuth();

  // Get the appropriate token based on user type
  const token = user?.user_type === 'developer' ? developerToken : propertySeekerToken;
  const currentUserId = user?.id || user?.profile?.developer_id;


  // Fetch conversation details
  useEffect(() => {
    const fetchConversation = async () => {
      if (!selectedChatId || !token) return;

      try {
        const response = await fetch(`/api/conversations/${selectedChatId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setConversation(data.conversation);
        }
      } catch (error) {
        console.error('Error fetching conversation:', error);
      }
    };

    fetchConversation();
  }, [selectedChatId, token]);

  // Fetch messages and subscribe to realtime updates
  useEffect(() => {
    if (!selectedChatId || !token) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/messages?conversation_id=${selectedChatId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
          
          // Mark conversation as read
          await fetch(`/api/conversations/${selectedChatId}/read`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchMessages();

    // Subscribe to realtime messages
    const channel = supabase
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
            // New message added
            console.log('📨 New message received:', payload.new);
            setMessages(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            // Message updated (e.g., edited)
            console.log('✏️ Message updated:', payload.new);
            setMessages(prev => prev.map(msg => 
              msg.id === payload.new.id ? payload.new : msg
            ));
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

    // Cleanup: unsubscribe when component unmounts or chat changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChatId, token]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
      <div className="flex-1 flex items-center min-h-screen h-full justify-center bg-gray-50 rounded-xl shadow-sm">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
          <p className="text-gray-500">Choose a chat from the list to start messaging</p>
        </div>
      </div>
    );
  }

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white rounded-xl shadow-sm">
        <p className="text-gray-500">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
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
            <h3 className="text-lg font-medium text-gray-900 truncate max-w-xs md:max-w-sm lg:max-w-md">
              {getOtherUserName()}
            </h3>
            <p className="text-sm text-gray-500 truncate capitalize">
              {(conversation?.other_user?.user_type || conversation?.otherUser?.user_type || 'user').replace('_', ' ')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef} style={{ minHeight: 0 }}>
        {loading && messages.length === 0 ? (
          <div className="space-y-4">
            {/* Skeleton Loaders for Messages */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} animate-pulse`}>
                <div className={`flex max-w-xs md:max-w-md ${i % 2 === 0 ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar Skeleton */}
                  {i % 2 !== 0 && (
                    <div className="h-8 w-8 bg-gray-200 rounded-full mt-1 flex-shrink-0"></div>
                  )}
                  {/* Message Bubble Skeleton */}
                  <div className={`ml-2 px-4 py-3 rounded-lg ${i % 2 === 0 ? 'bg-gray-200' : 'bg-gray-100'}`}>
                    <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isMine = message.sender_id === currentUserId && message.sender_type === user?.user_type;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-xs md:max-w-md lg:max-w-2xl ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isMine && (
                      <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                        <AvatarImage src={getOtherUserImage()} alt={getOtherUserName()} />
                        <AvatarFallback>
                          {getOtherUserName().split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`ml-2 px-4 py-2 rounded-lg message-bubble break-words max-w-[80vw] md:max-w-md lg:max-w-2xl shadow ${
                        isMine
                          ? 'bg-primary_color text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                      style={{ wordBreak: 'break-word' }}
                    >
                      <p className={`text-sm break-words ${isMine ? '!text-white' : 'text-gray-900'}`}>
                        {message.message_text}
                      </p>
                      <p className={`text-xs mt-1 ${isMine ? '!text-white opacity-90' : 'text-gray-500'}`}>
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
      <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
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
