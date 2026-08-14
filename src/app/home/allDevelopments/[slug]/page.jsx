'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, CheckCircle, FileText, Heart, Share2 } from 'lucide-react'
import { motion, useScroll } from 'framer-motion'

import UnitCard from '@/app/components/developers/units/UnitCard'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useAuth } from '@/contexts/AuthContext'
import ShareModal from '@/app/components/ui/ShareModal'
import { toast } from 'react-toastify'
import Nav from '@/app/components/Nav'
import { withWebsiteLeadAttribution } from '@/lib/leadAttributionUrl'

/* Purposes/types/categories resolve to {id,name}; unit_types.inbuilt and
   amenities.custom may be plain strings. Normalise both to a label. */
const labelOf = (value) => {
  if (!value) return null
  if (typeof value === 'string') return value
  return value.name || null
}

const toLabels = (list) => (Array.isArray(list) ? list.map(labelOf).filter(Boolean) : [])

/* Section title with the thin rule running off to the right */
const SectionHeading = ({ children, className = '' }) => (
  <div className={`flex items-baseline gap-6 mb-8 ${className}`}>
    <h2 className="text-3xl md:text-4xl font-light tracking-tight text-primary_color whitespace-nowrap">
      {children}
    </h2>
    <span className="h-px flex-1 bg-primary_color/20" />
  </div>
)

/* Small uppercase label sitting above a value or a row of pills */
const FieldLabel = ({ children }) => (
  <p className="text-[0.65rem] uppercase tracking-[0.18em] text-primary_color/50 mb-3">{children}</p>
)

const Pill = ({ children }) => (
  <span className="inline-flex items-center rounded-full bg-primary_color px-4 py-1.5 text-xs font-medium text-white">
    {children}
  </span>
)

/* A labelled row of pills — renders nothing when the list is empty */
const PillGroup = ({ label, items }) => {
  if (!items || items.length === 0) return null

  return (
    <div className="border-t border-primary_color/10 pt-5">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <Pill key={`${item}-${i}`}>{item}</Pill>
        ))}
      </div>
    </div>
  )
}

