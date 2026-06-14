'use client'

import React, { useState } from 'react'
import { Playfair_Display } from 'next/font/google'

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const homeseekerFaqs = [
  {
    question: 'Is there a sign up fee and how do I sign up?',
    answer: 'No, there is no sign up fee. Sign ups can be done through the home page using the profile icon on the upper right corner and click on the sign up button.',
  },
  {
    question: 'How do I log in and out of my account?',
    answer: 'Log ins can be done through the home page using the profile icon on the upper right corner and click on the log in button. To log out, click on the arrow in the profile icon in your dashboard. From the drop down menu click on log out, it is the last option.',
  },
  {
    question: 'Does this platform cater to properties only in Accra?',
    answer: 'No, we cater to properties globally.',
  },
  {
    question: 'Does this platform cater to short stay properties?',
    answer: 'Yes, further enquiries can be made by contacting the listed agencies or developers of the preferred property.',
  },
  {
    question: 'How are complaints resolved?',
    answer: 'Complaints can be resolved by our responsive customer service agents through your profile dashboard.',
  },
  {
    question: 'Will I get information on the neighbourhood the property is located in?',
    answer: 'Yes, there are markers indicating what amenities are available within the neighborhoods making the decision making process easier.',
  },
  {
    question: 'Can I book an appointment to view a property?',
    answer: 'Yes, further enquiries can be made by contacting the listed agencies or developers of the preferred property.',
  },
  {
    question: 'Is it possible to save properties to review later?',
    answer: 'Yes, further enquiries can be made by contacting the listed agencies or developers of the preferred property.',
  },
  {
    question: 'What types of realty are listed on this website?',
    answer: 'We list all kinds of residential properties, commercial properties and land.',
  },
  {
    question: 'Are homeowners allowed to list on this website?',
    answer: 'No, all listings are made by licensed developers, agencies and agents.',
  },
]

const listerFaqs = [
  {
    question: 'Is there a sign up fee and how do I sign up?',
    answer: 'No, there is no sign up fee. Sign ups can be done through the home page using the profile icon on the upper right corner and click on the sign up button.',
  },
  {
    question: 'How do I log in and out of my account?',
    answer: 'Log ins can be done through the home page using the profile icon on the upper right corner and click on the log in button. To log out, click on the arrow in the profile icon in your dashboard. From the drop down menu click on log out, it is the last option.',
  },
  {
    question: 'Can I change my account details?',
    answer: 'Yes, you can do this by accessing your profile information through the sidebar on your dashboard. This enables editing of information.',
  },
  {
    question: 'Can I have multiple accounts?',
    answer: 'Yes, but each account is tied to a subscription plan.',
  },
  {
    question: 'What are the subscription plans?',
    answer: 'There are 2 subscription plans for developers and 3 subscription plans for agencies. Each plan provides different levels of access and functionality to the user.',
  },
  {
    question: 'Do I need a license to sign up as a developer, agency or agent on the website?',
    answer: 'Yes, a REAC licence is required before approval as a lister on the website.',
  },
  {
    question: 'How does ISKA Homes verify I am a licensed developer, agency or agent?',
    answer: 'We ensure all documents under the REAC licensing guidelines are up to date.',
  },
  {
    question: 'Why does ISKA Homes insist on a license?',
    answer: 'To ensure legal compliance, build trust and quality control.',
  },
  {
    question: 'Will I be able to access analytics on my account?',
    answer: 'Yes.',
  },
  {
    question: 'How secure is my information on the website?',
    answer: 'The website utilizes a high grade defense security system aligned with cloud systems.',
  },
]

const AccordionItem = ({ question, answer, isOpen, onToggle }) => (
  <div style={{ borderBottom: '1px solid rgba(23,99,124,0.1)' }}>
    <button
      onClick={onToggle}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 500, color: '#17637C', paddingRight: 16, lineHeight: 1.5 }}>
        {question}
      </span>
      <span
        style={{
          flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
          border: '1.5px solid #17637C', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.3s ease, background 0.3s ease',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          background: isOpen ? '#17637C' : 'transparent',
          color: isOpen ? '#fff' : '#17637C',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </span>
    </button>
    <div
      style={{
        overflow: 'hidden', transition: 'max-height 0.35s ease, opacity 0.3s ease',
        maxHeight: isOpen ? 300 : 0, opacity: isOpen ? 1 : 0,
      }}
    >
      <p style={{ fontSize: 14, lineHeight: 1.8, color: '#555', margin: 0, padding: '0 0 20px' }}>
        {answer}
      </p>
    </div>
  </div>
)

const FaqsPage = () => {
  const [activeTab, setActiveTab] = useState('homeseekers')
  const [openIndex, setOpenIndex] = useState(null)

  const currentFaqs = activeTab === 'homeseekers' ? homeseekerFaqs : listerFaqs

  const toggleItem = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx)
  }

  // Reset open item when switching tabs
  const switchTab = (tab) => {
    setActiveTab(tab)
    setOpenIndex(null)
  }

  return (
    <div style={{ background: 'linear-gradient(180deg, rgba(23,99,124,0.1) 19%, rgba(255,255,255,0.01) 100%)', color: '#1a1a1a', minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '60px 5% 40px' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '56%', height: '100%',
          background: 'linear-gradient(to right, rgba(23,99,124,0.12) 0%, rgba(23,99,124,0.06) 40%, transparent 100%)',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <h1
          className="font-medium text-primary_color tracking-tight"
          style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', margin: 0, lineHeight: 1.1, position: 'relative', zIndex: 1 }}
        >
          Frequently Asked Questions
        </h1>
        <p style={{ fontSize: 15, color: '#555', marginTop: 16, maxWidth: 560, lineHeight: 1.7, position: 'relative', zIndex: 1 }}>
          Find answers to the most common questions about using ISKA Homes, whether you&apos;re a homeseeker or a property lister.
        </p>
      </section>

      <div style={{ height: 1, background: '#e5e5e5', margin: '0 5%' }} />

      {/* Content */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '40px 5% 80px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 40, borderRadius: 10, overflow: 'hidden', border: '1.5px solid rgba(23,99,124,0.15)' }}>
          {[
            { key: 'homeseekers', label: 'Homeseekers' },
            { key: 'listers', label: 'Property Listers' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              style={{
                flex: 1, padding: '14px 20px', border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, transition: 'all 0.25s ease',
                background: activeTab === tab.key ? '#17637C' : 'transparent',
                color: activeTab === tab.key ? '#fff' : '#17637C',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category subtitle */}
        <h2
          className={playfairDisplay.className}
          style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 500, color: '#17637C', margin: '0 0 8px' }}
        >
          {activeTab === 'homeseekers' ? 'Homeseekers' : 'Developers, Agencies & Agents'}
        </h2>
        <div style={{ width: 60, height: 3, background: 'linear-gradient(90deg, #17637C, #F68B1F)', marginBottom: 24 }} />

        {/* Accordion */}
        <div>
          {currentFaqs.map((faq, idx) => (
            <AccordionItem
              key={idx}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === idx}
              onToggle={() => toggleItem(idx)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

export default FaqsPage
