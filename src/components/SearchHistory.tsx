'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Star, Trash2, Search, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface SearchHistoryItem {
  id: string;
  query: string;
  searchType: 'verse' | 'reference';
  resultsCount: number;
  createdAt: string;
  isSaved?: boolean;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  searchType: 'verse' | 'reference';
  filters?: any;
  createdAt: string;
  lastUsed: string;
}

interface SearchHistoryProps {
  onSearchSelect?: (query: string) => void;
  onClearHistory?: () => void;
  className?: string;
}

export default function SearchHistory({
  onSearchSelect,
  onClearHistory,
  className = ''
}: SearchHistoryProps) {
  const [activeTab, setActiveTab] = useState<'recent' | 'saved'>('recent');
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchToSave, setSearchToSave] = useState<SearchHistoryItem | null>(null);
  const [saveName, setSaveName] = useState('');

  // Load search history from API or localStorage
  const loadSearchHistory = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Try to load from API first (for authenticated users)
      const response = await fetch('/api/search/history');
      
      if (response.ok) {
        const data = await response.json();
        setRecentSearches(data.searches || []);
      } else {
        // Fallback to localStorage for non-authenticated users
        const localHistory = localStorage.getItem('searchHistory');
        if (localHistory) {
          const parsed = JSON.parse(localHistory);
          setRecentSearches(parsed);
        }
      }
      
      // Load saved searches
      const savedResponse = await fetch('/api/search/saved');
      if (savedResponse.ok) {
        const savedData = await savedResponse.json();
        setSavedSearches(savedData.searches || []);
      } else {
        // Fallback to localStorage
        const localSaved = localStorage.getItem('savedSearches');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          setSavedSearches(parsed);
        }
      }
      
    } catch (error) {
      console.error('Failed to load search history:', error);
      
      // Fallback to localStorage
      try {
        const localHistory = localStorage.getItem('searchHistory');
        const localSaved = localStorage.getItem('savedSearches');
        
        if (localHistory) {
          setRecentSearches(JSON.parse(localHistory));
        }
        if (localSaved) {
          setSavedSearches(JSON.parse(localSaved));
        }
      } catch (parseError) {
        console.error('Failed to parse local search history:', parseError);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadSearchHistory();
  }, [loadSearchHistory]);

  // Handle search selection
  const handleSearchSelect = useCallback((query: string) => {
    if (onSearchSelect) {
      onSearchSelect(query);
    }
  }, [onSearchSelect]);

  // Handle delete recent search
  const handleDeleteRecentSearch = useCallback(async (searchId: string) => {
    try {
      // Try to delete from API
      const response = await fetch(`/api/search/history/${searchId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setRecentSearches(prev => prev.filter(search => search.id !== searchId));
        toast.success('Search removed from history');
      } else {
        // Fallback to localStorage
        const updated = recentSearches.filter(search => search.id !== searchId);
        setRecentSearches(updated);
        localStorage.setItem('searchHistory', JSON.stringify(updated));
        toast.success('Search removed from history');
      }
    } catch (error) {
      console.error('Failed to delete search:', error);
      toast.error('Failed to remove search');
    }
  }, [recentSearches]);

  // Handle clear all history
  const handleClearAllHistory = useCallback(async () => {
    try {
      // Try to clear from API
      const response = await fetch('/api/search/history', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setRecentSearches([]);
        if (onClearHistory) {
          onClearHistory();
        }
        toast.success('Search history cleared');
      } else {
        // Fallback to localStorage
        setRecentSearches([]);
        localStorage.removeItem('searchHistory');
        if (onClearHistory) {
          onClearHistory();
        }
        toast.success('Search history cleared');
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
      toast.error('Failed to clear history');
    }
  }, [onClearHistory]);

  // Handle save search
  const handleSaveSearch = useCallback((search: SearchHistoryItem) => {
    setSearchToSave(search);
    setSaveName(search.query);
    setShowSaveDialog(true);
  }, []);

  // Handle confirm save
  const handleConfirmSave = useCallback(async () => {
    if (!searchToSave || !saveName.trim()) {
      toast.error('Please enter a name for the saved search');
      return;
    }

    const newSavedSearch: SavedSearch = {
      id: Date.now().toString(),
      name: saveName.trim(),
      query: searchToSave.query,
      searchType: searchToSave.searchType,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };

    try {
      // Try to save to API
      const response = await fetch('/api/search/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSavedSearch)
      });

      if (response.ok) {
        setSavedSearches(prev => [newSavedSearch, ...prev]);
        toast.success('Search saved successfully');
      } else {
        // Fallback to localStorage
        const updated = [newSavedSearch, ...savedSearches];
        setSavedSearches(updated);
        localStorage.setItem('savedSearches', JSON.stringify(updated));
        toast.success('Search saved locally');
      }
    } catch (error) {
      console.error('Failed to save search:', error);
      // Fallback to localStorage
      const updated = [newSavedSearch, ...savedSearches];
      setSavedSearches(updated);
      localStorage.setItem('savedSearches', JSON.stringify(updated));
      toast.success('Search saved locally');
    }

    setShowSaveDialog(false);
    setSearchToSave(null);
    setSaveName('');
  }, [searchToSave, saveName, savedSearches]);

  // Handle delete saved search
  const handleDeleteSavedSearch = useCallback(async (searchId: string) => {
    try {
      // Try to delete from API
      const response = await fetch(`/api/search/saved/${searchId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSavedSearches(prev => prev.filter(search => search.id !== searchId));
        toast.success('Saved search removed');
      } else {
        // Fallback to localStorage
        const updated = savedSearches.filter(search => search.id !== searchId);
        setSavedSearches(updated);
        localStorage.setItem('savedSearches', JSON.stringify(updated));
        toast.success('Saved search removed');
      }
    } catch (error) {
      console.error('Failed to delete saved search:', error);
      toast.error('Failed to remove saved search');
    }
  }, [savedSearches]);

  // Format date
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }, []);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          {[...Array(3)].map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header with tabs */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('recent')}
              className={`
                px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${activeTab === 'recent'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <Clock className="h-4 w-4 inline mr-2" />
              Recent
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`
                px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${activeTab === 'saved'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <Star className="h-4 w-4 inline mr-2" />
              Saved
            </button>
          </div>
          
          {activeTab === 'recent' && recentSearches.length > 0 && (
            <button
              onClick={handleClearAllHistory}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'recent' && (
          <div className="space-y-3">
            {recentSearches.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">No recent searches</p>
              </div>
            ) : (
              recentSearches.map((search) => (
                <div
                  key={search.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg group"
                >
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => handleSearchSelect(search.query)}
                  >
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{search.query}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {search.searchType}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>{search.resultsCount} results</span>
                      <span>{formatDate(search.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleSaveSearch(search)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                      title="Save search"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRecentSearch(search.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                      title="Remove from history"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="space-y-3">
            {savedSearches.length === 0 ? (
              <div className="text-center py-8">
                <Star className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">No saved searches</p>
                <p className="text-gray-400 text-xs mt-1">
                  Save searches from your recent history
                </p>
              </div>
            ) : (
              savedSearches.map((search) => (
                <div
                  key={search.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg group"
                >
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => handleSearchSelect(search.query)}
                  >
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium text-gray-900">{search.name}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {search.searchType}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>Query: {search.query}</span>
                      <span>Saved {formatDate(search.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDeleteSavedSearch(search.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                      title="Remove saved search"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Save Search</h3>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Name
              </label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Enter a name for this search"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            
            {searchToSave && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">Query:</p>
                <p className="font-medium text-gray-900">{searchToSave.query}</p>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={!saveName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}