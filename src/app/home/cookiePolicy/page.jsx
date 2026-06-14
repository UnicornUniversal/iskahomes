'use client'

import React from 'react'

const cookieTypes = [
  {
    name: 'Required Cookies',
    description: 'These cookies are necessary to enable the basic features of this Site to function, such as identifying you as a valid user, ensuring that no one else can sign on simultaneously with your account from another computer and helping us serve you better based on your registration preferences. These cookies may also be used to remember and honor your cookie preferences via our cookie preference center.',
  },
  {
    name: 'Functional Cookies',
    description: 'These cookies allow us to analyze your use of the Site to evaluate and improve our performance. They may also be used to provide a better customer experience on this Site. For example, providing us information about how our Site is used and helping us facilitate any promotions or surveys that we provide.',
  },
  {
    name: 'Advertising Cookies',
    description: 'These cookies may be used to share data with advertisers so that the ads you see on our Site or on third-party websites are more relevant to you, allow you to share certain pages with social networks, or allow you to post comments on our Site.',
  },
]

export default function CookiePolicyPage() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '60px 5% 40px' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '56%', height: '100%',
          background: 'linear-gradient(to right, rgba(23,99,124,0.12) 0%, rgba(23,99,124,0.06) 40%, transparent 100%)',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <h1
          className="font-medium text-primary_color tracking-tight"
          style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', margin: 0, lineHeight: 1.1, position: 'relative', zIndex: 1 }}
        >
          Cookie Policy
        </h1>
        <p style={{ marginTop: 16, fontSize: 14, color: '#17637C', opacity: 0.7, position: 'relative', zIndex: 1, maxWidth: 600, lineHeight: 1.7 }}>
          How ISKA Homes uses cookies and similar technologies on our platform.
        </p>
      </section>

      <div style={{ height: 1, background: '#17637C', opacity: 0.12, margin: '0 5%' }} />

      {/* What is a Cookie */}
      <section style={{ padding: '40px 5%', maxWidth: 900 }}>
        <h2 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)', fontWeight: 600, color: '#17637C', marginBottom: 16 }}>
          What is a Cookie?
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.9, color: '#334155' }}>
          A cookie is a small text file that a website stores on your personal computer, telephone or any other device, with information about your navigation on that website. Cookies serve various purposes such as allowing you to navigate between pages efficiently, remembering your preferences, analyzing the use of our Site, generally improving the user experience, and ensuring that the advertisements you see online are more relevant to you and your interests.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.9, color: '#334155', marginTop: 14 }}>
          A cookie contains the name of the server it came from, the expiry of the cookie, a value, usually a randomly generated unique number as well as other data relating to your use of our Site. Depending on the applicable data protection law such information and data may qualify as personal information.
        </p>
      </section>

      {/* How Cookies Are Used */}
      <section style={{ padding: '0 5%', maxWidth: 900 }}>
        <h2 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)', fontWeight: 600, color: '#17637C', marginBottom: 16 }}>
          Cookies Used by Us and How They Are Used
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.9, color: '#334155', marginBottom: 12 }}>
          We use session cookies, which are temporary cookies that are erased from your device&apos;s memory when you close your Internet browser or turn your computer off, and persistent cookies, which are stored on your device until they expire, unless you delete them before that time.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.9, color: '#334155', marginBottom: 20 }}>
          We group cookies on our site into three categories. We use these cookies to:
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'Ensure our websites work properly',
            'Understand how it\'s used',
            'Personalize your experience',
            'Tailor ads to your interests',
            'Measure the effectiveness of our marketing efforts',
          ].map((item, i) => (
            <li key={i} style={{ fontSize: 14, lineHeight: 1.7, color: '#334155', paddingLeft: 20, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 4, top: 8, width: 5, height: 5, borderRadius: '50%', background: '#F68B1F' }} />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Cookie Types */}
      <section style={{ padding: '20px 5% 40px', maxWidth: 900 }}>
        <h2 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)', fontWeight: 600, color: '#17637C', marginBottom: 24 }}>
          Types of Cookies We Collect
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {cookieTypes.map((cookie, i) => (
            <div
              key={i}
              style={{
                border: '1px solid rgba(23,99,124,0.1)',
                borderRadius: 12,
                padding: '24px 28px',
                background: 'rgba(23,99,124,0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: i === 0 ? '#17637C' : i === 1 ? '#F68B1F' : '#94a3b8',
                  flexShrink: 0,
                }} />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#17637C', margin: 0 }}>
                  {cookie.name}
                </h3>
                {i === 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
                    background: '#17637C', color: '#fff', padding: '2px 8px', borderRadius: 4,
                  }}>
                    Always Active
                  </span>
                )}
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: '#334155', margin: 0 }}>
                {cookie.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Your Cookie Preferences */}
      <section style={{ padding: '0 5% 60px', maxWidth: 900 }}>
        <h2 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)', fontWeight: 600, color: '#17637C', marginBottom: 16 }}>
          Your Cookie Preferences
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.9, color: '#334155' }}>
          You can choose which types of cookies to allow. To do this please click on &quot;Cookie Preferences&quot; at the bottom of the website. This takes you to the preference page where you can select each cookie category to learn more and manage your preferences. Some cookies are required for the website to work properly and cannot be turned off.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.9, color: '#334155', marginTop: 14 }}>
          On mobile devices, you can limit interest-based ads through your device settings, such as &quot;Limit Ad Tracking&quot; on iOS or &quot;Opt out of interest-based ads&quot; on Android. Keep in mind that these choices apply only to the browser or device you use. If you switch browsers, use a new device, or clear your cookies, you&apos;ll need to update your settings again.
        </p>
      </section>
    </div>
  )
}
