'use client'

import React, { useState } from 'react'
import AgentNav from '@/app/components/agents/AgentNav'
import AgentHeader from '@/app/components/agents/AgentHeader'
import Conversation from '@/app/components/messages/Conversation'
import Chats from '@/app/components/messages/Chats'

const page = () => {
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
    <div className='w-full normal_div'>
      <AgentNav active={4} />
      <div className='w-full flex flex-col gap-[2em] min-h-0'>
        <AgentHeader />
        <div className='flex flex-1 min-h-0 gap-4 h-[calc(100vh-250px)] min-h-[600px] messages-page'>
          <div className={`${selectedChatId ? 'hidden md:block' : 'block'} md:w-80 w-full h-full flex-shrink-0 min-h-0`}>
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
              onConversationDataChange={handleConversationDataChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default page
