'use client'
import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/app/components/ui/avatar';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Send, Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import { dummyChats, dummyConversations } from './dummyData';

const Conversation = ({ selectedChatId, onBack }) => {
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState(dummyConversations);
  const scrollRef = useRef(null);

  const selectedChat = dummyChats.find(chat => chat.id === selectedChatId);
  const currentConversation = conversations[selectedChatId] || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentConversation, selectedChatId]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChatId) return;

    const newMsg = {
      id: Date.now(),
      senderId: 'me',
      message: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };

    setConversations(prev => ({
      ...prev,
      [selectedChatId]: [...(prev[selectedChatId] || []), newMsg]
    }));

    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center min-h-screen  h-full justify-center bg-gray-50 rounded-xl shadow-sm">
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

  return (
    <div className="flex flex-col min-h-[80vh] w-full bg-white rounded-xl shadow-sm border border-gray-100">
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
            <AvatarImage src={selectedChat.image} alt={selectedChat.name} />
            <AvatarFallback>
              {selectedChat.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate max-w-xs md:max-w-sm lg:max-w-md">{selectedChat.name}</h3>
            <p className="text-sm text-gray-500 truncate">{selectedChat.isOnline ? 'Online' : 'Offline'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef} style={{ minHeight: 0 }}>
        <div className="space-y-4">
          {currentConversation.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-xs md:max-w-md lg:max-w-2xl ${message.senderId === 'me' ? 'flex-row-reverse' : 'flex-row'}`}>
                {message.senderId !== 'me' && (
                  <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                    <AvatarImage src={selectedChat.image} alt={selectedChat.name} />
                    <AvatarFallback>
                      {selectedChat.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`ml-2 px-4 py-2 rounded-lg message-bubble break-words max-w-[80vw] md:max-w-md lg:max-w-2xl shadow ${
                    message.senderId === 'me'
                      ? 'bg-primary_color text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                  style={{ wordBreak: 'break-word' , color: 'white'}}
                >
                  <p className="text-sm text-white break-words">{message.message}</p>
                  <p className={`text-xs mt-1 ${
                    message.senderId === 'me' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
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
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Conversation;
