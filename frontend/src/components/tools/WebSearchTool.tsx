import React, { useState } from 'react';
import axios from 'axios';

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  date_published?: string;
}

interface WebSearchToolProps {
  className?: string;
  onResultSelect?: (result: WebSearchResult) => void;
}

const WebSearchTool: React.FC<WebSearchToolProps> = ({ className = '', onResultSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WebSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchEnabled, setSearchEnabled] = useState<boolean | null>(null);

  // Check if search is enabled on mount
  React.useEffect(() => {
    const checkSearchStatus = async () => {
      try {
        const response = await axios.get('/api/search/status');
        setSearchEnabled(response.data.enabled);
        if (!response.data.enabled) {
          setError('Web search is not configured. Please set up an API key.');
        }
      } catch (err) {
        console.error('Error checking search status:', err);
        setSearchEnabled(false);
        setError('Could not connect to search service');
      }
    };
    
    checkSearchStatus();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/search/web', {
        params: { query, results: 5 }
      });
      
      if (response.data.error) {
        setError(response.data.error);
        setResults([]);
      } else {
        setResults(response.data.results || []);
        if (response.data.results.length === 0) {
          setError('No results found');
        }
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.response?.data?.detail || err.message || 'An error occurred');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: WebSearchResult) => {
    if (onResultSelect) {
      onResultSelect(result);
    } else {
      window.open(result.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`chalky-texture faded-edges ${className}`}>
      <form onSubmit={handleSearch} className="mb-3">
        <div className="flex">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the web..."
            className="flex-grow p-2 border-2 border-farm-brown rounded-l"
            disabled={loading || searchEnabled === false}
          />
          <button
            type="submit"
            className="farm-button bg-farm-blue rounded-l-none rounded-r px-3"
            disabled={loading || !query.trim() || searchEnabled === false}
          >
            {loading ? 
              <span className="inline-block animate-spin">⟳</span> : 
              <span>🔍</span>
            }
          </button>
        </div>
      </form>
      
      {error && (
        <div className="bg-red-100 border-2 border-red-500 p-2 rounded mb-3 text-red-700 text-sm">
          {error}
        </div>
      )}
      
      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, index) => (
            <div 
              key={index} 
              className="bg-white p-2 rounded border-2 border-farm-brown hover:bg-amber-50 cursor-pointer"
              onClick={() => handleResultClick(result)}
            >
              <h4 className="font-bold text-blue-600 hover:underline text-sm">{result.title}</h4>
              <div className="text-xs text-green-700 mb-1">{result.url}</div>
              <p className="text-xs text-gray-700">{result.snippet}</p>
              {result.date_published && (
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(result.date_published).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-2">
        {searchEnabled === false ? 
          'Web search is not configured. Please contact an administrator.' :
          'Powered by Bing Search API'}
      </div>
    </div>
  );
};

export default WebSearchTool; 