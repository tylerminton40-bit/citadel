import Navbar from "@/components/Navbar"
import Link from "next/link"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />
      <main className="max-w-md mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-3">Login Required</h1>
        <p className="text-gray-400 text-sm mb-8">
          You need to login with Steam to do that.
        </p>
        <a
          href="/api/steam/login"
          className="btn-primary px-8 py-3 rounded-xl inline-block font-medium"
        >
          Login with Steam
        </a>
        <div className="mt-6">
          <Link href={next || "/"} className="text-sm text-gray-500 hover:text-white">
            ← Back
          </Link>
        </div>
      </main>
    </div>
  )
}