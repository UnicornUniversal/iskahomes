"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  FaHome,
  FaCogs,
  FaSearch,
  FaHandshake,
  FaBuilding,
  FaCity,
  FaUsers,
  FaSitemap,
  FaInfoCircle,
  FaUserPlus,
  FaSignInAlt,
  FaEnvelope,
  FaBars,
  FaTimes,
  FaUser,
  FaSignOutAlt,
  FaChevronDown,
} from "react-icons/fa";

/* ── Nav link data ─────────────────────────────────────── */
const leftLinks = [
  {
    name: "All Services", href: "/home/allServices", icon: FaCogs,
    children: [
      { name: "Virtual Tour", href: "/home/allServices?service=virtual-tour" },
      { name: "3D Visualization", href: "/home/allServices?service=3d-visualization" },
      { name: "Interior Design", href: "/home/allServices?service=interior-design" },
      { name: "Smart Home Installation", href: "/home/allServices?service=smart-home-installation" },
      { name: "Space Planning Consultation", href: "/home/allServices?service=space-planning" },
    ],
  },
  { name: "Explore Properties", href: "/home/exploreProperties", icon: FaSearch },
  { name: "Developers", href: "/home/allDevelopers", icon: FaBuilding },
  { name: "All Developments", href: "/home/allDevelopments", icon: FaCity },
];

const rightLinks = [
  { name: "Agencies", href: "/home/allAgencies", icon: FaSitemap },
  { name: "Agents", href: "/home/allAgents", icon: FaUsers },
  { name: "About Us", href: "/home/aboutUs", icon: FaInfoCircle },
  { name: "Contact Us", href: "/home/contactUs", icon: FaEnvelope },
];

