import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Scatter } from 'react-chartjs-2';
import { Radar } from 'react-chartjs-2';
import { Bar } from 'react-chartjs-2';
import { Network } from 'vis-network/standalone';
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
      <main className="dashboard-container">
        {/* Keyword Search Section */}
        <section className="mb-8">
          <KeywordSearch />
        </section>

        <section className="dashboard-summary">
          <h1>Growth Intelligence Report</h1>
          <p>Captured {new Date(data.summary.captured_at).toLocaleString()}</p>
          <article className="summary-card">
            <h2>Executive Summary</h2>
            <p>{data.summary.executive_summary}</p>
            <h3>Top Recommendations</h3>
            <ul>
              {data.summary.recommendations.map((rec) => (
                <li key={rec.title}>
                  <strong>{rec.title}</strong>
                  <p>{rec.description}</p>
                  <span>Confidence: {(rec.confidence * 100).toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="dashboard-grid">
          <div className="panel" data-chart="line">
            <h3>SERP Share of Voice</h3>
            <Line data={buildSerpTimelineDataset(data.serpTimeline)} />
          </div>

          <div className="panel" data-chart="scatter">
            <h3>Keyword Opportunities</h3>
            <Scatter data={buildKeywordScatterDataset(data.keywordOpportunities)} />
          </div>

          <div className="panel" data-chart="radar">
            <h3>Brand & Sentiment Pulse</h3>
            <Radar data={buildSentimentRadarDataset(data.sentiment)} />
          </div>

          <div className="panel" data-chart="bar">
            <h3>Core Web Vitals</h3>
            <Bar data={buildCoreWebVitalsDataset(data.coreWebVitals)} />
          </div>

          <div className="panel" id="backlink-network-wrapper">
            <h3>Backlink Network</h3>
            <div id="backlink-network" className="network-canvas" />
          </div>

          <div className="panel">
            <h3>Competitor Tech Stack</h3>
            <table className="tech-stack-table">
              <thead>
                <tr>
                  <th>Competitor</th>
                  <th>Technologies</th>
                </tr>
              </thead>
              <tbody>
                {data.techStack.map((entry: TechStackEntry) => (
                  <tr key={entry.competitor}>
                    <td>{entry.competitor}</td>
                    <td>{entry.categories.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ReportPage;

