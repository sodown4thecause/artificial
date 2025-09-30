import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import type { BillingStatus } from '../types/workflow';
import brandLogo from '../logo.svg';
import './pricing.css';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small businesses and startups getting started with AI-powered insights',
    price: 49,
    billing: 'month',
    popular: true,
    trialDays: 14,
    features: [
      'Track up to 500 keywords',
      'Monitor 5 competitors',
      'Basic SERP tracking',
      'Monthly intelligence reports',
      'Email support',
      'API access (1,000 requests/month)',
      'Core Web Vitals monitoring',
      'Basic backlink analysis'
    ],
    limitations: [
      'Limited to 1 domain',
      'Basic sentiment analysis',
      'Standard data refresh (daily)'
    ]
  }
];

const additionalFeatures = [
  {
    category: 'Search Intelligence',
    features: [
      { name: 'Keyword Research & Tracking', value: '500 keywords' },
      { name: 'SERP Feature Monitoring', value: 'Basic' },
      { name: 'Competitor Analysis', value: '5 competitors' },
      { name: 'Search Volume Data', value: '✓' },
      { name: 'CPC & Competition Metrics', value: '✓' }
    ]
  },
  {
    category: 'Technical SEO',
    features: [
      { name: 'Site Crawling', value: 'Basic' },
      { name: 'Core Web Vitals', value: '✓' },
      { name: 'Page Speed Analysis', value: 'Basic' },
      { name: 'Technical Issue Detection', value: 'Basic' },
      { name: 'Mobile Optimization Tracking', value: '✓' }
    ]
  },
  {
    category: 'Content Intelligence',
    features: [
      { name: 'Content Gap Analysis', value: 'Basic' },
      { name: 'Brand Sentiment Tracking', value: 'Basic' },
      { name: 'Content Performance Metrics', value: '✓' },
      { name: 'AI Content Recommendations', value: 'Basic' },
      { name: 'Topic Authority Tracking', value: 'Basic' }
    ]
  },
  {
    category: 'Reporting & Analytics',
    features: [
      { name: 'Automated Reports', value: 'Monthly' },
      { name: 'Custom Dashboards', value: 'Basic' },
      { name: 'API Access', value: '1,000/month' },
      { name: 'Data Export', value: 'CSV' },
      { name: 'Email Support', value: '✓' }
    ]
  }
];

const faqs = [
  {
    question: 'How does the free trial work?',
    answer: 'All plans include a free trial period (14-30 days depending on plan). No credit card required to start. You\'ll have full access to all features during your trial period.'
  },
  {
    question: 'Can I change plans anytime?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle, and we\'ll prorate any differences.'
  },
  {
    question: 'What happens to my data if I cancel?',
    answer: 'Your data remains accessible for 30 days after cancellation. You can export all your data during this period. Enterprise customers get extended retention periods.'
  },
  {
    question: 'Do you offer custom enterprise solutions?',
    answer: 'Absolutely! We work with large organizations to create custom solutions including dedicated infrastructure, custom integrations, and specialized reporting.'
  },
  {
    question: 'Is there an API available?',
    answer: 'Yes, all plans include API access with different rate limits. Our REST API allows you to integrate our intelligence data directly into your existing workflows and tools.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, PayPal, and can arrange ACH/wire transfers for Enterprise customers. All payments are processed securely through Stripe.'
  }
];

interface PricingPageProps {}

