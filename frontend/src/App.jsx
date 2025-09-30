import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import './App.css';
import Header from './components/Header';

const LandingPage = lazy(() => import('./pages/LandingPage.tsx'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage.tsx'));
const TrialSignupPage = lazy(() => import('./pages/TrialSignupPage.tsx'));
const ReportPage = lazy(() => import('./pages/dashboard/Report.tsx'));
const PricingPage = lazy(() => import('./pages/PricingPage.tsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.tsx'));
const FAQPage = lazy(() => import('./pages/FAQPage.tsx'));

function App() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="app-shell loading-state">Loading...</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/trial-signup" element={<TrialSignupPage />} />
          <Route path="/dashboard" element={<ReportPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq" element={<FAQPage />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;

