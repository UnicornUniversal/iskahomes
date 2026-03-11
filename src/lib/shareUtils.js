// Share medium values for lead attribution (lead_source)
export const SHARE_MEDIUMS = {
  COPY_LINK: 'copy_link',
  WHATSAPP: 'whatsapp',
  FACEBOOK: 'facebook',
  TWITTER: 'twitter',
  LINKEDIN: 'linkedin',
  TELEGRAM: 'telegram',
  EMAIL: 'email',
  INSTAGRAM: 'instagram',
  WEBSITE: 'website' // Direct visit, no share param
}

/**
 * Append share_medium to URL for lead attribution.
 * When someone shares a link (copy, WhatsApp, etc.), the recipient's lead will have lead_source set.
 */
export const appendShareMediumToUrl = (url, shareMedium) => {
  if (!url || !shareMedium) return url
  try {
    const u = new URL(url)
    u.searchParams.set('share_medium', shareMedium)
    return u.toString()
  } catch {
    return url
  }
}

// Utility function to generate share URLs and metadata
export const generateShareData = (property, currentUrl, shareMedium = null) => {
  let shareUrl = currentUrl || (typeof window !== 'undefined' ? window.location.href : '')
  if (shareMedium) {
    shareUrl = appendShareMediumToUrl(shareUrl, shareMedium)
  }
  
  const title = property?.title || 'Check out this amazing property'
  const description = property?.description ? 
    property.description.substring(0, 160) + '...' : 
    'Amazing property available now!'
  
  const price = property?.price ? 
    `${property.currency} ${parseFloat(property.price).toLocaleString()}${property.price_type === 'rent' ? `/${property.duration}` : ''}` : 
    'Price available on request'
  
  const location = property ? 
    `${property.city}, ${property.state}` : 
    'Location available'
  
  return {
    url: shareUrl,
    title,
    description,
    price,
    location,
    hashtags: ['RealEstate', 'Property', 'Home', 'ForSale', 'ForRent'],
    image: property?.media?.mediaFiles?.[0]?.url || property?.media?.banner?.url
  }
}

// Social media specific share data - each platform gets URL with share_medium for lead attribution
export const getSocialShareData = (property, currentUrl) => {
  const baseUrl = currentUrl || (typeof window !== 'undefined' ? window.location.href : '')
  return {
    facebook: {
      url: appendShareMediumToUrl(baseUrl, SHARE_MEDIUMS.FACEBOOK),
      quote: `${property?.title || 'Check out this property'} - ${property?.price ? `${property.currency} ${property.price}` : 'Price on request'} in ${property ? `${property.city}, ${property.state}` : 'Location'}. ${property?.description?.substring(0, 160) || 'Amazing property!'}`
    },
    twitter: {
      url: appendShareMediumToUrl(baseUrl, SHARE_MEDIUMS.TWITTER),
      title: `${property?.title || 'Check out this property'} - ${property?.price ? `${property.currency} ${property.price}` : 'Price on request'}`,
      hashtags: ['RealEstate', 'Property', 'Home'].slice(0, 3),
      via: 'IskaHomes'
    },
    linkedin: {
      url: appendShareMediumToUrl(baseUrl, SHARE_MEDIUMS.LINKEDIN),
      title: property?.title || 'Check out this property',
      summary: `${property?.description?.substring(0, 160) || 'Amazing property!'} Located in ${property ? `${property.city}, ${property.state}` : 'Location'}. ${property?.price ? `${property.currency} ${property.price}` : 'Price on request'}`
    },
    whatsapp: {
      url: appendShareMediumToUrl(baseUrl, SHARE_MEDIUMS.WHATSAPP),
      title: `${property?.title || 'Check out this property'} - ${property?.price ? `${property.currency} ${property.price}` : 'Price on request'}`
    },
    telegram: {
      url: appendShareMediumToUrl(baseUrl, SHARE_MEDIUMS.TELEGRAM),
      title: property?.title || 'Check out this property'
    },
    email: {
      url: appendShareMediumToUrl(baseUrl, SHARE_MEDIUMS.EMAIL),
      subject: `Check out this property: ${property?.title || 'Amazing property'}`,
      body: `Hi,\n\nI found this amazing property and thought you might be interested:\n\n${property?.title || 'Amazing property'}\n${property?.price ? `${property.currency} ${property.price}` : 'Price on request'}\n${property ? `${property.city}, ${property.state}` : 'Location'}\n\n${property?.description?.substring(0, 160) || 'Amazing property!'}\n\nView it here: ${appendShareMediumToUrl(baseUrl, SHARE_MEDIUMS.EMAIL)}\n\nBest regards!`
    },
    instagram: {
      url: appendShareMediumToUrl(baseUrl, SHARE_MEDIUMS.INSTAGRAM),
      title: property?.title || 'Check out this property',
      text: `🏠 ${property?.title || 'Amazing property'}\n\n💰 ${property?.price ? `${property.currency} ${property.price}` : 'Price on request'}\n📍 ${property ? `${property.city}, ${property.state}` : 'Location'}\n\n${property?.description?.substring(0, 160) || 'Amazing property!'}\n\n🔗 ${appendShareMediumToUrl(baseUrl, SHARE_MEDIUMS.INSTAGRAM)}\n\n#RealEstate #Property #Home`
    }
  }
}
