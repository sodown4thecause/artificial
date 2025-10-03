import { useState } from 'react';
import { Search, TrendingUp, DollarSign, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth, useSession } from '@clerk/clerk-react';
import { supabase } from '../supabaseClient';
import type { DataForSEOKeywordResult, KeywordSearchState } from '../types/dataforseo';

const KeywordSearch = () => {
  const { getToken } = useAuth();
  const { session } = useSession();
  const [searchState, setSearchState] = useState<KeywordSearchState>({
    query: '',
    results: [],
    isLoading: false,
    error: null,
    hasSearched: false,
  });

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      query: searchQuery,
    }));

    try {
      // Get the raw Clerk session token (JWT)
      const token = await session?.getToken();
      
      console.log('🔑 Token retrieved:', token ? 'Yes' : 'No');
      console.log('🔑 Token preview:', token?.substring(0, 50));
      
      if (!token) {
        throw new Error('Not authenticated. Please sign in.');
      }
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      // Using the Supabase Edge Function for DataForSEO API
      const apiUrl = `${supabaseUrl}/functions/v1/dataforseo-keywords`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          keywords: [searchQuery],
          location_code: 2840, // United States
          language_code: 'en',
          limit: 50,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `Failed to fetch keyword data (${response.status})`;
        console.error('❌ API Error:', errorData);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('📊 DataForSEO API response:', data);

      // Parse DataForSEO response structure:
      // data.tasks[0].result[0].items contains the keyword array
      const results = data.tasks?.[0]?.result?.[0]?.items || [];
      console.log('📈 Parsed results:', results.length, 'keywords');

      setSearchState(prev => ({
        ...prev,
        results: results,
        isLoading: false,
        hasSearched: true,
      }));
    } catch (error) {
      setSearchState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false,
      }));
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Keyword Research Tool
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Search for keywords using DataForSEO API to discover opportunities and competition data
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter keyword to research..."
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                disabled={searchState.isLoading}
              />
            </div>
            <Button
              type="submit"
              disabled={searchState.isLoading || !searchQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {searchState.isLoading ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Loading State */}
      {searchState.isLoading && (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Searching for keyword data...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {searchState.error && (
        <Card className="border-red-200">
          <CardContent className="py-4">
            <p className="text-red-600">Error: {searchState.error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {searchState.hasSearched && !searchState.isLoading && (
        <div className="space-y-4">
          {searchState.results.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Search Results for "{searchState.query}"
                </h3>
                <Badge variant="outline">
                  {searchState.results.length} keywords found
                </Badge>
              </div>

              <div className="grid gap-4">
                {searchState.results.map((result, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-lg mb-1">
                            {result.keyword}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {result.keyword_properties?.categories?.join(', ') || 'General'}
                          </p>
                        </div>
                        <Badge className={getCompetitionColor(result.competition_level)}>
                          {result.competition_level} Competition
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Search Volume</p>
                            <p className="font-semibold">
                              {formatNumber(result.keyword_info?.search_volume || 0)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">CPC</p>
                            <p className="font-semibold">
                              ${result.keyword_info?.cpc?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Difficulty</p>
                            <p className="font-semibold">
                              {result.keyword_properties?.keyword_difficulty || 0}/100
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Intent</p>
                            <p className="font-semibold capitalize">
                              {result.search_intent || 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Monthly Search Trend */}
                      {result.monthly_searches && result.monthly_searches.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Monthly Search Trends</p>
                          <div className="flex gap-2 overflow-x-auto">
                            {result.monthly_searches.slice(-6).map((monthly, idx) => (
                              <div key={idx} className="text-center min-w-[60px]">
                                <p className="text-xs text-muted-foreground">
                                  {monthly.month}/{monthly.year}
                                </p>
                                <p className="text-sm font-semibold">
                                  {formatNumber(monthly.search_volume)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No results found for "{searchState.query}". Try a different keyword.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default KeywordSearch;
