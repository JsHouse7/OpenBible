'use client'

import React from 'react'

export function LoadingTranslations() {
  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-2">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      <p className="text-sm text-muted-foreground">Loading Bible translations...</p>
    </div>
  )
}