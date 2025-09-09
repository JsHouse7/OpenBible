'use client';

import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Copy, Share2, Heart, Bookmark } from 'lucide-react';
import { toast } from 'sonner';

interface Verse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  version: string;
  rank?: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface SearchResultsProps {
  verses: Verse[];
  pagination: Pagination;
  query: string;
  searchType?: 'verse' | 'reference';
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
  onVerseAction?: (verse: Verse, action: 'copy' | 'share' | 'bookmark' | 'favorite') => void;
  className?: string;
}

export default function SearchResults({
  verses,
  pagination,
  query,
  searchType = 'verse',
  isLoading = false,
  onPageChange,
  onVerseAction,
  className = ''
}: SearchResultsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Highlight search terms in text
  const highlightText = useCallback((text: string, searchQuery: string) => {
    if (!searchQuery || searchType === 'reference') return text;

    const words = searchQuery.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    if (words.length === 0) return text;

    let highlightedText = text;
    words.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    });

    return highlightedText;
  }, [searchType]);

  // Handle copy verse
  const handleCopyVerse = useCallback(async (verse: Verse) => {
    const verseText = `${verse.text} - ${verse.book} ${verse.chapter}:${verse.verse} (${verse.version})`;
    
    try {
      await navigator.clipboard.writeText(verseText);
      setCopiedId(verse.id);
      toast.success('Verse copied to clipboard!');
      
      setTimeout(() => setCopiedId(null), 2000);
      
      if (onVerseAction) {
        onVerseAction(verse, 'copy');
      }
    } catch (error) {
      toast.error('Failed to copy verse');
    }
  }, [onVerseAction]);

  // Handle share verse
  const handleShareVerse = useCallback(async (verse: Verse) => {
    const verseText = `${verse.text} - ${verse.book} ${verse.chapter}:${verse.verse} (${verse.version})`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${verse.book} ${verse.chapter}:${verse.verse}`,
          text: verseText,
          url: window.location.href
        });
        
        if (onVerseAction) {
          onVerseAction(verse, 'share');
        }
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying
      await handleCopyVerse(verse);
    }
  }, [onVerseAction, handleCopyVerse]);

  // Handle bookmark verse
  const handleBookmarkVerse = useCallback((verse: Verse) => {
    if (onVerseAction) {
      onVerseAction(verse, 'bookmark');
    }
    toast.success('Verse bookmarked!');
  }, [onVerseAction]);

  // Handle favorite verse
  const handleFavoriteVerse = useCallback((verse: Verse) => {
    if (onVerseAction) {
      onVerseAction(verse, 'favorite');
    }
    toast.success('Verse added to favorites!');
  }, [onVerseAction]);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    if (onPageChange && newPage >= 1 && newPage <= pagination.totalPages) {
      onPageChange(newPage);
    }
  }, [onPageChange, pagination.totalPages]);

  // Generate page numbers for pagination
  const getPageNumbers = useCallback(() => {
    const { page, totalPages } = pagination;
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (page > 4) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (page < totalPages - 3) {
        pages.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [pagination]);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center space-x-2 mb-3">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (verses.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No verses found</h3>
        <p className="text-gray-500">
          Try adjusting your search terms or check your spelling.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Results summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
          {pagination.total} results for &quot;<span className="font-medium">{query}</span>&quot;
        </p>
        {searchType === 'verse' && (
          <p className="text-xs text-gray-500">
            Results ranked by relevance
          </p>
        )}
      </div>

      {/* Verse cards */}
      <div className="space-y-4">
        {verses.map((verse, index) => (
          <div
            key={verse.id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            {/* Verse header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-600">
                  {verse.book} {verse.chapter}:{verse.verse}
                </span>
                <span className="text-sm text-gray-500">({verse.version})</span>
                {verse.rank && searchType === 'verse' && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Rank: {verse.rank.toFixed(2)}
                  </span>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleCopyVerse(verse)}
                  className={`
                    p-2 rounded-md transition-colors
                    ${copiedId === verse.id 
                      ? 'bg-green-100 text-green-600' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }
                  `}
                  title="Copy verse"
                >
                  <Copy className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => handleShareVerse(verse)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  title="Share verse"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => handleBookmarkVerse(verse)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Bookmark verse"
                >
                  <Bookmark className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => handleFavoriteVerse(verse)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Add to favorites"
                >
                  <Heart className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Verse text */}
            <div className="text-gray-900 leading-relaxed">
              <p 
                dangerouslySetInnerHTML={{ 
                  __html: highlightText(verse.text, query) 
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="
                inline-flex items-center px-3 py-2 border border-gray-300 rounded-md
                text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="
                inline-flex items-center px-3 py-2 border border-gray-300 rounded-md
                text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          
          {/* Page numbers */}
          <div className="hidden md:flex items-center space-x-1">
            {getPageNumbers().map((pageNum, index) => (
              <React.Fragment key={index}>
                {pageNum === '...' ? (
                  <span className="px-3 py-2 text-gray-500">...</span>
                ) : (
                  <button
                    onClick={() => handlePageChange(pageNum as number)}
                    className={`
                      px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${pageNum === pagination.page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    {pageNum}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>
          
          <div className="text-sm text-gray-700">
            Page {pagination.page} of {pagination.totalPages}
          </div>
        </div>
      )}
    </div>
  );
}