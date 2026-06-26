'use client'

import React, { useState } from 'react'
import { Playfair_Display } from 'next/font/google'
import { LayoutGrid, Workflow, Package, Layers, ArrowRight } from 'lucide-react'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '700'] })

const SERVICES = [
  {
    Icon: LayoutGrid,
    title: 'Layout Optimisation',
    body: 'We redesign your floorplan to maximise square footage, natural light, and the natural movement of people through every space.',
  },
  {
    Icon: Workflow,
    title: 'Traffic Flow Analysis',
    body: 'Using spatial data and occupancy modeling, we map how people move — then design layouts that feel effortless to navigate.',
  },
  {
    Icon: Package,
    title: 'Storage Solutions',
    body: 'Smart, bespoke storage integrated seamlessly into your architecture — no wasted corners, no cluttered countertops.',
  },
  {
    Icon: Layers,
    title: 'Multi-Use Design',
    body: 'A guest room that doubles as a studio. A kitchen that doubles as a dining hub. We design spaces that adapt to your life.',
  },
]

const APPROACH = [
  {
    num: '01',
    title: 'Spatial Audit',
    body: 'We walk every inch of your property, documenting how the space is currently used, where friction exists, and where potential lies untapped.',
    light: true,
  },
  {
    num: '02',
    title: 'Analysis & Insight',
    body: 'We cross-reference occupancy patterns, natural light cycles, and furniture dimensions to build an evidence-based picture of your ideal layout.',
    light: false,
  },
  {
    num: '03',
    title: 'Concept Presentation',
    body: 'A clear, visual presentation of the proposed layout — floor plans, furniture arrangements, and annotated rationale for every decision.',
    light: true,
  },
  {
    num: '04',
    title: 'Refined & Delivered',
    body: 'After your feedback, we finalise the plan as a professionally drawn document — ready to hand to your contractor or interior designer.',
    light: false,
  },
]

const GALLERY = [
  { src: '/aboutUsImages/c1.jpeg', label: 'Open Plan Living' },
  { src: '/aboutUsImages/land1.JPG', label: 'Garden Estate Layout' },
  { src: '/aboutUsImages/c2.jpeg', label: 'Urban Apartment Redesign' },
]

