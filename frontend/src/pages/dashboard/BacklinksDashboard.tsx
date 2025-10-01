import { useState } from 'react';
import { Search, ExternalLink, TrendingUp, TrendingDown, AlertCircle, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import type { BacklinkResponse, BacklinkItem } from '../../types/backlinks';

const WEBHOOK_URL = 'https://hook.us2.make.com/vo0wugr8juix9untkitdyfpdfbic8ba5';

function getSpamScoreBadge(score: number) {
  if (score === 0) return { variant: 'success' as const, label: 'Clean' };
  if (score <= 15) return { variant: 'default' as const, label: 'Low' };
  if (score <= 35) return { variant: 'warning' as const, label: 'Medium' };
  return { variant: 'destructive' as const, label: 'High' };
}

function getRankBadge(rank: number) {
  if (rank >= 500) return { variant: 'success' as const, label: 'High Authority' };
  if (rank >= 300) return { variant: 'default' as const, label: 'Good' };
  if (rank >= 100) return { variant: 'warning' as const, label: 'Medium' };
  return { variant: 'outline' as const, label: 'Low' };
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function BacklinksDashboard() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BacklinkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rank' | 'spam' | 'date'>('rank');

  const handleSearch = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch backlinks');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getBacklinks = (): BacklinkItem[] => {
    if (!data?.tasks?.[0]?.result?.[0]?.items) return [];
    return data.tasks[0].result[0].items;
  };

  const filterAndSortBacklinks = (backlinks: BacklinkItem[]): BacklinkItem[] => {
    let filtered = backlinks;

    // Apply filter
    if (filterType !== 'all') {
      filtered = backlinks.filter((item) => {
        switch (filterType) {
          case 'dofollow':
            return item.dofollow;
          case 'nofollow':
            return !item.dofollow;
          case 'new':
            return item.is_new;
          case 'lost':
            return item.is_lost;
          case 'clean':
            return item.backlink_spam_score === 0;
          default:
            return true;
        }
      });
    }

    // Apply sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rank':
          return b.rank - a.rank;
        case 'spam':
          return a.backlink_spam_score - b.backlink_spam_score;
        case 'date':
          return new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime();
        default:
          return 0;
      }
    });
  };

  const backlinks = getBacklinks();
  const filteredBacklinks = filterAndSortBacklinks(backlinks);
  const totalCount = data?.tasks?.[0]?.result?.[0]?.total_count || 0;
  const newBacklinks = backlinks.filter((b) => b.is_new).length;
  const lostBacklinks = backlinks.filter((b) => b.is_lost).length;
  const dofollowCount = backlinks.filter((b) => b.dofollow).length;
  const avgSpamScore = backlinks.length > 0
    ? (backlinks.reduce((sum, b) => sum + b.backlink_spam_score, 0) / backlinks.length).toFixed(1)
    : '0';

  const exportToCSV = () => {
    if (!backlinks.length) return;

    const headers = [
      'Source Domain',
      'Source URL',
      'Anchor Text',
      'Type',
      'DoFollow',
      'Rank',
      'Spam Score',
      'First Seen',
      'Last Seen',
    ];

    const rows = filteredBacklinks.map((item) => [
      item.domain_from,
      item.url_from,
      item.anchor || 'N/A',
      item.item_type,
      item.dofollow ? 'Yes' : 'No',
      item.rank,
      item.backlink_spam_score,
      formatDate(item.first_seen),
      formatDate(item.last_seen),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backlinks-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Backlinks Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Analyze and monitor your website's backlink profile
        </p>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Analyze Backlinks</CardTitle>
          <CardDescription>Enter a URL to fetch comprehensive backlink data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-9"
                disabled={loading}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading || !url.trim()}>
              {loading ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>
          {error && (
            <div className="mt-4 flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <>
          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Backlinks</CardTitle>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Showing {backlinks.length} results
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Backlinks</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{newBacklinks}</div>
                <p className="text-xs text-muted-foreground">
                  {((newBacklinks / backlinks.length) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lost Backlinks</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{lostBacklinks}</div>
                <p className="text-xs text-muted-foreground">
                  {((lostBacklinks / backlinks.length) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Spam Score</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgSpamScore}</div>
                <p className="text-xs text-muted-foreground">
                  {dofollowCount} dofollow links
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Backlink Details</CardTitle>
                  <CardDescription>
                    Comprehensive view of all backlinks pointing to your domain
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="space-y-4">
                <div className="flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  </TabsList>

                  <div className="flex gap-2">
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Links</SelectItem>
                        <SelectItem value="dofollow">DoFollow</SelectItem>
                        <SelectItem value="nofollow">NoFollow</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                        <SelectItem value="clean">Clean (No Spam)</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rank">Rank</SelectItem>
                        <SelectItem value="spam">Spam Score</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <TabsContent value="all" className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Source</TableHead>
                          <TableHead>Anchor/Type</TableHead>
                          <TableHead>Link Type</TableHead>
                          <TableHead>Rank</TableHead>
                          <TableHead>Spam Score</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Seen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBacklinks.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                              No backlinks match the selected filters
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredBacklinks.map((item, index) => (
                            <TableRow key={`${item.url_from}-${index}`}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <a
                                    href={item.url_from}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium hover:underline text-blue-600 flex items-center gap-1"
                                  >
                                    {item.domain_from}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {item.page_from_title || 'No title'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm">
                                    {item.anchor || <span className="text-muted-foreground">N/A</span>}
                                  </span>
                                  <Badge variant="outline" className="w-fit text-xs">
                                    {item.item_type}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                {item.dofollow ? (
                                  <Badge variant="success">DoFollow</Badge>
                                ) : (
                                  <Badge variant="secondary">NoFollow</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge {...getRankBadge(item.rank)}>
                                  {item.rank}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge {...getSpamScoreBadge(item.backlink_spam_score)}>
                                  {item.backlink_spam_score}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {item.is_new && (
                                    <Badge variant="success" className="text-xs">
                                      New
                                    </Badge>
                                  )}
                                  {item.is_lost && (
                                    <Badge variant="destructive" className="text-xs">
                                      Lost
                                    </Badge>
                                  )}
                                  {!item.is_new && !item.is_lost && (
                                    <Badge variant="outline" className="text-xs">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(item.last_seen)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid gap-4">
                    {filteredBacklinks.slice(0, 10).map((item, index) => (
                      <Card key={`${item.url_from}-${index}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-base">
                                <a
                                  href={item.url_from}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline text-blue-600 flex items-center gap-2"
                                >
                                  {item.domain_from}
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </CardTitle>
                              <CardDescription>
                                {item.page_from_title || 'No title available'}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              {item.dofollow ? (
                                <Badge variant="success">DoFollow</Badge>
                              ) : (
                                <Badge variant="secondary">NoFollow</Badge>
                              )}
                              <Badge {...getSpamScoreBadge(item.backlink_spam_score)}>
                                Spam: {item.backlink_spam_score}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Anchor Text:</span>
                              <p className="font-medium">{item.anchor || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Type:</span>
                              <p className="font-medium">{item.item_type}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Rank:</span>
                              <p className="font-medium">{item.rank}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Country:</span>
                              <p className="font-medium">{item.domain_from_country || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">First Seen:</span>
                              <p className="font-medium">{formatDate(item.first_seen)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Last Seen:</span>
                              <p className="font-medium">{formatDate(item.last_seen)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="metrics" className="space-y-4">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Link Type Distribution</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {Object.entries(
                          backlinks.reduce((acc, item) => {
                            acc[item.item_type] = (acc[item.item_type] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        )
                          .sort(([, a], [, b]) => b - a)
                          .map(([type, count]) => (
                            <div key={type} className="flex items-center justify-between">
                              <span className="text-sm capitalize">{type}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-secondary rounded-full h-2">
                                  <div
                                    className="bg-primary h-2 rounded-full"
                                    style={{
                                      width: `${(count / backlinks.length) * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-sm font-medium w-8">{count}</span>
                              </div>
                            </div>
                          ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Top Referring Domains</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {Object.entries(
                          backlinks.reduce((acc, item) => {
                            acc[item.domain_from] = (acc[item.domain_from] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        )
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 10)
                          .map(([domain, count]) => (
                            <div key={domain} className="flex items-center justify-between text-sm">
                              <span className="truncate max-w-[200px]">{domain}</span>
                              <Badge variant="secondary">{count}</Badge>
                            </div>
                          ))}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
