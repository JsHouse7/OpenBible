'use client'

import React from 'react'
import { ExternalLink } from 'lucide-react'

interface BibleAttributionProps {
  className?: string
  variant?: 'footer' | 'inline' | 'modal'
}

export function BibleAttribution({ className = '', variant = 'footer' }: BibleAttributionProps) {
  const baseClasses = 'text-sm text-muted-foreground'
  
  const variantClasses = {
    footer: 'border-t pt-4 mt-8',
    inline: 'my-2',
    modal: 'p-4 bg-muted/50 rounded-lg'
  }

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span>Bible translations sourced from:</span>
        <a 
          href="https://github.com/jadenzaleski/BibleTranslations" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline transition-colors"
        >
          jadenzaleski/BibleTranslations
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <div className="mt-1 text-xs opacity-75">
        No copyright infringement intended. All translations are used for educational and religious purposes.
      </div>
    </div>
  )
}

export default BibleAttribution