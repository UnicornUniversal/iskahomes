'use client'

import React, { useState } from 'react'
import { Camera, Box, Palette, Home, Ruler, CheckCircle, ArrowRight, Mail, Phone, User } from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import 'react-toastify/dist/ReactToastify.css'

const AllServicesPage = () => {
  const [selectedServices, setSelectedServices] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)

  const services = [
    {
      id: 'virtual-tour',
      name: 'Virtual Tour',
      description: 'Experience properties from anywhere with our immersive 360° virtual tours. Perfect for remote viewing and showcasing properties to international clients.',
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0',
      icon: Camera,
      features: [
        '360° panoramic views',
        'Interactive property exploration',
        'HD quality imaging',
        'Mobile-friendly experience',
        'Shareable tour links'
      ]
    },
    {
      id: '3d-visualization',
      name: '3D Visualization',
      description: 'Bring your property visions to life with stunning 3D renderings and architectural visualizations. Perfect for pre-construction marketing and design presentations.',
      image: 'https://images.unsplash.com/photo-1568605117034-6095e1e87e1e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0',
      icon: Box,
      features: [
        'Photorealistic 3D renders',
        'Interior and exterior visualization',
        'Multiple design options',
        'Virtual staging capabilities',
        'Animation and walkthroughs'
      ]
    },
    {
      id: 'interior-design',
      name: 'Interior Design',
      description: 'Transform your spaces with professional interior design services. From concept to completion, we create beautiful, functional living environments.',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0',
      icon: Palette,
      features: [
        'Custom design concepts',
        'Color scheme selection',
        'Furniture and decor sourcing',
        'Space optimization',
        'Style consultation'
      ]
    },
    {
      id: 'smart-home-installation',
      name: 'Smart Home Installation',
      description: 'Upgrade your property with cutting-edge smart home technology. Control lighting, security, climate, and more from your smartphone.',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0',
      icon: Home,
      features: [
        'Smart lighting systems',
        'Home security integration',
        'Climate control automation',
        'Voice assistant compatibility',
        'Professional installation'
      ]
    },
    {
      id: 'space-planning-consultation',
      name: 'Space Planning Consultation',
      description: 'Maximize your property\'s potential with expert space planning. Optimize layouts for functionality, flow, and aesthetic appeal.',
      image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0',
      icon: Ruler,
      features: [
        'Layout optimization',
        'Furniture placement',
        'Traffic flow analysis',
        'Storage solutions',
        'Multi-purpose space design'
      ]
    }
  ]

  const handleServiceToggle = (serviceId) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId)
      } else {
        return [...prev, serviceId]
      }
    })
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service')
      return
    }

    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/services/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          services: selectedServices
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Thank you! We\'ll contact you soon.')
        setFormData({ name: '', email: '', phone: '', message: '' })
        setSelectedServices([])
      } else {
        toast.error(result.error || 'Failed to submit inquiry')
      }
    } catch (error) {
      console.error('Error submitting inquiry:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectedServiceDetails = selectedServices.length > 0
    ? services.find(s => s.id === selectedServices[selectedServices.length - 1])
    : null

  return (
    <div className="w-full min-h-screen bg-white_bg">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary_color/10 via-primary_color/5 to-transparent border-b border-primary_color/20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary_color mb-4">
              Our Services
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover how we can help enhance your property experience with our comprehensive range of services.
            </p>
          </div>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-200px)]">
        {/* Left Side - Service Details */}
        <div className="w-full lg:w-1/2 bg-white/30 backdrop-blur-sm border-r border-primary_color/10 p-6 md:p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Service Selection */}
    <div>
              <h2 className="text-2xl font-bold text-primary_color mb-6 flex items-center gap-2">
                <span className="w-1 h-8 bg-primary_color rounded-full"></span>
                Select Your Services
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-3">
                {services.map((service) => {
                  const IconComponent = service.icon
                  const isSelected = selectedServices.includes(service.id)
                  
                  return (
                    <button
                      key={service.id}
                      onClick={() => handleServiceToggle(service.id)}
                      className={`group relative p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                        isSelected
                          ? 'border-primary_color bg-primary_color/10 shadow-lg shadow-primary_color/20'
                          : 'border-gray-200 hover:border-primary_color/50 hover:bg-primary_color/5 hover:shadow-md'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300 ${
                          isSelected
                            ? 'bg-primary_color text-white scale-110'
                            : 'bg-primary_color/10 text-primary_color group-hover:bg-primary_color/20'
                        }`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <span className={`font-semibold text-center text-sm transition-colors ${
                          isSelected ? 'text-primary_color' : 'text-gray-700 group-hover:text-primary_color'
                        }`}>
                          {service.name}
                        </span>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-primary_color absolute top-2 right-2" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Service Details Display */}
            <AnimatePresence mode="wait">
              {selectedServiceDetails ? (
                <motion.div
                  key={selectedServiceDetails.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Service Image */}
                  <div className="relative rounded-2xl overflow-hidden shadow-xl border border-primary_color/20 group">
                    <div className="absolute inset-0 bg-gradient-to-t from-primary_color/40 to-transparent z-10"></div>
                    <img
                      src={selectedServiceDetails.image}
                      alt={selectedServiceDetails.name}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                          {React.createElement(selectedServiceDetails.icon, {
                            className: 'w-6 h-6 text-primary_color'
                          })}
                        </div>
                        <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                          {selectedServiceDetails.name}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Service Description */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-primary_color/10 shadow-sm">
                    <p className="text-gray-700 leading-relaxed mb-6">
                      {selectedServiceDetails.description}
                    </p>

                    <div className="space-y-3">
                      <h4 className="font-bold text-primary_color text-lg mb-4 flex items-center gap-2">
                        <ArrowRight className="w-5 h-5" />
                        What's Included
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        {selectedServiceDetails.features.map((feature, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-start gap-3 p-3 rounded-lg bg-white/50 hover:bg-white/70 transition-colors"
                          >
                            <CheckCircle className="w-5 h-5 text-primary_color mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{feature}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-primary_color/10 flex items-center justify-center mb-4">
                    <Home className="w-12 h-12 text-primary_color/40" />
                  </div>
                  <p className="text-gray-500 text-lg font-medium">Select a service to view details</p>
                  <p className="text-gray-400 text-sm mt-2">Choose from the options above to learn more</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side - Contact Form */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-white via-white to-primary_color/5 p-6 md:p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-primary_color mb-3 flex items-center gap-2">
                <span className="w-1 h-8 bg-primary_color rounded-full"></span>
                Get in Touch
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Fill out the form below and we'll get back to you about your selected services within 24 hours.
              </p>
            </div>

            {/* Selected Services Display */}
            {selectedServices.length > 0 && (
              <div className="mb-6 p-5 bg-primary_color/10 rounded-xl border border-primary_color/20 backdrop-blur-sm">
                <p className="text-sm font-semibold text-primary_color mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Selected Services ({selectedServices.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedServices.map(serviceId => {
                    const service = services.find(s => s.id === serviceId)
                    return (
                      <span
                        key={serviceId}
                        className="px-4 py-2 bg-primary_color text-white rounded-full text-xs font-medium shadow-sm flex items-center gap-2"
                      >
                        {service?.name}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-primary_color flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-primary_color transition-all bg-white/80 backdrop-blur-sm placeholder:text-gray-400"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-primary_color flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-primary_color transition-all bg-white/80 backdrop-blur-sm placeholder:text-gray-400"
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-semibold text-primary_color flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-primary_color transition-all bg-white/80 backdrop-blur-sm placeholder:text-gray-400"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-semibold text-primary_color">
                  Message <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-primary_color transition-all resize-y bg-white/80 backdrop-blur-sm placeholder:text-gray-400"
                  placeholder="Tell us more about your requirements, timeline, or any specific questions..."
                />
              </div>

              <button
                type="submit"
                disabled={loading || selectedServices.length === 0}
                className="w-full bg-primary_color text-white py-4 px-6 rounded-xl hover:bg-primary_color/90 focus:outline-none focus:ring-2 focus:ring-primary_color focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Inquiry</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By submitting this form, you agree to our privacy policy and terms of service.
              </p>
            </form>
          </div>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  )
}

export default AllServicesPage
