'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Playfair_Display } from 'next/font/google'
import {
  FaClock,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhone,
} from 'react-icons/fa'

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const sideLinks = [
  { id: 'mission-vision', label: 'Mission and Vision?' },
  { id: 'who-is-iska', label: 'Who is ISKA Homes?' },
  { id: 'what-separates', label: 'What separates us?' },
]

const contactCards = [
  {
    icon: FaEnvelope,
    title: "We're always happy to help",
    value: 'iskahomes@gmail.com',
  },
  {
    icon: FaPhone,
    title: 'Our Hotline Number',
    value: '0302318132',
  },
  {
    icon: FaMapMarkerAlt,
    title: 'Our Address',
    value: 'Accra, Spintex child streeet',
  },
  {
    icon: FaClock,
    title: 'Our Business Hours',
    value: 'mon-fri 8am-5pm',
  },
]

const AboutUsPage = () => {
  const [activeSection, setActiveSection] = useState('mission-vision')
  const sectionRefs = useRef({})

  const scrollToSection = (id) => {
    setActiveSection(id)
    const el = sectionRefs.current[id]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Auto-update sidebar based on scroll position
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0.1 }
    )

    sideLinks.forEach((link) => {
      const el = sectionRefs.current[link.id]
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div style={{ background: 'linear-gradient(180deg, rgba(23,99,124,0.1) 19%, rgba(255,255,255,0.01) 100%)', color: '#1a1a1a', minHeight: '100vh' }}>
      {/* ── Hero ──────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '60px 5% 40px' }}>
        {/* Blue gradient overlay — left corner only */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '56%', height: '100%',
          background: 'linear-gradient(to right, rgba(23,99,124,0.12) 0%, rgba(23,99,124,0.06) 40%, transparent 100%)',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <h1
          className="font-medium text-primary_color tracking-tight"
          style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', margin: 0, lineHeight: 1.1, position: 'relative', zIndex: 1 }}
        >
          About Us
        </h1>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'center', justifyContent: 'space-between', marginTop: 32, position: 'relative', zIndex: 1 }}>
          {/* Platform badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: '#17637C', borderRadius: 10, padding: '16px 24px', maxWidth: 360
          }}>
            <img
              src="/aboutUsImages/onelogo.png"
              alt="ISKA Homes logo"
              style={{ width: 40, height: 40, objectFit: 'contain' }}
            />
            <div>
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>Premium Real Estate Platform</p>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, margin: '4px 0 0', lineHeight: 1.5 }}>
                Get to know the platform shaping listings, stronger viability and smarter real estate growth
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3" style={{ marginLeft: 'auto' }}>
            {[
              { label: 'VERIFIED LISTINGS', value: 'Trusted', icon: '✓' },
              { label: 'REAL-TIME DATA', value: 'Real-time', icon: '⚡' },
              { label: 'PREMIUM SERVICE', value: 'Premium', icon: '★' },
            ].map((stat) => (
              <div key={stat.value} style={{
                textAlign: 'center', background: 'rgba(23,99,124,0.05)',
                borderRadius: 14, padding: '18px 26px', minWidth: 120,
                border: '1px solid rgba(23,99,124,0.08)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.3s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(23,99,124,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(23,99,124,0.12)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(23,99,124,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ fontSize: 18, marginBottom: 6 }}>{stat.icon}</div>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: '#aaa', margin: 0, textTransform: 'uppercase' }}>{stat.label}</p>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#17637C', margin: '8px 0 0' }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Divider ───────────────────────────────── */}
      <div style={{ height: 1, background: '#e5e5e5', margin: '0 5%' }} />

      {/* ── Content area ─────────────────────────── */}
      <div className="flex flex-col lg:flex-row" style={{ gap: 0, padding: '40px 5%' }}>
        {/* Sidebar nav */}
        <aside className="hidden lg:block" style={{ width: 220, flexShrink: 0, paddingRight: 40, position: 'sticky', top: 100, alignSelf: 'flex-start' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sideLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontSize: 14, padding: '6px 0',
                  color: activeSection === link.id ? '#17637C' : '#888',
                  fontWeight: activeSection === link.id ? 600 : 400,
                  transition: 'color 0.2s',
                }}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0 }}>

          {/* ── Our Mission ────────────────────────── */}
          <section
            id="mission-vision"
            ref={(el) => { sectionRefs.current['mission-vision'] = el }}
            style={{ scrollMarginTop: 100 }}
          >
            <h2
              className={playfairDisplay.className}
              style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 500, color: '#17637C', margin: 0 }}
            >
              Our Mission
            </h2>

            <p
              className={playfairDisplay.className}
              style={{ fontSize: 18, fontStyle: 'italic', color: '#17637C', margin: '20px 0 0', lineHeight: 1.6, maxWidth: 540 }}
            >
              &ldquo;Our mission at ISKA Homes is to provide homeseekers, developers, agencies, and agents with an optimum platform that ensures security, transparency, efficiency, and ease, tailored to their premium real estate needs.&rdquo;
            </p>

            <div style={{ width: 80, height: 3, background: 'linear-gradient(90deg, #17637C, #F68B1F)', margin: '20px 0' }} />

            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 24, fontSize: 13, lineHeight: 1.8, color: '#555', maxWidth: 700 }}>
              <p style={{ margin: 0 }}>
                Our mission is to deliver exceptional real estate experiences by combining timeless design, superior craftsmanship, and innovative development practices.We are committed to setting industry standards through quality, trust, and attention to detail transforming prime locations into enduring spaces that reflect luxury, comfort, and long-term value for our clients.
              </p>
              <p style={{ margin: 0 }}>
                We build on a legacy of excellence by delivering premium real estate developments that stand the test of time. We strive to blend tradition with innovation—creating modern, high-quality spaces that meet evolving lifestyle needs while upholding the highest standards of design, integrity, and long-term value.
              </p>
            </div>

            {/* Mission images */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 16, marginTop: 32 }}>
              <div style={{ borderRadius: 8, overflow: 'hidden' }}>
                <img src="/aboutUsImages/Gym1.jpeg" alt="Modern gym facility" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ borderRadius: 8, overflow: 'hidden' }}>
                <img src="/aboutUsImages/c1.jpeg" alt="Modern property exterior" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ borderRadius: 8, overflow: 'hidden' }}>
                <img src="/aboutUsImages/c2.jpeg" alt="Premium real estate frontage" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
              </div>
            </div>

            {/* ── Our Vision ─────────────────────────── */}
            <h2
              className={playfairDisplay.className}
              style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 500, color: '#17637C', margin: '48px 0 0' }}
            >
              Our Vision
            </h2>

            <p
              className={playfairDisplay.className}
              style={{ fontSize: 18, fontStyle: 'italic', color: '#17637C', margin: '20px 0 0', lineHeight: 1.6, maxWidth: 540 }}
            >
              &ldquo;To become a leading premium real estate brand, recognized for transforming prime locations into iconic developments that redefine modern living, investment value, and architectural excellence.&rdquo;
            </p>

            <div style={{ width: 80, height: 3, background: 'linear-gradient(90deg, #17637C, #F68B1F)', margin: '20px 0' }} />

            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 24, fontSize: 13, lineHeight: 1.8, color: '#555', maxWidth: 700 }}>
              <p style={{ margin: 0 }}>
                Our Vision is to shape the future of premium real estate by blending enduring excellence with modern innovation—creating timeless developments that evolve with changing lifestyles while maintaining the highest standards of design, quality, and value.
              </p>
              <p style={{ margin: 0 }}>
               build a lasting legacy in premium real estate—one that transcends generations by adapting to modern advancements while preserving excellence at its core, and continuing to set the benchmark for innovation, design, and enduring value in every development.
              </p>
            </div>

            {/* Vision images */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 16, marginTop: 32 }}>
              <div style={{ borderRadius: 8, overflow: 'hidden' }}>
                <img src="/aboutUsImages/Container.png" alt="Modern real estate development" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ borderRadius: 8, overflow: 'hidden' }}>
                <img src="/aboutUsImages/H.png" alt="Property facade detail" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ borderRadius: 8, overflow: 'hidden' }}>
                <img src="/aboutUsImages/Kitchen1.jpeg" alt="Premium interior finish" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
              </div>
            </div>
          </section>

          {/* ── Who is ISKA Homes ────────────────── */}
          <section
            id="who-is-iska"
            ref={(el) => { sectionRefs.current['who-is-iska'] = el }}
            style={{ scrollMarginTop: 100, marginTop: 64 }}
          >
            <h2
              className={playfairDisplay.className}
              style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 500, color: '#17637C', margin: 0 }}
            >
              Who is ISKA Homes?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 24, fontSize: 13, lineHeight: 1.8, color: '#555', maxWidth: 700, marginTop: 20 }}>
              <p style={{ margin: 0 }}>
                We are the cutting edge of modern real estate marketing. We offer a robust digital property marketplace connecting buyers, renters, developers, and agents. Through verified listings, structured commissions, and data-led marketing tools, we make premium property discovery easier and more transparent.
              </p>
              <p style={{ margin: 0 }}>
                Headquartered in Accra, ISKA Homes is powered by professionals across design, research, compliance, and real estate marketing. We verify neighborhood, residential, and commercial data so our users can act on real-time, relevant information with confidence.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 16, marginTop: 32 }}>
              <div style={{ borderRadius: 8, overflow: 'hidden' }}>
                <img src="/aboutUsImages/Kitchen1.jpeg" alt="Modern kitchen interior" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ borderRadius: 8, overflow: 'hidden' }}>
                <img src="/aboutUsImages/sitting1.jpeg" alt="Premium sitting area" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ borderRadius: 8, overflow: 'hidden' }}>
                <img src="/aboutUsImages/ww.jpeg" alt="Elegant living space" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
              </div>
            </div>
          </section>

          {/* ── What Separates Us ─────────────────── */}
          <section
            id="what-separates"
            ref={(el) => { sectionRefs.current['what-separates'] = el }}
            style={{ scrollMarginTop: 100, marginTop: 64 }}
          >
            <h2
              className={playfairDisplay.className}
              style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 500, color: '#17637C', margin: 0 }}
            >
              What Separates Us?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 24, fontSize: 13, lineHeight: 1.8, color: '#555', maxWidth: 700, marginTop: 20 }}>
              <p style={{ margin: 0 }}>
                Our advantage is built on a holistic ecosystem designed for maximum efficiency and impact. It begins with in-depth data collection that supports smarter strategy, then expands into lead generation systems that target and secure high-value opportunities.
              </p>
              <p style={{ margin: 0 }}>
                We make clearer tracking possible through real-time insight, 360 service provision, and responsive compliance support. The result is a complete, accountable partnership designed for sustainable growth.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 16, marginTop: 32 }}>
              <div style={{ borderRadius: 8, overflow: 'hidden' }}>
                <img src="/aboutUsImages/land1.JPG" alt="Landscape view 1" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ borderRadius: 8, overflow: 'hidden' }}>
                <img src="/aboutUsImages/land3.JPG" alt="Landscape view 2" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ borderRadius: 8, overflow: 'hidden' }}>
                <img src="/aboutUsImages/hh.jpeg" alt="Featured property" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* ── Why Choose Us ────────────────────────── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: '#17637C', margin: '0 5%', borderRadius: 20,
        display: 'grid', minHeight: 420,
      }}
      className="!grid-cols-1 lg:!grid-cols-2"
      >
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: 30, left: 30, width: 120, height: 120, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 45, left: 45, width: 90, height: 90, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 60, left: 60, width: 60, height: 60, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

        {/* Left — text content */}
        <div className="p-8 lg:p-14" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 1 }}>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
            Why Choose Us
          </p>
          <h2
            className={playfairDisplay.className}
            style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', fontWeight: 600, color: '#fff', margin: '20px 0 0', lineHeight: 1.15 }}
          >
            Where Property Meets<br />Possibility.
          </h2>
          <div style={{ width: 280, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, margin: '24px 0' }} />
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.78)', lineHeight: 1.75, margin: 0, maxWidth: 480 }}>
            We believe real estate is more than just transactions — it&apos;s about creating opportunities and building futures. With deep market knowledge, strong negotiation skills, and a commitment to excellence, we ensure every client receives the attention, care, and results they deserve.
          </p>
        </div>

        {/* Right — image */}
        <div className="p-8 lg:pr-12 lg:pl-0 lg:py-10" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: '100%', maxWidth: 480, aspectRatio: '4/3', borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <img
              src="/aboutUsImages/sitting1.jpeg"
              alt="Floor plan view — premium property layout"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        </div>
      </section>

      {/* ── Get In Touch ─────────────────────────── */}
      <section style={{ padding: '48px 5%', marginTop: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h2
            className={playfairDisplay.className}
            style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 500, color: '#17637C', margin: 0 }}
          >
            Get In Touch
          </h2>
          <div style={{ width: '100%', maxWidth: 700, height: 2, background: '#17637C', margin: '16px auto 0' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, marginTop: 40, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}>
          {contactCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.title}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', background: '#17637C',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                }}>
                  <Icon size={20} color="#fff" />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#17637C', margin: 0 }}>{card.title}</p>
                <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0', whiteSpace: 'pre-line' }}>{card.value}</p>
              </div>
            )
          })}
        </div>

        {/* Map */}
        <div style={{ marginTop: 40, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e5e5' }}>
          <iframe
            title="ISKA Homes Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31766.632567482047!2d-0.16099!3d5.6500!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9c7ebaeabe93%3A0xd9e9a38c83e7f123!2sEast%20Legon%2C%20Accra%2C%20Ghana!5e0!3m2!1sen!2sgh!4v1700000000000!5m2!1sen!2sgh"
            style={{ width: '100%', height: 360, border: 'none', display: 'block' }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </div>
  )
}

export default AboutUsPage
