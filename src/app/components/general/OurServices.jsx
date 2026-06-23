'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ISKA_SERVICES } from '@/lib/services'

const OurServices = () => {
  return (
    <section className="w-full px-4 md:px-8 py-14">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-primary_color/60 mb-2">
            What We Offer
          </p>
          <h2 className="heading_title font-medium text-left">Our Services</h2>
        </div>

        <Link
          href="/home/allServices"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary_color hover:text-primary_color/80 transition-colors"
        >
          View all services
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {ISKA_SERVICES.map((service) => {
          const Icon = service.icon

          return (
            <Link
              key={service.id}
              href={service.href}
              className="group flex h-full flex-col overflow-hidden border border-primary_color/10 bg-white transition-all duration-300 hover:border-primary_color/30 hover:shadow-lg"
            >
              <div className="relative h-44 overflow-hidden bg-primary_color/5">
                <img
                  src={service.image}
                  alt={service.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary_color/70 via-primary_color/10 to-transparent" />

                <div className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-md bg-white/90 backdrop-blur-sm shadow-sm">
                  <Icon className="h-5 w-5 text-primary_color" />
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-semibold text-primary_color mb-2 line-clamp-2">
                  {service.name}
                </h3>
                <p className="text-sm text-primary_color/70 leading-relaxed line-clamp-3 flex-1">
                  {service.shortDescription}
                </p>

                <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary_color group-hover:gap-3 transition-all">
                  Learn more
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default OurServices
