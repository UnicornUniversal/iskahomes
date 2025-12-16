'use client';
import React, { useState } from 'react'
import Chats from '@/app/components/messages/Chats'
import Conversation from '@/app/components/messages/Conversation'

const MessagesPage = () => {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const handleChatSelect = (chatId) => {
    setSelectedChatId(chatId);
  };

  const handleConversationDataChange = (conversationData) => {
    setSelectedConversation(conversationData);
  };

  const handleBack = () => {
    setSelectedChatId(null);
    setSelectedConversation(null);
  };

  return (
    <div className='flex gap-4 h-[80vh] overflow-hidden'>
      <div className={`${selectedChatId ? 'hidden md:flex' : 'flex'} flex-col h-full`}>
        <Chats 
          onChatSelect={handleChatSelect} 
          selectedChatId={selectedChatId}
          onConversationDataChange={handleConversationDataChange}
        />
      </div>
      <div className={`${selectedChatId ? 'flex' : 'hidden md:flex'} flex-1 flex-col h-full min-h-0`}>
        <Conversation 
          selectedChatId={selectedChatId} 
          onBack={handleBack}
          conversationData={selectedConversation}
        />
      </div>
    </div>
  )
}

export default MessagesPage
