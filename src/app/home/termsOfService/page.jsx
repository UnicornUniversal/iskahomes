'use client'

import React from 'react'

const sections = [
  {
    title: '1. Introduction and Acceptance of Terms',
    content: 'Welcome to ISKA Homes. These Terms of Service ("Terms") govern your use of our premium real estate platform, services, and content. By accessing or using our website, mobile applications, or any of our services (collectively, "the Platform"), you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Platform.',
  },
  {
    title: '2. About ISKA Homes and Our Services',
    content: 'ISKA Homes is a premium real estate platform and property marketing company focused on connecting verified developers, agencies, and landowners with property seekers globally. Our services include publishing vetted property listings, generating high\u2011quality leads for our partners, and delivering comprehensive marketing campaigns that enhance property visibility. We do not act as a real estate agent or broker. Instead, we provide an online marketplace that bridges credible supply and qualified demand while maintaining a strict zero\u2011tolerance policy for unverified or speculative properties.',
  },
  {
    title: '3. Eligibility and Account Registration',
    content: 'To use certain features of the Platform, you may need to create an account and provide accurate, current information about yourself or your organisation. You must be at least 18 years old, of legal capacity, and have the authority to enter into these Terms. You agree to keep your login credentials secure and notify us immediately of any unauthorised access to your account. ISKA Homes reserves the right to decline or terminate accounts in the event of inaccurate information, suspected fraud, or breach of these Terms.',
  },
  {
    title: '4. Verified Listings and Content Standards',
    content: 'ISKA Homes maintains a strict zero\u2011tolerance policy for unverified or speculative properties. All listings on the Platform must undergo our verification process, which includes review of ownership documents, land titles, and compliance with Ghanaian laws. We reserve the right to remove any listing that is incomplete, misleading, unlawful, or fails to meet our standards. By submitting content, you grant ISKA Homes a non\u2011exclusive, royalty\u2011free licence to use, reproduce, and display that content for the purpose of marketing the property.',
  },
  {
    title: '5. User Obligations and Conduct',
    intro: 'You agree to use the Platform only for lawful purposes and in accordance with these Terms. You will not:',
    bullets: [
      'Post or share material that is illegal, offensive, defamatory, or infringes any third\u2011party rights.',
      'Upload false or misleading information about a property or your identity.',
      'Attempt to circumvent our verification processes or contact leads outside of ISKA Homes to avoid marketing fees.',
      'Introduce viruses, malware, or any other harmful code.',
      'Engage in any conduct that interferes with the proper functioning of the Platform or the experience of other users.',
    ],
  },
  {
    title: '6. Exclusive Leads and Marketing Fees',
    content: 'ISKA Homes operates as the exclusive listing partner for properties registered on the Platform. We generate and distribute high\u2011intent leads to our partners. Developers and agencies agree to pay the applicable marketing fees for our promotional efforts as set out in the written agreements or fee schedules provided to you. These fees are payable regardless of whether a transaction completes, provided we have delivered qualified leads in accordance with our service commitments.',
  },
  {
    title: '7. Payments and Transactions',
    content: 'Payments for the purchase, lease, or rental of a property are handled directly between the buyer and the developer, agency, or landowner. ISKA Homes does not act as a payment processor or hold deposits on behalf of either party. You acknowledge that ISKA Homes is not a party to any transaction concluded as a result of using our Platform and cannot be held responsible for any disputes arising from property transactions.',
  },
  {
    title: '8. Data Privacy and Protection',
    content: 'ISKA Homes respects your privacy and processes personal data in accordance with Ghana\u2019s Data Protection Act, 2012 (Act 843). We collect only the information necessary to provide our services, such as contact details from property seekers and developers, and implement appropriate technical and organisational safeguards to secure this data. We register with the Data Protection Commission and recognise the rights of individuals to be informed, to access and correct their data, to object to certain forms of processing, to withdraw consent, and to lodge complaints. The Platform includes an audit trail/logging system that captures user interactions. This log is accessible only to designated system administrators for compliance and security purposes, ensuring transparency and accountability in data handling.',
  },
  {
    title: '9. Anti\u2011Circumvention and Exclusivity',
    content: 'By using ISKA Homes, developers, agencies, and landowners agree not to circumvent or bypass the Platform to avoid paying marketing fees or to engage directly with leads provided by us. You agree not to solicit or accept offers from property seekers obtained through ISKA Homes outside of the Platform. If a property seeker initiates contact with you via ISKA Homes, you must process all communications and transactions through our platform for the duration specified in your agreement. This ensures fair compensation for our services and the integrity of our marketplace.',
  },
  {
    title: '10. Intellectual Property Rights',
    content: 'All content and materials available on the Platform, including text, photographs, graphics, logos, audio, video, and software, are owned by ISKA Homes or our licensors and are protected by intellectual property laws. You may not reproduce, distribute, modify, transmit, or use our content without prior written consent, except as permitted under these Terms. You retain ownership of content you submit; however, by providing your content, you grant ISKA Homes a licence to use it in connection with marketing your property.',
  },
  {
    title: '11. Termination',
    content: 'ISKA Homes may terminate or suspend your access to the Platform at any time, with or without cause, and without notice. Reasons for termination include (but are not limited to) breach of these Terms, failure to pay applicable fees, provision of false information, and behaviour that compromises our Platform or reputation. You may also terminate your account by sending a written notice to ISKA Homes. All obligations incurred prior to termination, such as payment of marketing fees, remain in force.',
  },
  {
    title: '12. Disclaimers',
    content: 'Our Platform and services are provided "as is" and "as available" without warranties of any kind. While we aim to verify all listings and provide accurate information, we do not guarantee the accuracy, completeness, or reliability of any property listing or third\u2011party content. ISKA Homes disclaims all warranties, whether express or implied, including, but not limited to, warranties of merchantability, fitness for a particular purpose, and non\u2011infringement.',
  },
  {
    title: '13. Limitation of Liability',
    content: 'To the extent permitted by law, ISKA Homes, its directors, officers, employees, and agents will not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Platform. Our total liability for any claims arising from or related to these Terms will not exceed the amount of marketing fees you have paid us in the twelve months preceding the event giving rise to the claim.',
  },
  {
    title: '14. Indemnification',
    content: 'You agree to indemnify, defend, and hold harmless ISKA Homes and its affiliates from any claims, liabilities, damages, losses, costs, or expenses (including reasonable legal fees) arising out of or related to your use of the Platform, your breach of these Terms, or your violation of any rights of another person or entity.',
  },
  {
    title: '15. Governing Law and Dispute Resolution',
    content: 'These Terms are governed by and construed in accordance with the laws of the Republic of Ghana. In the event of a dispute, you agree to first attempt to resolve the matter informally with ISKA Homes. If the dispute cannot be resolved amicably, it shall be submitted to arbitration in Ghana in accordance with the rules of the Ghana Arbitration Centre, and the decision of the arbitrator(s) shall be final and binding.',
  },
  {
    title: '16. Modifications to the Terms',
    content: 'ISKA Homes reserves the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on our Platform or by other reasonable means. Your continued use of the Platform after such changes constitutes your acceptance of the updated Terms.',
  },
  {
    title: '17. Miscellaneous Provisions',
    content: 'These Terms constitute the entire agreement between you and ISKA Homes regarding your use of the Platform. If any provision is found to be unenforceable, the remaining provisions will remain in full force. ISKA Homes may assign its rights under these Terms without your consent. You may not assign your rights or obligations without our prior written consent. Failure by ISKA Homes to enforce any right or provision of these Terms will not constitute a waiver.',
  },
  {
    title: '18. Contact Information',
    content: 'If you have questions or concerns about these Terms or any aspect of the ISKA Homes Platform, please contact our support team via email at support@iskahomes.com or by mail at our registered office in Accra, Ghana.',
  },
]

