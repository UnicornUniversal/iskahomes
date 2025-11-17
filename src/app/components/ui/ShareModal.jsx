'use client'

import React, { useState } from 'react'
import { 
  FacebookShareButton, 
  TwitterShareButton, 
  LinkedinShareButton,
  WhatsappShareButton,
  TelegramShareButton,
  EmailShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon,
  TelegramIcon,
  EmailIcon
} from 'react-share'
import { 
  X, 
  Copy, 
  Check, 
  Share2
} from 'lucide-react'
import { toast } from 'react-toastify'
import { generateShareData, getSocialShareData } from '@/lib/shareUtils'
import { useAnalytics } from '@/hooks/useAnalytics'

const ShareModal = ({ isOpen, onClose, property, propertyType = 'listing' }) => {
  const [copied, setCopied] = useState(false)
  const analytics = useAnalytics()
  
  if (!isOpen || !property) return null

  const shareData = generateShareData(property)
  const socialData = getSocialShareData(property)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareData.url)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      
      // Track copy link action
      analytics.trackShare(propertyType, 'copy_link', {
        listingId: property.id,
        listing: propertyType === 'listing' ? property : undefined, // Pass listing object if it's a listing
        profileId: propertyType === 'developer' ? property.developer_id : undefined, // For profile-based shares
        lister_id: property.user_id || property.developer_id || property.developers?.developer_id || property.agent_id || property.developers?.agent_id,
        lister_type: property.account_type || (property.developer_id || property.developers?.developer_id ? 'developer' : (property.agent_id || property.developers?.agent_id ? 'agent' : 'developer'))
      })
      
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
      toast.error('Failed to copy link')
    }
  }

  const handleSocialShare = (platform) => {
    // Track social media share
    analytics.trackShare(propertyType, platform, {
      listingId: property.id,
      listing: propertyType === 'listing' ? property : undefined, // Pass listing object if it's a listing
      profileId: propertyType === 'developer' ? property.developer_id : undefined, // For profile-based shares
      lister_id: property.user_id || property.developer_id || property.developers?.developer_id || property.agent_id || property.developers?.agent_id,
      lister_type: property.account_type || (property.developer_id || property.developers?.developer_id ? 'developer' : (property.agent_id || property.developers?.agent_id ? 'agent' : 'developer'))
    })
  }


  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Share2 className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">
              Share {propertyType === 'developer' ? 'Developer' : propertyType === 'development' ? 'Development' : 'Property'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Property Preview */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              {propertyType === 'developer' ? (
                property.profile_image?.url ? (
                  <img
                    src={property.profile_image.url}
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-bold">
                    {property.name?.charAt(0) || 'D'}
                  </div>
                )
              ) : propertyType === 'development' ? (
                property.banner?.url ? (
                  <img
                    src={property.banner.url}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-bold">
                    {property.title?.charAt(0) || 'D'}
                  </div>
                )
              ) : (
                property.media?.mediaFiles?.[0]?.url ? (
                  <img
                    src={property.media.mediaFiles[0].url}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-bold">
                    {property.title?.charAt(0) || 'P'}
                  </div>
                )
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                {propertyType === 'developer' ? property.name : property.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {propertyType === 'developer' 
                  ? `${property.city}, ${property.country}`
                  : `${property.city}, ${property.state || property.country}`
                }
              </p>
              {propertyType === 'listing' && (
                <p className="text-lg font-bold text-blue-600 mt-1">
                  {property.currency} {parseFloat(property.price).toLocaleString()}
                  {property.price_type === 'rent' && `/${property.duration}`}
                </p>
              )}
              {propertyType === 'development' && (
                <p className="text-sm text-gray-500 mt-1">
                  {property.total_units} units • {property.number_of_buildings} buildings
                </p>
              )}
              {propertyType === 'developer' && (
                <p className="text-sm text-gray-500 mt-1">
                  {property.total_developments} developments • {property.total_units} units
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Copy Link */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Copy Link</h3>
          <div className="space-y-3">
            <div className="w-full bg-gray-50 rounded-lg p-3 border">
              <p className="text-sm text-gray-600 break-all">{shareData.url}</p>
            </div>
            <button
              onClick={handleCopyLink}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
                copied 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Social Media Share Buttons */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Share on Social Media</h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Facebook */}
            <FacebookShareButton
              url={socialData.facebook.url}
              quote={socialData.facebook.quote}
              className="w-full"
              onClick={() => handleSocialShare('facebook')}
            >
              <div className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 hover:shadow-lg">
                <FacebookIcon size={20} round />
                <span>Facebook</span>
              </div>
            </FacebookShareButton>

            {/* Twitter */}
            <TwitterShareButton
              url={socialData.twitter.url}
              title={socialData.twitter.title}
              hashtags={socialData.twitter.hashtags}
              via={socialData.twitter.via}
              className="w-full"
              onClick={() => handleSocialShare('twitter')}
            >
              <div className="w-full bg-sky-500 hover:bg-sky-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 hover:shadow-lg">
                <TwitterIcon size={20} round />
                <span>Twitter</span>
              </div>
            </TwitterShareButton>

            {/* LinkedIn */}
            <LinkedinShareButton
              url={socialData.linkedin.url}
              title={socialData.linkedin.title}
              summary={socialData.linkedin.summary}
              className="w-full"
              onClick={() => handleSocialShare('linkedin')}
            >
              <div className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 hover:shadow-lg">
                <LinkedinIcon size={20} round />
                <span>LinkedIn</span>
              </div>
            </LinkedinShareButton>

            {/* WhatsApp */}
            <WhatsappShareButton
              url={socialData.whatsapp.url}
              title={socialData.whatsapp.title}
              className="w-full"
              onClick={() => handleSocialShare('whatsapp')}
            >
              <div className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 hover:shadow-lg">
                <WhatsappIcon size={20} round />
                <span>WhatsApp</span>
              </div>
            </WhatsappShareButton>

            {/* Telegram */}
            <TelegramShareButton
              url={socialData.telegram.url}
              title={socialData.telegram.title}
              className="w-full"
              onClick={() => handleSocialShare('telegram')}
            >
              <div className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 hover:shadow-lg">
                <TelegramIcon size={20} round />
                <span>Telegram</span>
              </div>
            </TelegramShareButton>

            {/* Email */}
            <EmailShareButton
              url={socialData.email.url}
              subject={socialData.email.subject}
              body={socialData.email.body}
              className="w-full"
              onClick={() => handleSocialShare('email')}
            >
              <div className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 hover:shadow-lg">
                <EmailIcon size={20} round />
                <span>Email</span>
              </div>
            </EmailShareButton>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 rounded-b-2xl">
          <p className="text-sm text-gray-600 text-center">
            Share this amazing {propertyType === 'developer' ? 'developer' : propertyType === 'development' ? 'development' : 'property'} with your friends and family!
          </p>
        </div>
      </div>
    </div>
  )
}

export default ShareModal
