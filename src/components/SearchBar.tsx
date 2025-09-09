'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Mic, MicOff, X, Clock, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

interface Suggestion {
  text: string;
  type: 'verse' | 'reference' | 'popular';
  popularity?: number;
}

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string, type?: 'verse' | 'reference') => void;
  className?: string;
  showVoiceSearch?: boolean;
  autoFocus?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function SearchBar({
  placeholder = "Search verses or enter reference (e.g., 'John 3:16' or 'love')",
  onSearch,
  className = '',
  showVoiceSearch = true,
  autoFocus = false,
  size = 'md'
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const recognitionRef = useRef<any>(null);

  // Size classes
  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-base',
    lg: 'h-12 text-lg'
  };

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}&limit=8`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced suggestion fetching
  useEffect(() => {
    if (debouncedQuery) {
      fetchSuggestions(debouncedQuery);
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery, fetchSuggestions]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Handle search
  const handleSearch = useCallback((searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    const trimmedQuery = searchQuery.trim();
    
    // Detect if it's a reference or verse search
    const referencePattern = /^[a-zA-Z0-9\s]+\s+\d+(?::\d+(?:-\d+)?)?$/;
    const isReference = referencePattern.test(trimmedQuery);
    
    if (onSearch) {
      onSearch(trimmedQuery, isReference ? 'reference' : 'verse');
    } else {
      // Navigate to search page
      const searchType = isReference ? 'reference' : 'verse';
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}&type=${searchType}`);
    }
    
    setShowSuggestions(false);
    setSelectedIndex(-1);
  }, [query, onSearch, router]);

  // Handle voice search
  const handleVoiceSearch = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, [isListening]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSearch(suggestions[selectedIndex].text);
          setQuery(suggestions[selectedIndex].text);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, handleSearch]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: Suggestion) => {
    setQuery(suggestion.text);
    handleSearch(suggestion.text);
  }, [handleSearch]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
  }, []);

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [suggestions.length]);

  // Handle input blur
  const handleInputBlur = useCallback((e: React.FocusEvent) => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }, 150);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, []);

  // Get suggestion icon
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'reference':
        return <Search className="w-4 h-4 text-primary" />;
      case 'popular':
        return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={`
            block w-full pl-10 pr-20 border border-border rounded-lg
            focus:ring-2 focus:ring-primary focus:border-transparent
            placeholder-muted-foreground bg-background shadow-sm
            text-foreground
            ${sizeClasses[size]}
            ${isListening ? 'ring-2 ring-red-500 border-red-500' : ''}
          `}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
          {query && (
            <button
              onClick={clearSearch}
              className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {showVoiceSearch && recognitionRef.current && (
            <button
              onClick={handleVoiceSearch}
              className={`
                p-1 rounded transition-colors
                ${isListening 
                  ? 'text-red-500 hover:text-red-600 bg-red-50' 
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
              type="button"
              title={isListening ? 'Stop listening' : 'Voice search'}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || isLoading) && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {isLoading && (
            <div className="px-4 py-2 text-sm text-muted-foreground flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              Loading suggestions...
            </div>
          )}
          
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.text}-${index}`}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`
                w-full px-4 py-2 text-left hover:bg-muted/50 flex items-center space-x-3
                ${index === selectedIndex ? 'bg-primary/10 border-l-2 border-primary' : ''}
                ${index === suggestions.length - 1 ? '' : 'border-b border-border'}
              `}
              type="button"
            >
              {getSuggestionIcon(suggestion.type)}
              <span className="flex-1 text-sm text-foreground">{suggestion.text}</span>
              {suggestion.popularity && (
                <span className="text-xs text-muted-foreground">
                  {suggestion.popularity} searches
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}