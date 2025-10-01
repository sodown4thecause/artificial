import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Network } from 'vis-network/standalone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  TrendingUp, BarChart3, Activity, Globe, Search, ExternalLink,
  TrendingDown, AlertCircle, Filter, Download
} from 'lucide-react';

import type {
  IntelligenceReportPayload,
  SerpTimelinePoint,
  KeywordOpportunity,
  SentimentMetric,
  BacklinkMetric,
  CoreWebVitalMetric,
  TechStackEntry,
  BillingStatus
} from '../../types/workflow';
import type { BacklinkResponse, BacklinkItem } from '../../types/backlinks';
import { useAuth } from '@clerk/clerk-react';
import KeywordSearch from '../../components/KeywordSearch';
import './dashboard.css';

const WEBHOOK_URL = 'https://hook.us2.make.com/vo0wugr8juix9untkitdyfpdfbic8ba5';

function useFetchReport(getToken: () => Promise<string | null>) {
  const [data, setData] = useState<IntelligenceReportPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let pollInterval: number | undefined;

    async function fetchReport() {
      setIsLoading(true);
      try {
        const clerkToken = await getToken();
        if (!clerkToken) {
          throw new Error('Not authenticated. Please sign in.');
        }
        
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        
        if (!supabaseUrl) {
          throw new Error('Supabase URL not configured');
        }
        
        const headers: Record<string, string> = {
          'Authorization': `Bearer ${clerkToken}`
        };

        const apiUrl = `${supabaseUrl}/functions/v1/reports-latest`;
        const response = await fetch(apiUrl, {
          headers
        });
        
        if (response.status === 202) {
          const statusData = await response.json();
          if (isMounted) {
            setIsProcessing(true);
            setError(statusData.message || 'Your intelligence report is being generated...');
            
            if (!pollInterval) {
              pollInterval = window.setInterval(() => {
                if (isMounted) {
                  fetchReport();
                }
              }, 10000);
            }
          }
          return;
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unable to load report' }));
          throw new Error(errorData.message || 'Unable to load report');
        }

        const payload = (await response.json()) as IntelligenceReportPayload;
        if (isMounted) {
          setData(payload);
          setIsProcessing(false);
          setError(null);
          
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = undefined;
          }
        }
      } catch (err) {
        if (isMounted) {
          setIsProcessing(false);
          setError(err instanceof Error ? err.message : 'Unable to load report');

          // Clear polling interval on error to prevent infinite retries
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = undefined;
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchReport();
    return () => {
      isMounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [getToken]);

  return { data, isLoading, error, isProcessing };
}

function buildBacklinkNetwork(container: HTMLDivElement, metrics: BacklinkMetric[]) {
  const nodes = metrics.map((metric, index) => ({
    id: index + 1,
    label: `${metric.source}\nAuthority ${metric.authority}`,
    shape: 'dot',
    size: Math.min(metric.authority / 2, 40)
  }));

  const edges = metrics.map((metric) => ({
    from: 0,
    to: nodes.find((node) => node.label.startsWith(metric.source))?.id ?? 0,
    label: metric.anchorText,
    font: { align: 'middle' }
  }));

  const networkNodes = [{ id: 0, label: 'Your Domain', size: 50, color: '#2361ff' }, ...nodes];

  return new Network(container, { nodes: networkNodes, edges }, {
    nodes: {
      font: {
        color: '#fff'
      }
    },
    edges: {
      color: '#4ca5ff'
    },
    physics: {
      stabilization: true
    }
  });
}

// Backlinks helper functions
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

function ReportPage() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { data, isLoading, error, isProcessing } = useFetchReport(getToken);
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [networkInstance, setNetworkInstance] = useState<Network | null>(null);
  
  // Backlinks state
  const [backlinkUrl, setBacklinkUrl] = useState('');
  const [backlinkLoading, setBacklinkLoading] = useState(false);
  const [backlinkData, setBacklinkData] = useState<BacklinkResponse | null>(null);
  const [backlinkError, setBacklinkError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rank' | 'spam' | 'date'>('rank');

  useEffect(() => {
    setBillingStatus({ subscribed: true } as BillingStatus);
  }, []);

  useEffect(() => {
    if (!data) return;

    const container = document.getElementById('backlink-network');
    if (container instanceof HTMLDivElement) {
      const instance = buildBacklinkNetwork(container, data.backlinks);
      setNetworkInstance(instance);
    }

    return () => {
      networkInstance?.destroy();
    };
  }, [data]);

  const handleBacklinkSearch = async () => {
    if (!backlinkUrl.trim()) {
      setBacklinkError('Please enter a valid URL');
      return;
    }

    setBacklinkLoading(true);
    setBacklinkError(null);
    setBacklinkData(null);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: backlinkUrl.trim() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setBacklinkData(result);
    } catch (err) {
      setBacklinkError(err instanceof Error ? err.message : 'Failed to fetch backlinks');
    } finally {
      setBacklinkLoading(false);
    }
  };

  const getBacklinks = (): BacklinkItem[] => {
    if (!backlinkData?.tasks?.[0]?.result?.[0]?.items) return [];
    return backlinkData.tasks[0].result[0].items;
  };

  const filterAndSortBacklinks = (backlinks: BacklinkItem[]): BacklinkItem[] => {
    let filtered = backlinks;

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

  if (isLoading) {
    return <div className="app-shell loading-state">Loading intelligence report…</div>;
  }

  if (isProcessing) {
    return (
      <div className="app-shell">
        <main className="dashboard-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div className="empty-state">
            <h1>🚀 Generating Your Intelligence Report</h1>
            <div style={{ margin: '2rem 0', fontSize: '3rem' }}>⚙️</div>
            <p style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#4ca5ff', fontWeight: '600' }}>
              {error || 'Your intelligence report is being generated...'}
            </p>
            <p style={{ fontSize: '1rem', marginBottom: '2rem', color: '#666' }}>
              Our AI agents are analyzing your market, identifying competitors, and gathering insights.
              This typically takes 5-10 minutes. This page will automatically refresh when ready.
            </p>
            <div style={{ display: 'inline-block', padding: '1rem 2rem', background: '#f0f8ff', borderRadius: '8px', color: '#2361ff' }}>
              💡 Tip: Feel free to explore other tabs while we work on your report!
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="app-shell">
        <main className="dashboard-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div className="empty-state">
            <h1>Welcome to Your Intelligence Dashboard</h1>
            <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: '#666' }}>
              {error?.includes('<!doctype') || error?.includes('Unexpected token') 
                ? "You haven't completed the onboarding workflow yet."
                : `Unable to load report: ${error}`}
            </p>
            <p style={{ marginBottom: '2rem' }}>
              Complete the onboarding process to generate your first AI-powered business intelligence report.
            </p>
            <button 
              className="cta primary" 
              type="button" 
              onClick={() => navigate('/onboarding')}
              style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
            >
              Start Onboarding
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Transform data for Recharts
  const serpData = data.serpTimeline.map((point) => ({
    date: new Date(point.captured_at).toLocaleDateString(),
    shareOfVoice: point.share_of_voice
  }));

  const keywordData = data.keywordOpportunities.map((item) => ({
    difficulty: item.difficulty,
    volume: item.volume,
    ctr: item.ctrPotential,
    keyword: item.keyword
  }));

  const sentimentData = data.sentiment.map((metric) => ({
    subject: metric.label,
    score: metric.score,
    fullMark: 100
  }));

  const webVitalsData = data.coreWebVitals.map((metric) => ({
    metric: metric.metric,
    desktop: metric.desktop,
    mobile: metric.mobile
  }));

  const backlinks = getBacklinks();
  const filteredBacklinks = filterAndSortBacklinks(backlinks);
  const totalBacklinkCount = backlinkData?.tasks?.[0]?.result?.[0]?.total_count || 0;
  const newBacklinks = backlinks.filter((b) => b.is_new).length;
  const lostBacklinks = backlinks.filter((b) => b.is_lost).length;
  const dofollowCount = backlinks.filter((b) => b.dofollow).length;
  const avgSpamScore = backlinks.length > 0
    ? (backlinks.reduce((sum, b) => sum + b.backlink_spam_score, 0) / backlinks.length).toFixed(1)
    : '0';

  return (
    <div className="app-shell">
      <main className="container mx-auto p-6 space-y-6">
        {/* Keyword Search Section */}
        <section className="mb-8">
          <KeywordSearch />
        </section>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Growth Intelligence Report</h1>
            <p className="text-muted-foreground mt-2">
              Captured {new Date(data.summary.captured_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Executive Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
            <CardDescription>AI-powered insights and analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">{data.summary.executive_summary}</p>
            
            <div className="space-y-3 mt-6">
              <h3 className="text-lg font-semibold">Top Recommendations</h3>
              {data.summary.recommendations.map((rec) => (
                <Card key={rec.title} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{rec.title}</CardTitle>
                      <Badge variant="outline">
                        {(rec.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="backlinks">Backlinks</TabsTrigger>
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    SERP Share of Voice
                  </CardTitle>
                  <CardDescription>Your visibility trend over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={serpData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="shareOfVoice" 
                        stroke="#4ca5ff" 
                        fill="#4ca5ff" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Brand & Sentiment Pulse
                  </CardTitle>
                  <CardDescription>Brand perception metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={sentimentData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis />
                      <Radar 
                        name="Sentiment" 
                        dataKey="score" 
                        stroke="#6ec6ff" 
                        fill="#6ec6ff" 
                        fillOpacity={0.3} 
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="keywords" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Keyword Opportunities
                </CardTitle>
                <CardDescription>
                  Visualizing keyword difficulty vs. search volume (size = CTR potential)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="difficulty" 
                      name="Difficulty" 
                      label={{ value: 'Difficulty', position: 'bottom' }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="volume" 
                      name="Volume" 
                      label={{ value: 'Search Volume', angle: -90, position: 'left' }}
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Keywords" data={keywordData} fill="#2361ff">
                      {keywordData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill="#2361ff"
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Core Web Vitals</CardTitle>
                  <CardDescription>Performance metrics across devices</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={webVitalsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metric" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="desktop" fill="#2ecc71" />
                      <Bar dataKey="mobile" fill="#f1c40f" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card id="backlink-network-wrapper">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Backlink Network
                  </CardTitle>
                  <CardDescription>Visual representation of your backlink profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <div id="backlink-network" className="network-canvas h-[300px]" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="backlinks" className="space-y-4">
            {/* Backlinks Search */}
            <Card>
              <CardHeader>
                <CardTitle>Backlink Monitor</CardTitle>
                <CardDescription>Analyze backlinks for any URL in real-time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="https://example.com"
                      value={backlinkUrl}
                      onChange={(e) => setBacklinkUrl(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleBacklinkSearch()}
                      className="pl-9"
                      disabled={backlinkLoading}
                    />
                  </div>
                  <Button onClick={handleBacklinkSearch} disabled={backlinkLoading || !backlinkUrl.trim()}>
                    {backlinkLoading ? 'Analyzing...' : 'Analyze'}
                  </Button>
                </div>
                {backlinkError && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{backlinkError}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Loading State */}
            {backlinkLoading && (
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
            {backlinkData && !backlinkLoading && (
              <>
                {/* Stats Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Backlinks</CardTitle>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalBacklinkCount.toLocaleString()}</div>
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

                {/* Backlinks Table */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Backlink Details</CardTitle>
                        <CardDescription>
                          Comprehensive view of all backlinks
                        </CardDescription>
                      </div>
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
                  </CardHeader>
                  <CardContent>
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
                            filteredBacklinks.slice(0, 20).map((item, index) => (
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
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="competitors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Competitor Tech Stack</CardTitle>
                <CardDescription>
                  Technologies used by your competitors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Competitor</TableHead>
                        <TableHead>Technologies</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.techStack.map((entry: TechStackEntry) => (
                        <TableRow key={entry.competitor}>
                          <TableCell className="font-medium">{entry.competitor}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {entry.categories.map((cat) => (
                                <Badge key={cat} variant="secondary">
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default ReportPage;
