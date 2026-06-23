'use client'

import React, { useState } from 'react'
import { Playfair_Display } from 'next/font/google'
import { Lightbulb, Shield, Thermometer, Tv, Cpu, Mic, CheckCircle } from 'lucide-react'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '700'] })

const FEATURES = [
  { Icon: Lightbulb, title: 'Smart Lighting', body: 'Automated ambiance control for every room and occasion.' },
  { Icon: Shield, title: 'Home Security', body: 'Cameras, sensors, and real-time alerts monitored 24/7.' },
  { Icon: Thermometer, title: 'Climate Control', body: 'AI-driven temperature management that learns your schedule.' },
  { Icon: Tv, title: 'Entertainment', body: 'Seamless multi-room audio and video at a single touch.' },
  { Icon: Cpu, title: 'Home Automation', body: 'Routines and scenes that run your home on autopilot.' },
  { Icon: Mic, title: 'Voice Control', body: 'Fully integrated with Alexa, Google Assistant, and Siri.' },
]

const PROCESS = [
  {
    num: '01',
    title: 'Site Assessment',
    body: 'Our engineers visit to map infrastructure, connectivity, and optimal device placement across every zone.',
  },
  {
    num: '02',
    title: 'System Design',
    body: 'A bespoke smart home blueprint is drafted detailing every device, zone, and automation workflow.',
  },
  {
    num: '03',
    title: 'Professional Installation',
    body: 'Certified technicians install all hardware discreetly with minimal disruption to your space.',
  },
  {
    num: '04',
    title: 'Testing & Handover',
    body: 'Full system testing, personalised training, and a dedicated support line for post-installation queries.',
  },
]

const BENEFITS = [
  'Control everything from a single app',
  'Military-grade security protocols',
  'Reduce energy bills by up to 30%',
]

const inputStyle = {
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid #d1d5db',
  borderRadius: 0,
  boxShadow: 'none',
  outline: 'none',
  padding: '8px 0',
  width: '100%',
  fontSize: '0.875rem',
  color: '#374151',
}

