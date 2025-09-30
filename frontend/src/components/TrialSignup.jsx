import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const TrialSignup = ({ onTrialStarted, defaultCoupon = '' }) => {
  const [selectedPlan, setSelectedPlan] = useState('starter');
  const [couponCode, setCouponCode] = useState(defaultCoupon);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const plans = {
    starter: {
      name: 'BI Dashboard Starter',
      price: '$49',
      subtitle: '1 Website/Industry/Location',
      features: [
        '1 full AI-powered report per fortnight',
        'Ongoing dashboard monitoring',
        'Competitor tracking (up to 3 competitors)',
        'Technical + backlink analysis'
      ]
    },
    growth: {
      name: 'BI Dashboard Growth',
      price: '$99',
      subtitle: 'Up to 3 Websites/Industry/Locations',
      features: [
        '3 reports per fortnight + monitoring dashboards',
        'Competitor tracking (up to 10 competitors)', 
        'Technical + backlink analysis'
      ],
      popular: true
    }
  };

  const startFreeTrial = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please sign in to start your free trial');
        setLoading(false);
        return;
      }

      const response = await fetch('/functions/v1/create-trial-checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planType: selectedPlan,
          couponCode: couponCode.trim() || null,
          trialDays: 14
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create trial');
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
      
    } catch (err) {
      console.error('Trial signup error:', err);
      setError(err.message || 'Failed to start trial');
      setLoading(false);
    }
  };

  return (
    <div className="trial-signup">
      <div className="trial-header">
        <h2>Start Your 14-Day Free Trial - Artificial Intelligentsia Business Intelligence</h2>
        <p>Experience the full power of AI-powered competitive intelligence by Artificial Intelligentsia with no commitment</p>
      </div>

      <div className="plans-container">
        {Object.entries(plans).map(([key, plan]) => (
          <div 
            key={key}
            className={`plan-card ${selectedPlan === key ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
            onClick={() => setSelectedPlan(key)}
          >
            {plan.popular && <div className="popular-badge">Most Popular</div>}
            <h3>{plan.name}</h3>
            <p className="plan-subtitle">{plan.subtitle}</p>
            <div className="plan-price">
              <span className="price">{plan.price}</span>
              <span className="period">/month</span>
            </div>
            <div className="trial-badge">14-Day Free Trial</div>
            <ul className="features-list">
              {plan.features.map((feature, index) => (
                <li key={index}>✓ {feature}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="coupon-section">
        <label htmlFor="coupon">Have a coupon code?</label>
        <input
          id="coupon"
          type="text"
          placeholder="Enter coupon code (optional)"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          disabled={loading}
        />
        <small>
          {defaultCoupon ? (
            <>✅ <strong>{defaultCoupon}</strong> automatically applied for new users!</>
          ) : (
            <>Try: FREETRIAL14 for extended trial benefits</>
          )}
        </small>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <button 
        className="start-trial-btn"
        onClick={startFreeTrial}
        disabled={loading}
      >
        {loading ? 'Starting Trial...' : `Start 14-Day Free Trial - ${plans[selectedPlan].name}`}
      </button>

      <div className="trial-info">
        <p>✓ No credit card required for trial</p>
        <p>✓ Cancel anytime during trial</p>
        <p>✓ Full access to all intelligence features</p>
        <p>✓ Generate unlimited reports during trial</p>
      </div>

      <style jsx>{`
        .trial-signup {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .trial-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .trial-header h2 {
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .plans-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        @media (max-width: 768px) {
          .plans-container {
            grid-template-columns: 1fr;
          }
        }

        .plan-card {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .plan-card.selected {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .plan-card.popular {
          border-color: #10b981;
          position: relative;
        }

        .popular-badge {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: #10b981;
          color: white;
          padding: 0.25rem 1rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .plan-subtitle {
          color: #6b7280;
          font-size: 0.9rem;
          margin: 0 0 1rem 0;
          font-style: italic;
        }

        .plan-card h3 {
          margin: 0 0 1rem 0;
          color: #1f2937;
        }

        .plan-price {
          margin-bottom: 1rem;
        }

        .price {
          font-size: 2rem;
          font-weight: bold;
          color: #1f2937;
        }

        .period {
          color: #6b7280;
          font-size: 0.9rem;
        }

        .trial-badge {
          background: #10b981;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 1rem;
        }

        .features-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .features-list li {
          padding: 0.25rem 0;
          color: #4b5563;
        }

        .coupon-section {
          margin: 2rem 0;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
        }

        .coupon-section label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .coupon-section input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          margin-bottom: 0.5rem;
        }

        .coupon-section small {
          color: #6b7280;
        }

        .start-trial-btn {
          width: 100%;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-bottom: 1rem;
        }

        .start-trial-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .start-trial-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .trial-info {
          text-align: center;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .trial-info p {
          margin: 0.25rem 0;
        }

        .error-message {
          background: #fef2f2;
          color: #dc2626;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          border: 1px solid #fecaca;
        }
      `}</style>
    </div>
  );
};

export default TrialSignup;
