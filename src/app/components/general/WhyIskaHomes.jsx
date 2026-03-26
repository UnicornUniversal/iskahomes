'use client'

import React, { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

const userGroups = [
  {
    id: 'property-seeker',
    label: 'Property Seeker',
    title: 'Search smarter and move with confidence.',
    description: 'Property seekers can discover verified homes, compare options across locations, and keep everything they need for a smooth property journey in one place.',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1200&auto=format&fit=crop',
    features: [
      'Verified Listings',
      'Saved Properties',
      'Smart Search',
      'Property Alerts',
      'Direct Messaging',
      'Viewing Requests'
    ]
  },
  {
    id: 'developer',
    label: 'Developer',
    title: 'Showcase projects and convert serious interest.',
    description: 'Developers get a focused space to present projects beautifully, manage exposure, and capture leads from people actively searching for premium property opportunities.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop',
    features: [
      'Property Management',
      'Property Listings',
      'Advanced Analytics',
      'Leads Management',
      'Reminders',
      'Client Management'
    ]
  },
  {
    id: 'agency',
    label: 'Agency',
    title: 'Manage your brand and listings from one place.',
    description: 'Agencies can maintain a polished presence, coordinate listings across teams, and respond to leads through a platform built for structured property operations.',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200&auto=format&fit=crop',
    features: [
      'Agency Profile',
      'Team Oversight',
      'Property Listings',
      'Lead Tracking',
      'Appointments',
      'Sales Insights'
    ]
  },
  {
    id: 'agent',
    label: 'Agent',
    title: 'Build trust, generate leads, and stay discoverable.',
    description: 'Agents can present active listings, strengthen credibility, and stay visible to property seekers looking for informed guidance and fast responses.',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1200&auto=format&fit=crop',
    features: [
      'Client Management',
      'Lead Follow-Up',
      'Property Listings',
      'Appointments',
      'Messages',
      'Performance Tracking'
    ]
  }
]

const WhyIskaHomes = () => {
  const [activeUserId, setActiveUserId] = useState(userGroups[0].id)
  const router = useRouter()

  const activeUser = useMemo(
    () => userGroups.find(user => user.id === activeUserId) || userGroups[0],
    [activeUserId]
  )

  return (
    <section className="w-full px-4 md:px-8 py-20 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="border-t border-primary_color/25 pt-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.04 }}
          className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-12 items-start border-b border-primary_color/25 pb-10"
        >
          <div>
            <h2 className="heading_title">
              Who does
              <br />
              Iska Homes serve?
            </h2>
          </div>
          {/* <div className="max-w-sm lg:justify-self-end pt-2">
            <div className="w-3 h-10 bg-primary_color mb-4" />
            <p className="text-sm md:text-base text-primary_color/80 leading-8">
              Explore how Iska Homes is built for property seekers, developers, agencies, and agents through a tailored experience for each user type.
            </p>
          </div> */}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[0.42fr_0.68fr_0.9fr] gap-12 lg:gap-0 pt-12">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 }}
            className="lg:border-r lg:border-primary_color/25 lg:pr-10"
          >
            <div className="space-y-3">
              {userGroups.map((user) => {
                const isActive = user.id === activeUserId

                return (
                  <motion.button
                    key={user.id}
                    type="button"
                    onClick={() => setActiveUserId(user.id)}
                    whileHover={{ x: 6 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    className={`flex items-center gap-4 text-left text-md md:text-[1.5em] leading-tight transition-colors ${
                      isActive ? 'text-primary_color' : 'text-primary_color/50 hover:text-primary_color/80'
                    }`}
                  >
                    <motion.span
                      layout
                      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                      className={`w-[8px] h-8 transition-colors ${isActive ? 'bg-primary_color' : 'bg-transparent'}`}
                    />
                    <motion.span
                      animate={{ letterSpacing: isActive ? '-0.02em' : '0em' }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                      {user.label}
                    </motion.span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeUser.id}-details`}
              initial={{ opacity: 0, y: 28, x: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -16, x: -20, filter: 'blur(8px)' }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="lg:border-r lg:border-primary_color/25 lg:px-10 pt-2"
            >
              <div className="max-w-xl">
                <motion.p
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.38, ease: 'easeOut', delay: 0.06 }}
                  className="text-2xl md:text-[3.1rem] leading-[1.02] tracking-[-0.03em] text-primary_color mb-6"
                >
                  {activeUser.title}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut', delay: 0.11 }}
                  className="text-lg md:text-[1.08rem] text-primary_color/82 leading-9 max-w-lg mb-12"
                >
                  {activeUser.description}
                </motion.p>

                <motion.button
                  type="button"
                  onClick={() => router.push('/home/signup')}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.32, ease: 'easeOut', delay: 0.16 }}
                  className="inline-flex items-center gap-4 border border-primary_color rounded-full px-4 py-2 text-primary_color transition-colors hover:bg-primary_color hover:text-white"
                >
                  <span className="text-[1rem] md:text-[1rem] leading-none">Get Started</span>
                  <span className="flex items-center justify-center w-11 h-11 rounded-full border border-current">
                    <ArrowRight className="w-6 h-6" />
                  </span>
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              key={`${activeUser.id}-visuals`}
              initial={{ opacity: 0, y: 30, x: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -18, x: -20, filter: 'blur(8px)' }}
              transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1], delay: 0.04 }}
              className="pt-1 lg:pl-10"
            >
              <motion.img
                key={activeUser.image}
                src={activeUser.image}
                alt={activeUser.label}
                initial={{ scale: 1.08, opacity: 0.65 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="w-full h-[280px] md:h-[300px] object-cover mb-8"
              />

              <div>
                <h4 className=" mb-5">Features</h4>
                <div className="flex flex-wrap gap-4">
                  {activeUser.features.map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.24, ease: 'easeOut', delay: 0.06 + index * 0.04 }}
                      className="border border-primary_color/60 rounded-xl bg-white px-5 py-3 text-primary_color"
                    >
                      <p className="text-sm md:text-[0.8em] leading-6 whitespace-nowrap">{feature}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  )
}

export default WhyIskaHomes
