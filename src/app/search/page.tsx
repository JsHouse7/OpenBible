'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import SearchResults from '@/components/SearchResults';
import { Search, Filter, SortAsc, SortDesc, BookOpen, Clock } from 'lucide-react';
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

interface SearchFilters {
  books?: string[];
  testament?: 'old' | 'new' | 'both';
  version?: string;
  sortBy?: 'relevance' | 'book' | 'chapter';
  sortOrder?: 'asc' | 'desc';
}

interface SearchResponse {
  verses: Verse[];
  pagination: Pagination;
  searchType: 'verse' | 'reference';
  query: string;
  filters: SearchFilters;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // State management
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    testament: 'both',
    version: 'ESV',
    sortBy: 'relevance',
    sortOrder: 'desc'
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Get initial query from URL params
  const initialQuery = searchParams?.get('q') || '';
  const initialPage = parseInt(searchParams?.get('page') || '1');

  // Bible books for filtering
  const oldTestamentBooks = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
    '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
    'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
  ];

  const newTestamentBooks = [
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians',
    'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
    '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
    '1 John', '2 John', '3 John', 'Jude', 'Revelation'
  ];

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
      }
    }
  }, []);

  // Perform search
  const performSearch = useCallback(async (
    query: string, 
    page: number = 1, 
    searchFilters: SearchFilters = filters
  ) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setIsLoading(true);
    
    try {
      // Determine search type
      const isReference = /^\d*\s*[a-zA-Z]+\s*\d+:\d+(-\d+)?$/.test(query.trim());
      const endpoint = isReference ? '/api/search/reference' : '/api/search/verses';
      
      // Build query parameters
      const params = new URLSearchParams({
        q: query,
        page: page.toString(),
        limit: '20'
      });

      // Add filters for verse search
      if (!isReference) {
        if (searchFilters.books && searchFilters.books.length > 0) {
          params.append('books', searchFilters.books.join(','));
        }
        if (searchFilters.testament && searchFilters.testament !== 'both') {
          params.append('testament', searchFilters.testament);
        }
        if (searchFilters.version) {
          params.append('version', searchFilters.version);
        }
        if (searchFilters.sortBy) {
          params.append('sortBy', searchFilters.sortBy);
        }
        if (searchFilters.sortOrder) {
          params.append('sortOrder', searchFilters.sortOrder);
        }
      }

      const response = await fetch(`${endpoint}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      setSearchResults({
        verses: data.verses || [],
        pagination: data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        },
        searchType: isReference ? 'reference' : 'verse',
        query,
        filters: searchFilters
      });

      // Update recent searches
      const updatedRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
      setRecentSearches(updatedRecent);
      localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));

      // Update URL
      const newParams = new URLSearchParams();
      newParams.set('q', query);
      if (page > 1) newParams.set('page', page.toString());
      router.replace(`/search?${newParams}`, { scroll: false });
      
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters, recentSearches, router]);

  // Handle search from SearchBar
  const handleSearch = useCallback((query: string) => {
    performSearch(query, 1, filters);
  }, [performSearch, filters]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    if (searchResults) {
      performSearch(searchResults.query, page, searchResults.filters);
    }
  }, [searchResults, performSearch]);

  // Handle verse actions
  const handleVerseAction = useCallback(async (
    verse: Verse, 
    action: 'copy' | 'share' | 'bookmark' | 'favorite'
  ) => {
    // These would typically interact with user data APIs
    console.log(`Action ${action} on verse:`, verse);
    
    // For now, just show success messages
    switch (action) {
      case 'bookmark':
        toast.success('Verse bookmarked!');
        break;
      case 'favorite':
        toast.success('Verse added to favorites!');
        break;
      case 'copy':
        // Handled in SearchResults component
        break;
      case 'share':
        // Handled in SearchResults component
        break;
    }
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Re-search with new filters if there's an active search
    if (searchResults) {
      performSearch(searchResults.query, 1, updatedFilters);
    }
  }, [filters, searchResults, performSearch]);

  // Initial search on page load
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, initialPage);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3 mb-6">
            <Search className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Bible Search</h1>
          </div>
          
          {/* Search Bar */}
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search verses or enter reference (e.g., John 3:16)"
            initialValue={initialQuery}
            className="mb-4"
          />
          
          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-border rounded-md text-sm font-medium text-foreground bg-background hover:bg-muted/50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {Object.values(filters).some(v => v && v !== 'both' && v !== 'relevance' && v !== 'desc' && v !== 'ESV') && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  Active
                </span>
              )}
            </button>
            
            {searchResults && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Sort by:</span>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
                  className="border border-border rounded px-2 py-1 text-sm bg-background text-foreground"
                >
                  <option value="relevance">Relevance</option>
                  <option value="book">Book Order</option>
                  <option value="chapter">Chapter</option>
                </select>
                
                <button
                  onClick={() => handleFilterChange({ 
                    sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
                  })}
                  className="p-1 hover:bg-muted/50 rounded text-muted-foreground hover:text-foreground"
                >
                  {filters.sortOrder === 'asc' ? 
                    <SortAsc className="h-4 w-4" /> : 
                    <SortDesc className="h-4 w-4" />
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-background border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Testament Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Testament
                </label>
                <select
                  value={filters.testament}
                  onChange={(e) => handleFilterChange({ testament: e.target.value as any })}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
                >
                  <option value="both">Both Testaments</option>
                  <option value="old">Old Testament</option>
                  <option value="new">New Testament</option>
                </select>
              </div>
              
              {/* Version Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Version
                </label>
                <select
                  value={filters.version}
                  onChange={(e) => handleFilterChange({ version: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
                >
                  <option value="ESV">ESV</option>
                  <option value="NIV">NIV</option>
                  <option value="KJV">KJV</option>
                  <option value="NASB">NASB</option>
                </select>
              </div>
              
              {/* Books Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Specific Books (Optional)
                </label>
                <select
                  multiple
                  value={filters.books || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    handleFilterChange({ books: selected.length > 0 ? selected : undefined });
                  }}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm h-20 bg-background text-foreground"
                >
                  <optgroup label="Old Testament">
                    {oldTestamentBooks.map(book => (
                      <option key={book} value={book}>{book}</option>
                    ))}
                  </optgroup>
                  <optgroup label="New Testament">
                    {newTestamentBooks.map(book => (
                      <option key={book} value={book}>{book}</option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Hold Ctrl/Cmd to select multiple books
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Recent Searches */}
        {!searchResults && recentSearches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-medium text-foreground">Recent Searches</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(search)}
                  className="px-3 py-1 bg-muted text-foreground rounded-full text-sm hover:bg-muted/80 transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults && (
          <SearchResults
            verses={searchResults.verses}
            pagination={searchResults.pagination}
            query={searchResults.query}
            searchType={searchResults.searchType}
            isLoading={isLoading}
            onPageChange={handlePageChange}
            onVerseAction={handleVerseAction}
          />
        )}

        {/* Empty State */}
        {!searchResults && !isLoading && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Search the Bible
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Enter keywords to search for verses, or type a reference like "John 3:16" 
              to find specific passages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading search...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}