import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="w-full bg-[#F7F6F2] pt-16 pb-6">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        {/* Top Section - 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-16">
          
          {/* Column 1: Brand & Tagline */}
          <div className="flex flex-col gap-6 lg:pr-10">
            <Link href="/" className="inline-block relative h-16 w-48">
              <Image 
                src="/iska-dark.png" 
                alt="ISKA HOMES Logo" 
                fill
                style={{ objectFit: 'contain', objectPosition: 'left' }}
                priority
              />
            </Link>
            <p className="text-[#6B7280] text-sm leading-relaxed max-w-sm">
              We believe real estate is more than just transactions — it's about creating opportunities and building futures.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="flex flex-col gap-5">
            <h3 className="text-[#17637C] font-semibold text-lg">Quick Links</h3>
            <ul className="flex flex-col gap-4">
              <li>
                <Link href="/home/allServices" className="text-[#6B7280] hover:text-[#17637C] transition-colors text-sm">
                  All Services
                </Link>
              </li>
              <li>
                <Link href="/home/exploreProperties" className="text-[#6B7280] hover:text-[#17637C] transition-colors text-sm">
                  Explore Properties
                </Link>
              </li>
              <li>
                <Link href="/home/allDevelopers" className="text-[#6B7280] hover:text-[#17637C] transition-colors text-sm">
                  Developers
                </Link>
              </li>
              <li>
                <Link href="/home/aboutUs" className="text-[#6B7280] hover:text-[#17637C] transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/home/contactUs" className="text-[#6B7280] hover:text-[#17637C] transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="flex flex-col gap-5">
            <h3 className="text-[#17637C] font-semibold text-lg">Company</h3>
            <ul className="flex flex-col gap-4">
              <li>
                <Link href="/faqs" className="text-[#6B7280] hover:text-[#17637C] transition-colors text-sm">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-[#6B7280] hover:text-[#17637C] transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="text-[#6B7280] hover:text-[#17637C] transition-colors text-sm">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/home/terms-of-service" className="text-[#6B7280] hover:text-[#17637C] transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div className="flex flex-col gap-5">
            <h3 className="text-[#17637C] font-semibold text-lg">Contact Info</h3>
            <ul className="flex flex-col gap-4">
              <li className="text-[#6B7280] text-sm leading-relaxed">
                Child Street, Spintex<br />
                No FHP 25
              </li>
              <li className="text-[#6B7280] text-sm">
                0302318132
              </li>
              <li>
                <a href="mailto:info@iskaglobal.com" className="text-[#6B7280] hover:text-[#17637C] transition-colors text-sm">
                  info@iskaglobal.com
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider & Bottom Bar */}
        <div className="border-t border-[#17637C]/20 pt-6 mt-8 flex justify-center items-center">
          <p className="text-[#6B7280] text-sm">
            © 2026 ISKA Homes, All Right Reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
