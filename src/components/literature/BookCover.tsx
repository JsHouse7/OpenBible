'use client'

import { cn } from '@/lib/utils'

const COVER_COLORS = [
  'from-amber-700 to-amber-900',
  'from-emerald-700 to-emerald-900',
  'from-blue-700 to-blue-900',
  'from-violet-700 to-violet-900',
  'from-rose-700 to-rose-900',
  'from-teal-700 to-teal-900',
  'from-orange-700 to-orange-900',
  'from-indigo-700 to-indigo-900',
]

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
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
  const colorClass = COVER_COLORS[hashString(id) % COVER_COLORS.length]
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  const sizeClasses = {
    sm: 'h-36 w-24 text-xs',
    md: 'h-48 w-32 text-sm',
    lg: 'h-56 w-40 text-base',
  }

  return (
    <div
      className={cn(
        'relative rounded-lg shadow-md overflow-hidden flex flex-col justify-end p-3 bg-gradient-to-br text-white',
        colorClass,
        sizeClasses[size],
        className
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-20 text-4xl font-serif font-bold">
        {initials}
      </div>
      <div className="relative z-10">
        <p className="font-semibold line-clamp-3 leading-tight">{title}</p>
        <p className="opacity-80 line-clamp-1 mt-1 text-[0.85em]">{author}</p>
      </div>
      {progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div
            className="h-full bg-white/80 transition-all"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
      {progress >= 99 && (
        <span className="absolute top-2 right-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
          Done
        </span>
      )}
    </div>
  )
}
