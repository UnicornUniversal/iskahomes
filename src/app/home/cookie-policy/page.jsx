export const metadata = {
  title: 'Cookie Policy | Iska Homes',
}

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-[#17637C] mb-6">Cookie Policy</h1>
        <p className="text-gray-700 mb-8">
          This Cookie Policy explains how Iska Homes uses cookies and similar technologies on our website.
        </p>

        <section className="space-y-6 text-gray-700 leading-7">
          <div>
            <h2 className="text-xl font-semibold text-[#17637C] mb-2">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files stored on your device that help websites remember preferences and improve
              your browsing experience.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#17637C] mb-2">2. How We Use Cookies</h2>
            <p>
              We use cookies for authentication, session management, analytics, and improving website performance.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#17637C] mb-2">3. Types of Cookies</h2>
            <p>
              We may use essential cookies, performance cookies, and functionality cookies to ensure core features and
              improve usability.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#17637C] mb-2">4. Managing Cookies</h2>
            <p>
              You can manage cookie settings from your browser. Disabling some cookies may affect the platform
              functionality.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
