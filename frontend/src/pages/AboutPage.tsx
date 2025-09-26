import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="about-page">
      {/* Hero Section - Entity Definition */}
      <section className="entity-hero">
        <div className="container">
          <h1>About Artificial Intelligentsia Business Intelligence Platform</h1>
          <p className="entity-definition">
            <strong>Artificial Intelligentsia</strong> is a cutting-edge business intelligence platform that leverages artificial intelligence to deliver comprehensive competitive analysis and market insights for modern businesses.
          </p>
        </div>
      </section>

      {/* What We Are Section */}
      <section className="what-we-are">
        <div className="container">
          <h2>What is Artificial Intelligentsia?</h2>
          <div className="definition-grid">
            <div className="definition-card">
              <h3>🏢 Business Intelligence Platform</h3>
              <p>Artificial Intelligentsia is a comprehensive business intelligence software platform designed for modern enterprises seeking competitive advantage through data-driven insights.</p>
            </div>
            <div className="definition-card">
              <h3>🤖 AI-Powered Analytics Engine</h3>
              <p>Our platform combines advanced artificial intelligence with real-time SEO monitoring, competitive analysis, and automated market intelligence reporting.</p>
            </div>
            <div className="definition-card">
              <h3>🎯 Strategic Intelligence Solution</h3>
              <p>Artificial Intelligentsia transforms raw market data into actionable business strategies through AI-enhanced competitive intelligence and growth opportunity identification.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Knowledge Graph Section */}
      <section className="knowledge-graph">
        <div className="container">
          <h2>Artificial Intelligentsia Platform Overview</h2>
          <div className="knowledge-content">
            
            <div className="knowledge-section">
              <h3>Platform Definition</h3>
              <p><strong>Artificial Intelligentsia Business Intelligence Platform</strong> is a cloud-based software-as-a-service (SaaS) solution that specializes in competitive intelligence, SEO analytics, and market research automation. Founded to democratize enterprise-level business intelligence for companies of all sizes.</p>
            </div>

            <div className="knowledge-section">
              <h3>Core Technology</h3>
              <ul>
                <li><strong>AI Analysis Engine:</strong> Powered by Anthropic Claude for intelligent report synthesis</li>
                <li><strong>Real-time Intelligence:</strong> Perplexity AI integration for live market research</li>
                <li><strong>SEO Intelligence:</strong> DataForSEO API integration across 9 specialized endpoints</li>
                <li><strong>Content Analysis:</strong> Firecrawl technology for competitive content intelligence</li>
                <li><strong>Performance Monitoring:</strong> Google PageSpeed integration for technical SEO</li>
              </ul>
            </div>

            <div className="knowledge-section">
              <h3>Business Model</h3>
              <p>Artificial Intelligentsia operates on a subscription-based model with two primary plans:</p>
              <ul>
                <li><strong>Starter Plan ($49/month):</strong> 1 website analysis, fortnightly AI-powered reports, up to 3 competitor tracking</li>
                <li><strong>Growth Plan ($99/month):</strong> 3 website analysis, enhanced reporting frequency, up to 10 competitor tracking</li>
              </ul>
              <p>All plans include a 14-day free trial period for comprehensive platform evaluation.</p>
            </div>

            <div className="knowledge-section">
              <h3>Industry Applications</h3>
              <div className="applications-grid">
                <div className="application">
                  <h4>Digital Marketing Agencies</h4>
                  <p>Comprehensive competitive analysis and SEO intelligence for client reporting and strategy development.</p>
                </div>
                <div className="application">
                  <h4>E-commerce & Retail</h4>
                  <p>Market positioning analysis, competitor pricing intelligence, and search visibility optimization.</p>
                </div>
                <div className="application">
                  <h4>SaaS & Technology</h4>
                  <p>Product positioning, competitive feature analysis, and technical SEO performance monitoring.</p>
                </div>
                <div className="application">
                  <h4>Enterprise Organizations</h4>
                  <p>Strategic market intelligence, brand monitoring, and comprehensive competitive landscape analysis.</p>
                </div>
              </div>
            </div>

            <div className="knowledge-section">
              <h3>Competitive Differentiation</h3>
              <p>Unlike traditional business intelligence tools, Artificial Intelligentsia combines:</p>
              <ul>
                <li><strong>Real-time AI Analysis:</strong> Live market intelligence synthesis</li>
                <li><strong>Comprehensive SEO Integration:</strong> Technical, content, and competitive SEO analysis</li>
                <li><strong>Automated Reporting:</strong> AI-generated insights with minimal manual intervention</li>
                <li><strong>Edge-Distributed Processing:</strong> Global Cloudflare network for optimal performance</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Entity Associations */}
      <section className="entity-associations">
        <div className="container">
          <h2>Platform Associations & Expertise</h2>
          <div className="associations-grid">
            <div className="association-category">
              <h3>Business Intelligence</h3>
              <ul>
                <li>Competitive Intelligence Software</li>
                <li>Market Research Automation</li>
                <li>Business Analytics Platform</li>
                <li>Strategic Intelligence Solutions</li>
              </ul>
            </div>
            <div className="association-category">
              <h3>AI Analytics</h3>
              <ul>
                <li>Artificial Intelligence Analytics</li>
                <li>Machine Learning Insights</li>
                <li>AI-Powered Market Research</li>
                <li>Automated Intelligence Reporting</li>
              </ul>
            </div>
            <div className="association-category">
              <h3>SEO Tools</h3>
              <ul>
                <li>Enterprise SEO Software</li>
                <li>Competitive SEO Analysis</li>
                <li>Technical SEO Monitoring</li>
                <li>Search Intelligence Platform</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Disambiguation */}
      <section className="brand-disambiguation">
        <div className="container">
          <h2>Brand Clarity</h2>
          <div className="disambiguation-notice">
            <p><strong>Important Note:</strong> Artificial Intelligentsia Business Intelligence Platform is a distinct entity specializing in AI-powered business intelligence software. We are not affiliated with:</p>
            <ul>
              <li>Northwestern University's "Artificial Intelligentsia" art project</li>
              <li>Social media accounts using similar names</li>
              <li>Other entities using "Artificial Intelligentsia" terminology</li>
            </ul>
            <p>Our platform focuses exclusively on <strong>business intelligence</strong>, <strong>competitive analysis</strong>, and <strong>AI-powered market research</strong> for commercial enterprises.</p>
          </div>
        </div>
      </section>

      <style jsx>{`
        .about-page {
          min-height: 100vh;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .entity-hero {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 4rem 0;
          text-align: center;
        }

        .entity-hero h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
          font-weight: 700;
        }

        .branded-subtitle {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          opacity: 0.9;
        }

        .entity-definition {
          font-size: 1.2rem;
          max-width: 800px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .what-we-are {
          padding: 4rem 0;
          background: #f8fafc;
        }

        .what-we-are h2 {
          text-align: center;
          margin-bottom: 3rem;
          font-size: 2.5rem;
          color: #1a202c;
        }

        .definition-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .definition-card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .definition-card h3 {
          color: #2d3748;
          margin-bottom: 1rem;
        }

        .knowledge-graph {
          padding: 4rem 0;
        }

        .knowledge-graph h2 {
          text-align: center;
          margin-bottom: 3rem;
          color: #1a202c;
        }

        .knowledge-section {
          margin-bottom: 3rem;
          padding: 2rem;
          border-left: 4px solid #667eea;
          background: #f7fafc;
        }

        .knowledge-section h3 {
          color: #2d3748;
          margin-bottom: 1rem;
        }

        .applications-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-top: 1rem;
        }

        .application {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .application h4 {
          color: #667eea;
          margin-bottom: 0.5rem;
        }

        .entity-associations {
          padding: 4rem 0;
          background: #f8fafc;
        }

        .entity-associations h2 {
          text-align: center;
          margin-bottom: 3rem;
          color: #1a202c;
        }

        .associations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .association-category {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .association-category h3 {
          color: #667eea;
          margin-bottom: 1rem;
          border-bottom: 2px solid #667eea;
          padding-bottom: 0.5rem;
        }

        .brand-disambiguation {
          padding: 4rem 0;
          background: #fff5f5;
        }

        .brand-disambiguation h2 {
          text-align: center;
          margin-bottom: 2rem;
          color: #1a202c;
        }

        .disambiguation-notice {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 2rem;
          border-radius: 12px;
          border: 2px solid #fed7d7;
        }

        .disambiguation-notice strong {
          color: #c53030;
        }

        ul {
          margin: 1rem 0;
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

export default AboutPage;
