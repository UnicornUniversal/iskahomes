 'use client'

import React, { useState } from 'react'
import { FaClock, FaEnvelope, FaMapMarkerAlt, FaPhoneAlt } from 'react-icons/fa'

const contactDetails = [
  {
    icon: FaEnvelope,
    value: 'info@iskaglobal.com',
  },
  {
    icon: FaPhoneAlt,
    value: '0302318132',
  },
  {
    icon: FaMapMarkerAlt,
    value: 'Child Street, Spintex No FHP 25',
  },
  {
    icon: FaClock,
    value: 'Mon - Fri, 8am - 5pm',
  },
]

const ContactUsPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    inquiryType: 'General inquiry',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitState, setSubmitState] = useState({ type: '', message: '' })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setSubmitState({ type: '', message: '' })

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to send your message right now.')
      }

      setSubmitState({
        type: 'success',
        message: 'Your message has been sent to Iska Homes.',
      })
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        inquiryType: 'General inquiry',
        subject: '',
        message: '',
      })
    } catch (error) {
      setSubmitState({
        type: 'error',
        message: error.message || 'Unable to send your message right now.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative bg-[linear-gradient(180deg,_rgba(23,99,124,0.07)_0%,_rgba(255,255,255,0.05)_40%,_rgba(246,139,31,0.06)_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(23,99,124,0.1),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(246,139,31,0.12),_transparent_26%)]" />

      <section className="relative mx-auto  px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#17637C]/15 bg-white/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#17637C] backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-[#F68B1F]" />
            Contact Us
          </div>

          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-[#17637C] sm:text-6xl lg:text-7xl">
            Contact Iska Homes.
          </h1>

          <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
            Get in touch with ISKA Homes for property inquiries, partnerships, support,
            or any questions about our services.
          </p>
        </div>

        <div className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="h-full">
            <div className="relative h-full min-h-[420px] overflow-hidden border border-white/25 bg-white/20 shadow-[0_24px_80px_rgba(23,99,124,0.08)] backdrop-blur-xl">
              <img
                src="/aboutUsImages/ww.jpeg"
                alt="ISKA Homes property showcase"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#17637C]/92 via-[#17637C]/78 to-transparent p-5 sm:p-6">
                <div className="grid gap-3">
                  {contactDetails.map((item) => {
                    const Icon = item.icon

                    return (
                      <div key={item.value} className="flex items-center gap-3 text-white">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/12">
                          <Icon size={14} />
                        </div>
                        <p className="text-sm leading-6 text-white/95">{item.value}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/25 bg-white/20 p-6 shadow-[0_24px_80px_rgba(23,99,124,0.08)] backdrop-blur-xl sm:p-8 lg:p-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#17637C]/70">
                Send a message
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#17637C] sm:text-4xl">
                Reach the Iska Homes team.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                Share your details and message below, and it will be sent directly to our team.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#17637C]">
                    Full name
                  </span>
                  <input
                    name="fullName"
                    type="text"
                    placeholder="Your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-[#17637C]/10 bg-white/30 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#17637C]/35 focus:ring-2 focus:ring-[#17637C]/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#17637C]">
                    Email address
                  </span>
                  <input
                    name="email"
                    type="email"
                    placeholder="Your email address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-[#17637C]/10 bg-white/30 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#17637C]/35 focus:ring-2 focus:ring-[#17637C]/10"
                  />
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#17637C]">
                    Phone number
                  </span>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="Your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-[#17637C]/10 bg-white/30 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#17637C]/35 focus:ring-2 focus:ring-[#17637C]/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#17637C]">
                    Inquiry type
                  </span>
                  <select
                    name="inquiryType"
                    value={formData.inquiryType}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-[#17637C]/10 bg-white/30 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#17637C]/35 focus:ring-2 focus:ring-[#17637C]/10"
                  >
                    <option>General inquiry</option>
                    <option>Property inquiry</option>
                    <option>Partnership</option>
                    <option>Support</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#17637C]">
                  Subject
                </span>
                <input
                  name="subject"
                  type="text"
                  placeholder="What is this about?"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-[#17637C]/10 bg-white/30 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#17637C]/35 focus:ring-2 focus:ring-[#17637C]/10"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#17637C]">
                  Message
                </span>
                <textarea
                  name="message"
                  rows="7"
                  placeholder="Tell us how we can help..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full resize-none rounded-2xl border border-[#17637C]/10 bg-white/30 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#17637C]/35 focus:ring-2 focus:ring-[#17637C]/10"
                />
              </label>

              {submitState.message && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    submitState.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {submitState.message}
                </div>
              )}

              <div className="flex justify-start pt-2 sm:justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#17637C] px-7 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(23,99,124,0.2)] transition hover:bg-[#114e62]"
                >
                  {isSubmitting ? 'Sending...' : 'Send message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ContactUsPage
