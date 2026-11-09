'use client'

import { cn } from '@/lib/utils'

function hashString(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

interface BookCoverProps {
  title: string
  author: string
  id: string
  progress?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function BookCover({
  title,
  author,
  id,
  progress = 0,
  size = 'md',
  className,
}: BookCoverProps) {
  const hue = 16 + (hashString(id || title) % 32)
  const lightness = 26 + (hashString(title) % 8)
  const sizeClasses = {
    sm: 'h-36 w-24 text-xs',
    md: 'h-52 w-36 text-sm',
    lg: 'h-64 w-44 text-base',
  }

  return (
    <div
      className={cn(
        'relative flex flex-col justify-between overflow-hidden rounded-sm p-3 text-[#f8f1e6] shadow-md',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `hsl(${hue} 32% ${lightness}%)`,
        backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.14), transparent 34%)',
      }}
    >
      <p className="relative z-10 font-playfair font-medium leading-tight line-clamp-4">{title}</p>
      <div className="relative z-10">
        <div className="mb-2 h-px w-8 bg-[#f8f1e6]/70" />
        <p className="text-[0.78em] uppercase tracking-[0.14em] opacity-85 line-clamp-2">{author}</p>
      </div>
      {progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/25">
          <div className="h-full bg-[#f8f1e6]" style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      )}
    </div>
  )
}
