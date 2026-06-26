'use client'

import React, { useState } from 'react'
import { Playfair_Display } from 'next/font/google'
import { Paintbrush, Gem, BadgeCheck, ArrowRight } from 'lucide-react'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '700'] })

const SERVICES = [
  {
    num: '01',
    img: '/aboutUsImages/c1.jpeg',
    title: 'Space Planning & Layout',
    body: 'We reimagine your floorplan to maximise flow, natural light, and purpose in every room — from intimate apartments to sprawling estates.',
  },
  {
    num: '02',
    img: '/aboutUsImages/hh.jpeg',
    title: 'Material & Finish Curation',
    body: 'From bespoke joinery to handpicked stone and artisan textiles — every surface, texture, and tone is selected with considered intention.',
  },
  {
    num: '03',
    img: '/aboutUsImages/Kitchen1.jpeg',
    title: 'Furniture & Styling',
    body: 'We source and style furniture pieces that balance form, function, and lasting quality — curated from the finest local and international suppliers.',
  },
]

const JOURNEY = [
  {
    step: '01',
    title: 'Discovery',
    body: 'We listen deeply to understand your lifestyle, aesthetic preferences, and long-term goals for the space.',
  },
  {
    step: '02',
    title: 'Concept Design',
    body: 'Mood boards, spatial layouts, and material palettes — all tailored exclusively to you.',
  },
  {
    step: '03',
    title: 'Development',
    body: 'Detailed technical drawings, supplier sourcing, and full project coordination handled seamlessly.',
  },
  {
    step: '04',
    title: 'Reveal',
    body: 'Your transformed space, delivered on time, on budget, and beyond every expectation.',
  },
]

const PORTFOLIO = [
  { src: '/aboutUsImages/sitting1.jpeg', label: 'Living Room Transformation', large: true },
  { src: '/aboutUsImages/hh.jpeg', label: 'Contemporary Suite' },
  { src: '/aboutUsImages/Kitchen1.jpeg', label: "Chef's Kitchen" },
  { src: '/aboutUsImages/Gym1.jpeg', label: 'Home Wellness Studio' },
  { src: '/aboutUsImages/c2.jpeg', label: 'Open Plan Redesign' },
]