const DevelopmentPage = () => {
  const params = useParams()
  const analytics = useAnalytics()
  const { user } = useAuth()
  const { scrollYProgress } = useScroll()
  const [development, setDevelopment] = useState(null)
  const [developer, setDeveloper] = useState(null)
  const [units, setUnits] = useState([])
  const [relatedDevelopments, setRelatedDevelopments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    const fetchDevelopment = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/public/developments/${params.slug}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch development')
        }

        if (data.success && data.data) {
          setDevelopment(data.data.development)
          setDeveloper(data.data.development.developers)
          
          // Enrich units with development location data
          const unitsWithLocation = (data.data.units || []).map(unit => ({
            ...unit,
            city: unit.city || data.data.development.city,
            state: unit.state || data.data.development.state,
            town: unit.town || data.data.development.town
          }))
          setUnits(unitsWithLocation)
          setRelatedDevelopments(data.data.relatedDevelopments || [])
          
          // Track development view
          if (data.data.development) {
            analytics.trackDevelopmentView(data.data.development.id, {
              viewedFrom: 'development_page',
              lister_id: data.data.development.developers?.developer_id,
              lister_type: 'developer',
              location: {
                city: data.data.development.city,
                state: data.data.development.state
              }
            })
          }
        } else {
          throw new Error('Invalid response format')
        }
      } catch (err) {
        console.error('Error fetching development:', err)
        setError(err.message)
        setDevelopment(null)
        setDeveloper(null)
        setUnits([])
        setRelatedDevelopments([])
      } finally {
        setLoading(false)
      }
    }

    if (params.slug) {
      fetchDevelopment()
    }
  }, [params.slug])

  // Analytics tracking functions
  const handlePhoneClick = async (phoneNumber, context = 'development') => {
    try {
      await navigator.clipboard.writeText(phoneNumber)
      // Track as development lead (not listing lead)
      analytics.trackDevelopmentLead(development?.id, 'phone', {
        lister_id: developer?.developer_id,
        lister_type: 'developer',
        contactMethod: 'phone',
        phoneNumber: phoneNumber
      })
      toast.success('Phone number copied!')
    } catch (error) {
      console.error('Failed to copy phone number:', error)
      toast.error('Failed to copy phone number')
    }
  }

  const handleEmailClick = async (email, context = 'development') => {
    try {
      await navigator.clipboard.writeText(email)
      // Track as development lead (not listing lead)
      analytics.trackDevelopmentLead(development?.id, 'email', {
        lister_id: developer?.developer_id,
        lister_type: 'developer',
        contactMethod: 'email'
      })
      toast.success('Email copied!')
    } catch (error) {
      console.error('Failed to copy email:', error)
      toast.error('Failed to copy email')
    }
  }

  const handleWebsiteClick = (websiteUrl, context = 'development') => {
    // Track as development interaction (website visit)
    analytics.trackDevelopmentInteraction(development?.id, 'website_visit', {
      lister_id: developer?.developer_id,
      lister_type: 'developer',
      websiteUrl: websiteUrl
    })
  }

  const handleSocialMediaClick = (platform, url, context = 'development') => {
    // Track as development interaction (social media click)
    analytics.trackDevelopmentInteraction(development?.id, 'social_media_click', {
      lister_id: developer?.developer_id,
      lister_type: 'developer',
      platform: platform,
      url: url
    })
  }

  const handleMessageClick = () => {
    // Track as development lead (message)
    analytics.trackDevelopmentLead(development?.id, 'message', {
      lister_id: developer?.developer_id,
      lister_type: 'developer',
      contactMethod: 'direct_message'
    })
  }

  const handleRelatedDevelopmentClick = (relatedDevelopment) => {
    analytics.trackDevelopmentView(relatedDevelopment.id, {
      viewedFrom: 'development_page',
      lister_id: developer?.developer_id,
      lister_type: 'developer',
      location: {
        city: relatedDevelopment.city,
        state: relatedDevelopment.state
      }
    })
  }

  const handleUnitClick = (unit) => {
    analytics.trackPropertyView(unit.id, {
      viewedFrom: 'development_page',
      listing: unit, // Pass full listing object so lister_id can be extracted
      listingType: unit.listing_type
    })
  }

  const handleShareClick = (platform) => {
    analytics.trackShare('development', platform, {
      listingId: development?.id,
      lister_id: developer?.developer_id,
      lister_type: 'developer'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off_white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="h-1 w-24 bg-gray-100 overflow-hidden rounded-full">
            <motion.div
              className="h-full bg-primary_color"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                repeat: Infinity,
                duration: 1,
                ease: "easeInOut"
              }}
            />
          </div>
          <motion.p 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-xs font-medium tracking-[0.2em] text-gray-400 uppercase"
          >
            Loading Experience
          </motion.p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!development) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Development Not Found</h1>
          <p className="text-gray-500">The development you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const galleryImages = (development.media_files || []).filter(Boolean)
  const featureImage = galleryImages[0] || development.banner

  const purposes = toLabels(development.purposes)
  const types = toLabels(development.types)
  const categories = toLabels(development.categories)
  const unitTypes = toLabels([
    ...(development.unit_types?.database || []),
    ...(development.unit_types?.inbuilt || []),
    ...(development.unit_types?.custom || []),
  ])
  const amenities = toLabels([
    ...(development.amenities?.inbuilt || []),
    ...(development.amenities?.custom || []),
  ])

  const locationLine = [development.town, development.city, development.state]
    .filter(Boolean)
    .join(', ')
  const developerLocation = [developer?.city, developer?.country].filter(Boolean).join(', ')

  const handleFavoriteClick = () => {
    // TODO: Implement favorite functionality for developments
    setIsFavorite(!isFavorite)
    toast.info('Favorite functionality coming soon')
  }



  return (
    <div className="min-h-screen bg-off_white text-primary_color selection:bg-primary_color selection:text-white">
      <Nav />
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary_color origin-left z-50"
        style={{ scaleX: scrollYProgress }}
      />
      
      <div className="max-w-[1500px] mx-auto px-6 md:px-12">
        {/* ---- Hero ---- */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="pt-10 md:pt-16 mb-20 md:mb-28"
        >
          {/* Title spans the full width */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight tracking-tight text-primary_color mb-4">
            {development.title}
          </h1>

          {/* Meta row sits directly beneath the title */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {locationLine && (
              <span className="inline-flex items-center gap-1 text-xs text-primary_color/70">
                <MapPin className="w-3 h-3 shrink-0" />
                {locationLine}
              </span>
            )}
            {development.status && (
              <span className="inline-flex items-center rounded-full bg-primary_color px-3 py-1 text-[0.7rem] font-medium text-white">
                {development.status}
              </span>
            )}

            <button
              onClick={handleFavoriteClick}
              aria-label="Save development"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-primary_color/25 transition hover:bg-primary_color hover:text-white"
            >
              <Heart className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => {
                setShowShareModal(true)
                handleShareClick('modal')
              }}
              aria-label="Share development"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-primary_color/25 transition hover:bg-primary_color hover:text-white"
            >
              <Share2 className="w-3 h-3" />
            </button>
          </div>

          {/* Developer card on the left, banner starting to its right and lower */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {developer && (
              <div className="lg:col-span-3">
                <Link
                  href={withWebsiteLeadAttribution(`/home/allDevelopers/${developer.slug}`, 'development')}
                  className="group flex items-start gap-3"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden bg-primary_color/10">
                    {developer.profile_image?.url ? (
                      <Image
                        src={developer.profile_image.url}
                        alt={developer.name}
                        width={48}
                        height={48}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="font-semibold">{developer.name?.charAt(0)}</span>
                    )}
                  </span>
                  <span className="flex flex-col leading-snug">
                    <span className="flex items-center gap-1 text-xs font-medium text-primary_color group-hover:underline underline-offset-4">
                      {developer.name}
                      {developer.verified && <CheckCircle className="w-3 h-3 shrink-0" />}
                    </span>
                    <span className="text-xs text-primary_color/60">Developer</span>
                    {developerLocation && (
                      <span className="text-[0.7rem] italic text-primary_color/50">{developerLocation}</span>
                    )}
                  </span>
                </Link>
              </div>
            )}

            {development.banner?.url && (
              <div
                className={`relative aspect-[16/7] w-full overflow-hidden ${
                  developer ? 'lg:col-span-9' : 'lg:col-span-12'
                }`}
              >
                <Image
                  src={development.banner.url}
                  alt={development.title}
                  fill
                  priority
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* ---- Tagline ---- */}
        {development.tagline && (
          <div className="mb-16 md:mb-24">
            <FieldLabel>Tagline</FieldLabel>
            <h2 className="max-w-3xl text-3xl md:text-5xl font-light leading-[1.15] tracking-tight text-primary_color">
              {development.tagline}
            </h2>
            <span className="mt-10 block h-px w-full bg-primary_color/20" />
          </div>
        )}

        {/* ---- Feature image + description / details ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 mb-24 md:mb-32">
          {featureImage?.url && (
            <div className="lg:col-span-5">
              <div className="relative aspect-[3/4] w-full overflow-hidden lg:sticky lg:top-12">
                <Image
                  src={featureImage.url}
                  alt={development.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}

          <div className={featureImage?.url ? 'lg:col-span-7' : 'lg:col-span-12'}>
            {development.description && (
              <div className="mb-14">
                <SectionHeading>Description</SectionHeading>
                <p className="preserve-whitespace max-w-2xl leading-relaxed text-primary_color/75">
                  {development.description}
                </p>
              </div>
            )}

            <SectionHeading>Details</SectionHeading>

            {/* Headline figures */}
            <div className="grid grid-cols-2 gap-8 mb-10">
              {development.size && (
                <div>
                  <FieldLabel>Property Size</FieldLabel>
                  <p className="text-2xl md:text-3xl font-light text-primary_color">{development.size}</p>
                </div>
              )}
              {development.total_units != null && (
                <div>
                  <FieldLabel>Total Units</FieldLabel>
                  <p className="text-2xl md:text-3xl font-light text-primary_color">{development.total_units}</p>
                </div>
              )}
              {development.number_of_buildings != null && (
                <div>
                  <FieldLabel>Buildings</FieldLabel>
                  <p className="text-2xl md:text-3xl font-light text-primary_color">
                    {development.number_of_buildings}
                  </p>
                </div>
              )}
              {development.full_address && (
                <div>
                  <FieldLabel>Address</FieldLabel>
                  <p className="text-primary_color">{development.full_address}</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <PillGroup label="Property Purposes" items={purposes} />
              <PillGroup label="Property Types" items={types} />
              <PillGroup label="Property Categories" items={categories} />
              <PillGroup label="Unit Types" items={unitTypes} />
              <PillGroup label="Amenities" items={amenities} />
            </div>

            {/* ---- Property media (video) ---- */}
            {development.video?.url && (
              <div className="mt-16">
                <SectionHeading>Property Media</SectionHeading>
                <video
                  src={development.video.url}
                  className="w-full aspect-video object-cover"
                  controls
                  poster={development.banner?.url}
                />
              </div>
            )}

            {/* ---- Additional files ---- */}
            {development.additional_files?.length > 0 && (
              <div className="mt-16">
                <SectionHeading>Additional Files</SectionHeading>
                <ul>
                  {development.additional_files.map((file, idx) => (
                    <li key={idx} className="border-b border-primary_color/10">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 py-3 transition hover:text-primary_color"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary_color text-white">
                          <FileText className="h-3 w-3" />
                        </span>
                        <span className="truncate text-primary_color/80 group-hover:underline underline-offset-4">
                          {file.name || 'Document'}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ---- Gallery: horizontal strip ---- */}
        {galleryImages.length > 0 && (
          <div className="mb-24 md:mb-32">
            <SectionHeading>Gallery</SectionHeading>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
              {galleryImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-[4/3] w-[260px] md:w-[340px] shrink-0 snap-start overflow-hidden group"
                >
                  <Image
                    src={img.url}
                    alt={`${development.title} photo ${idx + 1}`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- All properties in this development ---- */}
        <div className="mb-24 md:mb-32">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end mb-10">
            <h2 className="md:col-span-6 text-3xl md:text-4xl font-light leading-tight tracking-tight text-primary_color">
              All Properties at {development.title}
            </h2>
            <div className="md:col-span-3">
              <FieldLabel>Total listings for this development</FieldLabel>
              <p className="text-3xl md:text-4xl font-light text-primary_color">{units.length}</p>
            </div>
            {development.total_units != null && (
              <div className="md:col-span-3">
                <FieldLabel>Total units</FieldLabel>
                <p className="text-3xl md:text-4xl font-light text-primary_color">
                  {development.total_units}
                </p>
              </div>
            )}
          </div>

          <span className="mb-10 block h-px w-full bg-primary_color/20" />

          {units.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {units.map((unit, idx) => (
                <motion.div
                  key={unit.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(idx, 5) * 0.08 }}
                >
                  <UnitCard
                    unit={unit}
                    developerSlug={developer?.slug}
                    publicView
                    leadAttributionContext="development"
                    onUnitClick={handleUnitClick}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <span className="font-light text-primary_color/45">Inventory coming soon</span>
            </div>
          )}
        </div>

        {/* Location Map */}
        {development.latitude && development.longitude && (
          <div className="mb-24 md:mb-32">
            <SectionHeading>Location</SectionHeading>
            <div className="h-[420px] md:h-[520px] w-full">
              <iframe
                title={`Map of ${development.title}`}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${development.longitude - 0.01},${development.latitude - 0.01},${development.longitude + 0.01},${development.latitude + 0.01}&layer=mapnik&marker=${development.latitude},${development.longitude}`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        {/* ---- Other developments by the same developer ---- */}
        {relatedDevelopments.length > 0 && (
          <div className="mb-24 md:mb-32">
            <p className="text-primary_color/60 mb-1">Developments by</p>
            <div className="flex items-baseline gap-6 mb-10">
              <h2 className="text-3xl md:text-4xl font-light tracking-tight text-primary_color whitespace-nowrap">
                {developer?.name}
              </h2>
              <span className="h-px flex-1 bg-primary_color/20" />
            </div>

            <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
              {relatedDevelopments.map((related) => (
                <Link
                  key={related.id}
                  href={withWebsiteLeadAttribution(`/home/allDevelopments/${related.slug}`, 'development')}
                  onClick={() => handleRelatedDevelopmentClick(related)}
                  className="group w-[280px] md:w-[340px] shrink-0 snap-start"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden mb-4">
                    {related.banner?.url ? (
                      <Image
                        src={related.banner.url}
                        alt={related.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-primary_color/5" />
                    )}
                    {related.status && (
                      <span className="absolute bottom-3 left-3 rounded-full bg-primary_color px-3 py-1 text-[0.65rem] font-medium text-white">
                        {related.status}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-light text-primary_color group-hover:underline underline-offset-4">
                    {related.title}
                  </h3>
                  {(related.city || related.country) && (
                    <p className="text-primary_color/55">
                      {[related.city, related.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Contact — keeps the developer lead-capture path on the page */}
        {developer && (developer.phone || developer.email) && (
          <div className="mb-20 border-t border-primary_color/15 pt-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <FieldLabel>Interested?</FieldLabel>
                <h2 className="text-2xl md:text-3xl font-light tracking-tight text-primary_color">
                  Contact {developer.name}
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {developer.phone && (
                  <button
                    onClick={() => handlePhoneClick(developer.phone)}
                    className="rounded-full bg-primary_color px-6 py-3 font-medium text-white transition hover:opacity-90"
                  >
                    Copy phone
                  </button>
                )}
                {developer.email && (
                  <button
                    onClick={() => handleEmailClick(developer.email)}
                    className="rounded-full border border-primary_color/25 px-6 py-3 font-medium text-primary_color transition hover:bg-primary_color hover:text-white"
                  >
                    Copy email
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        property={development}
        propertyType="development"
      />
    </div>
  )
}

export default DevelopmentPage