export default function TermsOfServicePage() {
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
          Terms of Service
        </h1>
        <p style={{ marginTop: 16, fontSize: 14, color: '#17637C', opacity: 0.7, position: 'relative', zIndex: 1, maxWidth: 600, lineHeight: 1.7 }}>
          The terms and conditions governing your use of the ISKA Homes platform.
        </p>
      </section>

      <div style={{ height: 1, background: '#17637C', opacity: 0.12, margin: '0 5%' }} />

      {/* Sections */}
      <div style={{ padding: '40px 5% 60px', maxWidth: 900 }}>
        {sections.map((section, i) => (
          <section key={i} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)', fontWeight: 600, color: '#17637C', marginBottom: 16 }}>
              {section.title}
            </h2>

            {section.intro && (
              <p style={{ fontSize: 14, lineHeight: 1.9, color: '#334155', marginBottom: 14 }}>
                {section.intro}
              </p>
            )}

            {section.content && (
              <p style={{ fontSize: 14, lineHeight: 1.9, color: '#334155' }}>
                {section.content}
              </p>
            )}

            {section.bullets && (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {section.bullets.map((bullet, j) => (
                  <li key={j} style={{ fontSize: 14, lineHeight: 1.9, color: '#334155', paddingLeft: 20, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, top: 10, width: 6, height: 6, borderRadius: '50%', background: '#F68B1F' }} />
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