const FORM_FIELDS = [
  { label: 'Full Name', name: 'fullName', type: 'text', placeholder: 'John Doe' },
  { label: 'Email Address', name: 'email', type: 'email', placeholder: 'john@example.com' },
  { label: 'Phone Number', name: 'phone', type: 'tel', placeholder: '+233 ...' },
  { label: 'Property Type', name: 'propertyType', type: 'text', placeholder: 'Apartment, Villa...' },
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

export default function InteriorDesignPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    propertyType: '',
    stylePreference: '',
    message: '',
  })

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Consultation Request:', formData)
  }

  const focusBorder = (e) => { e.currentTarget.style.borderBottomColor = '#17637C' }
  const blurBorder = (e) => { e.currentTarget.style.borderBottomColor = '#d1d5db' }

  return (
    <div className="min-h-screen">

      {/* ── Section 1: Hero ─────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-end md:-mt-[4em]"
        style={{
          backgroundImage: "url('/aboutUsImages/sitting1.jpeg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.05) 100%)',
          }}
        />

        <div className="relative z-10 pb-16 pl-8 md:pl-16 lg:pl-24 pr-8 max-w-3xl">
          <p
            className="text-xs uppercase tracking-[0.25em] mb-4"
            style={{ color: '#F68B1F' }}
          >
            Interior Design Services
          </p>

          <h1
            className={`${playfair.className} text-white font-bold leading-tight mb-6`}
            style={{ fontSize: 'clamp(2.4rem, 6vw, 4.2rem)', color: '#fff' }}
          >
            Where Space<br />Becomes Story
          </h1>

          <p
            className="text-sm leading-relaxed mb-8 max-w-lg"
            style={{ color: '#d1d5db' }}
          >
            From concept to reveal, our award-winning designers craft interiors that
            feel personal, purposeful, and permanently beautiful.
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            <button
              className="px-8 py-3 font-semibold text-sm transition-colors duration-300"
              style={{ backgroundColor: '#fff', color: '#17637C' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f0f0' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff' }}
            >
              View Portfolio
            </button>
            <button
              className="px-8 py-3 text-sm font-semibold transition-colors duration-300"
              style={{ border: '1px solid rgba(255,255,255,0.6)', color: '#fff', background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              Book Consultation
            </button>
          </div>

          {/* Stat strip */}
          <div
            className="flex items-center gap-6 pt-6"
            style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}
          >
            {[
              { value: '200+', label: 'Projects Delivered' },
              { value: '15+', label: 'Expert Designers' },
              { value: '5★', label: 'Client Rating' },
            ].map((stat, i, arr) => (
              <React.Fragment key={stat.label}>
                <div>
                  <p className="font-bold text-white text-lg leading-none" style={{ color: '#fff' }}>
                    {stat.value}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {stat.label}
                  </p>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 2: Philosophy ────────────────────────────── */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p
            className={`${playfair.className} font-medium italic leading-relaxed`}
            style={{
              fontSize: 'clamp(1.4rem, 3vw, 2.2rem)',
              color: '#1f2937',
            }}
          >
            "We believe the most beautiful homes are not decorated — they are curated."
          </p>

          <div
            className="mx-auto my-10"
            style={{
              width: 96,
              height: 3,
              background: 'linear-gradient(to right, #17637C, #F68B1F)',
            }}
          />

          <div className="flex flex-wrap justify-center gap-12">
            {[
              { Icon: Paintbrush, title: 'Bespoke Design', body: 'Every project starts from a blank canvas — no templates, no shortcuts.' },
              { Icon: Gem, title: 'Material Expertise', body: 'Handpicked finishes sourced from the world\'s finest suppliers.' },
              { Icon: BadgeCheck, title: 'End-to-End Service', body: 'From the first sketch to the final styling — we handle everything.' },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="text-center" style={{ maxWidth: 180 }}>
                <Icon className="mx-auto mb-3" style={{ width: 28, height: 28, color: '#17637C' }} />
                <p className="font-semibold text-sm text-gray-800 mb-1" style={{ color: '#1f2937' }}>
                  {title}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: '#9ca3af' }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Design Services ───────────────────────── */}
      <section
        className="py-16 px-6 md:px-16"
        style={{
          background: 'linear-gradient(180deg, rgba(23,99,124,0.07) 0%, rgba(255,255,255,0) 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#F68B1F' }}>
              What We Offer
            </p>
            <h2
              className={playfair.className}
              style={{
                color: '#17637C',
                fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
                fontWeight: 600,
                margin: 0,
              }}
            >
              Design Services
            </h2>
            <div style={{ width: 48, height: 2, backgroundColor: '#17637C', marginTop: 12 }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SERVICES.map((svc) => (
              <div
                key={svc.num}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 group"
                style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
              >
                <div className="overflow-hidden" style={{ height: 208 }}>
                  <img
                    src={svc.img}
                    alt={svc.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-7">
                  <p
                    className="text-xs font-bold tracking-widest mb-3"
                    style={{ color: '#F68B1F' }}
                  >
                    {svc.num}
                  </p>
                  <p className="font-bold text-base mb-2" style={{ color: '#111827' }}>
                    {svc.title}
                  </p>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: '#6b7280' }}>
                    {svc.body}
                  </p>
                  <span
                    className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    style={{ color: '#17637C' }}
                  >
                    Enquire <ArrowRight style={{ width: 12, height: 12 }} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: The Design Journey (Timeline) ─────────── */}
      <section className="bg-white py-16 px-6 md:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#F68B1F' }}>
              Our Process
            </p>
            <h2
              className={playfair.className}
              style={{
                color: '#17637C',
                fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
                fontWeight: 600,
                margin: 0,
              }}
            >
              The Design Journey
            </h2>
            <div style={{ width: 48, height: 2, backgroundColor: '#17637C', marginTop: 12 }} />
          </div>

          {/* Desktop timeline */}
          <div className="hidden md:flex items-start">
            {JOURNEY.map((step, i) => (
              <React.Fragment key={step.step}>
                <div className="flex-1">
                  <div
                    className="flex items-center justify-center text-white text-sm font-bold mb-4"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: '#17637C',
                    }}
                  >
                    {step.step}
                  </div>
                  <p className="font-bold text-sm mb-1" style={{ color: '#111827' }}>
                    {step.title}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: '#9ca3af', maxWidth: 160 }}>
                    {step.body}
                  </p>
                </div>
                {i < JOURNEY.length - 1 && (
                  <div
                    className="flex-1 mx-2"
                    style={{
                      borderTop: '2px dashed #e5e7eb',
                      marginTop: 20,
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Mobile timeline */}
          <div className="flex flex-col gap-8 md:hidden">
            {JOURNEY.map((step) => (
              <div key={step.step} className="flex gap-4 items-start">
                <div
                  className="flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: '#17637C',
                  }}
                >
                  {step.step}
                </div>
                <div>
                  <p className="font-bold text-sm mb-1" style={{ color: '#111827' }}>
                    {step.title}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: '#9ca3af' }}>
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: Portfolio (Asymmetric Grid) ───────────── */}
      <section className="py-16 px-6 md:px-16" style={{ backgroundColor: '#17637C' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
            <div>
              <h3
                className={`${playfair.className} font-bold mb-1`}
                style={{
                  color: '#fff',
                  fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)',
                }}
              >
                Our Portfolio
              </h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                A selection of spaces we have had the privilege of transforming.
              </p>
            </div>
            <button
              className="text-sm font-medium whitespace-nowrap transition-opacity"
              style={{ color: '#fff' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.65' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              View All →
            </button>
          </div>

          <div
            className="grid grid-cols-2 md:grid-cols-3 gap-3"
            style={{ gridAutoRows: '200px' }}
          >
            {PORTFOLIO.map((item) => (
              <div
                key={item.src}
                className={`rounded-xl overflow-hidden relative group cursor-pointer${item.large ? ' md:row-span-2' : ''}`}
              >
                <img
                  src={item.src}
                  alt={item.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-xl transition-opacity duration-300"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0)',
                    opacity: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)'
                    e.currentTarget.style.opacity = '1'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0)'
                    e.currentTarget.style.opacity = '0'
                  }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: '#fff' }}
                  >
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: Consultation Form ─────────────────────── */}
      <section className="bg-white py-16 px-6 md:px-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

          {/* Left */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#F68B1F' }}>
              Get Started
            </p>
            <h2
              className={playfair.className}
              style={{
                color: '#17637C',
                fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
                fontWeight: 600,
                margin: '0 0 16px',
              }}
            >
              Begin Your Design Journey
            </h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: '#6b7280', maxWidth: 380 }}>
              Share your vision with us and we'll pair you with the right designer for your space.
              The first consultation is completely free.
            </p>
            <div
              className="text-sm leading-relaxed italic"
              style={{
                borderLeft: '4px solid #17637C',
                backgroundColor: 'rgba(23,99,124,0.05)',
                padding: '16px 20px',
                color: '#4b5563',
              }}
            >
              "Our designers have transformed over 200 spaces across Ghana and beyond — yours is next."
            </div>
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
                    style={inputStyle}
                    onFocus={focusBorder}
                    onBlur={blurBorder}
                  />
                </div>
              ))}
            </div>

            <div className="mb-6">
              <label
                htmlFor="stylePreference"
                className="block text-xs uppercase tracking-widest mb-1"
                style={{ color: '#9ca3af' }}
              >
                Interior Style Preference
              </label>
              <input
                id="stylePreference"
                name="stylePreference"
                type="text"
                placeholder="e.g. Minimalist, Contemporary, Tropical Modern..."
                value={formData.stylePreference}
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
                Tell Us About Your Vision
              </label>
              <textarea
                id="message"
                name="message"
                placeholder="Describe your space, goals, and any inspiration you have in mind..."
                value={formData.message}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  minHeight: 100,
                  resize: 'vertical',
                }}
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
              Book a Free Consultation
            </button>
          </form>
        </div>
      </section>

    </div>
  )
}
