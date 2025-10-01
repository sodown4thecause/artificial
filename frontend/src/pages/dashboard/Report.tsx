import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Scatter } from 'react-chartjs-2';
import { Radar } from 'react-chartjs-2';
import { Bar } from 'react-chartjs-2';
import { Network } from 'vis-network/standalone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { TrendingUp, BarChart3, Activity, Globe } from 'lucide-react';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  RadarController,
  RadialLinearScale,
  ScatterController,
  TimeScale,
  Title,
  Tooltip
} from 'chart.js';

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
import { useAuth } from '@clerk/clerk-react';
import KeywordSearch from '../../components/KeywordSearch';
import './dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  TimeScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  ScatterController,
  RadarController,
  Filler,
  Title,
  Tooltip,
  Legend
);

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
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'x-clerk-token': clerkToken
        };

        const apiUrl = `${supabaseUrl}/functions/v1/reports-latest`;
        const response = await fetch(apiUrl, {
          headers
        });
        
        // Handle 202 status (processing)
        if (response.status === 202) {
          const statusData = await response.json();
          if (isMounted) {
            setIsProcessing(true);
            setError(statusData.message || 'Your intelligence report is being generated...');
            
            // Poll every 10 seconds while processing
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
          
          // Clear polling once report is loaded
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = undefined;
          }
        }
      } catch (err) {
        if (isMounted) {
          setIsProcessing(false);
          setError(err instanceof Error ? err.message : 'Unable to load report');
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

function buildSerpTimelineDataset(points: SerpTimelinePoint[]) {
  return {
    labels: points.map((point) => new Date(point.captured_at).toLocaleDateString()),
    datasets: [
      {
        label: 'Share of Voice %',
        data: points.map((point) => point.share_of_voice),
        fill: true,
        borderColor: '#4ca5ff',
        backgroundColor: 'rgba(76, 165, 255, 0.2)'
      }
    ]
  };
}

function buildKeywordScatterDataset(opportunities: KeywordOpportunity[]) {
  return {
    datasets: [
      {
        label: 'Keyword Opportunities',
        data: opportunities.map((item) => ({
          x: item.difficulty,
          y: item.volume,
          r: Math.min(Math.max(item.ctrPotential * 10, 8), 28)
        })),
        backgroundColor: 'rgba(35, 97, 255, 0.6)'
      }
    ]
  };
}

function buildSentimentRadarDataset(metrics: SentimentMetric[]) {
  return {
    labels: metrics.map((metric) => metric.label),
    datasets: [
      {
        label: 'Sentiment',
        data: metrics.map((metric) => metric.score),
        backgroundColor: 'rgba(110, 198, 255, 0.3)',
        borderColor: '#6ec6ff'
      }
    ]
  };
}

function buildCoreWebVitalsDataset(metrics: CoreWebVitalMetric[]) {
  return {
    labels: metrics.map((metric) => metric.metric),
    datasets: [
      {
        label: 'Desktop',
        data: metrics.map((metric) => metric.desktop),
        backgroundColor: 'rgba(46, 204, 113, 0.7)'
      },
      {
        label: 'Mobile',
        data: metrics.map((metric) => metric.mobile),
        backgroundColor: 'rgba(241, 196, 15, 0.7)'
      }
    ]
  };
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

function ReportPage() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { data, isLoading, error, isProcessing } = useFetchReport(getToken);
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [networkInstance, setNetworkInstance] = useState<Network | null>(null);

  // Billing status check disabled - using Clerk for auth now
  // TODO: Update billing-status function to use Clerk authentication
  useEffect(() => {
    // For now, assume user has access if they're authenticated
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

        {/* Analytics Grid */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
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
                  <Line data={buildSerpTimelineDataset(data.serpTimeline)} />
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
                  <Radar data={buildSentimentRadarDataset(data.sentiment)} />
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
                  Visualizing keyword difficulty vs. search volume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Scatter data={buildKeywordScatterDataset(data.keywordOpportunities)} />
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
                  <Bar data={buildCoreWebVitalsDataset(data.coreWebVitals)} />
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
                  <div id="backlink-network" className="network-canvas h-[400px]" />
                </CardContent>
              </Card>
            </div>
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

