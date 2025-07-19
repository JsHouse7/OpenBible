'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import SupabaseAuthPage from '@/components/SupabaseAuthPage'

export default function HomePage() {
  const { user, loading } = useAuth()
  const [lastUpdated, setLastUpdated] = useState('')

  useEffect(() => {
    setLastUpdated(new Date().toISOString())
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <SupabaseAuthPage />
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">OpenBible</h1>
        <p className="text-muted-foreground mb-4">Free Bible Study App</p>
        <p className="text-xs text-muted-foreground mb-2">✅ Real Authentication Enabled</p>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground mb-6">Last updated: {lastUpdated}</p>
        )}
        <a
          href="/dashboard"
          className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 mr-4"
        >
          Go to Dashboard
        </a>
        <a
          href="/auth"
          className="inline-block px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90"
        >
          Login / Register
        </a>
      </div>
    </div>
  )
}
