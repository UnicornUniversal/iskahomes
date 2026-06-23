'use client'

import React, { useState } from 'react'
import { Playfair_Display } from 'next/font/google'
import { Building2, Layers, Navigation2, ArrowRight } from 'lucide-react'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '700'] })

const RENDER_TYPES = [
  {
    Icon: Building2,
    title: 'Exterior Visualization',
    body: 'Photorealistic renders capturing every facade detail, light condition, and landscape element — before a single brick is laid.',
  },
  {
    Icon: Layers,
    title: 'Interior Renders',
    body: 'Accurate interior visualizations with true-to-life materials, finishes, and ambient lighting that pre-sell and inspire buyers.',
  },
  {
    Icon: Navigation2,
    title: 'Aerial Perspectives',
    body: "Bird's-eye renders and animated fly-throughs communicating site context, scale, and surroundings at a glance.",
  },
]

const PIPELINE = [
  {
    num: '01',
    title: 'Brief & Reference Collection',
    body: 'We gather your architectural drawings, material boards, and vision references to anchor every detail in accuracy.',
  },
  {
    num: '02',
    title: '3D Geometry Modelling',
    body: 'Our artists build precise digital geometry — walls, windows, landscape, and structural elements at exact real-world scale.',
  },
  {
    num: '03',
    title: 'Texturing & Lighting Setup',
    body: 'Materials are mapped with HDR lighting rigs that replicate real-world conditions at any time of day.',
  },
  {
    num: '04',
    title: 'Final Render & Delivery',
    body: 'High-resolution outputs ready within 48 hours — print-ready and web-optimised formats both included.',
  },
]

const GALLERY = [
  { src: '/aboutUsImages/c3.jpeg', label: 'Riverside Residence', large: true },
  { src: '/aboutUsImages/c4.jpeg', label: 'Urban Penthouse' },
  { src: '/aboutUsImages/R1.jpeg', label: 'Hillside Estate' },
  { src: '/aboutUsImages/land2.JPG', label: 'Coastal Development' },
  { src: '/aboutUsImages/land3.JPG', label: 'Garden Villa' },
]

