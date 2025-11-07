'use client'

import React, { useState } from 'react'
import Layout1 from '../../../layout/Layout1'
import HomeSeekerHeader from '../../../components/homeSeeker/HomeSeekerHeader'

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
    <Layout1>
      <HomeSeekerHeader />
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Messages</h2>
        
        <div className='flex h-[calc(100vh-300px)] min-h-0 bg-gray-50 gap-4 messages-page'>
          <div className={`${selectedChatId ? 'hidden md:block' : 'block'} md:w-80 w-full h-full`}>
            <Chats 
              onChatSelect={handleChatSelect} 
              selectedChatId={selectedChatId}
              onConversationDataChange={handleConversationDataChange}
            />
          </div>
          <div className={`${selectedChatId ? 'block' : 'hidden md:block'} flex-1 h-full min-h-0`}>
            <Conversation 
              selectedChatId={selectedChatId} 
              onBack={handleBack}
              conversationData={selectedConversation}
            />
          </div>
        </div>
      </div>
    </Layout1>
  )
}

export default HomeSeekerMessages 