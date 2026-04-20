'use client'

import React from 'react'
import { FiChevronDown } from 'react-icons/fi'

const GeneralHeader = ({
  headingOne,
  headingTwo,
  description,
  stats = [],
  images = [],
  topRightIcon,
  bottomRightIcon,
  className = ''
}) => {
  return (
    <section className={`w-full ${className}`} style={{ position: 'relative' }}>
      <div className="px-4 sm:px-6 lg:px-8 mx-auto" style={{ paddingTop: '60px', paddingBottom: '0' }}>
        {/* Tier 1: Heading */}
        <div className="flex justify-start items-start flex-wrap">
          <h2 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }} className="font-medium text-primary_color tracking-tight">
            {headingOne} {headingTwo}
          </h2>
       
          {/* {topRightIcon != null ? (
            topRightIcon
          ) : (
            <div className="w-10 h-10 rounded-full border-2 border-primary_color flex items-center justify-center flex-shrink-0 text-primary_color">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
              </svg>
            </div>
          )} */}
        </div>

        {/* Salmon/pale coral accent line */}
     

      


        {/* Tier 3: Images left, description + stats right, bottom-right icon */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch mt-6 sm:mt-8 pb-6">
          {images.length > 0 && (
            <div className="flex gap-3 sm:gap-4 flex-shrink-0 order-2 lg:order-1">
              {images.slice(0, 3).map((image, index) => (
                <div
                  key={`${image.src}-${index}`}
                  className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 overflow-hidden rounded-2xl bg-slate-100 flex-shrink-0"
                >
                  <img
                    src={image.src}
                    alt={image.alt || `${headingTwo} ${index + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
          <div className="flex-1 min-w-0 order-1 lg:order-2 flex flex-col justify-between gap-4">
            {description && (
              <p className="text-sm sm:text-base text-primary_color/90 italic max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
            {stats.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {stats.map((stat) => (
                  <div key={`${stat.label}-${stat.value}`} className="flex flex-col">
                    <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500">
                      {stat.label}
                    </span>
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-primary_color leading-tight">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          
          {bottomRightIcon != null ? (
            bottomRightIcon
          ) : (
            <button
              type="button"
              aria-label="Scroll down"
              className="w-10 h-10 rounded-full border-2 border-primary_color flex items-center justify-center flex-shrink-0 text-primary_color hover:bg-primary_color hover:text-white transition-colors self-end lg:self-auto order-3"
            >
              <FiChevronDown className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Bottom teal line */}
        <div className="h-px bg-primary_color w-full" />
      </div>


    </section>
  )
}

export default GeneralHeader
