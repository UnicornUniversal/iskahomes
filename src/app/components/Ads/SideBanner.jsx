import React from 'react'
import Image from 'next/image'

const SideBanner = () => {
  const side_banners = [
    {
      image: "https://plus.unsplash.com/premium_photo-1680281937048-735543c5c0f7?q=80&w=722&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      link: "https://www.google.com"
    },
    
    {
      image: "https://plus.unsplash.com/premium_photo-1680281937048-735543c5c0f7?q=80&w=722&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      link: "https://www.google.com"
    },
    
    {
      image: "https://plus.unsplash.com/premium_photo-1680281937048-735543c5c0f7?q=80&w=722&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      link: "https://www.google.com"
    },
    
  ]
  return (
    <div className='w-full h-full rel flex flex-col gap-4 max-h-[400px] overflow-hidden'>
      {side_banners.map((banner, idx) => (
        <a href={banner.link} target="_blank" rel="noopener noreferrer" key={idx} className="block w-full">
          <Image src={banner.image} alt={`Side Banner ${idx + 1}`} width={300} height={300} className='w-full max-h-[400px] object-cover rounded-md' />
        </a>
      ))}
    </div>
  )
}

export default SideBanner
