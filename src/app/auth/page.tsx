'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import SupabaseAuthPage from '@/components/SupabaseAuthPage'

export default function AuthRoute() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    // Redirect if already authenticated
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect via useEffect
  }

  return <SupabaseAuthPage />
} 