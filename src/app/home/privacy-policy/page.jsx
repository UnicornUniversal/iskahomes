export const metadata = {
  title: 'Privacy Policy | Iska Homes',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-[#17637C] mb-6">Privacy Policy</h1>
        <p className="text-gray-700 mb-8">
          This Privacy Policy explains how Iska Homes collects, uses, and protects your personal information.
        </p>

        <section className="space-y-6 text-gray-700 leading-7">
          <div>
            <h2 className="text-xl font-semibold text-[#17637C] mb-2">1. Information We Collect</h2>
            <p>
              We collect information you provide directly, such as your name, email, phone number, and profile details.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#17637C] mb-2">2. How We Use Information</h2>
            <p>
              We use your information to create and manage accounts, improve the platform, communicate with you, and
              maintain platform security.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#17637C] mb-2">3. Data Sharing</h2>
            <p>
              We do not sell personal information. We may share data with service providers or legal authorities when
              required by law.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#17637C] mb-2">4. Data Security</h2>
            <p>
              We implement reasonable technical and organizational safeguards, but no system can be fully guaranteed
              against every risk.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#17637C] mb-2">5. Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may request access, correction, or deletion of your personal data.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
