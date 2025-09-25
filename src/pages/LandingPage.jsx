import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../providers/AuthProvider.jsx';
import type { BillingStatus } from '../types/workflow';
import brandLogo from '../logo.svg';

const featureHighlights = [
  {
    title: 'Real-Time Search Performance Monitoring',
    description:
      'Track your rankings across Google, Bing, and Yahoo instantly. Monitor SERP features, competitor positions, and ranking fluctuations 24/7. Our platform delivers actionable search visibility data that helps you capitalize on opportunities the moment they emerge.'
  },
  {
    title: 'Advanced Keyword Research & Opportunity Discovery',
    description:
      'Discover high-value keywords your competitors miss. Access search volume data, CPC metrics, competition scores, and clickstream analytics. Our AI identifies content gaps and untapped keyword opportunities that drive qualified traffic and conversions.'
  },
  {
    title: 'AI-Powered Content Optimization',
    description:
      'Create content that ranks and converts. Our AI Optimization API leverages real-time LLM benchmarking for conversational search optimization. Understand search intent, optimize for voice search, and align content with how users actually search today.'
  },
  {
    title: 'Comprehensive Competitive Analysis',
    description:
      'See exactly what makes your competitors successful. Analyze their backlink profiles, traffic sources, technology stacks, and content strategies. Our platform reveals their strengths, weaknesses, and the strategies driving their growth—so you can do it better.'
  },
  {
    title: 'Technical SEO & Site Performance',
    description:
      'Identify and fix technical issues before they impact rankings. Crawl websites with customizable parameters, monitor page speed, analyze Core Web Vitals, and ensure optimal technical health. Keep your site performing at peak efficiency for users and search engines.'
  },
  {
    title: 'Enterprise Backlink Intelligence',
    description:
      'Build authority with data-driven link strategies. Analyze referring domains, anchor text distribution, link quality metrics, and competitor link profiles. Discover high-value link opportunities and monitor your backlink growth in real-time.'
  }
];

const intelligencePillars = [
  {
    title: 'Search Intelligence',
    points: ['SERP tracking', 'Keyword research', 'Search volume analysis']
  },
  {
    title: 'Competitive Intelligence',
    points: ['Domain analytics', 'Traffic insights', 'Technology detection']
  },
  {
    title: 'Content Intelligence',
    points: ['Sentiment analysis', 'Brand monitoring', 'Content gap identification']
  },
  {
    title: 'Technical Intelligence',
    points: ['Site crawling', 'Performance monitoring', 'SEO health checks']
  },
  {
    title: 'Market Intelligence',
    points: ['Business data enrichment', 'Industry trend analysis', 'Competitor tracking']
  }
];

const capabilityHighlights = [
  'Process millions of keywords simultaneously',
  'Monitor unlimited competitors',
  'Track rankings across multiple search engines',
  'Generate insights in minutes, not weeks',
  'API-first architecture for seamless integration'
];

const advantageStatements = [
  {
    title: 'Predictive Market Insights',
    description:
      'Anticipate market shifts before competitors. Our AI analyzes patterns across billions of data points to identify emerging trends and opportunities.'
  },
  {
    title: 'Automated Opportunity Detection',
    description:
      'Never miss growth opportunities. Our platform continuously discovers new keywords, content gaps, and market segments while you focus on strategy.'
  },
  {
    title: 'ROI-Focused Intelligence',
    description:
      'Make data-driven budget decisions. Understand CPC trends, traffic potential, and conversion opportunities to maximize marketing ROI.'
  },
  {
    title: '360-Degree Visibility',
    description:
      'See the complete picture. From technical SEO to competitor strategies, from keyword opportunities to brand sentiment—everything you need in one unified platform.'
  }
];

const instantAccessHighlights = [
  'Real-time SERP tracking and ranking data',
  'Comprehensive competitor analysis',
  'AI-powered content recommendations',
  'Technical SEO monitoring',
  'Backlink intelligence',
  'Custom API integrations'
];

function LandingPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);

  useEffect(() => {
    async function fetchBillingStatus() {
      if (!accessToken) {
        setBillingStatus(null);
        return;
      }

      setIsLoadingBilling(true);
      try {
        const response = await fetch('/functions/v1/billing-status', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load billing status');
        }

        const payload = (await response.json()) as BillingStatus;
        setBillingStatus(payload);
      } catch (error) {
        console.error(error);
        setBillingStatus(null);
      } finally {
        setIsLoadingBilling(false);
      }
    }

    fetchBillingStatus();
  }, [accessToken]);

  const handleLaunchDashboard = () => {
    navigate('/dashboard');
  };

  const handleUpgrade = async () => {
    if (!accessToken) {
      navigate('/auth');
      return;
    }

    setIsLoadingBilling(true);
    try {
      const response = await fetch('/functions/v1/create-checkout-session', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId: billingStatus?.planId ?? null,
          mode: isSubscribed ? 'portal' : 'checkout'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start billing flow');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingBilling(false);
    }
  };

  const isSubscribed = Boolean(billingStatus?.subscribed);

  return (
    <div className="app-shell">
      <header className="hero-section">
        <div className="hero-content">
          <div className="hero-copy">
            <div className="brand-row">
              <img src={brandLogo} alt="Artificial Intelligentsia logo" className="brand-logo" />
              <p className="eyebrow">Artificial Intelligentsia</p>
            </div>
            <h1>Transform Your Digital Strategy with AI-Powered Business Intelligence</h1>
            <p className="hero-subtext">
              Unlock real-time insights across search, competitors, and market trends with
              our comprehensive AI business intelligence platform—your competitive edge in
              digital marketing.
            </p>
            <div className="hero-cta">
              {!accessToken && (
                <>
                  <Link className="cta primary" to="/auth">
                    Start Free Trial
                  </Link>
                  <a className="cta secondary" href="#demo">
                    Book a Demo
                  </a>
                  <a className="cta tertiary" href="#pricing">
                    View Pricing
                  </a>
                </>
              )}

              {accessToken && (
                <>
                  <button className="cta primary" type="button" onClick={handleLaunchDashboard}>
                    Launch Dashboard
                  </button>
                  <button
                    className={`cta secondary${isLoadingBilling ? ' pending' : ''}`}
                    type="button"
                    onClick={handleUpgrade}
                    disabled={isLoadingBilling}
                  >
                    {isSubscribed ? 'Manage Subscription' : 'Upgrade to Pro'}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="cta-card" id="signup">
            <div className="card-header">
              <h2>Experience AI-Powered Growth</h2>
              <p>
                Create an account in seconds, explore Supabase-authenticated dashboards, and unlock
                a guided onboarding tailored to your business.
              </p>
            </div>
            <div className="cta-card-content">
              <ul>
                <li>Unified login powered by Supabase Auth</li>
                <li>Launch onboarding in under two minutes</li>
                <li>Personalized growth roadmap for your brand</li>
              </ul>
              {!accessToken ? (
                <Link className="cta primary" to="/auth">
                  Continue to Secure Sign-In
                </Link>
              ) : (
                <button className="cta primary" type="button" onClick={handleLaunchDashboard}>
                  Continue to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="section" id="demo">
          <div className="section-header">
            <h2>Complete Market Intelligence for Data-Driven Growth</h2>
            <p>
              Stop guessing. Start knowing. Artificial Intelligentsia delivers the insights you
              need to outperform competitors and accelerate growth.
            </p>
          </div>
          <div className="feature-grid">
            {featureHighlights.map((item) => (
              <article key={item.title} className="feature-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section alt">
          <div className="section-header">
            <h2>Why Leading Businesses Choose Our Platform</h2>
            <p>All your intelligence tools in one platform.</p>
          </div>
          <div className="pillars">
            {intelligencePillars.map((pillar) => (
              <div key={pillar.title} className="pillar-card">
                <h3>{pillar.title}</h3>
                <ul>
                  {pillar.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="pricing">
          <div className="split">
            <div>
              <h2>Powered by Advanced AI</h2>
              <p>
                Integrated OpenAI, Claude, and Perplexity APIs transform raw data into strategic
                recommendations. Get automated insights, predictive analytics, and customized
                reports that drive decision-making.
              </p>
              <ul className="checklist">
                {capabilityHighlights.map((capability) => (
                  <li key={capability}>{capability}</li>
                ))}
              </ul>
            </div>
            <div className="accent-card">
              <h3>Turn Data Into Competitive Advantage</h3>
              <div className="advantages">
                {advantageStatements.map((item) => (
                  <div key={item.title} className="advantage-item">
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section alt">
          <div className="section-header">
            <h2>Start Making Smarter Decisions Today</h2>
            <p>
              Trusted by data-driven marketers who need accurate, real-time intelligence to stay
              ahead. Whether you're an agency managing multiple clients, an enterprise optimizing
              global presence, or a growing business competing against giants—our platform scales
              with your ambitions.
            </p>
          </div>
          <div className="instant-access">
            <div className="instant-copy">
              <h3>Get instant access to:</h3>
              <ul className="checklist">
                {instantAccessHighlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </div>
            <div className="instant-cta">
              <a className="cta secondary" href="#demo">
                Book a Demo
              </a>
              <a className="cta tertiary" href="#pricing">
                View Pricing
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Artificial Intelligentsia. Built for scale, speed, and growth.</p>
      </footer>
    </div>
  );
}

export default LandingPage;

