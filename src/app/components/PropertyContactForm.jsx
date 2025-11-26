"use client"
import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useAnalytics } from '@/hooks/useAnalytics'
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaCheckCircle, FaVideo, FaUserFriends } from 'react-icons/fa'
import { FaWhatsapp } from 'react-icons/fa6'
import { HiOutlineCalendar, HiOutlineClock } from 'react-icons/hi'

const PropertyContactForm = ({ propertyId, propertyTitle, propertyType, developer, listing }) => {
  const { user, propertySeekerToken } = useAuth()
  const router = useRouter()
  const analytics = useAnalytics()
  const [activeTab, setActiveTab] = useState('appointment')
  const [mode, setMode] = useState('in-person')
  const [loading, setLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  
  // State initialization remains the same...
  const [appointmentData, setAppointmentData] = useState({
    date: '', time: '', name: '', email: '', phone: '', message: ''
  })
  const [messageData, setMessageData] = useState({ message: '' })

  useEffect(() => {
    if (user && user.user_type === 'property_seeker' && user.profile) {
      setAppointmentData(prev => ({
        ...prev,
        name: user.profile.name || '',
        email: user.email || '',
        phone: user.profile.phone || ''
      }))
    }
  }, [user])

  // Helper functions (unchanged logic)
  const getAccountType = () => listing?.account_type || (propertyType === 'unit' || propertyType === 'developer' ? 'developer' : 'agent')
  const getAccountId = () => listing?.user_id || developer?.developer_id || 'unknown'
  
  const getContactInfo = () => {
    const name = developer?.name || listing?.title || 'Property Owner'
    const profileImage = developer?.profile_image?.url || null
    const location = developer?.town && developer?.city ? `${developer.town}, ${developer.city}` : developer?.address || listing?.full_address || 'Location n/a'
    return { 
      name, 
      profileImage, 
      location, 
      phone: developer?.phone || listing?.phone, 
      whatsapp: listing?.whatsapp || developer?.whatsapp, 
      email: developer?.email 
    }
  }
  const contactInfo = getContactInfo()

  // Handlers (unchanged logic, just stripped for brevity in this view)
  const handleAppointmentInputChange = (e) => setAppointmentData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  const handleMessageInputChange = (e) => setMessageData({ message: e.target.value })
  
  // ... Include your existing handleAppointmentSubmit, handleMessageSubmit, handlePhoneClick, etc. here ...
  // For the sake of the design preview, I am assuming the logic blocks exist as they were.
  
  const handlePhoneClick = async () => {
     if(contactInfo.phone) { navigator.clipboard.writeText(contactInfo.phone); toast.success("Copied!"); }
  }
  const handleWhatsAppClick = () => { if(contactInfo.whatsapp) window.open(`https://wa.me/${contactInfo.whatsapp}`, '_blank'); }
  const handleEmailClick = () => { if(contactInfo.email) window.location.href = `mailto:${contactInfo.email}`; }
  
  // Dummy handlers for visual completeness if you copy-paste this directly
  const handleAppointmentSubmit = (e) => { e.preventDefault(); setLoading(true); setTimeout(() => { setLoading(false); toast.success("Request sent"); }, 1500); }
  const handleMessageSubmit = (e) => { e.preventDefault(); setSendingMessage(true); setTimeout(() => { setSendingMessage(false); toast.success("Message sent"); }, 1500); }


  return (
    <div className="w-full h-full xl:h-[500px] flex flex-col bg-white/30 rounded-3xl shadow-2xl shadow-gray-200/50 max-w-md mx-auto overflow-hidden border border-gray-100 font-sans">
      
      {/* --- HEADER SECTION (Fixed) --- */}
      <div className="flex-none bg-white p-6 pb-2 z-20">
        
        {/* Profile Card */}
        <div className="flex items-center text-center mb-6">
          <div className="relative mb-3">
             {contactInfo.profileImage ? (
                <img src={contactInfo.profileImage} alt={contactInfo.name} className="w-20 h-20 rounded-full object-cover ring-4 ring-gray-50 shadow-inner" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ring-4 ring-gray-50 text-gray-400 text-2xl font-bold">
                  {contactInfo.name?.charAt(0)}
                </div>
              )}
              <div className="absolute bottom-0 right-0 bg-green-500 w-5 h-5 rounded-full border-4 border-white"></div>
          </div>
          

          <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-1.5">
            {contactInfo.name}
            <FaCheckCircle className="text-blue-500 w-4 h-4" title="Verified Account" />
          </h3>


          <p className="text-sm text-gray-500 font-medium mb-4 flex items-center gap-1">
            <FaMapMarkerAlt className="text-gray-300" /> {contactInfo.location}
          </p>

          {/* Quick Actions - Minimalist Circles */}
          <div className="flex items-center gap-4">
            {contactInfo.whatsapp && (
              <button onClick={handleWhatsAppClick} className="group flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center transition-all group-hover:bg-green-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-green-500/30">
                  <FaWhatsapp className="w-5 h-5" />
                </div>
              </button>
            )}
            {contactInfo.phone && (
              <button onClick={handlePhoneClick} className="group flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center transition-all group-hover:bg-blue-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/30">
                  <FaPhone className="w-4 h-4" />
                </div>
              </button>
            )}
            {contactInfo.email && (
              <button onClick={handleEmailClick} className="group flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center transition-all group-hover:bg-gray-800 group-hover:text-white group-hover:shadow-lg">
                  <FaEnvelope className="w-4 h-4" />
                </div>
              </button>
            )}
          </div>
          </div>
        
        </div>

        {/* Modern Segmented Control Tabs */}
        <div className="p-1.5 bg-gray-100/80 rounded-2xl flex relative">
          <button
            onClick={() => setActiveTab('appointment')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 relative z-10 ${
              activeTab === 'appointment' ? 'text-gray-900 shadow-sm bg-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Book a Tour
          </button>
          <button
            onClick={() => setActiveTab('message')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 relative z-10 ${
              activeTab === 'message' ? 'text-gray-900 shadow-sm bg-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Message
          </button>
        </div>
      </div>

      {/* --- SCROLLABLE CONTENT --- */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 scrollbar-hide">
        
        {activeTab === 'appointment' ? (
          <form onSubmit={handleAppointmentSubmit} className="space-y-5 pt-4 animate-fadeIn">
            
            {/* Toggle Switch */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                <button
                  type="button"
                  onClick={() => setMode('in-person')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-all ${
                    mode === 'in-person' ? 'bg-white shadow-sm text-gray-900 ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <FaUserFriends className="w-3 h-3" /> In Person
                </button>
                <button
                  type="button"
                  onClick={() => setMode('video')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-all ${
                    mode === 'video' ? 'bg-white shadow-sm text-gray-900 ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <FaVideo className="w-3 h-3" /> Video Chat
                </button>
              </div>
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-1">Date</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                    <HiOutlineCalendar className="w-5 h-5" />
                  </div>
                  <input
                    type="date"
                    name="date"
                    required
                    value={appointmentData.date}
                    onChange={handleAppointmentInputChange}
                    className="w-full bg-gray-50 text-gray-900 text-sm font-medium rounded-xl border-none pl-10 pr-3 py-3.5 focus:ring-2 focus:ring-orange-100 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-1">Time</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                    <HiOutlineClock className="w-5 h-5" />
                  </div>
                  <input
                    type="time"
                    name="time"
                    required
                    value={appointmentData.time}
                    onChange={handleAppointmentInputChange}
                    className="w-full bg-gray-50 text-gray-900 text-sm font-medium rounded-xl border-none pl-10 pr-3 py-3.5 focus:ring-2 focus:ring-orange-100 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Inputs */}
            {['name', 'email', 'phone'].map((field) => (
              <div key={field} className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-1">{field}</label>
                <input
                  type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                  name={field}
                  required={field !== 'phone'}
                  value={appointmentData[field]}
                  onChange={handleAppointmentInputChange}
                  placeholder={`Enter your ${field}`}
                  className="w-full bg-gray-50 text-gray-900 text-sm font-medium rounded-xl border-none px-4 py-3.5 focus:ring-2 focus:ring-orange-100 focus:bg-white transition-all outline-none placeholder-gray-400"
                />
              </div>
            ))}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-1">Notes</label>
              <textarea
                name="message"
                rows={3}
                value={appointmentData.message}
                onChange={handleAppointmentInputChange}
                placeholder="Any specific requests?"
                className="w-full bg-gray-50 text-gray-900 text-sm font-medium rounded-xl border-none px-4 py-3.5 focus:ring-2 focus:ring-orange-100 focus:bg-white transition-all outline-none resize-none placeholder-gray-400"
              />
            </div>
            
            {/* Spacer for sticky button */}
            <div className="h-4"></div>
          </form>
        ) : (
          <form onSubmit={handleMessageSubmit} className="space-y-5 pt-4 animate-fadeIn">
             <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-1">Your Message</label>
              <textarea
                name="message"
                rows={10}
                required
                value={messageData.message}
                onChange={handleMessageInputChange}
                placeholder="Hi, I am interested in this property..."
                className="w-full bg-gray-50 text-gray-900 text-sm font-medium rounded-xl border-none px-4 py-4 focus:ring-2 focus:ring-orange-100 focus:bg-white transition-all outline-none resize-none placeholder-gray-400 leading-relaxed"
              />
            </div>
             <div className="h-4"></div>
          </form>
        )}
      </div>

      {/* --- STICKY FOOTER BUTTON --- */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-gray-100 z-30">
        <button
          type="submit"
          onClick={activeTab === 'appointment' ? handleAppointmentSubmit : handleMessageSubmit}
          disabled={loading || sendingMessage}
          className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg shadow-gray-900/20 transform active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading || sendingMessage ? (
             <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
          ) : (
            <>
              {activeTab === 'appointment' ? 'Request Appointment' : 'Send Message'}
            </>
          )}
        </button>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

export default PropertyContactForm