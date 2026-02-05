import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, User, FileText } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const SearchBar = ({ className = '' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ reviews: [], users: [] });
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchDebounce = setTimeout(() => {
      if (query.trim().length >= 2) {
        handleSearch();
      } else {
        setResults({ reviews: [], users: [] });
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(searchDebounce);
  }, [query]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/search?q=${encodeURIComponent(query)}`);
      setResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (type, id) => {
    setShowResults(false);
    setQuery('');
    if (type === 'review') {
      navigate(`/review/${id}`);
    } else if (type === 'user') {
      navigate(`/profile/${id}`);
    }
  };

  const hasResults = results.reviews.length > 0 || results.users.length > 0;

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Oyun veya kullanıcı ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setShowResults(true)}
          className="pl-10 rounded-full"
          data-testid="search-input"
        />
      </div>

      {showResults && hasResults && (
        <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto z-50 rounded-xl shadow-lg" data-testid="search-results">
          <div className="p-2">
            {results.reviews.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  İncelemeler
                </div>
                {results.reviews.map((review) => (
                  <div
                    key={review.id}
                    onClick={() => handleResultClick('review', review.id)}
                    className="flex items-start gap-3 px-3 py-2 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                    data-testid={`search-review-${review.id}`}
                  >
                    <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{review.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{review.game_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.users.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Kullanıcılar
                </div>
                {results.users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleResultClick('user', user.id)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                    data-testid={`search-user-${user.id}`}
                  >
                    <User className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="font-medium text-sm">{user.username}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {showResults && !hasResults && query.trim().length >= 2 && !loading && (
        <Card className="absolute top-full mt-2 w-full p-4 z-50 rounded-xl shadow-lg">
          <p className="text-sm text-muted-foreground text-center">Sonuç bulunamadı</p>
        </Card>
      )}
    </div>
  );
};