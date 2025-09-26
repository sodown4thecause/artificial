import React from 'react';
import BrandedHeader from '../../components/BrandedHeader';

const DigitalAgenciesPage: React.FC = () => {
  return (
    <div className="digital-agencies-page">
      <BrandedHeader 
        title="Digital Agencies Solutions"
        subtitle="How Digital Agencies Use Artificial Intelligentsia Business Intelligence for Superior Client Reporting and Competitive Analysis"
      />

      <section className="solution-overview">
        <div className="container">
          <h2>AI-Powered Business Intelligence for Digital Marketing Agencies</h2>
          <p className="overview-text">
            Digital marketing agencies choose Artificial Intelligentsia Business Intelligence Platform to deliver superior client results through comprehensive competitive analysis, automated SEO intelligence, and AI-powered market insights that traditional tools cannot provide.
          </p>

          <div className="benefits-grid">
            <div className="benefit">
              <h3>🎯 Enhanced Client Reporting</h3>
              <p>Generate comprehensive AI-powered competitive intelligence reports that showcase your agency's strategic depth and analytical capabilities to clients.</p>
            </div>
            <div className="benefit">
              <h3>⚡ Automated Analysis</h3>
              <p>Reduce manual research time by 80% with automated competitive monitoring, SEO analysis, and market intelligence gathering.</p>
            </div>
            <div className="benefit">
              <h3>📊 Data-Driven Strategies</h3>
              <p>Base client strategies on real-time competitive intelligence rather than assumptions, improving campaign performance and client retention.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="agency-use-cases">
        <div className="container">
          <h2>How Digital Agencies Use Artificial Intelligentsia for Client Success</h2>
          
          <div className="use-case">
            <h3>Client Onboarding & Competitive Analysis</h3>
            <p>When agencies acquire new clients, Artificial Intelligentsia provides immediate competitive landscape analysis:</p>
            <ul>
              <li><strong>Competitor Identification:</strong> AI automatically discovers direct and indirect competitors through SERP analysis</li>
              <li><strong>Market Position Assessment:</strong> Comprehensive analysis of client's current market position versus competitors</li>
              <li><strong>Opportunity Discovery:</strong> AI identifies untapped keyword opportunities and competitive gaps</li>
              <li><strong>Baseline Reporting:</strong> Automated baseline reports for measuring campaign improvements</li>
            </ul>
          </div>

          <div className="use-case">
            <h3>Ongoing Campaign Optimization</h3>
            <p>Artificial Intelligentsia enables agencies to provide superior ongoing optimization:</p>
            <ul>
              <li><strong>Real-Time Monitoring:</strong> Continuous tracking of competitive changes and market shifts</li>
              <li><strong>Content Strategy Intelligence:</strong> AI analysis of competitor content strategies and performance</li>
              <li><strong>Technical SEO Monitoring:</strong> Automated technical audits and Core Web Vitals tracking</li>
              <li><strong>Backlink Opportunity Discovery:</strong> AI-powered identification of high-value link prospects</li>
            </ul>
          </div>

          <div className="use-case">
            <h3>Client Reporting & Retention</h3>
            <p>Deliver exceptional client value through AI-enhanced reporting:</p>
            <ul>
              <li><strong>Automated Intelligence Reports:</strong> Fortnightly AI-generated competitive intelligence summaries</li>
              <li><strong>Strategic Recommendations:</strong> AI-powered growth strategies based on competitive analysis</li>
              <li><strong>Performance Benchmarking:</strong> Automated comparison against competitors with trend analysis</li>
              <li><strong>Executive Summaries:</strong> AI-generated executive-level insights for C-suite presentations</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="agency-features">
        <div className="container">
          <h2>Platform Features for Digital Marketing Agencies</h2>
          
          <div className="features-grid">
            <div className="feature-category">
              <h3>🔍 Competitive Intelligence</h3>
              <ul>
                <li>Automated competitor discovery and monitoring</li>
                <li>Real-time SERP tracking across Google, Bing, Yahoo</li>
                <li>Content strategy analysis and performance metrics</li>
                <li>Technology stack and infrastructure analysis</li>
              </ul>
            </div>

            <div className="feature-category">
              <h3>📊 SEO Intelligence</h3>
              <ul>
                <li>Keyword opportunity discovery with search volume data</li>
                <li>Technical SEO auditing and Core Web Vitals monitoring</li>
                <li>Backlink quality analysis and prospect identification</li>
                <li>On-page optimization recommendations</li>
              </ul>
            </div>

            <div className="feature-category">
              <h3>🤖 AI-Powered Insights</h3>
              <ul>
                <li>Automated report generation with strategic recommendations</li>
                <li>Real-time market intelligence synthesis</li>
                <li>Predictive analytics for trend identification</li>
                <li>Natural language insights for client communication</li>
              </ul>
            </div>

            <div className="feature-category">
              <h3>📈 Client Success Tools</h3>
              <ul>
                <li>White-label reporting for agency branding</li>
                <li>Multi-client dashboard management</li>
                <li>Automated alert systems for competitive changes</li>
                <li>ROI tracking and performance attribution</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="agency-pricing">
        <div className="container">
          <h2>Pricing for Digital Marketing Agencies</h2>
          <div className="pricing-comparison">
            <div className="pricing-plan">
              <h3>Agency Starter</h3>
              <p className="price">$49/month per client</p>
              <p className="plan-description">Perfect for smaller agencies or individual client management</p>
              <ul>
                <li>1 website analysis per client</li>
                <li>Fortnightly AI-powered competitive reports</li>
                <li>Up to 3 competitor tracking</li>
                <li>Complete technical and backlink analysis</li>
                <li>Client dashboard access</li>
              </ul>
            </div>

            <div className="pricing-plan featured">
              <h3>Agency Growth</h3>
              <p className="price">$99/month per client</p>
              <p className="plan-description">Ideal for agencies managing comprehensive client portfolios</p>
              <ul>
                <li>Up to 3 website analysis per client</li>
                <li>3 reports per fortnight + ongoing monitoring</li>
                <li>Up to 10 competitor tracking</li>
                <li>Advanced technical and backlink analysis</li>
                <li>Priority support and custom integrations</li>
              </ul>
            </div>
          </div>

          <div className="agency-value">
            <h3>Why Agencies Choose Artificial Intelligentsia</h3>
            <div className="value-points">
              <div className="value-point">
                <h4>Reduce Research Time</h4>
                <p>Automate 80% of competitive research that typically requires hours of manual analysis</p>
              </div>
              <div className="value-point">
                <h4>Improve Client Retention</h4>
                <p>Deliver deeper insights and strategic recommendations that justify higher retainer fees</p>
              </div>
              <div className="value-point">
                <h4>Scale Operations</h4>
                <p>Handle more clients without proportionally increasing research and analysis overhead</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .digital-agencies-page {
          min-height: 100vh;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .solution-overview {
          padding: 4rem 0;
          background: white;
        }

        .solution-overview h2 {
          text-align: center;
          color: #1a202c;
          margin-bottom: 2rem;
          font-size: 2.5rem;
        }

        .overview-text {
          font-size: 1.2rem;
          text-align: center;
          max-width: 800px;
          margin: 0 auto 3rem auto;
          line-height: 1.7;
          color: #4a5568;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .benefit {
          background: #f7fafc;
          padding: 2rem;
          border-radius: 12px;
          border-left: 4px solid #667eea;
        }

        .benefit h3 {
          color: #2d3748;
          margin-bottom: 1rem;
        }

        .agency-use-cases {
          padding: 4rem 0;
          background: #f8fafc;
        }

        .agency-use-cases h2 {
          text-align: center;
          color: #1a202c;
          margin-bottom: 3rem;
        }

        .use-case {
          background: white;
          padding: 2rem;
          margin: 2rem 0;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .use-case h3 {
          color: #667eea;
          margin-bottom: 1rem;
          font-size: 1.3rem;
        }

        .agency-features {
          padding: 4rem 0;
          background: white;
        }

        .agency-features h2 {
          text-align: center;
          color: #1a202c;
          margin-bottom: 3rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .feature-category {
          background: #f7fafc;
          padding: 2rem;
          border-radius: 12px;
          border-top: 4px solid #667eea;
        }

        .feature-category h3 {
          color: #2d3748;
          margin-bottom: 1rem;
        }

        .agency-pricing {
          padding: 4rem 0;
          background: #f8fafc;
        }

        .agency-pricing h2 {
          text-align: center;
          color: #1a202c;
          margin-bottom: 3rem;
        }

        .pricing-comparison {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .pricing-plan {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          text-align: center;
        }

        .pricing-plan.featured {
          border: 2px solid #667eea;
          position: relative;
        }

        .pricing-plan.featured::before {
          content: "Most Popular";
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: #667eea;
          color: white;
          padding: 0.25rem 1rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .pricing-plan h3 {
          color: #2d3748;
          margin-bottom: 1rem;
        }

        .price {
          font-size: 2.5rem;
          font-weight: 700;
          color: #667eea;
          display: block;
          margin-bottom: 0.5rem;
        }

        .plan-description {
          color: #6b7280;
          margin-bottom: 1.5rem;
          font-style: italic;
        }

        .agency-value {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .agency-value h3 {
          text-align: center;
          color: #2d3748;
          margin-bottom: 2rem;
        }

        .value-points {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .value-point {
          text-align: center;
          padding: 1rem;
        }

        .value-point h4 {
          color: #667eea;
          margin-bottom: 0.5rem;
        }

        ul {
          text-align: left;
          padding-left: 1.5rem;
        }

        li {
          margin: 0.5rem 0;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
};

export default DigitalAgenciesPage;
