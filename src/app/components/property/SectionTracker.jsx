"use client"
import React, { useState, useEffect } from 'react'
import { FaImages, FaFileAlt, FaDollarSign, FaHome, FaList, FaStar, FaMapMarkerAlt, FaInfoCircle, FaGavel } from 'react-icons/fa'

const SectionTracker = ({ sections = [] }) => {
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200 // Offset for better UX

      // Find which section is currently in view
      for (const section of sections) {
        const element = document.getElementById(section.id)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [sections])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 100 // Offset from top
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  const getIcon = (iconName) => {
    const icons = {
      gallery: FaImages,
      description: FaFileAlt,
      pricing: FaDollarSign,
      specifications: FaHome,
      completeSpecs: FaList,
      amenities: FaStar,
      location: FaMapMarkerAlt,
      additionalInfo: FaInfoCircle,
      acquisitionRules: FaGavel
    }
    return icons[iconName] || FaInfoCircle
  }

  if (sections.length === 0) return null

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="space-y-2">
          {sections.map((section) => {
            const Icon = getIcon(section.icon)
            const isActive = activeSection === section.id
            
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                title={section.label}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span className="text-sm font-medium whitespace-nowrap">{section.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default SectionTracker