/* ── Dropdown wrapper ──────────────────────────────────── */
const Dropdown = ({ trigger, children, align = "left" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div
      ref={ref}
      style={{ position: "relative" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div onClick={() => setOpen((v) => !v)} style={{ cursor: "pointer" }}>
        {trigger}
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            [align]: 0,
            paddingTop: 4,
            zIndex: 100,
          }}
        >
          <div
            style={{
              minWidth: 160,
              background: "#fff",
              borderRadius: 8,
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              padding: "6px 0",
            }}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

const DropdownItem = ({ href, children, onClick }) => (
  <Link href={href} onClick={onClick}>
    <div
      className="text-primary_color"
      style={{
        padding: "10px 20px",
        fontSize: "0.8rem",
        fontWeight: 400,
        cursor: "pointer",
        transition: "background 0.2s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(23,99,124,0.06)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </div>
  </Link>
);

const MenuTrigger = () => (
  <span
    className="text-primary_color"
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 38,
      height: 38,
      cursor: "pointer",
    }}
  >
    <FaBars size={20} />
  </span>
);

/* ── Profile icon SVG ──────────────────────────────────── */
const ProfileIcon = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="2" />
    <circle cx="20" cy="15" r="6" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 34c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

/* ══════════════════════════════════════════════════════════
   NAV COMPONENT
   ══════════════════════════════════════════════════════════ */
const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  /* ── Dashboard link helper ─────────────────────────── */
  const getDashboardLink = () => {
    if (!user) return "/";
    const slug = user.profile?.slug || user.id;
    const orgSlug = user.profile?.organization_slug || slug;
    switch (user.user_type) {
      case "developer": return `/developer/${slug}/dashboard`;
      case "property_seeker": return `/propertySeeker/${slug}/dashboard`;
      case "agent": return `/agents/${slug}/dashboard`;
      case "agency": return `/agency/${slug}/dashboard`;
      case "team_member":
        return user.profile?.organization_type === "agency"
          ? `/agency/${orgSlug}/dashboard`
          : `/developer/${orgSlug}/dashboard`;
      default: return "/";
    }
  };

  const linkStyle = {
    fontSize: "0.82rem",
    fontWeight: 400,
    cursor: "pointer",
    transition: "opacity 0.2s",
    whiteSpace: "nowrap",
    textDecoration: "none",
  };

  /* ── Render a nav link (desktop) ───────────────────── */
  const NavLink = ({ item }) => {
    if (item.children) {
      return (
        <Dropdown
          trigger={
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Link href={item.href}>
                <span
                  className="text-primary_color"
                  style={linkStyle}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  {item.name}
                </span>
              </Link>
              <span className="text-primary_color" style={{ display: "flex", alignItems: "center" }}>
                <FaChevronDown size={10} />
              </span>
            </div>
          }
        >
          {item.children.map((child) => (
            <DropdownItem key={child.name} href={child.href}>
              {child.name}
            </DropdownItem>
          ))}
        </Dropdown>
      );
    }
    return (
      <Link href={item.href}>
        <span
          className="text-primary_color"
          style={linkStyle}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {item.name}
        </span>
      </Link>
    );
  };

  /* ── Profile / auth section (desktop) ──────────────── */
  const AuthSection = () => {
    if (loading) {
      return (
        <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary_color" />
        </div>
      );
    }

    if (user) {
      return (
        <Link href={getDashboardLink()}>
          <span
            className="text-primary_color"
            style={{ ...linkStyle, display: "flex", alignItems: "center", gap: 6 }}
          >
            <ProfileIcon size={32} />
          </span>
        </Link>
      );
    }

    return (
      <Dropdown
        align="right"
        trigger={
          <span className="text-primary_color" style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <ProfileIcon size={32} />
          </span>
        }
      >
        <DropdownItem href="/home/signup">Sign Up</DropdownItem>
        <DropdownItem href="/home/signin">Login</DropdownItem>
      </Dropdown>
    );
  };

  /* ════════════════════════════════════════════════════════
     DESKTOP NAVBAR
     ════════════════════════════════════════════════════════ */

  return (
    <>
      {/* ── DESKTOP NAV ──────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2000,
          transition: "all 0.35s ease",
          ...(scrolled
            ? {
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                borderBottom: "1px solid rgba(255,255,255,0.35)",
                boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
              }
            : {
                background: "transparent",
              }),
        }}
        className="hidden md:block"
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: scrolled ? "10px 32px" : "18px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            transition: "padding 0.4s ease",
            position: "relative",
          }}
        >
          {/* Left links — fade out when not scrolled on initial, show always when scrolled */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              flex: scrolled ? "0 0 auto" : 1,
              justifyContent: "flex-start",
              opacity: scrolled ? 0 : 1,
              maxWidth: scrolled ? 0 : 600,
              overflow: scrolled ? "hidden" : "visible",
              transition: "opacity 0.35s ease, max-width 0.4s ease, flex 0.4s ease",
              pointerEvents: scrolled ? "none" : "auto",
            }}
          >
            {leftLinks.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </div>

          {/* Logo — centered initially, slides left when scrolled */}
          <Link
            href="/"
            style={{
              flexShrink: 0,
              margin: scrolled ? "0 0" : "0 60px",
              transition: "margin 0.4s ease",
              order: scrolled ? -1 : 0,
            }}
          >
            <img
              src="/ISKA Logo.png"
              alt="Iska Homes"
              style={{
                height: scrolled ? 34 : 38,
                width: "auto",
                transition: "height 0.4s ease",
              }}
            />
          </Link>

          {/* Right links + profile — always visible, expands when scrolled */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: scrolled ? 22 : 28,
              flex: 1,
              justifyContent: scrolled ? "flex-end" : "flex-end",
              transition: "gap 0.4s ease, justify-content 0.4s ease",
            }}
          >
            {/* Initial state shows right links inline; scrolled state collapses all nav links into a hamburger menu */}
            {!scrolled && rightLinks.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}

            {scrolled && (
              <Dropdown
                align="right"
                trigger={<MenuTrigger />}
              >
                <div>
                  {[...leftLinks, ...rightLinks].map((item) => (
                    <React.Fragment key={`desktop-menu-${item.name}`}>
                      <DropdownItem href={item.href}>
                        {item.name}
                      </DropdownItem>
                      {item.children?.map((child) => (
                        <DropdownItem key={`desktop-menu-${child.name}`} href={child.href}>
                          <span style={{ paddingLeft: 12, fontSize: '0.78rem', opacity: 0.75 }}>{child.name}</span>
                        </DropdownItem>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </Dropdown>
            )}
          </div>

          {/* Profile icon — far right, with left padding to separate from links */}
          <div
            style={{
              flexShrink: 0,
              paddingLeft: scrolled ? 24 : 16,
              transition: "padding-left 0.4s ease",
            }}
          >
            <AuthSection />
          </div>
        </div>
      </nav>

      {/* ── MOBILE NAV ───────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2000,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
        className="md:hidden"
      >
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
          <Link href="/" onClick={closeMobile}>
            <img src="/ISKA Logo.png" alt="Iska Homes" style={{ height: 36, width: "auto" }} />
          </Link>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="text-primary_color"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}
          >
            {mobileOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
          </button>
        </div>

        {/* Slide-down panel */}
        <div
          style={{
            maxHeight: mobileOpen ? "calc(100vh - 60px)" : 0,
            overflow: "hidden",
            transition: "max-height 0.35s ease",
          }}
        >
          <div style={{ padding: "8px 16px 24px", overflowY: "auto", maxHeight: "calc(100vh - 60px)" }}>
            {/* All nav links */}
            {[...leftLinks, ...rightLinks].map((item) => (
              <div key={item.name}>
                <Link href={item.href} onClick={closeMobile}>
                  <div
                    className="text-primary_color"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px 8px",
                      fontSize: "1rem",
                      fontWeight: 400,
                      borderBottom: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    <item.icon size={18} />
                    <span>{item.name}</span>
                  </div>
                </Link>
                {/* Nested children */}
                {item.children?.map((child) => (
                  <Link href={child.href} key={child.name} onClick={closeMobile}>
                    <div
                      className="text-primary_color/70"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 8px 12px 36px",
                        fontSize: "0.9rem",
                        fontWeight: 400,
                        borderBottom: "1px solid rgba(0,0,0,0.03)",
                      }}
                    >
                      {child.icon && <child.icon size={16} />}
                      <span>{child.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ))}

            {/* Auth section */}
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary_color" />
                </div>
              ) : user ? (
                <Link href={getDashboardLink()} onClick={closeMobile}>
                  <div
                    className="bg-primary_color"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 16px",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    <FaUser size={16} />
                    <span>Welcome, {user.profile?.name || user.email}</span>
                  </div>
                </Link>
              ) : (
                <>
                  <Link href="/home/signup" onClick={closeMobile}>
                    <div
                      className="bg-primary_color"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        justifyContent: "center",
                        padding: "12px 16px",
                        borderRadius: 8,
                        color: "#fff",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                      }}
                    >
                      <FaUserPlus size={16} />
                      <span>Sign Up</span>
                    </div>
                  </Link>
                  <Link href="/home/signin" onClick={closeMobile}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        justifyContent: "center",
                        padding: "12px 16px",
                        borderRadius: 8,
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        border: "1.5px solid var(--color-primary_color)",
                      }}
                      className="text-primary_color"
                    >
                      <FaSignInAlt size={16} />
                      <span>Login</span>
                    </div>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Nav;