function PricingPage({}: PricingPageProps) {
  const navigate = useNavigate();
  const { user, getToken, isSignedIn } = useAuth();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  // Get access token when user is signed in
  useEffect(() => {
    const fetchToken = async () => {
      if (isSignedIn) {
        try {
          const token = await getToken();
          setAccessToken(token);
        } catch (error) {
          console.error('Failed to get token:', error);
          setAccessToken(null);
        }
      } else {
        setAccessToken(null);
      }
    };
    
    fetchToken();
  }, [isSignedIn, getToken]);
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

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

        if (response.ok) {
          const payload = (await response.json()) as BillingStatus;
          setBillingStatus(payload);
        }
      } catch (error) {
        console.error('Failed to fetch billing status:', error);
      }
    }

    fetchBillingStatus();
  }, [accessToken]);

  const handleSelectPlan = async (planId: string, trialDays: number) => {
    if (!accessToken) {
      window.location.href = 'https://accounts.artificialintelligentsia.co/sign-up';
      return;
    }

    setIsLoading(true);
    setSelectedPlan(planId);

    try {
      const response = await fetch('/functions/v1/create-checkout-session', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId,
          trialDays,
          mode: 'checkout'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to start checkout:', error);
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const response = await fetch('/functions/v1/create-checkout-session', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'portal'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to access billing portal');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isSubscribed = Boolean(billingStatus?.subscribed);
  const currentPlan = billingStatus?.plan_type || '';

  return (
    <div className="app-shell">
      <main>
        {/* Pricing Section Header */}
        <section className="section">
          <div className="section-header">
            <h1>Choose Your Intelligence Plan</h1>
            <p>
              Start your free trial today and experience the power of AI-driven business intelligence.
              All plans include full access during your trial period.
            </p>
            <div className="hero-cta">
              {isSubscribed && (
                <button
                  className="cta primary"
                  type="button"
                  onClick={handleManageSubscription}
                  disabled={isLoading}
                >
                  Manage Subscription
                </button>
              )}
              <Link className="cta tertiary" to="/dashboard">
                {isSubscribed ? 'Go to Dashboard' : 'View Demo'}
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing Plans Section */}
        <section className="section" id="pricing">
          <div className="section-header">
            <h2>Simple, Transparent Pricing</h2>
            <p>
              Choose the plan that fits your needs. Start with a free trial and scale as you grow.
              All plans include our core AI-powered insights.
            </p>
          </div>
          
          <div className="pricing-grid">
            {plans.map((plan) => (
              <div 
                key={plan.id} 
                className={`pricing-card ${plan.popular ? 'popular' : ''} ${currentPlan === plan.id ? 'current' : ''}`}
              >
                {plan.popular && <div className="popular-badge">Most Popular</div>}
                {currentPlan === plan.id && <div className="current-badge">Current Plan</div>}
                
                <div className="plan-header">
                  <h3>{plan.name}</h3>
                  <p className="plan-description">{plan.description}</p>
                  <div className="plan-price">
                    <span className="price">${plan.price}</span>
                    <span className="billing">/{plan.billing}</span>
                  </div>
                  <p className="trial-info">{plan.trialDays}-day free trial</p>
                </div>

                <div className="plan-features">
                  <ul>
                    {plan.features.map((feature, index) => (
                      <li key={index} className="feature-included">
                        <span className="feature-icon">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {plan.limitations.length > 0 && (
                    <div className="plan-limitations">
                      <h4>Limitations:</h4>
                      <ul>
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="feature-limited">
                            <span className="feature-icon">!</span>
                            {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="plan-action">
                  {currentPlan === plan.id ? (
                    <button 
                      className="cta secondary" 
                      type="button" 
                      onClick={handleManageSubscription}
                      disabled={isLoading}
                    >
                      Manage Plan
                    </button>
                  ) : (
                    <button 
                      className={`cta ${plan.popular ? 'primary' : 'secondary'}`}
                      type="button" 
                      onClick={() => handleSelectPlan(plan.id, plan.trialDays)}
                      disabled={isLoading && selectedPlan === plan.id}
                    >
                      {isLoading && selectedPlan === plan.id ? 'Processing...' : `Start ${plan.trialDays}-Day Trial`}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Comparison Section */}
        <section className="section alt" id="comparison">
          <div className="section-header">
            <h2>Complete Feature Comparison</h2>
            <p>See exactly what's included in each plan and choose the best fit for your needs.</p>
          </div>

          <div className="comparison-table-wrapper">
            {additionalFeatures.map((category, categoryIndex) => (
              <div key={categoryIndex} className="feature-category">
                <h3 className="category-title">{category.category}</h3>
                <div className="comparison-table">
                  <div className="comparison-header">
                    <div className="feature-column">Feature</div>
                    <div className="plan-column">Starter Plan</div>
                  </div>
                  
                  {category.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="comparison-row">
                      <div className="feature-name">{feature.name}</div>
                      <div className={`feature-value ${feature.value === '—' ? 'unavailable' : 'available'}`}>
                        {feature.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="section" id="faq">
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Got questions? We've got answers. Contact us if you need more information.</p>
          </div>

          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <h3 className="faq-question">{faq.question}</h3>
                <p className="faq-answer">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="section alt" id="get-started">
          <div className="section-header">
            <h2>Ready to Transform Your Business Intelligence?</h2>
            <p>
              Join thousands of businesses using AI-powered insights to stay ahead of the competition.
              Start your free trial today—no credit card required.
            </p>
          </div>

          <div className="final-cta">
            <div className="cta-options">
              <button
                className="cta primary large"
                type="button"
                onClick={() => handleSelectPlan('starter', 14)}
                disabled={isLoading}
              >
                {isLoading ? 'Starting Trial...' : 'Start Free Trial'}
              </button>
              <a 
                className="cta tertiary large" 
                href="https://accounts.artificialintelligentsia.co/sign-up"
              >
                Sign Up Now
              </a>
            </div>
            <p className="cta-subtext">
              ✓ 14-day free trial &nbsp;&nbsp; ✓ No credit card required &nbsp;&nbsp; ✓ Cancel anytime
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Artificial Intelligentsia Business Intelligence Platform. Built for scale, speed, and growth.</p>
      </footer>
    </div>
  );
}

export default PricingPage;