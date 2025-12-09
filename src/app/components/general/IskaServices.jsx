import React from 'react'
import Image from 'next/image'
import { iskaServices } from '../Data/StaticData'

const IskaServices = () => {
  return (
    <div className="w-full py-8 px-4 md:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-primary_color">
          Our Services
        </h2>
        <p className="text-center mb-12 text-primary_color/80 max-w-2xl mx-auto">
          Discover the comprehensive range of services we offer to enhance your property experience
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {iskaServices.map((service) => {
            const IconComponent = service.icon;
            return (
              <div
                key={service.id}
                className="design1 p-6 hover:shadow-xl transition-all duration-300 group cursor-pointer"
              >
                <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                </div>
                
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary_color/10 flex items-center justify-center group-hover:bg-primary_color transition-colors duration-300">
                    <IconComponent className="text-primary_color group-hover:text-white transition-colors duration-300 text-lg" />
                  </div>
                  <h3 className="text-xl font-semibold text-primary_color group-hover:text-secondary_color transition-colors duration-300">
                    {service.title}
                  </h3>
                </div>
                
                <p className="text-sm mb-3 text-primary_color/70 line-clamp-2">
                  {service.excerpt}
                </p>
                
                <p className="text-xs text-primary_color/60 line-clamp-3">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}

export default IskaServices
