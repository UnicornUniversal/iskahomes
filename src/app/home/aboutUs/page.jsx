'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  FaBolt,
  FaClock,
  FaEnvelope,
  FaFingerprint,
  FaHome,
  FaMapMarkerAlt,
  FaPhone,
} from 'react-icons/fa'

const sections = [
  {
    id: 'what-is-iska',
    label: 'What is ISKA Homes?',
    eyebrow: 'Who we are',
    title: 'A premium real estate platform built for trust, speed, and clarity.',
    quote: 'Your reliable access to premium realty.',
    paragraphs: [
      'We are the cutting edge of modern real estate marketing. We offer a robust digital property marketplace connecting buyers, renters, developers, and agents. Through verified listings, structured commissions, and data-led marketing tools, we make premium property discovery easier and more transparent.',
      'Headquartered in Accra, ISKA Homes is powered by professionals across design, research, compliance, and real estate marketing. We verify neighborhood, residential, and commercial data so our users can act on real-time, relevant information with confidence.',
    ],
    images: [
      { src: '/aboutUsImages/Kitchen1.jpeg', alt: 'Modern kitchen interior' },
      { src: '/aboutUsImages/sitting1.jpeg', alt: 'Premium sitting area' },
      { src: '/aboutUsImages/sitting2.jpeg', alt: 'Elegant living space' },
    ],
    highlights: ['Verified listings', 'Responsive digital experience', 'Data-led decision support'],
  },
  {
    id: 'mission-vision',
    label: 'Mission and Vision',
    eyebrow: 'What drives us',
    title: 'We are building a more secure and refined real estate experience.',
    panels: [
      {
        heading: 'Our Mission',
        body:
          'Our mission at ISKA Homes is to provide homeseekers, developers, agencies, and agents with an optimum platform that ensures security, transparency, efficiency, and ease, tailored to their premium real estate needs.',
        images: [
          { src: '/aboutUsImages/Gym1.jpeg', alt: 'Modern gym facility' },
          { src: '/aboutUsImages/c1.jpeg', alt: 'Modern property exterior' },
          { src: '/aboutUsImages/c2.jpeg', alt: 'Premium real estate frontage' },
        ],
      },
      {
        heading: 'Our Vision',
        body:
          'Our vision is to be a global standard for premium digital real estate marketing, prioritizing secure and personalized solutions for every property partnership and client journey.',
        images: [
          { src: '/aboutUsImages/c3.jpeg', alt: 'Modern real estate development' },
          { src: '/aboutUsImages/c4.jpeg', alt: 'Property facade detail' },
          { src: '/aboutUsImages/R1.jpeg', alt: 'Premium interior finish' },
        ],
      },
    ],
    highlights: ['Security-first operations', 'Personalized solutions', 'Global-standard positioning'],
  },
  {
    id: 'what-separates',
    label: 'What Separates Us?',
    eyebrow: 'Why it matters',
    title: 'Our edge comes from combining market intelligence with execution.',
    paragraphs: [
      'Our advantage is built on a holistic ecosystem designed for maximum efficiency and impact. It begins with in-depth data collection that supports smarter strategy, then expands into lead generation systems that target and secure high-value opportunities.',
      'We make clearer tracking possible through real-time insight, 360 service provision, and responsive compliance support. The result is a complete, accountable partnership designed for sustainable growth.',
    ],
    images: [
      { src: '/aboutUsImages/land1.JPG', alt: 'Landscape view 1' },
      { src: '/aboutUsImages/land2.JPG', alt: 'Landscape view 2' },
      { src: '/aboutUsImages/hh.jpeg', alt: 'Featured property highlight' },
    ],
    highlights: ['Lead generation systems', '360 service provision', 'Responsive compliance team'],
  },
]

const heroStats = [
  { label: 'Verified listings', value: 'Trusted' },
  { label: 'Market insight', value: 'Real-time' },
  { label: 'Client experience', value: 'Premium' },
]

const contactCards = [
  {
    icon: FaEnvelope,
    title: "We're always happy to help",
    value: 'info@iskaglobal.com',
  },
  {
    icon: FaPhone,
    title: 'Our hotline number',
    value: '0302318132',
  },
  {
    icon: FaMapMarkerAlt,
    title: 'Our address',
    value: 'Child Street, Spintex No FHP 25',
  },
  {
    icon: FaClock,
    title: 'Business hours',
    value: 'Mon - Fri, 8am - 5pm',
  },
]

const signaturePoints = [
  'Market knowledge that turns complexity into clarity.',
  'A refined service culture shaped around trust and responsiveness.',
  'Execution support that helps buyers, developers, and agents move with confidence.',
]

const iconSet = [FaFingerprint, FaHome, FaBolt]

