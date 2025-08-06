'use client'

import React, { useState } from 'react'
import Layout1 from '@/app/layout/Layout1'
import HomeOwnerHeader from '@/app/components/homeowner/HomeOwnerHeader'
import HomeOwnerNav from '@/app/components/homeowner/HomeOwnerNav'
import Chats from '@/app/components/messages/Chats'
import Conversation from '@/app/components/messages/Conversation'

const HomeOwnerMessages = () => {
  const [selectedChatId, setSelectedChatId] = useState(null)

  const handleChatSelect = (chatId) => {
    setSelectedChatId(chatId)
  }

  const handleBack = () => {
    setSelectedChatId(null)
  }

  return (
    <Layout1>
      <div className="flex">
        <HomeOwnerNav active={3} />
        <div className="flex-1 p-8">
          <HomeOwnerHeader />
          
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Messages</h2>
            
            <div className='flex   bg-gray-50 gap-4 messages-page'>
              <div className={`${selectedChatId ? 'hidden md:block' : 'block'} md:w-80 w-full h-full`}>
                <Chats onChatSelect={handleChatSelect} selectedChatId={selectedChatId} />
              </div>
              <div className={`${selectedChatId ? 'block' : 'hidden md:block'} flex-1 h-full min-h-screen`}>
                <Conversation selectedChatId={selectedChatId} onBack={handleBack} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout1>
  )
}

export default HomeOwnerMessages 