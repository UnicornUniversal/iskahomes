'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const LOGO_SRC = '/aboutUsImages/white iska loguo.png'
const BACKGROUND_SRC = '/aboutUsImages/signuppic.jpg'

const AuthLayout = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full">
      {/* Fixed full-bleed background so content sits on a still image */}
      <div className="fixed inset-0">
        <Image
          src={BACKGROUND_SRC}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/65 to-black/45" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Back to home */}
        <header className="shrink-0 px-5 pt-5 sm:px-8 lg:px-12">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft
              size={18}
              className="transition-transform duration-200 group-hover:-translate-x-1"
            />
            Back to home
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16">
            {/* Branding - desktop only */}
            <div className="hidden lg:flex flex-1 items-center justify-center">
              <div className="auth-logo-in relative flex items-center justify-center">
                <span
                  aria-hidden="true"
                  className="auth-logo-glow pointer-events-none absolute h-[320px] w-[320px] rounded-full blur-2xl"
                />
                <Image
                  src={LOGO_SRC}
                  alt="ISKA Homes"
                  width={400}
                  height={400}
                  priority
                  className="auth-logo-img relative w-full max-w-[200px] xl:max-w-[230px] h-auto object-contain drop-shadow-2xl"
                />
              </div>
            </div>

            {/* Card + its own footer, stacked so they can never overlap */}
            <div className="w-full lg:flex-1 flex flex-col items-center">
              <div className="w-full max-w-[440px] bg-white shadow-2xl p-6 sm:p-8">
                {children}
              </div>

              <AuthFooter />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

const AuthFooter = () => (
  <footer className="w-full max-w-[440px] mt-6 text-center">
    <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
      <Link
        href="/home/privacyPolicy"
        className="text-xs text-white/70 hover:text-white transition-colors"
      >
        Privacy Policy
      </Link>
      <span className="h-1 w-1 rounded-full bg-white/30" />
      <Link
        href="/home/termsOfService"
        className="text-xs text-white/70 hover:text-white transition-colors"
      >
        Terms of Service
      </Link>
      <span className="h-1 w-1 rounded-full bg-white/30" />
      <Link
        href="/home/cookiePolicy"
        className="text-xs text-white/70 hover:text-white transition-colors"
      >
        Cookie Policy
      </Link>
    </nav>
    <p className="mt-2 text-xs text-white/50">
      © {new Date().getFullYear()} ISKA Homes. All Rights Reserved.
    </p>
  </footer>
)

export default AuthLayout