const AboutUsPage = () => {
  const [activeSection, setActiveSection] = useState('what-is-iska')
  const sectionRefs = useRef({})

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      {
        root: null,
        rootMargin: '-20% 0px -55% 0px',
        threshold: 0.15,
      }
    )

    sections.forEach((section) => {
      const element = sectionRefs.current[section.id]
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  const scrollToSection = (id) => {
    setActiveSection(id)
    const element = sectionRefs.current[id]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const activeIconCount =
    activeSection === 'what-is-iska' ? 3 : activeSection === 'mission-vision' ? 2 : 1

  return (
    <div className="relative bg-[radial-gradient(circle_at_top_left,_rgba(246,139,31,0.18),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(23,99,124,0.14),_transparent_28%),linear-gradient(180deg,_rgba(23,99,124,0.08)_0%,_rgba(255,255,255,0.06)_40%,_rgba(246,139,31,0.08)_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px)] bg-[size:120px_120px] opacity-40" />
      <div className="pointer-events-none absolute left-0 top-24 h-72 w-72 rounded-full bg-[#17637C]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-72 h-80 w-80 rounded-full bg-[#F68B1F]/10 blur-3xl" />

      <div className="relative mx-auto  px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <section className="rounded-[2rem] border border-white/30 bg-white/20 px-6 py-8 shadow-[0_24px_80px_rgba(23,99,124,0.08)] backdrop-blur-xl sm:px-8 lg:px-10 lg:py-10">
          <div className="flex flex-col gap-8">
            <div className="w-full">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#17637C]/20 bg-white/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#17637C] shadow-sm backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-[#F68B1F]" />
                About ISKA Homes
              </div>

              <h1 className="w-full max-w-none text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-[#17637C] sm:text-7xl lg:text-[7.5rem]">
                Designed for premium property journeys.
              </h1>
            </div>

            <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                {iconSet.map((Icon, index) => (
                  <div
                    key={index}
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-300 ${
                      index < activeIconCount
                        ? 'border-[#17637C]/15 bg-[#17637C] text-white shadow-[0_12px_30px_rgba(23,99,124,0.22)]'
                        : 'border-[#17637C]/15 bg-white/20 text-[#17637C]/40'
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                ))}
              </div>

              <div className="grid gap-5 lg:w-1/3 lg:min-w-[360px]">
                <div className="rounded-[1.75rem] border border-[#17637C]/20 bg-[#17637C] p-5 text-white shadow-[0_20px_60px_rgba(23,99,124,0.22)]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 p-2">
                      <img
                        src="/aboutUsImages/onelogo.png"
                        alt="ISKA Homes logo"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
                        Premium real estate platform
                      </p>
                      <p className="mt-2 text-sm leading-7 text-white/85">
                        Get to know the platform shaping verified listings, stronger visibility,
                        and smarter real estate growth.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {heroStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-[1.5rem] border border-white/30 bg-white/20 p-4 shadow-[0_16px_40px_rgba(23,99,124,0.05)] backdrop-blur-md"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {stat.label}
                      </p>
                      <p className="mt-3 text-lg font-semibold text-[#17637C]">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[1.75rem] border border-white/30 bg-white/20 p-5 shadow-[0_18px_60px_rgba(23,99,124,0.06)] backdrop-blur-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Explore the page
              </p>
              <nav className="mt-5 space-y-3">
                {sections.map((section, index) => {
                  const isActive = activeSection === section.id

                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => scrollToSection(section.id)}
                      className={`group flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300 ${
                        isActive
                          ? 'border-[#17637C]/15 bg-[#17637C] text-white shadow-[0_14px_36px_rgba(23,99,124,0.2)]'
                          : 'border-white/25 bg-white/15 text-[#17637C] hover:border-[#17637C]/20 hover:bg-white/20'
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${
                          isActive ? 'bg-white/15 text-white' : 'bg-[#17637C]/10 text-[#17637C]'
                        }`}
                      >
                        0{index + 1}
                      </span>
                      <span className="text-sm font-medium">{section.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>

          <main className="space-y-8">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                ref={(element) => {
                  sectionRefs.current[section.id] = element
                }}
                className="scroll-mt-24 rounded-[2rem] border border-white/30 bg-white/20 p-6 shadow-[0_24px_80px_rgba(23,99,124,0.06)] backdrop-blur-xl sm:p-8 lg:p-10"
              >
                <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_320px]">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#17637C]/10 bg-[#17637C]/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#17637C]">
                      <span className="h-2 w-2 rounded-full bg-[#F68B1F]" />
                      {section.eyebrow}
                    </div>

                    <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-[#17637C] sm:text-4xl">
                      {section.title}
                    </h2>

                    {section.quote && (
                      <p className="mt-4 text-base font-medium italic text-[#17637C]">
                        "{section.quote}"
                      </p>
                    )}

                    {section.paragraphs && (
                      <div className="mt-6 space-y-4 text-[15px] leading-8 text-slate-600 sm:text-base">
                        {section.paragraphs.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </div>
                    )}

                    {section.panels && (
                      <div className="mt-8 space-y-6">
                        {section.panels.map((panel) => (
                          <div
                            key={panel.heading}
                            className="rounded-[1.75rem] border border-white/25 bg-white/15 p-5 backdrop-blur-md sm:p-6"
                          >
                            <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[#17637C]">
                              {panel.heading}
                            </h3>
                            <div className="mt-4 h-px w-20 bg-gradient-to-r from-[#17637C] to-[#F68B1F]" />
                            <p className="mt-5 max-w-3xl text-[15px] leading-8 text-slate-600 sm:text-base">
                              {panel.body}
                            </p>

                            <div className="mt-6 grid gap-4 md:grid-cols-3">
                              {panel.images.map((image, index) => (
                                <div
                                  key={image.src}
                                  className={`group relative overflow-hidden rounded-[1.5rem] ${
                                    index === 0 ? 'md:col-span-2' : ''
                                  }`}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-60" />
                                  <img
                                    src={image.src}
                                    alt={image.alt}
                                    className="h-64 w-full object-cover transition duration-700 group-hover:scale-105"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[1.75rem] border border-[#17637C]/20 bg-[#17637C] p-5 text-white">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
                        Section focus
                      </p>
                      <p className="mt-3 text-xl font-semibold tracking-[-0.03em]">
                        {section.label}
                      </p>
                      <div className="mt-5 h-px w-full bg-white/10" />
                      <div className="mt-5 space-y-3">
                        {section.highlights.map((item) => (
                          <div
                            key={item}
                            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {section.images && (
                  <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {section.images.map((image, index) => (
                      <div
                        key={image.src}
                        className={`group relative overflow-hidden rounded-[1.75rem] ${
                          index === 0 ? 'sm:col-span-2 xl:col-span-1' : ''
                        }`}
                      >
                        <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
                        <img
                          src={image.src}
                          alt={image.alt}
                          className="h-72 w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </main>
        </div>

        <section className="mt-10 overflow-hidden rounded-[2rem] border border-[#17637C]/20 bg-[#17637C] p-6 text-white shadow-[0_30px_100px_rgba(23,99,124,0.25)] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">
                <span className="h-2 w-2 rounded-full bg-[#F68B1F]" />
                Why choose us
              </div>
              <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                Where realty vision becomes reality.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/75">
                At ISKA Homes, we believe genuine partnerships are built on balance, trust,
                and sustained value. We shape opportunities and build futures through market
                knowledge, negotiation expertise, and a standard of excellence clients can feel.
              </p>

              <div className="mt-8 grid gap-3">
                {signaturePoints.map((point) => (
                  <div
                    key={point}
                    className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/85 backdrop-blur-sm"
                  >
                    {point}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10">
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0f2d36]/55 via-transparent to-transparent" />
              <img
                src="/aboutUsImages/ww.jpeg"
                alt="Real estate overview"
                className="h-full min-h-[320px] w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-white/30 bg-white/20 p-6 shadow-[0_24px_80px_rgba(23,99,124,0.06)] backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#17637C]/10 bg-[#17637C]/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#17637C]">
              <span className="h-2 w-2 rounded-full bg-[#F68B1F]" />
              Get in touch
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-[#17637C] sm:text-4xl">
              Let&apos;s build your next property success story.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Reach out for listings, partnerships, development visibility, or tailored real estate
              support. We are ready to connect.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {contactCards.map((card) => {
              const Icon = card.icon

              return (
                <div
                  key={card.title}
                  className="rounded-[1.75rem] border border-white/25 bg-white/15 p-5 transition duration-300 backdrop-blur-md hover:-translate-y-1 hover:border-[#17637C]/20 hover:bg-white/20"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#17637C] text-white shadow-[0_12px_30px_rgba(23,99,124,0.22)]">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-[#17637C]">{card.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{card.value}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-8 overflow-hidden rounded-[1.8rem] border border-white/25 shadow-[0_20px_60px_rgba(23,99,124,0.08)]">
            <iframe
              title="Iska Homes Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31766.632567482047!2d-0.16099!3d5.6500!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9c7ebaeabe93%3A0xd9e9a38c83e7f123!2sEast%20Legon%2C%20Accra%2C%20Ghana!5e0!3m2!1sen!2sgh!4v1700000000000!5m2!1sen!2sgh"
              className="h-[360px] w-full border-0"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>
      </div>
    </div>
  )
}

export default AboutUsPage
