import React from 'react';

interface BrandedHeaderProps {
  title?: string;
  subtitle?: string;
  showBrandSuffix?: boolean;
}

const BrandedHeader: React.FC<BrandedHeaderProps> = ({ 
  title, 
  subtitle, 
  showBrandSuffix = true 
}) => {
  const brandedTitle = showBrandSuffix && title 
    ? `${title} - Artificial Intelligentsia Business Intelligence`
    : title || 'Artificial Intelligentsia Business Intelligence Platform';

  // Update document title for SEO
  React.useEffect(() => {
    document.title = brandedTitle;
  }, [brandedTitle]);

  return (
    <header className="branded-header">
      <div className="brand-container">
        <h1 className="main-title">{title || 'Artificial Intelligentsia Business Intelligence Platform'}</h1>
        {showBrandSuffix && title && (
          <p className="brand-suffix">Powered by Artificial Intelligentsia</p>
        )}
        {subtitle && (
          <p className="subtitle">{subtitle}</p>
        )}
        <div className="brand-keywords">
          <span className="keyword">AI-Powered Business Intelligence</span>
          <span className="keyword">Competitive Intelligence Platform</span>
          <span className="keyword">Artificial Intelligentsia Analytics</span>
        </div>
      </div>

      <style jsx>{`
        .branded-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 3rem 0;
          text-align: center;
        }

        .brand-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .main-title {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 1rem;
          line-height: 1.2;
        }

        .brand-suffix {
          font-size: 1.2rem;
          opacity: 0.9;
          margin-bottom: 1rem;
          font-style: italic;
        }

        .subtitle {
          font-size: 1.3rem;
          opacity: 0.95;
          margin-bottom: 2rem;
          line-height: 1.5;
        }

        .brand-keywords {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-top: 1.5rem;
        }

        .keyword {
          background: rgba(255,255,255,0.2);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .main-title {
            font-size: 2rem;
          }
          
          .brand-keywords {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </header>
  );
};

export default BrandedHeader;
