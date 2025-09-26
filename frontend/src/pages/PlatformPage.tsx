import React from 'react';

const PlatformPage: React.FC = () => {
  return (
    <div className="platform-page">
      {/* Knowledge Graph Hero */}
      <section className="knowledge-hero">
        <div className="container">
          <h1>Artificial Intelligentsia Business Intelligence Platform</h1>
          <h2>Comprehensive AI-Powered Market Intelligence Solution</h2>
          <div className="entity-facts">
            <div className="fact">
              <strong>Category:</strong> Business Intelligence Software
            </div>
            <div className="fact">
              <strong>Type:</strong> SaaS Platform
            </div>
            <div className="fact">
              <strong>Industry:</strong> AI Analytics & SEO Tools
            </div>
            <div className="fact">
              <strong>Founded:</strong> 2025
            </div>
          </div>
        </div>
      </section>

      {/* Platform Definition */}
      <section className="platform-definition">
        <div className="container">
          <h2>Platform Overview</h2>
          <div className="definition-content">
            <p>
              <strong>Artificial Intelligentsia Business Intelligence Platform</strong> is a specialized software solution that combines artificial intelligence, competitive analysis, and real-time market intelligence to provide comprehensive business insights.
            </p>
            
            <p>
              The platform distinguishes itself in the business intelligence sector by offering automated competitive analysis, AI-powered report generation, and real-time SEO monitoring capabilities that traditionally required multiple disparate tools and manual analysis.
            </p>

            <div className="key-differentiators">
              <h3>Key Platform Characteristics</h3>
              <ul>
                <li><strong>AI-First Architecture:</strong> Built around artificial intelligence for automated analysis and insights</li>
                <li><strong>Real-Time Intelligence:</strong> Live market data synthesis and competitive monitoring</li>
                <li><strong>Comprehensive SEO Integration:</strong> 9 specialized DataForSEO API endpoints for complete search intelligence</li>
                <li><strong>Edge-Distributed Processing:</strong> Global Cloudflare infrastructure for optimal performance</li>
                <li><strong>Automated Reporting:</strong> Minimal manual intervention required for comprehensive market analysis</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="technology-stack">
        <div className="container">
          <h2>Platform Technology & Architecture</h2>
          <div className="tech-grid">
            <div className="tech-category">
              <h3>🧠 AI & Machine Learning</h3>
              <ul>
                <li><strong>Anthropic Claude:</strong> Advanced language model for report synthesis</li>
                <li><strong>Perplexity AI:</strong> Real-time web intelligence with Sonar model</li>
                <li><strong>Automated Analysis:</strong> Machine learning-driven competitive insights</li>
              </ul>
            </div>
            
            <div className="tech-category">
              <h3>📊 Data Intelligence APIs</h3>
              <ul>
                <li><strong>DataForSEO Suite:</strong> 9 specialized SEO and market intelligence endpoints</li>
                <li><strong>Firecrawl:</strong> Advanced web content analysis and competitor intelligence</li>
                <li><strong>Google PageSpeed:</strong> Technical SEO and Core Web Vitals monitoring</li>
                <li><strong>Custom Search:</strong> Content discovery and market monitoring</li>
              </ul>
            </div>
            
            <div className="tech-category">
              <h3>🏗️ Infrastructure</h3>
              <ul>
                <li><strong>Supabase:</strong> Real-time database and authentication</li>
                <li><strong>Cloudflare Pages:</strong> Global edge distribution</li>
                <li><strong>Cloudflare Workers:</strong> Serverless API processing</li>
                <li><strong>Stripe:</strong> Subscription billing and trial management</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases & Applications */}
      <section className="use-cases">
        <div className="container">
          <h2>Business Applications & Use Cases</h2>
          <div className="use-cases-content">
            
            <div className="use-case-category">
              <h3>Enterprise Business Intelligence</h3>
              <p>Artificial Intelligentsia serves enterprise organizations requiring comprehensive market intelligence for strategic decision-making, competitive positioning, and growth opportunity identification.</p>
              <ul>
                <li>Strategic planning and market positioning</li>
                <li>Competitive landscape analysis</li>
                <li>Brand monitoring and reputation management</li>
                <li>Market opportunity identification</li>
              </ul>
            </div>

            <div className="use-case-category">
              <h3>SEO & Digital Marketing</h3>
              <p>The platform provides specialized tools for SEO professionals, digital marketers, and agencies seeking comprehensive search intelligence and competitive analysis.</p>
              <ul>
                <li>Real-time search ranking monitoring</li>
                <li>Keyword opportunity discovery</li>
                <li>Backlink authority analysis</li>
                <li>Technical SEO performance auditing</li>
              </ul>
            </div>

            <div className="use-case-category">
              <h3>Market Research & Analytics</h3>
              <p>Automated market research capabilities enable businesses to maintain continuous competitive intelligence without dedicated research teams.</p>
              <ul>
                <li>Automated competitive monitoring</li>
                <li>Market trend identification</li>
                <li>Industry intelligence reporting</li>
                <li>Customer behavior analysis</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Platform History & Development */}
      <section className="platform-history">
        <div className="container">
          <h2>Platform Development & Vision</h2>
          <div className="history-content">
            <p>
              Artificial Intelligentsia Business Intelligence Platform was developed to address the growing need for accessible, AI-powered competitive intelligence in an increasingly complex digital marketplace.
            </p>
            
            <div className="development-timeline">
              <div className="timeline-item">
                <h4>2025 - Platform Foundation</h4>
                <p>Initial development focusing on AI-powered competitive analysis and real-time market intelligence capabilities.</p>
              </div>
              
              <div className="timeline-item">
                <h4>Core Integration Development</h4>
                <p>Integration of specialized APIs including DataForSEO, Anthropic Claude, Perplexity AI, and Firecrawl for comprehensive intelligence gathering.</p>
              </div>
              
              <div className="timeline-item">
                <h4>Edge Infrastructure Deployment</h4>
                <p>Implementation of global edge distribution via Cloudflare infrastructure for optimal performance and reliability.</p>
              </div>
            </div>

            <div className="vision-statement">
              <h3>Platform Vision</h3>
              <p>
                Artificial Intelligentsia aims to democratize enterprise-level business intelligence by making AI-powered competitive analysis accessible to organizations of all sizes. Our vision is to become the definitive platform for automated market intelligence and competitive analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .platform-page {
          min-height: 100vh;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .knowledge-hero {
          background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
          color: white;
          padding: 4rem 0;
          text-align: center;
        }

        .knowledge-hero h1 {
          font-size: 3.5rem;
          margin-bottom: 1rem;
          font-weight: 700;
        }

        .knowledge-hero h2 {
          font-size: 1.5rem;
          opacity: 0.9;
          margin-bottom: 2rem;
        }

        .entity-facts {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .fact {
          background: rgba(255,255,255,0.1);
          padding: 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
        }

        .platform-definition, .technology-stack, .use-cases, .platform-history {
          padding: 4rem 0;
        }

        .platform-definition {
          background: white;
        }

        .technology-stack {
          background: #f8fafc;
        }

        .use-cases {
          background: white;
        }

        .platform-history {
          background: #f8fafc;
        }

        .entity-associations {
          background: #edf2f7;
          padding: 4rem 0;
        }

        .brand-disambiguation {
          background: #fff5f5;
          padding: 3rem 0;
        }

        h2 {
          font-size: 2.5rem;
          color: #1a202c;
          margin-bottom: 2rem;
          text-align: center;
        }

        h3 {
          color: #2d3748;
          margin-bottom: 1rem;
        }

        .definition-content p {
          font-size: 1.1rem;
          line-height: 1.8;
          margin-bottom: 1.5rem;
          color: #4a5568;
        }

        .key-differentiators {
          background: #f7fafc;
          padding: 2rem;
          border-radius: 12px;
          border-left: 4px solid #667eea;
          margin-top: 2rem;
        }

        .tech-grid, .associations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
        }

        .tech-category, .association-category {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .use-cases-content {
          display: grid;
          gap: 2rem;
        }

        .use-case-category {
          background: #f7fafc;
          padding: 2rem;
          border-radius: 12px;
          border-left: 4px solid #48bb78;
        }

        .development-timeline {
          margin: 2rem 0;
        }

        .timeline-item {
          background: white;
          padding: 1.5rem;
          margin: 1rem 0;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }

        .timeline-item h4 {
          color: #667eea;
          margin-bottom: 0.5rem;
        }

        .vision-statement {
          background: #edf2f7;
          padding: 2rem;
          border-radius: 12px;
          text-align: center;
          margin-top: 2rem;
        }

        .disambiguation-notice {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          border: 2px solid #fed7d7;
          max-width: 800px;
          margin: 0 auto;
        }

        .disambiguation-notice ul {
          background: #fef5e7;
          padding: 1rem;
          border-radius: 6px;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
};

export default PlatformPage;
