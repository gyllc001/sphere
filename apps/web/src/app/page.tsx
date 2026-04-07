import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Sphere</h1>
        <p className="text-xl text-gray-500 mb-12">
          The AI-powered marketplace connecting brands with community owners
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Brand side */}
          <div className="border border-gray-200 rounded-xl p-8 text-left hover:shadow-md transition-shadow">
            <div className="text-3xl mb-3">🏷️</div>
            <h2 className="text-xl font-semibold mb-2">For Brands</h2>
            <p className="text-gray-500 text-sm mb-6">
              Submit campaign briefs and let AI match you with the right communities. Automate negotiation and close deals fast.
            </p>
            <div className="space-y-2">
              <Link
                href="/brand/login"
                className="block w-full bg-blue-600 text-white text-center py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Sign In as Brand
              </Link>
              <Link
                href="/brand/register"
                className="block w-full border border-blue-200 text-blue-600 text-center py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-blue-50"
              >
                Create Brand Account
              </Link>
            </div>
          </div>

          {/* Community side */}
          <div className="border border-gray-200 rounded-xl p-8 text-left hover:shadow-md transition-shadow">
            <div className="text-3xl mb-3">🌐</div>
            <h2 className="text-xl font-semibold mb-2">For Community Owners</h2>
            <p className="text-gray-500 text-sm mb-6">
              List your community and receive inbound brand partnership opportunities matched by AI. Accept, decline, or counter.
            </p>
            <div className="space-y-2">
              <Link
                href="/community/login"
                className="block w-full bg-green-600 text-white text-center py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-green-700"
              >
                Sign In as Community Owner
              </Link>
              <Link
                href="/community/register"
                className="block w-full border border-green-200 text-green-600 text-center py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-green-50"
              >
                Create Community Account
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-16 text-xs text-gray-300">Sphere · AI-powered brand × community partnerships</p>
      </div>
    </main>
  );
}
