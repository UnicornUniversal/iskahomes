export const metadata = {
  title: 'Terms of Agreement | Iska Homes',
}

export default function TermsOfAgreementPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-[#17637C] mb-6">Terms of Agreement</h1>
        <p className="text-gray-700 mb-8">
          These Terms of Agreement govern your use of Iska Homes. By creating an account or using the platform,
          you agree to these terms.
        </p>

        <section className="space-y-6 text-gray-700 leading-7">
          <div>
            <h2 className="text-xl font-semibold text-[#17637C] mb-2">1. Account Responsibility</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activity
              under your account.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#17637C] mb-2">2. Acceptable Use</h2>
            <p>
              You agree not to use the platform for unlawful activities, misleading listings, or any content that
              violates applicable laws and regulations.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#17637C] mb-2">3. Listings and Content</h2>
            <p>
              You are solely responsible for the information, media, and details you publish. Iska Homes may remove
              content that violates policy or legal requirements.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#17637C] mb-2">4. Service Availability</h2>
            <p>
              We aim to keep services available, but we do not guarantee uninterrupted access at all times.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#17637C] mb-2">5. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the platform after updates means you
              accept the revised terms.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
