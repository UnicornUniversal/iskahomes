'use client'

import React, { useState } from 'react'
import HomeSeekerHeader from '../../../components/homeSeeker/HomeSeekerHeader'
import { FiMessageSquare } from 'react-icons/fi'
import Chats from '../../../components/messages/Chats'
import Conversation from '../../../components/messages/Conversation'


const HomeSeekerMessages = () => {
  const [selectedChatId, setSelectedChatId] = useState(null)
  const [selectedConversation, setSelectedConversation] = useState(null)

  const handleChatSelect = (chatId) => {
    setSelectedChatId(chatId)
  }

  const handleConversationDataChange = (conversationData) => {
    setSelectedConversation(conversationData)
  }

  const handleBack = () => {
    setSelectedChatId(null)
    setSelectedConversation(null)
  }

  return (
    <>
      <HomeSeekerHeader />
      
      <div className="mt-6 lg:mt-8 flex flex-col h-[calc(100vh-200px)] min-h-[600px]">
        <h2 className="text-2xl lg:text-3xl font-bold text-primary_color mb-6 flex items-center gap-3">
          <div className="p-2 bg-primary_color/10 rounded-lg">
            <FiMessageSquare className="w-6 h-6 text-primary_color" />
          </div>
          Messages
        </h2>
        
        <div className='flex flex-1 min-h-0 gap-4 messages-page'>
          <div className={`${selectedChatId ? 'hidden md:block' : 'block'} md:w-80 w-full h-full flex-shrink-0`}>
            <Chats 
              onChatSelect={handleChatSelect} 
              selectedChatId={selectedChatId}
              onConversationDataChange={handleConversationDataChange}
            />
          </div>
          <div className={`${selectedChatId ? 'block' : 'hidden md:block'} flex-1 h-full min-h-0 flex-shrink`}>
            <Conversation 
              selectedChatId={selectedChatId} 
              onBack={handleBack}
              conversationData={selectedConversation}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default HomeSeekerMessages 