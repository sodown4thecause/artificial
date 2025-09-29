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
import { useAuth } from '../../providers/AuthProvider.jsx';
import KeywordSearch from '../../components/KeywordSearch';
import './dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  TimeScale,
  PointElement,
  BarElement,
  ScatterController,
  RadarController,
  Filler,
  Title,
  Tooltip,
  Legend
);

function useFetchReport(accessToken?: string | null) {
  const [data, setData] = useState<IntelligenceReportPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchReport() {
      setIsLoading(true);
      try {
        const headers: Record<string, string> = {};
        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`;
        }

        const response = await fetch('/functions/v1/reports/latest', {
          headers
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }

        const payload = (await response.json()) as IntelligenceReportPayload;
        if (isMounted) {
          setData(payload);
        }
      } catch (err) {
        if (isMounted) {
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
    };
  }, [accessToken]);

  return { data, isLoading, error };
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
  const { accessToken } = useAuth();
  const { data, isLoading, error } = useFetchReport(accessToken);
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [networkInstance, setNetworkInstance] = useState<Network | null>(null);

  useEffect(() => {
    async function fetchBillingStatus() {
      if (!accessToken) {
        setBillingStatus(null);
        return;
      }

      try {
        const response = await fetch('/functions/v1/billing-status', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch billing status');
        }

        const payload = (await response.json()) as BillingStatus;
        setBillingStatus(payload);
      } catch (err) {
        console.error(err);
        setBillingStatus(null);
      }
    }

    fetchBillingStatus();
  }, [accessToken]);

  useEffect(() => {
    if (!billingStatus) return;

    const subscribed = Boolean(billingStatus.subscribed);
    if (!subscribed) {
      navigate('/', { replace: true });
    }
  }, [billingStatus, navigate]);

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

  if (error || !data) {
    return <div className="app-shell loading-state">Unable to load report: {error}</div>;
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

