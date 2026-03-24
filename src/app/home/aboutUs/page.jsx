'use client'
import React, { useState, useRef, useEffect } from 'react'
import { FaFingerprint, FaHome, FaBolt, FaMapMarkerAlt, FaEnvelope, FaPhone, FaClock } from 'react-icons/fa'

const sections = [
  { id: 'what-is-iska', label: 'What is ISKA Homes?' },
  { id: 'mission-vision', label: 'Mission and Vision' },
  { id: 'what-separates', label: 'What Separates Us?' },
]

const AboutUsPage = () => {
  const [activeSection, setActiveSection] = useState('what-is-iska')
  const sectionRefs = useRef({})

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }, observerOptions)

    sections.forEach((section) => {
      const el = sectionRefs.current[section.id]
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const scrollToSection = (id) => {
    setActiveSection(id)
    const el = sectionRefs.current[id]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Determine which icons are "active" based on section
  const getIconStates = () => {
    switch (activeSection) {
      case 'what-is-iska':
        return [true, true, true]
      case 'mission-vision':
        return [false, true, true]
      case 'what-separates':
        return [false, false, true]
      default:
        return [true, true, true]
    }
  }

  const iconStates = getIconStates()

  return (
    <div className="text-[#333]">
      {/* ============ HERO HEADER ============ */}
      <section className="py-16 px-8 max-w-[1200px] mx-auto">
        <h1 className="!text-6xl md:!text-[7rem] lg:!text-[8.5rem] font-semibold text-[#17637C] leading-none tracking-tight">About Us</h1>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-8 gap-8 md:gap-0">
          {/* Icon badges */}
          <div className="flex gap-4">
            {iconStates[0] && (
              <div className="bg-[#f0f5f5] text-[#17637C] p-4 rounded-full shadow-sm">
                <FaFingerprint size={20} />
              </div>
            )}
            {iconStates[1] && (
              <div className="bg-[#f0f5f5] text-[#17637C] p-4 rounded-full shadow-sm">
                <FaHome size={20} />
              </div>
            )}
            {iconStates[2] && (
              <div className="bg-[#f0f5f5] text-[#17637C] p-4 rounded-full shadow-sm">
                <FaBolt size={20} />
              </div>
            )}
          </div>

          {/* Tagline */}
          <div className="flex items-center gap-4 max-w-[300px]">
            <div className="w-10 h-10 shrink-0 bg-transparent">
              <img src="/about/onelogo.png" alt="ISKA Homes Logo" className="w-full h-full object-contain" />
            </div>
            <p className="text-xs text-[#17637C] leading-relaxed">
              Get to know us as the main platform for your real estate listing and development platform
            </p>
          </div>
        </div>

        <div className="h-[1px] bg-[#17637C]/20 mt-8"></div>
      </section>

      {/* ============ MAIN CONTENT ============ */}
      <div className="flex flex-col lg:flex-row gap-16 max-w-[1200px] my-16 mx-auto px-8">
        {/* Left sidebar */}
        <aside className="w-full lg:w-[250px] shrink-0">
          <nav className="flex flex-row overflow-x-auto whitespace-nowrap lg:flex-col gap-4 lg:sticky lg:top-[100px]">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`text-left bg-transparent border-none text-[1.1rem] cursor-pointer py-2 transition-all lg:border-l-2 lg:border-b-0 border-b-2 px-2 lg:px-0 lg:pl-4 
                  ${activeSection === section.id ? 'text-[#17637C] font-semibold border-[#17637C]' : 'border-transparent text-[#666] hover:text-[#17637C]'}`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Right content */}
        <main className="flex-1">

          {/* ---- Section 1: What is Iska Homes? ---- */}
          <section
            id="what-is-iska"
            ref={(el) => (sectionRefs.current['what-is-iska'] = el)}
            className="mb-24"
          >
            <h2 className="text-4xl text-[#17637C] font-bold mb-4">What is ISKA Homes?</h2>
            <p className="text-2xl italic text-[#666] mb-8">&quot;Your Reliable Access To Premium Realty.&quot;</p>
            <div className="h-[3px] w-[60px] bg-[#17637C] mb-8"></div>
            <div className="text-[1.1rem] leading-[1.8] text-[#444] mb-12 flex flex-col gap-6">
              <p>
                We are the cutting edge of modern real estate marketing. We offer a robust digital
                property marketplace connecting buyers, renters, developers, and agents. Using a system
                of verified listings, structured commissions and data-led marketing tools with a
                focus on transparency, we offer our users an effortless and fully responsive digital platform.
              </p>
              <p>
                Headquartered in Accra, ISKA Homes is powered by a team of professionals with a range of
                experience in design, research, compliance and real estate marketing. We ensure all in depth
                neighborhood, residential and commercial building data collected is verified and accurate, giving
                all our users real time and relevant information. This helps them make confident decisions when
                looking to buy, rent, invest or list.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl overflow-hidden shadow-lg h-[200px] group">
                <img src="/about/Kitchen1.jpeg" alt="Modern Kitchen" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="rounded-xl overflow-hidden shadow-lg h-[200px] group">
                <img src="/about/sitting1.jpeg" alt="Premium Sitting Area" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="rounded-xl overflow-hidden shadow-lg h-[200px] group">
                <img src="/about/sitting2.jpeg" alt="Elegant Sitting Area" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
            </div>
          </section>

          {/* ---- Section 2: Mission and Vision ---- */}
          <section
            id="mission-vision"
            ref={(el) => (sectionRefs.current['mission-vision'] = el)}
            className="mb-24"
          >
            {/* Our Mission */}
            <h2 className="text-4xl text-[#17637C] font-bold mb-4">Our Mission</h2>
            <div className="h-[3px] w-[60px] bg-[#17637C] mb-8"></div>
            <div className="text-[1.1rem] leading-[1.8] text-[#444] mb-12 flex flex-col gap-6">
              <p>
                Our mission at ISKA Homes is to provide homeseekers, developers, agencies and agents with
                the optimum platform that ensures security, transparency, efficiency and ease, tailored to their
                needs in premium real estate solutions.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl overflow-hidden shadow-lg h-[200px] group">
                <img src="/about/Gym1.jpeg" alt="Modern Gym Facility" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="rounded-xl overflow-hidden shadow-lg h-[200px] group">
                <img src="/about/c1.jpeg" alt="Exterior View" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="rounded-xl overflow-hidden shadow-lg h-[200px] group">
                <img src="/about/c2.jpeg" alt="Real Estate Property" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
            </div>

            {/* Our Vision */}
            <h2 className="text-4xl text-[#17637C] font-bold mb-4 mt-12">Our Vision</h2>
            <div className="h-[3px] w-[60px] bg-[#17637C] mb-8"></div>
            <div className="text-[1.1rem] leading-[1.8] text-[#444] mb-12 flex flex-col gap-6">
              <p>
                Our vision is to be a global standard for premium digital real estate marketing, prioritizing secure
                and personalized solutions for all real estate needs of our partners.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl overflow-hidden shadow-lg h-[200px] group">
                <img src="/about/c3.jpeg" alt="Modern Real Estate" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="rounded-xl overflow-hidden shadow-lg h-[200px] group">
                <img src="/about/c4.jpeg" alt="Property View" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="rounded-xl overflow-hidden shadow-lg h-[200px] group">
                <img src="/about/R1.jpeg" alt="Premium Interior" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
            </div>
          </section>

          {/* ---- Section 3: What Separates Us? ---- */}
          <section
            id="what-separates"
            ref={(el) => (sectionRefs.current['what-separates'] = el)}
            className="mb-24"
          >
            <h2 className="text-4xl text-[#17637C] font-bold mb-4">What Separates Us?</h2>
            <div className="h-[3px] w-[60px] bg-[#17637C] mb-8"></div>
            <div className="text-[1.1rem] leading-[1.8] text-[#444] mb-12 flex flex-col gap-6">
              <p>
                Our advantage is built on a holistic ecosystem designed for maximum efficiency and impact. It
                starts with in-depth data collection to support intelligent strategy, which is then amplified by a
                powerful lead generation data acquisition feature that targets and secures the best
                opportunities. Our platforms make easier data tracking a reality, providing you with clear,
                real-time insights.
              </p>
              <p>
                This is all wrapped in a 360 service provision, ensuring every aspect of your
                project is covered through a single, accountable partnership. And because sustainable growth
                requires safety, everything we do is supported by a responsive compliance team that keeps
                operations agile and secure. What we offer is a complete, integrated advantage.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl overflow-hidden shadow-lg h-[200px] group">
                <img src="/about/land1.JPG" alt="Landscape View 1" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="rounded-xl overflow-hidden shadow-lg h-[200px] group">
                <img src="/about/land2.JPG" alt="Landscape View 2" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="rounded-xl overflow-hidden shadow-lg h-[200px] group">
                <img src="/about/hh.jpeg" alt="Property Highlight" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* ============ WHY CHOOSE US BANNER ============ */}
      <section className="bg-[#17637C] text-white py-24 px-8 my-16">
        <div className="flex flex-col lg:flex-row gap-16 max-w-[1200px] mx-auto items-center">
          <div className="flex-1">
            <div className="flex items-center gap-2 uppercase tracking-[2px] mb-4 text-[0.9rem]">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              <span>Why Choose Us</span>
            </div>
            <h2 className="text-[3rem] font-bold mb-8 leading-[1.2] text-white">Where realty visions becomes reality</h2>
            <div className="h-[2px] w-[80px] bg-white mb-8"></div>
            <p className="text-[1.1rem] leading-[1.8] text-white/90">
              At ISKA Homes we believe genuine partnerships are built on equilibrium, as such we shape
              opportunities and build futures. Our promise is simple: to leverage our market knowledge,
              negotiation expertise, and dedication to excellence so that every client we work with receives
              the highest level of attention, care, and success.
            </p>
          </div>
          <div className="flex-1 rounded-[20px] overflow-hidden shadow-2xl h-[400px] w-full">
            <img src="/about/ww.jpeg" alt="Real Estate Render/Overview" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* ============ GET IN TOUCH ============ */}
      <section className="max-w-[1200px] mx-auto my-24 px-8 text-center">
        <h2 className="text-[2.5rem] text-[#17637C] font-bold mb-4">Get In Touch</h2>
        <div className="h-[3px] w-[60px] bg-[#17637C] mx-auto mb-16"></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {/* Email */}
          <div className="bg-[#f0f5f5] p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
            <div className="w-[60px] h-[60px] bg-white rounded-full flex items-center justify-center text-[#17637C] mx-auto mb-6 shadow-sm">
              <FaEnvelope size={22} />
            </div>
            <h6 className="text-[1.1rem] font-semibold text-[#333] mb-2">We&apos;re always happy to help</h6>
            <p className="text-[#666] text-[0.95rem]">info@iskaglobal.com</p>
          </div>

          {/* Phone */}
          <div className="bg-[#f0f5f5] p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
            <div className="w-[60px] h-[60px] bg-white rounded-full flex items-center justify-center text-[#17637C] mx-auto mb-6 shadow-sm">
              <FaPhone size={22} />
            </div>
            <h6 className="text-[1.1rem] font-semibold text-[#333] mb-2">Our Hotline Number</h6>
            <p className="text-[#666] text-[0.95rem]">0302318132</p>
          </div>

          {/* Address */}
          <div className="bg-[#f0f5f5] p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
            <div className="w-[60px] h-[60px] bg-white rounded-full flex items-center justify-center text-[#17637C] mx-auto mb-6 shadow-sm">
              <FaMapMarkerAlt size={22} />
            </div>
            <h6 className="text-[1.1rem] font-semibold text-[#333] mb-2">Our Address</h6>
            <p className="text-[#666] text-[0.95rem]">Child Street, Spintex No FHP 25</p>
          </div>

          {/* Business Hours */}
          <div className="bg-[#f0f5f5] p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
            <div className="w-[60px] h-[60px] bg-white rounded-full flex items-center justify-center text-[#17637C] mx-auto mb-6 shadow-sm">
              <FaClock size={22} />
            </div>
            <h6 className="text-[1.1rem] font-semibold text-[#333] mb-2">Our Business Hours</h6>
            <p className="text-[#666] text-[0.95rem]">mon–fri 8am–5pm</p>
          </div>
        </div>

        {/* Google Map */}
        <div className="about-contact__map">
          <iframe
            title="Iska Homes Location"
            src="https://maps.google.com/maps?q=Iska%20Global,%20No.%20FHP%2025%20Child%20Street,%20Spintex,%20Accra,%20GT-346-5834&t=&z=15&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="350"
            style={{ border: 0, borderRadius: '12px' }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </section>
    </div>
  )
}

export default AboutUsPage
