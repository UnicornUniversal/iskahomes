// Utility function to generate share URLs and metadata
export const generateShareData = (property, currentUrl) => {
  const shareUrl = currentUrl || (typeof window !== 'undefined' ? window.location.href : '')
  
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

// Social media specific share data
export const getSocialShareData = (property, currentUrl) => {
  const baseData = generateShareData(property, currentUrl)
  
  return {
    facebook: {
      url: baseData.url,
      quote: `${baseData.title} - ${baseData.price} in ${baseData.location}. ${baseData.description}`
    },
    twitter: {
      url: baseData.url,
      title: `${baseData.title} - ${baseData.price}`,
      hashtags: baseData.hashtags.slice(0, 3), // Twitter has hashtag limits
      via: 'IskaHomes' // Replace with your Twitter handle
    },
    linkedin: {
      url: baseData.url,
      title: baseData.title,
      summary: `${baseData.description} Located in ${baseData.location}. ${baseData.price}`
    },
    whatsapp: {
      url: baseData.url,
      title: `${baseData.title} - ${baseData.price}`
    },
    telegram: {
      url: baseData.url,
      title: baseData.title
    },
    email: {
      url: baseData.url,
      subject: `Check out this property: ${baseData.title}`,
      body: `Hi,\n\nI found this amazing property and thought you might be interested:\n\n${baseData.title}\n${baseData.price}\n${baseData.location}\n\n${baseData.description}\n\nView it here: ${baseData.url}\n\nBest regards!`
    }
  }
}
