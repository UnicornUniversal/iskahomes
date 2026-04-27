'use client'

import React from 'react'
import Link from 'next/link'

const quickLinks = [
  { name: 'All Services', href: '/home/allServices' },
  { name: 'Explore Properties', href: '/home/exploreProperties' },
  { name: 'Developers', href: '/home/allDevelopers' },
  { name: 'About Us', href: '/home/aboutUs' },
  { name: 'Contact Us', href: '/home/contactUs' },
]

const companyLinks = [
  { name: 'FAQs', href: '/home/faqs' },
  { name: 'Privacy Policy', href: '/home/privacyPolicy' },
  { name: 'Cookie Policy', href: '/home/cookiePolicy' },
  { name: 'Terms of Service', href: '/home/termsOfService' },
]

const Footer = () => {
  return (
    <footer style={{ background: '#fff', borderTop: '1px solid rgba(23,99,124,0.08)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 0' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 lg:gap-10">

          {/* Brand column */}
          <div>
            <img
              src="/ISKA Logo.png"
              alt="ISKA Homes"
              style={{ height: 60, width: 'auto', marginBottom: 16 }}
            />
            <p style={{ fontSize: 13, lineHeight: 1.7, color: '#17637C', opacity: 0.8, maxWidth: 240 }}>
              Your Reliable Access to Premium Real Estate - Discover, Connect, and Close with ISKA Homes.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: '#17637C', marginBottom: 16 }}>
              Quick Links
            </h4>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    style={{ fontSize: 14, color: '#17637C', opacity: 0.7, textDecoration: 'none', transition: 'opacity 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7' }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: '#17637C', marginBottom: 16 }}>
              Company
            </h4>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    style={{ fontSize: 14, color: '#17637C', opacity: 0.7, textDecoration: 'none', transition: 'opacity 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7' }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: '#17637C', marginBottom: 16 }}>
              Contact Info
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 14, color: '#17637C', opacity: 0.7, margin: 0, lineHeight: 1.6 }}>
                Child Street, Spintex<br />No FHP 25
              </p>
              <p style={{ fontSize: 14, color: '#17637C', opacity: 0.7, margin: 0 }}>
                0302318132/0303960971
              </p>
              <p style={{ fontSize: 14, color: '#17637C', opacity: 0.7, margin: 0 }}>
                info@iskaglobal.com
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #17637C, #F68B1F, transparent)', margin: '40px 0 0', opacity: 0.3 }} />

        {/* Copyright */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '20px 0' }}>
          <span style={{ fontSize: 13, color: '#17637C', opacity: 0.6 }}>
            © {new Date().getFullYear()} ISKA Homes, All Right Reserved
          </span>
        </div>
      </div>


    </footer>
  )
}

export default Footer
