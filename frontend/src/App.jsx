import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import './App.css';
// Clerk Auth (replace Supabase Auth)
import { AuthProvider } from './providers/ClerkAuthProvider.jsx';

const LandingPage = lazy(() => import('./pages/LandingPage.tsx'));
const AuthPage = lazy(() => import('./pages/AuthPage.jsx'));
const ClerkAuthPage = lazy(() => import('./pages/ClerkAuthPage.jsx'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage.tsx'));
const TrialSignupPage = lazy(() => import('./pages/TrialSignupPage.tsx'));
const ReportPage = lazy(() => import('./pages/dashboard/Report.tsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.tsx'));
const FAQPage = lazy(() => import('./pages/FAQPage.tsx'));

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="app-shell loading-state">Loading...</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
        <Route path="/clerk-auth" element={<ClerkAuthPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/trial-signup" element={<TrialSignupPage />} />
          <Route path="/dashboard" element={<ReportPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq" element={<FAQPage />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;

