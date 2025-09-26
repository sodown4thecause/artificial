import React, { useState } from 'react';

const FAQPage: React.FC = () => {
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);

  const faqs = [
    {
      category: "About Artificial Intelligentsia",
      questions: [
        {
          question: "What is Artificial Intelligentsia?",
          answer: "Artificial Intelligentsia is a comprehensive business intelligence platform that leverages artificial intelligence to deliver competitive analysis, SEO monitoring, and automated market intelligence. Unlike art projects or social media accounts with similar names, we are a specialized software platform focused exclusively on AI-powered business intelligence for commercial enterprises."
        },
        {
          question: "How does Artificial Intelligentsia differ from traditional BI tools?",
          answer: "Traditional business intelligence tools require manual data analysis and interpretation. Artificial Intelligentsia automates this process using AI, providing real-time competitive analysis, automated report generation, and intelligent insights. Our platform combines SEO intelligence, competitive monitoring, and AI-powered analysis in a single solution, whereas traditional tools typically require multiple separate platforms."
        },
        {
          question: "Is Artificial Intelligentsia related to other entities with similar names?",
          answer: "No. Artificial Intelligentsia Business Intelligence Platform is a distinct commercial software entity. We are not affiliated with Northwestern University's art project, Instagram accounts, or other entities using similar terminology. Our platform focuses exclusively on AI-powered business intelligence and competitive analysis software."
        }
      ]
    },
    {
      category: "AI-Powered Features",
      questions: [
        {
          question: "How does the AI-powered analysis work?",
          answer: "Our platform uses Anthropic Claude for intelligent report synthesis and Perplexity AI for real-time market intelligence. The AI analyzes competitive data, SEO metrics, and market trends to generate actionable insights automatically. This eliminates the need for manual data interpretation while providing deeper analysis than human analysts could achieve alone."
        },
        {
          question: "What types of competitive intelligence does the AI provide?",
          answer: "The AI analyzes competitor SEO strategies, content performance, backlink profiles, technical SEO health, keyword opportunities, and market positioning. It synthesizes this data into strategic recommendations for improving your competitive position, identifying growth opportunities, and optimizing your digital presence."
        },
        {
          question: "How accurate is the AI-generated market intelligence?",
          answer: "Our AI combines real-time data from DataForSEO's 9 specialized endpoints, live web intelligence from Perplexity, and comprehensive content analysis. The accuracy depends on data freshness and market volatility, but our AI provides probability scores and confidence levels for all recommendations to help you make informed decisions."
        }
      ]
    },
    {
      category: "Business Intelligence Capabilities",
      questions: [
        {
          question: "What business intelligence features are included?",
          answer: "Artificial Intelligentsia provides comprehensive business intelligence including competitive analysis, SEO performance monitoring, keyword opportunity discovery, backlink authority analysis, technical SEO auditing, content strategy insights, and automated market research. All features are powered by AI for deeper analysis and automated reporting."
        },
        {
          question: "How does the competitive analysis work?",
          answer: "Our platform automatically identifies your competitors through SERP analysis, crawls their content strategies using Firecrawl technology, analyzes their backlink profiles, monitors their SEO performance, and tracks their market positioning. The AI then compares this data to your performance and identifies strategic opportunities."
        },
        {
          question: "Can I track multiple competitors simultaneously?",
          answer: "Yes. Our Starter plan tracks up to 3 competitors, while our Growth plan monitors up to 10 competitors simultaneously. The AI automatically discovers competitors through SERP analysis and allows manual competitor addition for comprehensive competitive intelligence."
        }
      ]
    },
    {
      category: "SEO & Analytics",
      questions: [
        {
          question: "What SEO data does Artificial Intelligentsia analyze?",
          answer: "We analyze comprehensive SEO data including search rankings across Google/Bing/Yahoo, keyword search volumes and competition, backlink authority and quality metrics, technical SEO performance, Core Web Vitals, on-page optimization opportunities, and competitive SEO strategies. This data feeds into AI-powered recommendations for SEO improvement."
        },
        {
          question: "How often is the SEO data updated?",
          answer: "SEO data is updated in real-time for rankings and continuously for other metrics. Our Starter plan provides fortnightly comprehensive reports with ongoing dashboard monitoring, while our Growth plan offers enhanced reporting frequency. All plans include real-time competitive monitoring and alerts for significant changes."
        },
        {
          question: "Does the platform integrate with existing SEO tools?",
          answer: "Yes. Artificial Intelligentsia integrates with major SEO data providers including DataForSEO (9 specialized endpoints), Google PageSpeed Insights for Core Web Vitals, and custom search intelligence. The platform serves as a central hub for SEO intelligence while providing AI-enhanced analysis not available in traditional SEO tools."
        }
      ]
    },
    {
      category: "Pricing & Plans",
      questions: [
        {
          question: "What's included in the 14-day free trial?",
          answer: "The free trial includes full access to all Artificial Intelligentsia features: complete competitive analysis, AI-powered reports, real-time SEO monitoring, competitor tracking, technical auditing, and backlink analysis. No credit card required, and you can cancel anytime during the trial period."
        },
        {
          question: "What's the difference between Starter and Growth plans?",
          answer: "Starter ($49/month) covers 1 website with fortnightly AI-powered reports and tracks up to 3 competitors. Growth ($99/month) supports up to 3 websites, provides 3 reports per fortnight, and tracks up to 10 competitors. Both include the same AI-powered analysis depth and ongoing dashboard monitoring."
        },
        {
          question: "Can I change plans or cancel anytime?",
          answer: "Yes. You can upgrade, downgrade, or cancel your Artificial Intelligentsia subscription anytime through your billing dashboard. Plan changes take effect at the next billing cycle, and you retain access to all features until your subscription period ends."
        }
      ]
    }
  ];

  const toggleQuestion = (index: number) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  return (
    <div className="faq-page">
      <header className="faq-hero">
        <div className="container">
          <h1>Frequently Asked Questions</h1>
          <h2>Everything About Artificial Intelligentsia Business Intelligence Platform</h2>
          <p>Get answers about our AI-powered competitive intelligence and business analytics platform</p>
        </div>
      </header>

      <section className="faq-content">
        <div className="container">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="faq-category">
              <h3 className="category-title">{category.category}</h3>
              <div className="questions-list">
                {category.questions.map((faq, questionIndex) => {
                  const globalIndex = categoryIndex * 100 + questionIndex;
                  const isOpen = openQuestion === globalIndex;
                  
                  return (
                    <div key={questionIndex} className="faq-item">
                      <button 
                        className="question-button"
                        onClick={() => toggleQuestion(globalIndex)}
                        aria-expanded={isOpen}
                      >
                        <span className="question-text">{faq.question}</span>
                        <span className={`icon ${isOpen ? 'open' : ''}`}>+</span>
                      </button>
                      
                      {isOpen && (
                        <div className="answer">
                          <p>{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Structured Data for FAQ */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqs.flatMap(category => 
            category.questions.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          )
        })
      }} />

      <style jsx>{`
        .faq-page {
          min-height: 100vh;
          background: #f8fafc;
        }

        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .faq-hero {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 4rem 0;
          text-align: center;
        }

        .faq-hero h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
          font-weight: 700;
        }

        .faq-hero h2 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          opacity: 0.9;
        }

        .faq-content {
          padding: 4rem 0;
        }

        .faq-category {
          margin-bottom: 3rem;
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .category-title {
          color: #667eea;
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
          border-bottom: 2px solid #667eea;
          padding-bottom: 0.5rem;
        }

        .faq-item {
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 1rem;
        }

        .faq-item:last-child {
          border-bottom: none;
        }

        .question-button {
          width: 100%;
          background: none;
          border: none;
          padding: 1.5rem 0;
          text-align: left;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 1.1rem;
          font-weight: 600;
          color: #2d3748;
        }

        .question-button:hover {
          color: #667eea;
        }

        .icon {
          font-size: 1.5rem;
          transition: transform 0.2s;
          color: #667eea;
        }

        .icon.open {
          transform: rotate(45deg);
        }

        .answer {
          padding: 0 0 1.5rem 0;
          color: #4a5568;
          line-height: 1.7;
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default FAQPage;
