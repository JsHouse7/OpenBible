'use client'

import { useEffect } from 'react'

export default function NotFound() {
  useEffect(() => {
    console.log('🚨 404 Page triggered - redirecting to main app')
    console.log('📍 Current location:', window.location.href)
    
    // Store the intended path
    const intendedPath = window.location.pathname
    console.log('🎯 Intended path:', intendedPath)
    
    // Redirect to main app using window.location (works with static export)
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">OpenBible</h1>
        <p className="text-muted-foreground">Loading your Bible study app...</p>
        <div className="mt-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    </div>
  )
} 