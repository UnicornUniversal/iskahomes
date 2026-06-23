'use client'

import React, { useState } from 'react'
import { Playfair_Display } from 'next/font/google'
import { Clock, Globe, Eye, Play, Check } from 'lucide-react'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '700'] })

const VR_PROPERTIES = [
  { src: '/aboutUsImages/VR1.jpg', name: 'Azure Sanctuary' },
  { src: '/aboutUsImages/VR2.jpg', name: 'The Monolith' },
  { src: '/aboutUsImages/VR3.jpg', name: 'Cotswold Manor' },
  { src: '/aboutUsImages/VR4.jpg', name: 'Skyloft VIII' },
]

const FORM_FIELDS = [
  { label: 'Full Name', name: 'fullName', type: 'text', placeholder: 'John Doe' },
  { label: 'Email Address', name: 'email', type: 'email', placeholder: 'john@example.com' },
  { label: 'Phone Number', name: 'phone', type: 'tel', placeholder: '+233 ...' },
  { label: 'Property Address', name: 'propertyAddress', type: 'text', placeholder: 'Spintex, Accra' },
]

export default function VirtualTourPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    propertyAddress: '',
  })

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Scan Request:', formData)
  }

  return (
    <div className="min-h-screen">

      {/* Section 1 — Hero */}
      <section
        className="relative min-h-screen flex items-center md:-mt-[4em]"
        style={{
          backgroundImage: "url('/aboutUsImages/H.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 60%, transparent 100%)',
          }}
        />
        <div className="relative z-10 pl-8 md:pl-16 lg:pl-24 pr-8 md:pr-0 max-w-2xl pt-24 md:pt-0">
          <p
            className="text-xs uppercase tracking-widest mb-4"
            style={{ color: '#17637C' }}
          >
            Next Generation Living
          </p>
          <h1
            className={`${playfair.className} text-white font-bold leading-tight mb-6`}
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            Experience Homes<br />Like Never Before
          </h1>
          <p
            className="text-gray-300 text-sm leading-relaxed mb-8 max-w-md"
            style={{ color: '#d1d5db' }}
          >
            Step into the future of luxury real estate with our proprietary 8K immersive
            virtual tours, offering a true-to-life walkthrough from anywhere in the world.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              className="text-white text-sm font-semibold tracking-wide px-6 py-3 transition-colors duration-300"
              style={{ backgroundColor: '#17637C' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#114e62')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#17637C')}
            >
              Explore in VR
            </button>
            <button
              className="flex items-center gap-2 border border-white text-white text-sm font-semibold tracking-wide px-6 py-3 transition-colors duration-300 hover:bg-white/10"
              style={{ color: '#fff' }}
            >
              <Play className="w-4 h-4" />
              Watch Trailer
            </button>
          </div>
        </div>
      </section>

      {/* Section 2 — Feature Cards */}
      <section
        className="py-16 md:py-20 px-6 md:px-16"
        style={{
          background:
            'linear-gradient(180deg, rgba(23,99,124,0.1) 0%, rgba(255,255,255,0.01) 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
            <Clock className="w-8 h-8" style={{ color: '#17637C' }} />
            <h3
              className="font-semibold text-lg mt-4 mb-2"
              style={{ color: '#17637C', fontSize: '1.125rem' }}
            >
              24/7 Access
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed" style={{ color: '#6b7280' }}>
              Tour properties at your own pace, anytime, without the need for scheduling
              appointments or physical travel.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
            <Globe className="w-8 h-8" style={{ color: '#17637C' }} />
            <h3
              className="font-semibold text-lg mt-4 mb-2"
              style={{ color: '#17637C', fontSize: '1.125rem' }}
            >
              Global Reach
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed" style={{ color: '#6b7280' }}>
              Our international clientele can explore portfolios across continents with zero
              latency and high-fidelity detail.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
            <Eye className="w-8 h-8" style={{ color: '#17637C' }} />
            <h3
              className="font-semibold text-lg mt-4 mb-2"
              style={{ color: '#17637C', fontSize: '1.125rem' }}
            >
              Spatial Context
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed" style={{ color: '#6b7280' }}>
              Understand floor plans and volumes better than any static photo can convey
              through our dedicated dollhouse perspective views.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3 — The Architectural Process */}
      <section className="py-16 px-6 md:px-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <h2
              className={playfair.className}
              style={{
                color: '#17637C',
                fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
                fontWeight: 600,
                margin: 0,
              }}
            >
              The Architectural Process
            </h2>
            <div className="w-12 border-b-2 mt-3" style={{ borderColor: '#17637C' }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: image with step 01 overlay */}
            <div className="relative min-h-[360px] rounded-xl overflow-hidden">
              <img
                src="/aboutUsImages/Container.png"
                alt="Precision Capture"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute bottom-0 left-0 m-4 p-4 rounded-lg"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.65)',
                  maxWidth: '270px',
                }}
              >
                <p
                  className="text-xs uppercase tracking-widest mb-1"
                  style={{ color: '#17637C' }}
                >
                  Step 01
                </p>
                <p className="font-bold text-sm text-white mb-1">Precision Capture</p>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  Using Leica laser scanning technology, we map every millimeter of the
                  property to create a perfect digital twin.
                </p>
              </div>
            </div>

            {/* Right: two stacked step cards */}
            <div className="flex flex-col gap-4">
              <div
                className="p-6 rounded-xl flex-1"
                style={{ backgroundColor: '#17637C' }}
              >
                <p
                  className="text-xs uppercase tracking-widest mb-2"
                  style={{ color: 'rgba(255,255,255,0.65)' }}
                >
                  Step 02
                </p>
                <h4
                  className="font-bold text-base mb-2"
                  style={{ color: '#fff', fontSize: '1rem' }}
                >
                  Spatial Synthesis
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Our AI-driven engine stitches 8K HDR imagery into a seamless,
                  navigable web environment.
                </p>
              </div>

              <div className="bg-white border border-gray-100 shadow-sm p-6 rounded-xl flex-1">
                <p
                  className="text-xs uppercase tracking-widest mb-2"
                  style={{ color: '#17637C' }}
                >
                  Step 03
                </p>
                <h4
                  className="font-bold text-base mb-2"
                  style={{ color: '#1f2937', fontSize: '1rem' }}
                >
                  Delivery
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>
                  Access your tour via private link, VR headset, or our dedicated
                  property concierge app.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 — Active VR Portfolios */}
      <section className="py-16 px-6 md:px-16" style={{ backgroundColor: '#1A5C5A' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
            <div>
              <h3
                className="font-bold text-xl md:text-2xl mb-1"
                style={{ color: '#fff', fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)' }}
              >
                Active VR Portfolios
              </h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Step inside our most exclusive listings currently on the market.
              </p>
            </div>
            <button
              className="text-sm font-medium whitespace-nowrap transition-opacity hover:opacity-70"
              style={{ color: '#fff' }}
            >
              Explore Below →
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {VR_PROPERTIES.map((property) => (
              <div key={property.name}>
                <div className="rounded-xl overflow-hidden aspect-[4/3]">
                  <img
                    src={property.src}
                    alt={property.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <p
                  className="font-bold text-sm mt-2"
                  style={{ color: '#fff' }}
                >
                  {property.name}
                </p>
                <p
                  className="text-xs flex items-center gap-1 mt-0.5"
                  style={{ color: '#5eead4' }}
                >
                  <Check className="w-3 h-3" /> VR Enabled
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 — Scan Request Form */}
      <section className="py-16 px-6 md:px-16 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Left */}
          <div>
            <h2
              className={playfair.className}
              style={{
                color: '#17637C',
                fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
                fontWeight: 600,
                margin: '0 0 16px',
              }}
            >
              Ready To Transform<br />Your Listing?
            </h2>
            <p className="text-sm leading-relaxed max-w-sm" style={{ color: '#6b7280' }}>
              Request a custom consultation and technical assessment for your property.
              Our team of specialists will guide you through the process of creating a
              world-class digital twin.
            </p>
          </div>

          {/* Right: form */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-6 mb-6">
              {FORM_FIELDS.map((field) => (
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
                    style={{
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
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderBottomColor = '#17637C'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderBottomColor = '#d1d5db'
                    }}
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full text-white py-4 uppercase tracking-widest font-semibold text-sm transition-colors duration-300"
              style={{ backgroundColor: '#17637C', borderRadius: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#114e62')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#17637C')}
            >
              Schedule a Scan
            </button>
          </form>
        </div>
      </section>

    </div>
  )
}
