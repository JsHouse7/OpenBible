export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          OpenBible Test
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Testing basic Next.js routing
        </p>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ If you can see this, the app is working!
        </div>
      </div>
    </div>
  )
}