const STATS = [
  { value: '500+', label: 'Renders Delivered' },
  { value: '8K', label: 'Max Resolution' },
  { value: '48hr', label: 'Turnaround' },
  { value: '12', label: 'Expert Artists' },
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

export default function Visualization3DPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    projectType: '',
    renderType: '',
    message: '',
  })

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  const handleSubmit = (e) => { e.preventDefault(); console.log('3D Viz Request:', formData) }
  const focusBorder = (e) => { e.currentTarget.style.borderBottomColor = '#17637C' }
  const blurBorder = (e) => { e.currentTarget.style.borderBottomColor = '#d1d5db' }

  return (
    <div className="min-h-screen">

      {/* ── Section 1: Hero ─────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center md:-mt-[4em]"
        style={{
          backgroundImage: "url('/aboutUsImages/land2.JPG')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.1) 100%)',
          }}
        />
        <div className="relative z-10 pl-8 md:pl-16 lg:pl-24 pr-8 max-w-2xl">
          <div
            className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] mb-6"
            style={{ backgroundColor: '#F68B1F', color: '#fff' }}
          >
            3D Visualization
          </div>
          <h1
            className={`${playfair.className} font-bold leading-tight mb-6`}
            style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)', color: '#fff' }}
          >
            From Blueprint<br />to Reality
          </h1>
          <p className="text-sm leading-relaxed mb-10 max-w-lg" style={{ color: '#d1d5db' }}>
            Photorealistic architectural visualizations that sell properties before
            construction begins — crafted by our team of specialist 3D artists.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              className="px-8 py-3 font-semibold text-sm transition-colors duration-300"
              style={{ backgroundColor: '#17637C', color: '#fff' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#114e62' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#17637C' }}
            >
              View Sample Renders
            </button>
            <button
              className="px-8 py-3 text-sm font-semibold transition-colors duration-300"
              style={{ border: '1px solid rgba(255,255,255,0.6)', color: '#fff', background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              Get a Quote
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 2: Stats Band ────────────────────────────── */}
      <section className="py-12 px-6 md:px-16" style={{ backgroundColor: '#17637C' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="text-center"
              style={{ borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none' }}
            >
              <p
                className={`${playfair.className} font-bold mb-1`}
                style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: '#fff' }}
              >
                {stat.value}
              </p>
              <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: Render Types ──────────────────────────── */}
      <section
        className="py-16 px-6 md:px-16"
        style={{
          background: 'linear-gradient(180deg, rgba(23,99,124,0.06) 0%, rgba(255,255,255,0) 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#F68B1F' }}>
              What We Create
            </p>
            <h2
              className={playfair.className}
              style={{ color: '#17637C', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 600, margin: 0 }}
            >
              Visualization Services
            </h2>
            <div style={{ width: 48, height: 2, backgroundColor: '#17637C', marginTop: 12 }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {RENDER_TYPES.map(({ Icon, title, body }) => (
              <div
                key={title}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100"
                style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
              >
                <div style={{ height: 4, backgroundColor: '#F68B1F' }} />
                <div className="p-8">
                  <div
                    className="flex items-center justify-center mb-6"
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(23,99,124,0.08)',
                    }}
                  >
                    <Icon style={{ width: 24, height: 24, color: '#17637C' }} />
                  </div>
                  <p className="font-bold text-base mb-3" style={{ color: '#111827' }}>{title}</p>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: '#6b7280' }}>{body}</p>
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

      {/* ── Section 4: Pipeline — 2×2 with ghost numbers ─────── */}
      <section className="py-16 px-6 md:px-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#F68B1F' }}>
              How It Works
            </p>
            <h2
              className={playfair.className}
              style={{ color: '#17637C', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 600, margin: 0 }}
            >
              The Render Pipeline
            </h2>
            <div style={{ width: 48, height: 2, backgroundColor: '#17637C', marginTop: 12 }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PIPELINE.map((step) => (
              <div
                key={step.num}
                className="relative overflow-hidden rounded-2xl border border-gray-100 p-8 bg-white"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
              >
                {/* Ghost background number */}
                <span
                  className={`${playfair.className} absolute select-none pointer-events-none`}
                  style={{
                    top: -16,
                    right: 12,
                    fontSize: '7rem',
                    fontWeight: 800,
                    color: 'rgba(23,99,124,0.06)',
                    lineHeight: 1,
                  }}
                >
                  {step.num}
                </span>
                <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#F68B1F' }}>
                  {step.num}
                </p>
                <p className="font-bold text-base mb-2" style={{ color: '#111827' }}>{step.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
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
                Sample Renders
              </h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                A selection of recent 3D visualization projects.
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

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3" style={{ gridAutoRows: '200px' }}>
            {GALLERY.map((item) => (
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
                  className="absolute inset-0 flex items-end p-4 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 60%)' }}
                >
                  <p className="text-white text-xs font-semibold uppercase tracking-widest">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: Form — centered white card ────────────── */}
      <section className="py-20 px-6 md:px-16" style={{ backgroundColor: '#f8fafc' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#F68B1F' }}>
              Commission a Project
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
              Request Your Renders
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: '#9ca3af' }}>
              Share your project details and we'll respond with a custom quote within 24 hours.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-8 md:p-10"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
          >
            <div className="grid grid-cols-2 gap-6 mb-6">
              {[
                { label: 'Full Name', name: 'fullName', type: 'text', placeholder: 'John Doe' },
                { label: 'Email Address', name: 'email', type: 'email', placeholder: 'john@example.com' },
                { label: 'Phone Number', name: 'phone', type: 'tel', placeholder: '+233 ...' },
                { label: 'Project Type', name: 'projectType', type: 'text', placeholder: 'Residential, Commercial...' },
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
                htmlFor="renderType"
                className="block text-xs uppercase tracking-widest mb-1"
                style={{ color: '#9ca3af' }}
              >
                Render Type Required
              </label>
              <input
                id="renderType"
                name="renderType"
                type="text"
                placeholder="Exterior, Interior, Aerial, Animation..."
                value={formData.renderType}
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
                Project Brief
              </label>
              <textarea
                id="message"
                name="message"
                placeholder="Describe your project, timeline, and any specific requirements..."
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
              Submit Project Brief
            </button>
          </form>
        </div>
      </section>

    </div>
  )
}
