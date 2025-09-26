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

      {/* Competitive Comparison Section */}
      <section className="competitive-comparison">
        <div className="container">
          <h2>Why Choose Artificial Intelligentsia Over Expensive SEO Tools?</h2>
          <p className="comparison-intro">
            Traditional SEO tools like Ahrefs, SEMrush, Moz, and SurferSEO charge premium prices for basic search metrics. Artificial Intelligentsia provides comprehensive AI-powered business intelligence for better value.
          </p>
          
          <div className="comparison-table">
            <div className="comparison-header">
              <div className="platform-col">Traditional SEO Tools</div>
              <div className="ai-col">Artificial Intelligentsia</div>
            </div>
            
            <div className="comparison-row">
              <div className="platform-col">
                <strong>Ahrefs Pro: $129/month</strong>
                <ul>
                  <li>Keyword research</li>
                  <li>Backlink analysis</li>
                  <li>Rank tracking</li>
                  <li>Site auditing</li>
                  <li><em>Manual analysis required</em></li>
                </ul>
              </div>
              <div className="ai-col">
                <strong>Our Starter: $49/month</strong> <span className="savings">62% Less!</span>
                <ul>
                  <li>✅ Everything Ahrefs offers</li>
                  <li>✅ AI-powered competitive intelligence</li>
                  <li>✅ Real-time market research</li>
                  <li>✅ Automated strategic insights</li>
                  <li>✅ Complete business intelligence</li>
                </ul>
              </div>
            </div>

            <div className="comparison-row">
              <div className="platform-col">
                <strong>SEMrush Pro: $119/month</strong>
                <ul>
                  <li>Keyword tracking</li>
                  <li>Domain analysis</li>
                  <li>Content optimization</li>
                  <li>Social media tracking</li>
                  <li><em>Static reporting</em></li>
                </ul>
              </div>
              <div className="ai-col">
                <strong>Our Growth: $99/month</strong> <span className="savings">17% Less!</span>
                <ul>
                  <li>✅ Everything SEMrush offers</li>
                  <li>✅ AI-synthesized competitor strategies</li>
                  <li>✅ Automated market intelligence</li>
                  <li>✅ Real-time competitive monitoring</li>
                  <li>✅ 3 websites vs 1</li>
                </ul>
              </div>
            </div>

            <div className="comparison-row">
              <div className="platform-col">
                <strong>Moz Pro: $99/month</strong>
                <ul>
                  <li>Rank tracking</li>
                  <li>Site crawling</li>
                  <li>Keyword research</li>
                  <li>Link building</li>
                  <li><em>Basic reporting</em></li>
                </ul>
              </div>
              <div className="ai-col">
                <strong>Same Price: $99/month</strong> <span className="value">10x More Value!</span>
                <ul>
                  <li>✅ All Moz capabilities</li>
                  <li>✅ AI-powered competitive analysis</li>
                  <li>✅ Business intelligence insights</li>
                  <li>✅ Automated report generation</li>
                  <li>✅ Strategic growth recommendations</li>
                </ul>
              </div>
            </div>

            <div className="comparison-row">
              <div className="platform-col">
                <strong>SurferSEO Pro: $89/month</strong>
                <ul>
                  <li>Content editor</li>
                  <li>SERP analyzer</li>
                  <li>Keyword research</li>
                  <li>Content audit</li>
                  <li><em>Content focus only</em></li>
                </ul>
              </div>
              <div className="ai-col">
                <strong>Better Choice: $49-99/month</strong>
                <ul>
                  <li>✅ Advanced content analysis</li>
                  <li>✅ AI-powered content strategy</li>
                  <li>✅ Competitive content intelligence</li>
                  <li>✅ Complete business intelligence</li>
                  <li>✅ Beyond just content optimization</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <h2>Common Questions About Artificial Intelligentsia</h2>
          
          <div className="faq-grid">
            <div className="faq-item">
              <h3>What is Artificial Intelligentsia?</h3>
              <p>Artificial Intelligentsia is a comprehensive business intelligence platform that leverages AI to deliver competitive analysis, SEO monitoring, and automated market intelligence. We are a distinct business software platform focused exclusively on AI-powered business intelligence for commercial enterprises.</p>
            </div>

            <div className="faq-item">
              <h3>How does it differ from Ahrefs, SEMrush, or Moz?</h3>
              <p>Traditional SEO tools provide raw data requiring manual interpretation. Artificial Intelligentsia uses AI to automatically analyze competitive data, generate strategic insights, and provide real-time market intelligence. We offer comprehensive business intelligence for 17-62% less than competitors charge for basic SEO metrics.</p>
            </div>

            <div className="faq-item">
              <h3>What's included in the 14-day free trial?</h3>
              <p>Full access to all features: AI-powered competitive analysis, automated report generation, real-time market intelligence, competitor tracking, technical SEO auditing, and strategic recommendations. No credit card required, cancel anytime.</p>
            </div>

            <div className="faq-item">
              <h3>Why is this better value than expensive SEO tools?</h3>
              <p>Traditional tools like Ahrefs ($129), SEMrush ($119), and Moz ($99) only provide SEO data requiring manual analysis. We provide complete AI-powered business intelligence with automated insights for $49-99/month - delivering 10x more value with strategic recommendations.</p>
            </div>

            <div className="faq-item">
              <h3>How accurate is the AI analysis?</h3>
              <p>Our AI combines real-time data from 9 specialized DataForSEO endpoints, live web intelligence from Perplexity, and comprehensive content analysis. All recommendations include confidence scores based on current market data, not historical estimates like traditional tools.</p>
            </div>

            <div className="faq-item">
              <h3>Is this suitable for agencies and enterprises?</h3>
              <p>Absolutely! Agencies reduce research time by 80% and provide superior client reporting. Enterprises get strategic market intelligence for decision-making. Both benefit from AI-powered analysis that traditional SEO tools cannot provide.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Artificial Intelligentsia Business Intelligence Platform. Built for scale, speed, and growth.</p>
      </footer>
    </div>
  );
}

export default LandingPage;

// Additional CSS for new sections
const additionalStyles = `
.competitive-comparison {
  padding: 4rem 0;
  background: #f8fafc;
}

.competitive-comparison h2 {
  text-align: center;
  color: #1a202c;
  margin-bottom: 2rem;
  font-size: 2.5rem;
}

.comparison-intro {
  text-align: center;
  font-size: 1.2rem;
  max-width: 800px;
  margin: 0 auto 3rem auto;
  color: #4a5568;
  line-height: 1.6;
}

.comparison-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.comparison-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #667eea;
  color: white;
  padding: 1rem;
  font-weight: 600;
  text-align: center;
}

.comparison-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid #e2e8f0;
}

.comparison-row:last-child {
  border-bottom: none;
}

.platform-col, .ai-col {
  padding: 2rem;
}

.platform-col {
  background: #fef5e7;
  border-right: 1px solid #e2e8f0;
}

.ai-col {
  background: #f0f9ff;
}

.savings {
  background: #10b981;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.value {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.faq-section {
  padding: 4rem 0;
  background: white;
}

.faq-section h2 {
  text-align: center;
  color: #1a202c;
  margin-bottom: 3rem;
  font-size: 2.5rem;
}

.faq-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.faq-item {
  background: #f7fafc;
  padding: 2rem;
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.faq-item h3 {
  color: #2d3748;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.faq-item p {
  color: #4a5568;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .comparison-header, .comparison-row {
    grid-template-columns: 1fr;
  }
  
  .platform-col {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .faq-grid {
    grid-template-columns: 1fr;
  }
}
`;

