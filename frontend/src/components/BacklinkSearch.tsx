import { useState } from 'react';
import { Link, TrendingUp, Globe, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from '@clerk/clerk-react';

interface BacklinkData {
  url: string;
  domain_rank: number;
  backlinks: number;
  referring_domains: number;
  referring_pages: number;
  referring_ips: number;
  referring_subnets: number;
}

interface BacklinkSearchState {
  query: string;
  results: BacklinkData | null;
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
}

const BacklinkSearch = () => {
  const { isSignedIn } = useAuth();
  const [searchState, setSearchState] = useState<BacklinkSearchState>({
    query: '',
    results: null,
    isLoading: false,
    error: null,
    hasSearched: false,
  });

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (!isSignedIn) {
      setSearchState(prev => ({
        ...prev,
        error: 'Please sign in to use backlink search'
      }));
      return;
    }

    setSearchState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      query: searchQuery,
    }));

    try {
      // Validate URL format
      let url = searchQuery.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      // Send to Make.com webhook
      const response = await fetch('https://hook.us2.make.com/vo0wugr8juix9untkitdyfpdfbic8ba5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch backlink data');
      }

      const data = await response.json();

      setSearchState(prev => ({
        ...prev,
        results: data,
        isLoading: false,
        hasSearched: true,
      }));
    } catch (error) {
      setSearchState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred while fetching backlink data',
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

  const getDomainRankColor = (rank: number) => {
    if (rank >= 80) return 'text-green-600';
    if (rank >= 60) return 'text-blue-600';
    if (rank >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Backlink Analysis Tool
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Analyze backlink profile for any domain using DataForSEO via Make.com integration
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter domain or URL (e.g., example.com)"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                disabled={searchState.isLoading}
              />
            </div>
            <Button
              type="submit"
              disabled={searchState.isLoading || !searchQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {searchState.isLoading ? 'Analyzing...' : 'Analyze'}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            Powered by DataForSEO Backlink API via Make.com
          </p>
        </CardContent>
      </Card>

      {/* Loading State */}
      {searchState.isLoading && (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Analyzing backlink profile...</p>
            <p className="text-xs text-muted-foreground mt-2">This may take 10-30 seconds</p>
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
      {searchState.hasSearched && !searchState.isLoading && searchState.results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Backlink Profile for "{searchState.query}"
            </h3>
            <a 
              href={searchState.results.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              Visit Site <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Summary Card */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getDomainRankColor(searchState.results.domain_rank)}`}>
                    {searchState.results.domain_rank}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Domain Rank</p>
                  <Badge variant="outline" className="mt-2">
                    {searchState.results.domain_rank >= 80 ? 'Excellent' : 
                     searchState.results.domain_rank >= 60 ? 'Good' : 
                     searchState.results.domain_rank >= 40 ? 'Average' : 'Needs Work'}
                  </Badge>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Link className="h-5 w-5 text-blue-600" />
                    <span className="text-3xl font-bold text-blue-600">
                      {formatNumber(searchState.results.backlinks)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Total Backlinks</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Globe className="h-5 w-5 text-purple-600" />
                    <span className="text-3xl font-bold text-purple-600">
                      {formatNumber(searchState.results.referring_domains)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Referring Domains</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-3xl font-bold text-green-600">
                      {formatNumber(searchState.results.referring_pages)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Referring Pages</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Additional Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <span className="text-sm text-muted-foreground">Referring IPs</span>
                  <span className="font-semibold">{formatNumber(searchState.results.referring_ips)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <span className="text-sm text-muted-foreground">Referring Subnets</span>
                  <span className="font-semibold">{formatNumber(searchState.results.referring_subnets)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <p className="text-sm text-blue-800">
                <strong>What does this mean?</strong> A higher domain rank and more diverse backlinks 
                indicate a stronger authority. Focus on getting backlinks from unique referring domains 
                rather than just increasing total backlink count.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Results */}
      {searchState.hasSearched && !searchState.isLoading && !searchState.results && !searchState.error && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No backlink data found for "{searchState.query}". The domain may be too new or not indexed.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BacklinkSearch;
