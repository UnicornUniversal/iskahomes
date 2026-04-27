'use client'

import React, { useState } from 'react'
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  TelegramShareButton,
  EmailShareButton
} from 'react-share'
import {
  X,
  Copy,
  Check,
  Share2,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Mail,
  MessageCircle,
  Send
} from 'lucide-react'
import { toast } from 'react-toastify'
import { generateShareData, getSocialShareData, SHARE_MEDIUMS } from '@/lib/shareUtils'
import { useAnalytics } from '@/hooks/useAnalytics'

/**
 * @param {'listing' | 'development' | 'developer' | 'agent' | 'agency'} propertyType
 */
const ShareModal = ({ isOpen, onClose, property, propertyType = 'listing' }) => {
  const [copied, setCopied] = useState(false)
  const analytics = useAnalytics()

  const entityType = propertyType

  const shareHeadline = () => {
    switch (propertyType) {
      case 'developer':
        return 'Share developer profile'
      case 'agent':
        return 'Share agent profile'
      case 'agency':
        return 'Share agency profile'
      case 'development':
        return 'Share development'
      default:
        return 'Share property'
    }
  }

  const previewTitle = () => {
    if (propertyType === 'developer' || propertyType === 'agent' || propertyType === 'agency') {
      return property?.name || 'Profile'
    }
    if (propertyType === 'development') {
      return property?.title || property?.name || 'Development'
    }
    return property?.title || 'Property'
  }

  const profilePreviewSrc = () => {
    if (!property) return null
    if (propertyType === 'agency' && typeof property.profile_image === 'string') {
      return property.profile_image
    }
    const p = property.profile_image
    if (!p) return null
    if (typeof p === 'string') {
      try {
        const j = JSON.parse(p)
        return j?.url || null
      } catch {
        return p
      }
    }
    return p?.url || null
  }

  const shareAnalyticsPayload = () => {
    if (!property) return {}
    if (propertyType === 'listing') {
      return {
        listingId: property.id,
        listing: property,
        lister_id: property.user_id,
        lister_type: property.account_type || 'developer'
      }
    }
    if (propertyType === 'development') {
      return {
        developmentId: property.id,
        lister_id: property.developer_id,
        lister_type: 'developer'
      }
    }
    if (propertyType === 'developer') {
      return {
        profileId: property.developer_id,
        lister_id: property.developer_id,
        lister_type: 'developer'
      }
    }
    if (propertyType === 'agent') {
      return {
        profileId: property.agent_id,
        lister_id: property.agent_id,
        lister_type: 'agent'
      }
    }
    if (propertyType === 'agency') {
      return {
        profileId: property.agency_id,
        lister_id: property.agency_id,
        lister_type: 'agency'
      }
    }
    return {}
  }

  const trackShareType = () => {
    if (propertyType === 'listing') return 'listing'
    if (propertyType === 'development') return 'development'
    return 'profile'
  }

  if (!isOpen || !property) return null

  const shareData = generateShareData(property, undefined, SHARE_MEDIUMS.COPY_LINK, entityType)
  const socialData = getSocialShareData(property, undefined, entityType)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareData.url)
      setCopied(true)
      toast.success('Link copied to clipboard!')

      analytics.trackShare(trackShareType(), 'copy_link', shareAnalyticsPayload())

      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
      toast.error('Failed to copy link')
    }
  }

  const handleSocialShare = (platform) => {
    analytics.trackShare(trackShareType(), platform, shareAnalyticsPayload())
  }

  const handleInstagramShare = async () => {
    try {
      const instagramText = socialData.instagram.text
      await navigator.clipboard.writeText(instagramText)
      toast.success('Caption copied — paste it in your Instagram post.')
      handleSocialShare('instagram')
    } catch (err) {
      console.error('Failed to copy Instagram text:', err)
      toast.error('Failed to copy caption')
    }
  }

  const socialButtonClass =
    'w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-3 px-4 font-medium text-primary_color transition-colors hover:border-primary_color/35 hover:bg-primary_color/[0.04]'

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <Share2 className="w-6 h-6 text-primary_color shrink-0" />
            <h2 className="text-xl font-semibold text-primary_color truncate">{shareHeadline()}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-primary_color/60 hover:text-primary_color hover:bg-primary_color/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-gray-100 bg-white">
              {propertyType === 'developer' || propertyType === 'agent' || propertyType === 'agency' ? (
                profilePreviewSrc() ? (
                  <img src={profilePreviewSrc()} alt={previewTitle()} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary_color/40 text-lg font-semibold bg-white">
                    {previewTitle().charAt(0) || '?'}
                  </div>
                )
              ) : propertyType === 'development' ? (
                property.banner?.url ? (
                  <img src={property.banner.url} alt={property.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary_color/40 text-lg font-semibold">
                    {property.title?.charAt(0) || 'D'}
                  </div>
                )
              ) : property.media?.mediaFiles?.[0]?.url ? (
                <img
                  src={property.media.mediaFiles[0].url}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary_color/40 text-lg font-semibold">
                  {property.title?.charAt(0) || 'P'}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-primary_color line-clamp-2 mb-1">{previewTitle()}</h3>
              <p className="text-sm text-primary_color/70 line-clamp-2">
                {propertyType === 'developer' || propertyType === 'agent' || propertyType === 'agency'
                  ? [property.city, property.state || property.region, property.country].filter(Boolean).join(', ') ||
                    'Iska Homes'
                  : `${property.city || ''}${property.city && (property.state || property.country) ? ', ' : ''}${property.state || property.country || ''}`}
              </p>
              {propertyType === 'listing' && (
                <p className="text-lg font-semibold text-primary_color mt-1">
                  {property.currency} {parseFloat(property.price || 0).toLocaleString()}
                  {property.price_type === 'rent' && property.duration ? `/${property.duration}` : ''}
                </p>
              )}
              {propertyType === 'development' && (
                <p className="text-sm text-primary_color/65 mt-1">
                  {property.total_units != null ? `${property.total_units} units` : ''}
                  {property.total_units != null && property.number_of_buildings != null ? ' · ' : ''}
                  {property.number_of_buildings != null ? `${property.number_of_buildings} buildings` : ''}
                </p>
              )}
              {(propertyType === 'developer' || propertyType === 'agency') && (
                <p className="text-sm text-primary_color/65 mt-1">
                  {propertyType === 'developer' &&
                    `${property.total_developments ?? '—'} developments · ${property.total_units ?? '—'} units`}
                  {propertyType === 'agency' &&
                    `${property.total_listings ?? 0} listings · ${property.total_agents ?? 0} agents`}
                </p>
              )}
              {propertyType === 'agent' && (
                <p className="text-sm text-primary_color/65 mt-1">
                  {property.total_listings != null ? `${property.total_listings} listings` : 'Agent profile'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-gray-100">
          <h3 className="text-base font-semibold text-primary_color mb-3">Copy link</h3>
          <div className="space-y-3">
            <div className="w-full rounded-lg p-3 border border-gray-200 bg-white">
              <p className="text-sm text-primary_color/70 break-all select-all">{shareData.url}</p>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                copied ? 'bg-primary_color/10 text-primary_color border border-primary_color/25' : 'bg-primary_color text-white hover:opacity-90'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy link
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-base font-semibold text-primary_color mb-4">Share on social</h3>
          <div className="grid grid-cols-2 gap-3">
            <FacebookShareButton
              url={socialData.facebook.url}
              quote={socialData.facebook.quote}
              className="w-full !flex"
              onClick={() => handleSocialShare('facebook')}
            >
              <div className={socialButtonClass}>
                <Facebook className="w-5 h-5 text-gray-500 shrink-0" strokeWidth={1.75} />
                <span>Facebook</span>
              </div>
            </FacebookShareButton>

            <TwitterShareButton
              url={socialData.twitter.url}
              title={socialData.twitter.title}
              hashtags={socialData.twitter.hashtags}
              via={socialData.twitter.via}
              className="w-full !flex"
              onClick={() => handleSocialShare('twitter')}
            >
              <div className={socialButtonClass}>
                <Twitter className="w-5 h-5 text-gray-500 shrink-0" strokeWidth={1.75} />
                <span>Twitter</span>
              </div>
            </TwitterShareButton>

            <LinkedinShareButton
              url={socialData.linkedin.url}
              title={socialData.linkedin.title}
              summary={socialData.linkedin.summary}
              className="w-full !flex"
              onClick={() => handleSocialShare('linkedin')}
            >
              <div className={socialButtonClass}>
                <Linkedin className="w-5 h-5 text-gray-500 shrink-0" strokeWidth={1.75} />
                <span>LinkedIn</span>
              </div>
            </LinkedinShareButton>

            <WhatsappShareButton
              url={socialData.whatsapp.url}
              title={socialData.whatsapp.title}
              className="w-full !flex"
              onClick={() => handleSocialShare('whatsapp')}
            >
              <div className={socialButtonClass}>
                <MessageCircle className="w-5 h-5 text-gray-500 shrink-0" strokeWidth={1.75} />
                <span>WhatsApp</span>
              </div>
            </WhatsappShareButton>

            <TelegramShareButton
              url={socialData.telegram.url}
              title={socialData.telegram.title}
              className="w-full !flex"
              onClick={() => handleSocialShare('telegram')}
            >
              <div className={socialButtonClass}>
                <Send className="w-5 h-5 text-gray-500 shrink-0" strokeWidth={1.75} />
                <span>Telegram</span>
              </div>
            </TelegramShareButton>

            <EmailShareButton
              url={socialData.email.url}
              subject={socialData.email.subject}
              body={socialData.email.body}
              className="w-full !flex"
              onClick={() => handleSocialShare('email')}
            >
              <div className={socialButtonClass}>
                <Mail className="w-5 h-5 text-gray-500 shrink-0" strokeWidth={1.75} />
                <span>Email</span>
              </div>
            </EmailShareButton>

            <button type="button" onClick={handleInstagramShare} className={`col-span-2 ${socialButtonClass}`}>
              <Instagram className="w-5 h-5 text-gray-500 shrink-0" strokeWidth={1.75} />
              <span>Instagram (copy caption)</span>
            </button>
          </div>
        </div>

        <div className="p-6 bg-primary_color/[0.03] rounded-b-2xl border-t border-gray-100">
          <p className="text-sm text-primary_color/70 text-center leading-relaxed">
            {propertyType === 'listing' && 'Share this listing with anyone looking for a place.'}
            {propertyType === 'development' && 'Share this development with investors and buyers.'}
            {(propertyType === 'developer' || propertyType === 'agent' || propertyType === 'agency') &&
              'Share this profile so others can discover them on Iska Homes.'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ShareModal