export default function SmartHomePage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    propertyType: '',
    systemsNeeded: '',
    message: '',
  })

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  const handleSubmit = (e) => { e.preventDefault(); console.log('Smart Home Request:', formData) }
  const focusBorder = (e) => { e.currentTarget.style.borderBottomColor = '#17637C' }
  const blurBorder = (e) => { e.currentTarget.style.borderBottomColor = '#d1d5db' }

  return (
    <div className="min-h-screen">

      {/* ── Section 1: Split-Screen Hero ────────────────────── */}
      <section
        className="flex flex-col md:flex-row md:-mt-[4em]"
        style={{ minHeight: '100vh' }}
      >
        {/* Left: teal panel */}
        <div
          className="flex-1 flex items-center px-8 md:px-14 lg:px-20 py-28 md:py-0"
          style={{ backgroundColor: '#17637C' }}
        >
          <div style={{ maxWidth: 480 }}>
            <div
              className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] mb-6"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 2 }}
            >
              Smart Home Installation
            </div>
            <h1
              className={`${playfair.className} font-bold leading-tight mb-6`}
              style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', color: '#fff' }}
            >
              Your Home,<br />Intelligent
            </h1>
            <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.72)' }}>
              We transform conventional homes into fully connected ecosystems — controlled from your
              phone, activated by your voice, and secured at every level.
            </p>

            <div className="flex flex-col gap-3 mb-10">
              {BENEFITS.map((b) => (
                <div key={b} className="flex items-center gap-3">
                  <CheckCircle style={{ width: 16, height: 16, color: '#F68B1F', flexShrink: 0 }} />
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{b}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                className="px-8 py-3 font-semibold text-sm transition-colors duration-300"
                style={{ backgroundColor: '#fff', color: '#17637C' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f0f0' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff' }}
              >
                Book Assessment
              </button>
              <button
                className="px-8 py-3 text-sm font-semibold transition-colors duration-300"
                style={{ border: '1px solid rgba(255,255,255,0.45)', color: '#fff', background: 'transparent' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* Right: image */}
        <div className="flex-1 relative" style={{ minHeight: '50vh' }}>
          <img
            src="/aboutUsImages/ww.jpeg"
            alt="Smart Home"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to left, transparent 65%, rgba(23,99,124,0.35) 100%)',
            }}
          />
        </div>
      </section>

      {/* ── Section 2: Smart Features Grid ──────────────────── */}
      <section
        className="py-16 px-6 md:px-16"
        style={{
          background: 'linear-gradient(180deg, rgba(23,99,124,0.06) 0%, rgba(255,255,255,0) 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#F68B1F' }}>
              The Ecosystem
            </p>
            <h2
              className={playfair.className}
              style={{ color: '#17637C', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 600, margin: 0 }}
            >
              What Gets Connected
            </h2>
            <div style={{ width: 48, height: 2, backgroundColor: '#17637C', marginTop: 12 }} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {FEATURES.map(({ Icon, title, body }) => (
              <div
                key={title}
                className="bg-white rounded-xl p-6 border border-gray-100 cursor-default transition-all duration-300"
                style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(23,99,124,0.3)'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(23,99,124,0.12)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#f3f4f6'
                  e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.05)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div
                  className="flex items-center justify-center mb-4"
                  style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(23,99,124,0.08)' }}
                >
                  <Icon style={{ width: 20, height: 20, color: '#17637C' }} />
                </div>
                <p className="font-bold text-sm mb-1" style={{ color: '#111827' }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#9ca3af' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Process + Image ───────────────────────── */}
      <section className="py-16 px-6 md:px-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

            {/* Vertical connected steps */}
            <div>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#F68B1F' }}>
                Our Method
              </p>
              <h2
                className={playfair.className}
                style={{
                  color: '#17637C',
                  fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
                  fontWeight: 600,
                  margin: '0 0 12px',
                }}
              >
                How It Works
              </h2>
              <div style={{ width: 48, height: 2, backgroundColor: '#17637C', marginBottom: 36 }} />

              <div className="flex flex-col">
                {PROCESS.map((step, i) => (
                  <div key={step.num} className="flex gap-5">
                    {/* Circle + connector */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div
                        className="flex items-center justify-center text-white text-xs font-bold"
                        style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#17637C' }}
                      >
                        {step.num}
                      </div>
                      {i < PROCESS.length - 1 && (
                        <div
                          style={{ width: 2, flexGrow: 1, backgroundColor: '#e5e7eb', minHeight: 28, marginTop: 4, marginBottom: 4 }}
                        />
                      )}
                    </div>
                    {/* Content */}
                    <div className={i < PROCESS.length - 1 ? 'pb-8' : ''}>
                      <p className="font-bold text-sm mb-1" style={{ color: '#111827' }}>{step.title}</p>
                      <p className="text-xs leading-relaxed" style={{ color: '#9ca3af' }}>{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image */}
            <div className="rounded-2xl overflow-hidden" style={{ height: 460 }}>
              <img
                src="/aboutUsImages/hh.jpeg"
                alt="Smart Home Installation"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Form ──────────────────────────────────── */}
      <section
        className="py-16 px-6 md:px-16"
        style={{ background: 'linear-gradient(180deg, rgba(23,99,124,0.05) 0%, rgba(255,255,255,0) 100%)' }}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

          {/* Left */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#F68B1F' }}>
              Get Started
            </p>
            <h2
              className={playfair.className}
              style={{ color: '#17637C', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 600, margin: '0 0 16px' }}
            >
              Book a Free<br />Site Assessment
            </h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: '#6b7280', maxWidth: 380 }}>
              Our engineers will visit your property, assess the infrastructure, and recommend
              the ideal smart home configuration — at no cost to you.
            </p>
            <div
              style={{ borderLeft: '4px solid #17637C', backgroundColor: 'rgba(23,99,124,0.05)', padding: '16px 20px' }}
            >
              <p className="text-sm leading-relaxed italic" style={{ color: '#4b5563' }}>
                "Our clients typically save 25–30% on energy costs within the first year of installation."
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-6 mb-6">
              {[
                { label: 'Full Name', name: 'fullName', type: 'text', placeholder: 'John Doe' },
                { label: 'Email Address', name: 'email', type: 'email', placeholder: 'john@example.com' },
                { label: 'Phone Number', name: 'phone', type: 'tel', placeholder: '+233 ...' },
                { label: 'Property Type', name: 'propertyType', type: 'text', placeholder: 'Home, Office...' },
              ].map((field) => (
                <div key={field.name}>
                  <label
                    htmlFor={field.name}
                    className="block text-xs uppercase tracking-widest mb-1"
                    style={{ color: '#9ca3af' }}
                  >
                    {field.label}
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.name]}
                    onChange={handleChange}
                    style={inputStyle}
                    onFocus={focusBorder}
                    onBlur={blurBorder}
                  />
                </div>
              ))}
            </div>

            <div className="mb-6">
              <label
                htmlFor="systemsNeeded"
                className="block text-xs uppercase tracking-widest mb-1"
                style={{ color: '#9ca3af' }}
              >
                Systems Required
              </label>
              <input
                id="systemsNeeded"
                name="systemsNeeded"
                type="text"
                placeholder="Lighting, Security, Climate, All..."
                value={formData.systemsNeeded}
                onChange={handleChange}
                style={inputStyle}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
            </div>

            <div className="mb-8">
              <label
                htmlFor="message"
                className="block text-xs uppercase tracking-widest mb-1"
                style={{ color: '#9ca3af' }}
              >
                Additional Notes
              </label>
              <textarea
                id="message"
                name="message"
                placeholder="Any specific requirements or questions..."
                value={formData.message}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
            </div>

            <button
              type="submit"
              className="w-full text-white py-4 uppercase tracking-widest font-semibold text-sm transition-colors duration-300"
              style={{ backgroundColor: '#17637C', borderRadius: 0 }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#114e62' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#17637C' }}
            >
              Book Free Assessment
            </button>
          </form>
        </div>
      </section>

    </div>
  )
}
