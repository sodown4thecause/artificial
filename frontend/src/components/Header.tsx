import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, UserButton } from '@clerk/clerk-react';
import { Button } from './ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import brandLogo from '../logo.svg';

function Header() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleAuthAction = () => {
    if (isSignedIn) {
      // User is signed in, could add sign out functionality here if needed
      // For now, the UserButton handles sign out
    } else {
      navigate('/clerk-auth');
    }
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const handlePricingClick = () => {
    navigate('/pricing');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isAuthPage = location.pathname === '/clerk-auth';
  const isOnboardingPage = location.pathname === '/onboarding';

  // Don't show header on auth and onboarding pages
  if (isAuthPage || isOnboardingPage) {
    return null;
  }

  return (
    <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img src={brandLogo} alt="Artificial Intelligentsia" className="h-8 w-auto" />
              <span className="text-white font-semibold text-lg">Artificial Intelligentsia</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-blue-400 ${
                location.pathname === '/' ? 'text-blue-400' : 'text-slate-300'
              }`}
            >
              Home
            </Link>
            <Link
              to="/pricing"
              className={`text-sm font-medium transition-colors hover:text-blue-400 ${
                location.pathname === '/pricing' ? 'text-blue-400' : 'text-slate-300'
              }`}
            >
              Pricing
            </Link>
            <Link
              to="/about"
              className={`text-sm font-medium transition-colors hover:text-blue-400 ${
                location.pathname === '/about' ? 'text-blue-400' : 'text-slate-300'
              }`}
            >
              About
            </Link>
            <Link
              to="/faq"
              className={`text-sm font-medium transition-colors hover:text-blue-400 ${
                location.pathname === '/faq' ? 'text-blue-400' : 'text-slate-300'
              }`}
            >
              FAQ
            </Link>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {isLoaded && (
              <>
                {isSignedIn ? (
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={handleDashboardClick}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Dashboard
                    </Button>
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: {
                            width: '32px',
                            height: '32px'
                          }
                        }
                      }}
                    />
                  </div>
                ) : (
                  <Button
                    onClick={handleAuthAction}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Sign In
                  </Button>
                )}
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-slate-300 hover:text-white"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 py-4">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors hover:text-blue-400 ${
                  location.pathname === '/' ? 'text-blue-400' : 'text-slate-300'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/pricing"
                className={`text-sm font-medium transition-colors hover:text-blue-400 ${
                  location.pathname === '/pricing' ? 'text-blue-400' : 'text-slate-300'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/about"
                className={`text-sm font-medium transition-colors hover:text-blue-400 ${
                  location.pathname === '/about' ? 'text-blue-400' : 'text-slate-300'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/faq"
                className={`text-sm font-medium transition-colors hover:text-blue-400 ${
                  location.pathname === '/faq' ? 'text-blue-400' : 'text-slate-300'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                FAQ
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
