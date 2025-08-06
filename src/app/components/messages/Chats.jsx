'use client'
import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/app/components/ui/avatar';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Input } from '@/app/components/ui/input';
import { Search, MoreVertical } from 'lucide-react';
import { dummyChats } from './dummyData';

const Chats = ({ onChatSelect, selectedChatId }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = dummyChats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 border-r border-gray-200 bg-white flex flex-col h-full shadow-sm rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-900">Chats</h2>
        <p className="text-sm text-gray-500 mt-1">6 conversations</p>
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
          />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onChatSelect && onChatSelect(chat.id)}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors border border-transparent ${
                selectedChatId === chat.id
                  ? 'bg-blue-50 border-blue-400 shadow-sm'
                  : 'hover:bg-gray-100'
              }`}
              style={{ minHeight: 64 }}
            >
              <div className="relative flex-shrink-0">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={chat.image} alt={chat.name} />
                  <AvatarFallback>
                    {chat.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {chat.isOnline && (
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full online-indicator"></div>
                )}
              </div>
              
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 truncate w-32 md:w-40 lg:w-48">
                    {chat.name}
                  </h3>
              
                </div>
                <p className="text-xs text-gray-600 truncate w-32 md:w-40 lg:w-48">
                  {chat.lastMessage}
                </p>
                <span className="text-xs text-gray-500 flex-shrink-0">{chat.timestamp}</span>
              </div>

              <div className="ml-2 flex flex-col items-end">
                {chat.unreadCount > 0 && (
                  <div className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center mb-1">
                    {chat.unreadCount}
                  </div>
                )}
                <MoreVertical className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Chats;
