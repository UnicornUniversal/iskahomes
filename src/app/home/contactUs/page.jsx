'use client'
import React, { useState } from 'react'
import {
  FaRegEnvelope,
  FaMapMarkerAlt,
  FaWhatsapp,
  FaFacebookF,
  FaInstagram
} from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { MdOutlineSmartphone } from "react-icons/md";
import { HiOutlineMail } from "react-icons/hi";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    userType: '',
    message: '',
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
  }

  return (
    <div className="min-h-screen font-sans">
      <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-20 flex flex-col gap-12">

        {/* HEADER SECTION */}
        <div className="flex flex-col mb-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <h1 className="!text-6xl md:!text-[7rem] lg:!text-[8.5rem] font-semibold text-[#17637C] leading-none tracking-tight">
              Contact Us
            </h1>

            <div className="flex items-center gap-3 max-w-xs md:self-end md:mb-6">
              <div className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center">
                <img src="/about/onelogo.png" alt="ISKA Homes Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <p className="text-xs text-[#17637C] leading-relaxed">
                Connect with us and discover the leading platform for real estate listings and property development solutions.
              </p>
            </div>
          </div>
          <div className="w-full h-[1px] bg-[#17637C]/20"></div>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-12 lg:gap-24 mb-16">

          {/* LEFT COLUMN - Contact Info */}
          <div className="flex flex-col mt-4">
            <h2 className="!text-3xl font-bold text-[#17637C] mb-2 tracking-tight">How can we help you?</h2>
            <p className="text-gray-400 mb-10 text-sm">Fill the form or drop and email</p>

            <div className="flex flex-col gap-4 mb-12">
              {/* Info Box 1 */}
              <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <FaRegEnvelope className="text-[#17637C] text-xl" />
                <span className="text-sm text-gray-500">info@iskaglobal.com</span>
              </div>

              {/* Info Box 2 */}
              <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <MdOutlineSmartphone className="text-[#17637C] text-xl" />
                <span className="text-sm text-gray-500">0302318132</span>
              </div>

              {/* Info Box 3 */}
              <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <FaMapMarkerAlt className="text-[#17637C] text-xl" />
                <span className="text-sm text-gray-500">Child Street, Spintex No FHP 25</span>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <a href="#" className="text-green-500 hover:opacity-80 transition-opacity">
                <FaWhatsapp size={26} />
              </a>
              <a href="#" className="text-black hover:opacity-80 transition-opacity">
                <FaXTwitter size={24} />
              </a>
              <a href="#" className="text-blue-600 hover:opacity-80 transition-opacity">
                <FaFacebookF size={22} />
              </a>
              <a href="#" className="text-pink-600 hover:opacity-80 transition-opacity rounded-md" style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)', display: 'flex', color: 'white', padding: '3px' }}>
                <FaInstagram size={20} />
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN - Contact Form */}
          <div className="bg-[#f0f5f5] rounded-3xl p-8 lg:p-10 text-[0.9em]">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full !bg-white !border-none !shadow-none !rounded-lg !px-5 !py-4 text-sm !text-gray-700 outline-none focus:!ring-1 focus:!ring-[#17637C] transition-colors"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full !bg-white !border-none !shadow-none !rounded-lg !px-5 !py-4 text-sm !text-gray-700 outline-none focus:!ring-1 focus:!ring-[#17637C] transition-colors"
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full !bg-white !border-none !shadow-none !rounded-lg !px-5 !py-4 text-sm !text-gray-700 outline-none focus:!ring-1 focus:!ring-[#17637C] transition-colors"
              />
              <div className="relative w-full">
                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleChange}
                  className="w-full !bg-white !border-none !shadow-none !rounded-lg !px-5 !py-4 text-sm !text-gray-400 outline-none appearance-none focus:!ring-1 focus:!ring-[#17637C] transition-colors"
                  style={{ backgroundImage: 'none', paddingRight: '2.5rem' }}
                >
                  <option value="" disabled>who you are?</option>
                  <option value="Developer" className="text-gray-700">Developer</option>
                  <option value="Agent" className="text-gray-700">Agent</option>
                  <option value="Agency" className="text-gray-700">Agency</option>
                  <option value="Buyer" className="text-gray-700">Buyer</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#17637C]">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <textarea
                name="message"
                placeholder="let us know about your project"
                value={formData.message}
                onChange={handleChange}
                className="w-full !bg-white !border-none !shadow-none !rounded-lg !px-5 !py-4 text-sm !text-gray-700 outline-none focus:!ring-1 focus:!ring-[#17637C] transition-colors h-32 resize-none"
              ></textarea>

              <button
                type="submit"
                className="w-full !bg-[#17637C] !text-white !font-bold !py-4 !rounded-lg mt-2 hover:!bg-[#135252] transition-colors !border-none !shadow-none !text-base"
              >
                Submit
              </button>
            </form>
          </div>
        </div>

        {/* FOOTER NEWSLETTER BAR */}
        <div className="bg-[#f0f5f5] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-[#17637C] p-3 rounded-full text-white shrink-0">
              <HiOutlineMail size={24} />
            </div>
            <p className="font-bold text-sm md:text-[0.95rem] text-black leading-tight max-w-[200px] md:max-w-none">
              Join the newsletter and read<br className="hidden md:block" /> the new posts first
            </p>
          </div>
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
            <input
              type="email"
              placeholder="Email"
              className="!bg-white !px-5 !py-3 !rounded-lg w-full sm:w-72 text-sm outline-none !border-none !shadow-none focus:!ring-1 focus:!ring-[#17637C]"
            />
            <button className="!bg-[#17637C] !text-white !font-medium !px-8 !py-3 !rounded-lg hover:!bg-[#135252] transition-colors whitespace-nowrap !text-sm !border-none !shadow-none cursor-pointer">
              Subscribe
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ContactPage
