'use client';
import React, { useState } from 'react'
import Chats from '@/app/components/messages/Chats'
import Conversation from '@/app/components/messages/Conversation'
import DeveloperNav from '@/app/components/developers/DeveloperNav';

const MessagesPage = () => {
  const [selectedChatId, setSelectedChatId] = useState(null);

  const handleChatSelect = (chatId) => {
    setSelectedChatId(chatId);
  };

  const handleBack = () => {
    setSelectedChatId(null);
  };

  return (
    <div className='flex h-[calc(100vh-64px)] min-h-0 bg-gray-50 gap-4 messages-page'>
      <DeveloperNav active={2} />
      <div className={`${selectedChatId ? 'hidden md:block' : 'block'} md:w-80 w-full h-full`}>
        <Chats onChatSelect={handleChatSelect} selectedChatId={selectedChatId} />
      </div>
      <div className={`${selectedChatId ? 'block' : 'hidden md:block'} flex-1 h-full min-h-0`}>
        <Conversation selectedChatId={selectedChatId} onBack={handleBack} />
      </div>
    </div>
  )
}

export default MessagesPage
