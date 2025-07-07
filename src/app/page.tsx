'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">OpenBible</h1>
        <p className="text-muted-foreground mb-4">Free Bible Study App</p>
        <p className="text-xs text-muted-foreground mb-2">✅ Real Authentication Enabled</p>
        <p className="text-xs text-muted-foreground mb-6">Last updated: {new Date().toISOString()}</p>
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
