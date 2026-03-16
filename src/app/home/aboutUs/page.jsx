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
    <div className="about-us-page">
      {/* ============ HERO HEADER ============ */}
      <section className="about-hero">
        <h1 className="!text-6xl md:!text-[7rem] lg:!text-[8.5rem] font-semibold text-[#17637C] leading-none tracking-tight">About Us</h1>

        <div className="about-hero__row">
          {/* Icon badges */}
          <div className="about-hero__icons">
            {iconStates[0] && (
              <div className="about-hero__icon-badge">
                <FaFingerprint size={20} />
              </div>
            )}
            {iconStates[1] && (
              <div className="about-hero__icon-badge">
                <FaHome size={20} />
              </div>
            )}
            {iconStates[2] && (
              <div className="about-hero__icon-badge">
                <FaBolt size={20} />
              </div>
            )}
          </div>

          {/* Tagline */}
          <div className="about-hero__tagline">
            <div className="about-hero__tagline-icon" style={{ background: 'transparent' }}>
              <img src="/about/onelogo.png" alt="ISKA Homes Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <p className="text-xs text-[#17637C] leading-relaxed">
              Get to know us as the main platform for your real estate listing and development platform
            </p>
          </div>
        </div>

        <div className="about-hero__divider"></div>
      </section>

      {/* ============ MAIN CONTENT ============ */}
      <div className="about-main">
        {/* Left sidebar */}
        <aside className="about-sidebar">
          <nav className="about-sidebar__nav">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`about-sidebar__link ${activeSection === section.id ? 'about-sidebar__link--active' : ''}`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Right content */}
        <main className="about-content">

          {/* ---- Section 1: What is Iska Homes? ---- */}
          <section
            id="what-is-iska"
            ref={(el) => (sectionRefs.current['what-is-iska'] = el)}
            className="about-section"
          >
            <h2 className="about-section__heading">What is ISKA Homes?</h2>
            <p className="about-section__quote">&quot;Your Reliable Access To Premium Realty.&quot;</p>
            <div className="about-section__underline"></div>
            <div className="about-section__body">
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
            <div className="about-section__images">
              <div className="about-section__img-wrapper">
                <img src="/about/Kitchen1.jpeg" alt="Modern Kitchen" />
              </div>
              <div className="about-section__img-wrapper">
                <img src="/about/sitting1.jpeg" alt="Premium Sitting Area" />
              </div>
              <div className="about-section__img-wrapper">
                <img src="/about/sitting2.jpeg" alt="Elegant Sitting Area" />
              </div>
            </div>
          </section>

          {/* ---- Section 2: Mission and Vision ---- */}
          <section
            id="mission-vision"
            ref={(el) => (sectionRefs.current['mission-vision'] = el)}
            className="about-section"
          >
            {/* Our Mission */}
            <h2 className="about-section__heading">Our Mission</h2>
            <div className="about-section__underline"></div>
            <div className="about-section__body">
              <p>
                Our mission at ISKA Homes is to provide homeseekers, developers, agencies and agents with
                the optimum platform that ensures security, transparency, efficiency and ease, tailored to their
                needs in premium real estate solutions.
              </p>
            </div>
            <div className="about-section__images">
              <div className="about-section__img-wrapper">
                <img src="/about/Gym1.jpeg" alt="Modern Gym Facility" />
              </div>
              <div className="about-section__img-wrapper">
                <img src="/about/c1.jpeg" alt="Exterior View" />
              </div>
              <div className="about-section__img-wrapper">
                <img src="/about/c2.jpeg" alt="Real Estate Property" />
              </div>
            </div>

            {/* Our Vision */}
            <h2 className="about-section__heading" style={{ marginTop: '3rem' }}>Our Vision</h2>
            <div className="about-section__underline"></div>
            <div className="about-section__body">
              <p>
                Our vision is to be a global standard for premium digital real estate marketing, prioritizing secure
                and personalized solutions for all real estate needs of our partners.
              </p>
            </div>
            <div className="about-section__images">
              <div className="about-section__img-wrapper">
                <img src="/about/c3.jpeg" alt="Modern Real Estate" />
              </div>
              <div className="about-section__img-wrapper">
                <img src="/about/c4.jpeg" alt="Property View" />
              </div>
              <div className="about-section__img-wrapper">
                <img src="/about/R1.jpeg" alt="Premium Interior" />
              </div>
            </div>
          </section>

          {/* ---- Section 3: What Separates Us? ---- */}
          <section
            id="what-separates"
            ref={(el) => (sectionRefs.current['what-separates'] = el)}
            className="about-section"
          >
            <h2 className="about-section__heading">What Separates Us?</h2>
            <div className="about-section__underline"></div>
            <div className="about-section__body">
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
            <div className="about-section__images">
              <div className="about-section__img-wrapper">
                <img src="/about/land1.JPG" alt="Landscape View 1" />
              </div>
              <div className="about-section__img-wrapper">
                <img src="/about/land2.JPG" alt="Landscape View 2" />
              </div>
              <div className="about-section__img-wrapper">
                <img src="/about/hh.jpeg" alt="Property Highlight" />
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* ============ WHY CHOOSE US BANNER ============ */}
      <section className="about-why-banner">
        <div className="about-why-banner__content">
          <div className="about-why-banner__text">
            <div className="about-why-banner__label">
              <span className="about-why-banner__dot"></span>
              <span>Why Choose Us</span>
            </div>
            <h2 className="about-why-banner__heading">Where realty visions becomes reality</h2>
            <div className="about-why-banner__accent-line"></div>
            <p className="about-why-banner__body">
              At ISKA Homes we believe genuine partnerships are built on equilibrium, as such we shape
              opportunities and build futures. Our promise is simple: to leverage our market knowledge,
              negotiation expertise, and dedication to excellence so that every client we work with receives
              the highest level of attention, care, and success.
            </p>
          </div>
          <div className="about-why-banner__image">
            <img src="/about/ww.jpeg" alt="Real Estate Render/Overview" />
          </div>
        </div>
      </section>

      {/* ============ GET IN TOUCH ============ */}
      <section className="about-contact">
        <h2 className="about-contact__heading">Get In Touch</h2>
        <div className="about-contact__divider"></div>

        <div className="about-contact__grid">
          {/* Email */}
          <div className="about-contact__item">
            <div className="about-contact__icon">
              <FaEnvelope size={22} />
            </div>
            <h6 className="about-contact__item-title">We&apos;re always happy to help</h6>
            <p className="about-contact__item-text">info@iskaglobal.com</p>
          </div>

          {/* Phone */}
          <div className="about-contact__item">
            <div className="about-contact__icon">
              <FaPhone size={22} />
            </div>
            <h6 className="about-contact__item-title">Our Hotline Number</h6>
            <p className="about-contact__item-text">0302318132</p>
          </div>

          {/* Address */}
          <div className="about-contact__item">
            <div className="about-contact__icon">
              <FaMapMarkerAlt size={22} />
            </div>
            <h6 className="about-contact__item-title">Our Address</h6>
            <p className="about-contact__item-text">Child Street, Spintex No FHP 25</p>
          </div>

          {/* Business Hours */}
          <div className="about-contact__item">
            <div className="about-contact__icon">
              <FaClock size={22} />
            </div>
            <h6 className="about-contact__item-title">Our Business Hours</h6>
            <p className="about-contact__item-text">mon–fri 8am–5pm</p>
          </div>
        </div>

        {/* Google Map */}
        <div className="about-contact__map">
          <iframe
            title="Iska Homes Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31766.632567482047!2d-0.16099!3d5.6500!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9c7ebaeabe93%3A0xd9e9a38c83e7f123!2sEast%20Legon%2C%20Accra%2C%20Ghana!5e0!3m2!1sen!2sgh!4v1700000000000!5m2!1sen!2sgh"
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
