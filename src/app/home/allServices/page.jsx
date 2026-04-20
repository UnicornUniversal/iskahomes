'use client'

import React, { useMemo, useState } from 'react'
import {
  ArrowRight,
  Box,
  Camera,
  CheckCircle,
  Home,
  Mail,
  Palette,
  Phone,
  Ruler,
  User,
  X
} from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import 'react-toastify/dist/ReactToastify.css'

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
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0',
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

const AllServicesPage = () => {
  const [selectedServices, setSelectedServices] = useState([])
  const [activeServiceId, setActiveServiceId] = useState(null)
  const [servicePickerValue, setServicePickerValue] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)

  const selectedServiceDetails = useMemo(() => {
    if (!activeServiceId) return null
    return services.find(service => service.id === activeServiceId) || null
  }, [activeServiceId])

  const handleServiceSelect = (serviceId) => {
    if (!serviceId) return

    setSelectedServices(prev => (
      prev.includes(serviceId) ? prev : [...prev, serviceId]
    ))
    setActiveServiceId(serviceId)
    setServicePickerValue('')
  }

  const handleRemoveService = (serviceId) => {
    setSelectedServices(prev => {
      const updatedServices = prev.filter(id => id !== serviceId)

      if (activeServiceId === serviceId) {
        setActiveServiceId(updatedServices[updatedServices.length - 1] || null)
      }

      return updatedServices
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
        setActiveServiceId(null)
        setServicePickerValue('')
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

  return (
    <div className="min-h-screen bg-white_bg text-primary_color">
      <div className="relative overflow-hidden ">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(37,99,235,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.06)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40" />
        <div className="relative w-full px-4 md:px-8 py-16 md:py-24">
          <div>
            <span className="inline-flex items-center  -primary_color/15 bg-primary_color/5 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-primary_color">
              Premium Property Services
            </span>
            <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }} className="mt-6 max-w-5xl font-medium leading-tight text-primary_color">
              Choose the services you need and explore each one in detail.
            </h1>
            {/* <p className="mt-5 text-base md:text-lg text-gray-600 leading-relaxed">
              A cleaner way to build your request. Select services from the dropdown, review them below, and click any selected item to see its full details on the left.
            </p> */}
          </div>
        </div>
      </div>

      <div className="w-full px-4 md:px-8 py-8 md:py-10">
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-0">
          <div className=" -primary_color/10 overflow-hidden">
            <div className="p-6 md:p-8">
              <AnimatePresence mode="wait">
                {selectedServiceDetails ? (
                  <motion.div
                    key={selectedServiceDetails.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -18 }}
                    transition={{ duration: 0.28 }}
                    className="space-y-6"
                  >
                    <div className="relative overflow-hidden  -primary_color/10 bg-primary_color/5">
                      <div className="absolute inset-0 bg-gradient-to-t from-primary_color/70 via-primary_color/20 to-transparent z-10" />
                      <img
                        src={selectedServiceDetails.image}
                        alt={selectedServiceDetails.name}
                        className="h-72 w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 z-20 p-6 md:p-8">
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center bg-white/85 backdrop-blur-md  -white/40">
                            {React.createElement(selectedServiceDetails.icon, {
                              className: 'w-7 h-7 text-primary_color'
                            })}
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-white/80">Selected Service</p>
                            <h2 className="text-2xl md:text-3xl font-semibold text-white">
                              {selectedServiceDetails.name}
                            </h2>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                      <div className=" -primary_color/10 bg-primary_color/5 p-6">
                        <p className="text-sm uppercase tracking-[0.22em] text-primary_color/70 mb-4">Overview</p>
                        <p className="text-gray-700 leading-8">
                          {selectedServiceDetails.description}
                        </p>
                      </div>

                      <div className=" -primary_color/10 bg-white p-6">
                        <div className="flex items-center gap-2 text-primary_color mb-4">
                          <ArrowRight className="w-4 h-4 text-primary_color" />
                          <h3 className="text-lg font-semibold">What&apos;s Included</h3>
                        </div>

                        <div className="space-y-3">
                          {selectedServiceDetails.features.map((feature, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.08 }}
                              className="flex items-start gap-3  -primary_color/10 bg-primary_color/5 px-4 py-3"
                            >
                              <CheckCircle className="mt-0.5 w-4 h-4 flex-shrink-0 text-primary_color" />
                              <span className="text-sm text-gray-700">{feature}</span>
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
                    className="flex min-h-[420px] flex-col items-center justify-center  -dashed -primary_color/15 bg-primary_color/5 px-6 text-center"
                  >
                    <div className="mb-5 flex h-20 w-20 items-center justify-center bg-primary_color/12">
                      <Home className="w-10 h-10 text-primary_color/70" />
                    </div>
                    <h2 className="text-2xl font-semibold text-primary_color">Pick a service to preview it</h2>
                    <p className="mt-3 max-w-md text-sm md:text-base text-gray-500 leading-7">
                      Use the selector on the right, then click any selected service to show its details here.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className=" -l-0 -primary_color/10 bg-gradient-to-br from-white/20 via-white to-primary_color/5 p-6 md:p-8">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.22em] text-primary_color/70 mb-3">Inquiry Form</p>
              <h2 className="text-3xl font-semibold text-primary_color mb-3">
                Tell us what you need
              </h2>
              <p className="text-gray-600 leading-7">
                Share your details and we&apos;ll follow up with the right team about your selected services.
              </p>
            </div>

            <div className="mb-6  -primary_color/10 bg-white p-5">
              <label htmlFor="service-select" className="block text-sm font-medium text-primary_color mb-3">
                Select a service
              </label>
              <select
                id="service-select"
                value={servicePickerValue}
                onChange={(e) => handleServiceSelect(e.target.value)}
                className="w-full  -primary_color/15 bg-white px-4 py-4 text-sm text-primary_color outline-none transition focus:-primary_color focus:ring-2 focus:ring-primary_color/20"
              >
                <option value="" className="text-gray-500">
                  Choose a service
                </option>
                {services.map(service => (
                  <option
                    key={service.id}
                    value={service.id}
                    disabled={selectedServices.includes(service.id)}
                    className="text-primary_color"
                  >
                    {service.name}
                  </option>
                ))}
              </select>

              <p className="text-sm font-medium text-primary_color mb-3">
                Selected Services {selectedServices.length > 0 ? `(${selectedServices.length})` : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedServices.length > 0 ? (
                  selectedServices.map(serviceId => {
                    const service = services.find(item => item.id === serviceId)
                    const IconComponent = service?.icon
                    const isActive = activeServiceId === serviceId

                    return (
                      <div
                        key={serviceId}
                        className={`inline-flex items-center gap-2  px-3 py-2 transition ${
                          isActive
                            ? '-primary_color/30 bg-primary_color/10 text-primary_color'
                            : '-primary_color/10 bg-primary_color/5 text-gray-700'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveServiceId(serviceId)}
                          className="inline-flex items-center gap-2 text-sm font-medium"
                        >
                          {IconComponent && <IconComponent className="w-4 h-4" />}
                          <span>{service?.name}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(serviceId)}
                          className="inline-flex h-6 w-6 items-center justify-center bg-primary_color/10 text-primary_color transition hover:bg-red-500/10 hover:text-red-500"
                          aria-label={`Remove ${service?.name}`}
                          title="Remove service"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  })
                ) : (
                  <span className="text-sm text-gray-500">Choose at least one service to continue.</span>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-primary_color flex items-center gap-2">
                  <User className="w-4 h-4 text-primary_color" />
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full  -primary_color/15 bg-white px-4 py-3.5 text-primary_color outline-none transition placeholder:text-gray-400 focus:-primary_color focus:ring-2 focus:ring-primary_color/20"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-primary_color flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary_color" />
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full  -primary_color/15 bg-white px-4 py-3.5 text-primary_color outline-none transition placeholder:text-gray-400 focus:-primary_color focus:ring-2 focus:ring-primary_color/20"
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-primary_color flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary_color" />
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full  -primary_color/15 bg-white px-4 py-3.5 text-primary_color outline-none transition placeholder:text-gray-400 focus:-primary_color focus:ring-2 focus:ring-primary_color/20"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-medium text-primary_color">
                  Message <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full  -primary_color/15 bg-white px-4 py-3.5 text-primary_color outline-none transition resize-y placeholder:text-gray-400 focus:-primary_color focus:ring-2 focus:ring-primary_color/20"
                  placeholder="Tell us more about your requirements, preferred timeline, or any specific details."
                />
              </div>

              <button
                type="submit"
                disabled={loading || selectedServices.length === 0}
                className="flex w-full items-center justify-center gap-2 bg-primary_color px-6 py-4 font-semibold text-white transition hover:translate-y-[-1px] hover:bg-primary_color/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 animate-spin -2 -white -t-transparent" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Inquiry</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-500">
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
