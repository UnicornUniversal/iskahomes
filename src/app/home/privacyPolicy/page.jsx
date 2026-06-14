'use client'

import React from 'react'

const sections = [
  {
    title: '1. Your Acceptance Through Use',
    content: `This Global Privacy Notice describes how ISKA Homes collects, uses and discloses certain personal information obtained through this Site, your interactions with us on social media, and other professional interactions with you. Please note that, to the extent permitted by the laws of Ghana, your use of this Site signifies your understanding and acceptance of the terms of this Privacy Notice.`,
  },
  {
    title: '2. Personal Data We Collect From You',
    intro: `In this Privacy Notice, "personal data" refers to information that identifies, relates to, describes, or can reasonably be associated or linked, directly or indirectly, with an individual or institution. This does not include aggregated or de-identified data that cannot reasonably be connected to you or any other individual.

Depending on how you interact with ISKA Homes, you may be a data subject as a user of our Site or as a business contact of ISKA Homes having a professional interaction with ISKA Homes, such as a developer, agency, agent or consultant. Depending on your use of the Site and Professional Interactions with ISKA Homes, we may collect and process the following types of personal information from you.`,
    bullets: [
      { label: 'Contact Information', text: 'Such as your name, postal or e-mail address, and phone number.' },
      { label: 'Account Registration and Profile', text: 'When you create an account through our services or complete an ISKA Homes profile, we collect account identifiers such as your email address, username, password, and internal identifiers assigned to your account to help our systems link information across different databases. We may associate your profile details with other information related to your use of our websites and services, including account history and records such as the services you use or interact with, account creation details, login activity, account status, transactions, communications related to our services, and your activity on our websites and mobile applications.' },
      { label: 'Communications and Enquiry', text: 'When you contact us, submit a form, inquiry, or question (such as through a web form), or communicate with us by phone or chat, we collect and store your contact details, account identifiers and history, and any other personal data or content you choose to share. This may include recordings or transcripts of phone calls or chat interactions, where permitted by law.' },
      { label: 'GPS and Precise Geolocation Data', text: 'We may collect information about your device\'s location, such as data inferred from your device or browser, including its IP address. With your permission, we may also collect more precise location information, such as GPS latitude and longitude, through your device or browser settings when you choose to enable location sharing.' },
      { label: 'Communication by Email and Newsletters', text: 'Many of our websites and online services allow you to sign up for newsletters and email updates by providing your email address. We use your email to share information about our services and updates from ISKA Global, which may include marketing messages.' },
      { label: 'Payment Information', text: 'We and our third-party service providers collect information related to your transactions with us, including details of payments made through our websites or apps. Payment information, such as credit card or bank account details, is processed and stored by third-party payment providers; we do not store this information ourselves.' },
    ],
  },
  {
    title: '3. Data We Gather During Your Use of Our Services',
    content: `Like most online platforms, our third-party service providers and we automatically collect certain information when you use our websites or other online services. This can include things like your home search history, the homes you view, your clicks, purchase activity, and the amount of time you spend on different parts of our sites. We collect this information using technologies like cookies (small files stored on your device), and other tools such as web beacons, pixels, embedded scripts, mobile software tools, location technologies, and logging systems.`,
    bullets: [
      { text: 'Information about how you use our services, including the website you visited before arriving at our site and the site you go to after leaving, how often you use our services, when you open emails or click links in them, your location when accessing our services, whether you use multiple devices, and other actions you take while using our services.' },
      { text: 'Information about what you do on our services, like which pages you visit, what links or ads you click, what homes you look at, and any purchases or checkout activity.' },
      { text: 'Information about the device you use, like your IP address, browser, internet provider, device type and model, operating system, the time and date you use our services, and unique IDs for your device or account (referred to as "Log Data").' },
      { text: 'Analytics data in the form of information about your activity when using our websites or apps, such as clicks, mouse movements, forms you complete, and similar actions.' },
      { text: 'Consent when given, such as agreeing to receive calls or text messages with promotional content, allows us to collect additional information, like your IP address and the time you gave consent.' },
    ],
    usage: [
      'Remember your information so you don\'t have to re-enter it during your visit or on future visits.',
      'Provide personalized content and recommendations.',
      'Identify and connect you across multiple devices.',
      'Deliver and track the effectiveness of our services.',
      'Analyze usage patterns.',
      'Diagnose or fix technical issues.',
      'Detect or prevent fraud or harmful activity.',
      'Plan and improve our services overall.',
    ],
  },
  {
    title: '4. Data We Obtain from Other Sources',
    bullets: [
      { label: 'Affiliates', text: 'We may receive information about you from other ISKA Global companies, brands, and affiliated entities. This allows information you provide to one part of our company to be used by other parts to better deliver services and communicate with you.' },
      { label: 'Authentication Services', text: 'We use single sign-on options that let you log in using third-party accounts like Apple, Facebook, or Google. When you do, these services verify your identity and may share personal information with us, such as your name and email.' },
      { label: 'Business Partners', text: 'Our business partners, including agent partners, lenders, builders, property managers, and other real estate professionals, collect personal data related to their services and may share some or all of it with us.' },
      { label: 'Service Providers', text: 'Service providers, such as payment processors and marketing providers, often collect and share personal data with us. This information helps us comply with legal requirements, monitor activity, prevent fraud, protect our rights and the rights of others, improve marketing and advertising, and provide and enhance our services.' },
      { label: 'Information Providers', text: 'Occasionally, we obtain information from third-party providers to correct or supplement the personal data we already have.' },
      { label: 'Publicly Available Information', text: 'We may collect personal data from publicly available sources, such as information you share on social media or that is included in public records. We use this information to verify identity, prevent fraud, conduct market research, and improve our services.' },
    ],
  },
  {
    title: '5. Other Points Of Personal Data Collection',
    bullets: [
      { label: 'Business Representatives', text: 'We collect professional personal information about representatives of third-party businesses, including those of our customers and business partners, in connection with our services and business operations. This may include contact information, professional information, tax and payment information, inquiry information, and feedback information.' },
      { label: 'Office and Event Visitors', text: 'We collect personal information about individuals who visit our offices or attend our events. This may include contact information, professional information, visit information, and security information.' },
    ],
  },
  {
    title: '6. What Your Personal Data Is Used For',
    bullets: [
      { text: 'Help us run our services every day, like assisting you in finding a home or connecting with a real estate professional or property manager.' },
      { text: 'Build and maintain our services, develop new products, and enhance existing ones.' },
      { text: 'Use collected information in aggregate to tailor our services and provide a better experience for all users.' },
      { text: 'Conduct research and analysis to understand our customers and improve our business, products, services, and overall experience.' },
      { text: 'Communicate with you for technical or administrative support.' },
      { text: 'Prevent, investigate, and respond to fraud, illegal activity, or unauthorized access to personal data and our systems.' },
      { text: 'Investigate, resolve, and enforce disputes, security issues, and our Terms of Service or other agreements.' },
      { text: 'Comply with legal requirements and government requests.' },
      { text: 'Understand your preferences and interests to better assist.' },
    ],
  },
  {
    title: '7. When and How We Disclose Personal Data',
    bullets: [
      { label: 'Within ISKA Global', text: 'To provide our products and services, ISKA Global entities may share your personal data with other ISKA Global companies. This sharing is done in ways consistent with this Privacy Notice and applicable law.' },
      { label: 'Business Partners', text: 'With your permission, we may share your personal data with our business partners, including real estate professionals such as agents, brokers, property managers, and builders, to help deliver the services you request.' },
      { label: 'Advertising and Marketing Partners', text: 'We may share certain personal data with marketing partners, including advertising networks, social media platforms, and marketing providers. This helps us communicate with you about our products and services and deliver marketing that may interest you.' },
      { label: 'Service Providers', text: 'We share personal data with third-party vendors and service providers who perform services for us. These providers are contractually limited to using your data only to perform services on our behalf.' },
      { label: 'Support for Business Operations', text: 'We share personal data with third parties who support essential business functions, like legal, accounting, and tax services.' },
      { label: 'Business Transactions or Reorganization', text: 'In the event of a corporate transaction your personal data may be shared with third parties involved in the transaction.' },
      { label: 'Legal Obligations and Rights', text: 'We may share personal data with third parties, including legal advisors and law enforcement, to establish, exercise, or defend legal claims, comply with laws, protect our rights and property, detect and prevent fraud, reduce credit risk, and meet legal requirements.' },
      { label: 'With Consent or at Your Direction', text: 'We may also share personal data with third parties or publicly if you give consent or direct us to do so.' },
    ],
  },
  {
    title: '8. How You Can Control Your Data',
    bullets: [
      { label: 'Managing Your Profile and Data Sharing', text: 'You can view and update your profile information including your username, address, or billing details, and manage certain data-sharing preferences through your account page.' },
      { label: 'Global Positioning and Device Permissions', text: 'You may choose not to share precise location information by adjusting your mobile device or browser settings or declining location prompts.' },
      { label: 'Promotional Communications via Email', text: 'You can opt out of promotional emails at any time by using the "unsubscribe" link included in those messages or by updating your preferences in your account settings. Please note that you may still receive important service-related messages.' },
      { label: 'Your Choices', text: 'You can control cookies and tracking tools by changing the settings on your browser or mobile device, such as choosing to block cookies or receive alerts when they\'re used. You can also manage your cookie settings by clicking the "Cookie Preferences" link at the bottom of our websites.' },
    ],
  },
  {
    title: '9. Data Retention',
    content: `We keep your personal information only as long as we need it to provide our services and meet legal requirements. How long we keep data depends on things like how long you have an account with us, legal or tax obligations, and the need to resolve disputes or comply with laws. When we no longer need your information, we delete it or remove details that could identify you. Some data may remain in secure backup systems for a limited time, but it is not actively used and will be deleted or de-identified when possible.`,
  },
  {
    title: '10. Data From Minors',
    content: `Our websites and online services are not meant for children under 18. We do not knowingly collect personal information from children under 18. If you are under 18, please do not use our services or share any personal information with us. If a child under 18 has given us personal information, a parent or guardian should contact us so we can remove it. If we learn that we have collected personal information from anyone under the age of 18, we will delete it as soon as possible.`,
  },
  {
    title: '11. Privacy Policy Update Notice',
    content: `We may update this Privacy Notice from time to time. If we make significant changes, we will let you know through appropriate communication methods, as required by law. Unless otherwise stated, any updates take effect when they are published.`,
  },
  {
    title: '12. Consequences of Not Providing Personal Information',
    content: `There is no statutory or contractual obligation requiring you to provide your personal information to ISKA Homes. The provision of your personal data is voluntary for you. You may choose not to provide your personal information to us, however, in this case, you may not be able to use our Sites and receive our services and/or to enable interaction with us. Also, the provision of your personal information may be necessary to allow us to perform a contract with you and/or to provide services to you.`,
  },
]

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p style={{ marginTop: 16, fontSize: 14, color: '#17637C', opacity: 0.7, position: 'relative', zIndex: 1, maxWidth: 600, lineHeight: 1.7 }}>
          How ISKA Homes collects, uses, and protects your personal information.
        </p>
      </section>

      <div style={{ height: 1, background: '#17637C', opacity: 0.12, margin: '0 5%' }} />

      {/* Intro */}
      <section style={{ padding: '40px 5%', maxWidth: 900 }}>
        <p style={{ fontSize: 14, lineHeight: 1.9, color: '#334155' }}>
          When you use ISKA Homes services to search for, buy, rent, or sell a property, or connect with a real estate professional, you place your trust in us with your personal information. We take that trust seriously and are committed to protecting your privacy. This Privacy Notice outlines the types of personal data we collect, how and why we use it, who we may share it with, how we safeguard it, and the options available to you for managing your privacy.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.9, color: '#334155', marginTop: 16 }}>
          ISKA Homes, together with its affiliates (collectively, ISKA Global), recognizes the necessity of protecting your privacy. This Notice is intended to assist you in understanding ISKA Global&apos;s data collection and handling practices and in making informed decisions and exercising your data privacy rights under applicable law.
        </p>
      </section>

      {/* Sections */}
      <div style={{ padding: '0 5% 60px', maxWidth: 900 }}>
        {sections.map((section, i) => (
          <section key={i} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)', fontWeight: 600, color: '#17637C', marginBottom: 16 }}>
              {section.title}
            </h2>

            {section.intro && (
              <p style={{ fontSize: 14, lineHeight: 1.9, color: '#334155', marginBottom: 16, whiteSpace: 'pre-line' }}>
                {section.intro}
              </p>
            )}

            {section.content && (
              <p style={{ fontSize: 14, lineHeight: 1.9, color: '#334155' }}>
                {section.content}
              </p>
            )}

            {section.bullets && (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {section.bullets.map((bullet, j) => (
                  <li key={j} style={{ fontSize: 14, lineHeight: 1.9, color: '#334155', paddingLeft: 20, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, top: 10, width: 6, height: 6, borderRadius: '50%', background: '#F68B1F' }} />
                    {bullet.label && (
                      <strong style={{ color: '#17637C' }}>{bullet.label}: </strong>
                    )}
                    {bullet.text}
                  </li>
                ))}
              </ul>
            )}

            {section.usage && (
              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#17637C', marginBottom: 10 }}>
                  This information may be used to:
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {section.usage.map((item, k) => (
                    <li key={k} style={{ fontSize: 14, lineHeight: 1.7, color: '#334155', paddingLeft: 20, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 4, top: 8, width: 4, height: 4, borderRadius: '50%', background: '#17637C', opacity: 0.4 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