const STATS = [
  { value: '300+', label: 'Spaces Planned' },
  { value: '98%', label: 'Client Satisfaction' },
  { value: '72hr', label: 'First Draft Delivery' },
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

export default function SpacePlanningPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    propertyType: '',
    spaceSize: '',
    message: '',
  })

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  const handleSubmit = (e) => { e.preventDefault(); console.log('Space Planning Request:', formData) }
  const focusBorder = (e) => { e.currentTarget.style.borderBottomColor = '#17637C' }
  const blurBorder = (e) => { e.currentTarget.style.borderBottomColor = '#d1d5db' }

  return (
    <div className="min-h-screen">

      {/* ── Section 1: Hero — white-overlay editorial ────────── */}
      <section
        className="relative min-h-screen flex items-center md:-mt-[4em]"
        style={{
          backgroundImage: "url('/aboutUsImages/sitting1.jpeg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
        }}
      >
        {/* White gradient overlay from left — bright editorial feel */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.88) 40%, rgba(255,255,255,0.4) 65%, rgba(255,255,255,0) 90%)',
          }}
        />

        <div className="relative z-10 pl-8 md:pl-16 lg:pl-24 pr-8 max-w-xl pt-24 md:pt-0">
          <p
            className="text-xs uppercase tracking-[0.25em] mb-4"
            style={{ color: '#F68B1F' }}
          >
            Space Planning Consultation
          </p>
          <h1
            className={`${playfair.className} font-bold leading-tight mb-6`}
            style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)', color: '#17637C' }}
          >
            Every Inch,<br />Intentional
          </h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: '#4b5563', maxWidth: 400 }}>
            Expert space planning that transforms underutilised areas into functional,
            flow-optimised environments — from single rooms to entire estates.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              className="px-8 py-3 font-semibold text-sm transition-colors duration-300"
              style={{ backgroundColor: '#17637C', color: '#fff' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#114e62' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#17637C' }}
            >
              Book Consultation
            </button>
            <button
              className="px-8 py-3 text-sm font-semibold transition-colors duration-300"
              style={{ border: '1px solid #17637C', color: '#17637C', background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(23,99,124,0.06)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              View Portfolio
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 2: Stats Strip ───────────────────────────── */}
      <section className="py-14 px-6 md:px-16 bg-white">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-0">
          {STATS.map((stat, i) => (
            <React.Fragment key={stat.label}>
              <div className="text-center px-10 py-4">
                <p
                  className={`${playfair.className} font-bold mb-1`}
                  style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#17637C' }}
                >
                  {stat.value}
                </p>
                <p className="text-xs uppercase tracking-widest" style={{ color: '#9ca3af' }}>
                  {stat.label}
                </p>
              </div>
              {i < STATS.length - 1 && (
                <div
                  className="hidden md:block"
                  style={{ width: 1, height: 56, backgroundColor: '#e5e7eb' }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ── Section 3: Services — 2×2 grid with border accent ── */}
      <section
        className="py-16 px-6 md:px-16"
        style={{
          background: 'linear-gradient(180deg, rgba(23,99,124,0.06) 0%, rgba(255,255,255,0) 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#F68B1F' }}>
              Our Specialisms
            </p>
            <h2
              className={playfair.className}
              style={{ color: '#17637C', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 600, margin: 0 }}
            >
              What We Plan
            </h2>
            <div style={{ width: 48, height: 2, backgroundColor: '#17637C', marginTop: 12 }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SERVICES.map(({ Icon, title, body }) => (
              <div
                key={title}
                className="bg-white rounded-xl flex gap-5 items-start p-6 border border-gray-100"
                style={{
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                  borderLeft: '4px solid #17637C',
                }}
              >
                <div
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(23,99,124,0.08)' }}
                >
                  <Icon style={{ width: 20, height: 20, color: '#17637C' }} />
                </div>
                <div>
                  <p className="font-bold text-sm mb-2" style={{ color: '#111827' }}>{title}</p>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: '#6b7280' }}>{body}</p>
                  <span
                    className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    style={{ color: '#17637C' }}
                  >
                    Enquire <ArrowRight style={{ width: 11, height: 11 }} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Approach — alternating full-width strips ─ */}
      <section className="py-4">
        <div className="max-w-6xl mx-auto px-6 md:px-16 mb-10 pt-12">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#F68B1F' }}>
            Our Approach
          </p>
          <h2
            className={playfair.className}
            style={{ color: '#17637C', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 600, margin: 0 }}
          >
            How We Work
          </h2>
          <div style={{ width: 48, height: 2, backgroundColor: '#17637C', marginTop: 12 }} />
        </div>

        {APPROACH.map((step) => (
          <div
            key={step.num}
            className="py-10 px-6 md:px-16"
            style={{ backgroundColor: step.light ? '#fff' : 'rgba(23,99,124,0.04)' }}
          >
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12 relative">
              {/* Ghost number */}
              <span
                className={`${playfair.className} hidden md:block absolute right-0 select-none pointer-events-none`}
                style={{ fontSize: '6rem', fontWeight: 800, color: 'rgba(23,99,124,0.07)', lineHeight: 1, top: '50%', transform: 'translateY(-50%)' }}
              >
                {step.num}
              </span>
              {/* Step number circle */}
              <div
                className="flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
                style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#17637C' }}
              >
                {step.num}
              </div>
              <div style={{ maxWidth: 600 }}>
                <p className="font-bold text-base mb-2" style={{ color: '#111827' }}>{step.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{step.body}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Section 5: Gallery ───────────────────────────────── */}
      <section className="py-16 px-6 md:px-16" style={{ backgroundColor: '#17637C' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
            <div>
              <h3
                className={`${playfair.className} font-bold mb-1`}
                style={{ color: '#fff', fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)' }}
              >
                Portfolio Highlights
              </h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Spaces we have transformed through thoughtful planning.
              </p>
            </div>
            <button
              className="text-sm font-medium whitespace-nowrap transition-opacity"
              style={{ color: '#fff' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.6' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              View All →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {GALLERY.map((item) => (
              <div
                key={item.src}
                className="rounded-xl overflow-hidden relative group cursor-pointer"
                style={{ height: 280 }}
              >
                <img
                  src={item.src}
                  alt={item.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div
                  className="absolute inset-0 flex items-end p-5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 60%)' }}
                >
                  <p className="text-white text-xs font-semibold uppercase tracking-widest">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: Form ──────────────────────────────────── */}
      <section className="py-16 px-6 md:px-16 bg-white">
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
              Plan Your Space
            </h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: '#6b7280', maxWidth: 380 }}>
              Tell us about your property and what you'd like to achieve. We'll reach out within
              24 hours to schedule your consultation.
            </p>
            <div
              style={{ borderLeft: '4px solid #17637C', backgroundColor: 'rgba(23,99,124,0.05)', padding: '16px 20px' }}
            >
              <p className="text-sm leading-relaxed italic" style={{ color: '#4b5563' }}>
                "Good space planning is invisible — you just feel like everything is exactly where it should be."
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
                { label: 'Property Type', name: 'propertyType', type: 'text', placeholder: 'Apartment, Villa...' },
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
                htmlFor="spaceSize"
                className="block text-xs uppercase tracking-widest mb-1"
                style={{ color: '#9ca3af' }}
              >
                Approximate Space Size
              </label>
              <input
                id="spaceSize"
                name="spaceSize"
                type="text"
                placeholder="e.g. 3-bedroom, 200 sqm, full floor..."
                value={formData.spaceSize}
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
                What Would You Like to Achieve?
              </label>
              <textarea
                id="message"
                name="message"
                placeholder="Describe your current space challenges and goals..."
                value={formData.message}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
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
              Book a Consultation
            </button>
          </form>
        </div>
      </section>

    </div>
  )
}
