import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from './AuthProvider';
import { 
  Smartphone, 
  Wifi, 
  Download, 
  Home, 
  Search, 
  Calendar, 
  MessageCircle, 
  User,
  X,
  MapPin,
  Heart,
  Settings,
  Plus,
  Zap,
  Globe,
  Shield
} from 'lucide-react';

interface MobileOptimizationProps {
  children: React.ReactNode;
}

const MobileOptimization: React.FC<MobileOptimizationProps> = ({ children }) => {
  const location = useLocation();
  const { user, isAdmin } = useAuthContext();
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      setShowInstallPrompt(true);
    };

    // Online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setShowInstallPrompt(false);
    }
    
    setDeferredPrompt(null);
  };



  return (
    <div className="relative">
      {/* Enhanced Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-3 text-center z-50 shadow-lg animate-fade-in-down">
          <div className="flex items-center justify-center space-x-2">
            <Wifi className="h-4 w-4 animate-pulse" />
            <span className="font-medium">You're offline. Some features may be limited.</span>
          </div>
        </div>
      )}

      {/* Enhanced PWA Install Prompt */}
      {showInstallPrompt && isInstallable && (
        <div className="fixed bottom-4 left-4 right-4 md:max-w-sm md:left-auto md:right-4 z-50 animate-fade-in-up">
          <div className="card-gradient shadow-2xl border-2 border-white/30 p-5">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-forest-500 to-earth-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="heading-md text-forest-800 mb-2">Install Harmony Spaces</h4>
                <p className="body-sm text-forest-600 mb-4 leading-relaxed">
                  Get quick access, offline features, and native notifications by installing our app!
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleInstallClick}
                    className="btn-primary text-sm px-4 py-2.5 flex items-center space-x-2 hover-lift"
                  >
                    <Download className="h-4 w-4" />
                    <span>Install</span>
                  </button>
                  <button
                    onClick={() => setShowInstallPrompt(false)}
                    className="btn-outline text-sm px-4 py-2.5"
                  >
                    Later
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="flex-shrink-0 p-1.5 text-forest-400 hover:text-forest-600 rounded-lg hover:bg-forest-50 transition-all duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Enhanced Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20">
        <div className="glass border-t border-white/20 shadow-2xl">
          <div className="flex items-center justify-around py-2 px-2" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
            {/* Home */}
            <Link 
              to="/" 
              className={`flex flex-col items-center p-2 transition-all duration-200 hover:scale-110 active:scale-95 touch-target group ${
                location.pathname === '/' ? 'text-forest-800' : 'text-forest-600 hover:text-forest-800'
              }`}
            >
              <Home className={`h-5 w-5 mb-1 group-hover:scale-110 transition-transform ${
                location.pathname === '/' ? 'text-forest-800' : ''
              }`} />
              <span className="text-xs font-medium">Home</span>
            </Link>

            {/* Discover/Map */}
            {user && (
              <Link 
                to="/map" 
                className={`flex flex-col items-center p-2 transition-all duration-200 hover:scale-110 active:scale-95 touch-target group ${
                  location.pathname === '/map' ? 'text-forest-800' : 'text-forest-600 hover:text-forest-800'
                }`}
              >
                <MapPin className={`h-5 w-5 mb-1 group-hover:scale-110 transition-transform ${
                  location.pathname === '/map' ? 'text-forest-800' : ''
                }`} />
                <span className="text-xs font-medium">Discover</span>
              </Link>
            )}

            {/* Global Feed or Search */}
            <Link 
              to={user ? "/global-feed" : "/search"} 
              className={`flex flex-col items-center p-2 transition-all duration-200 hover:scale-110 active:scale-95 touch-target group ${
                location.pathname === '/global-feed' || location.pathname === '/search' ? 'text-forest-800' : 'text-forest-600 hover:text-forest-800'
              }`}
            >
              {user ? (
                <Globe className={`h-5 w-5 mb-1 group-hover:scale-110 transition-transform ${
                  location.pathname === '/global-feed' ? 'text-forest-800' : ''
                }`} />
              ) : (
                <Search className={`h-5 w-5 mb-1 group-hover:scale-110 transition-transform ${
                  location.pathname === '/search' ? 'text-forest-800' : ''
                }`} />
              )}
              <span className="text-xs font-medium">{user ? 'Feed' : 'Search'}</span>
            </Link>

            {/* Activities or Messages */}
            {user && (
              <Link 
                to="/activities" 
                className={`flex flex-col items-center p-2 transition-all duration-200 hover:scale-110 active:scale-95 touch-target group ${
                  location.pathname === '/activities' || location.pathname === '/my-activities' ? 'text-forest-800' : 'text-forest-600 hover:text-forest-800'
                }`}
              >
                <Calendar className={`h-5 w-5 mb-1 group-hover:scale-110 transition-transform ${
                  location.pathname === '/activities' || location.pathname === '/my-activities' ? 'text-forest-800' : ''
                }`} />
                <span className="text-xs font-medium">Activities</span>
              </Link>
            )}

            {/* Profile or Admin */}
            {user ? (
              <Link 
                to={isAdmin ? "/admin" : "/account"} 
                className={`flex flex-col items-center p-2 transition-all duration-200 hover:scale-110 active:scale-95 touch-target group ${
                  location.pathname === '/account' || location.pathname === '/admin' ? 'text-forest-800' : 'text-forest-600 hover:text-forest-800'
                }`}
              >
                {isAdmin ? (
                  <Shield className={`h-5 w-5 mb-1 group-hover:scale-110 transition-transform ${
                    location.pathname === '/admin' ? 'text-forest-800' : ''
                  }`} />
                ) : (
                  <User className={`h-5 w-5 mb-1 group-hover:scale-110 transition-transform ${
                    location.pathname === '/account' ? 'text-forest-800' : ''
                  }`} />
                )}
                <span className="text-xs font-medium">{isAdmin ? 'Admin' : 'Account'}</span>
              </Link>
            ) : (
              <Link 
                to="/search" 
                className={`flex flex-col items-center p-2 transition-all duration-200 hover:scale-110 active:scale-95 touch-target group ${
                  location.pathname === '/search' ? 'text-forest-800' : 'text-forest-600 hover:text-forest-800'
                }`}
              >
                <User className={`h-5 w-5 mb-1 group-hover:scale-110 transition-transform ${
                  location.pathname === '/search' ? 'text-forest-800' : ''
                }`} />
                <span className="text-xs font-medium">Join</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Styles with design system */}
      <style>{`
        /* Enhanced Touch-friendly interactions */
        @media (max-width: 768px) {
          .touch-target {
            min-height: 44px;
            min-width: 44px;
          }
          
          input, select, textarea {
            min-height: 44px;
            font-size: 16px; /* Prevents zoom on iOS */
            border-radius: 12px;
          }
          
          button {
            min-height: 44px;
            border-radius: 12px;
          }
          
          /* Smooth scrolling with momentum */
          html {
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
          }
          
          /* Prevent unwanted zoom and selection */
          * {
            touch-action: manipulation;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
          }
          
          /* Allow text selection for content */
          p, span, div[contenteditable], input, textarea {
            -webkit-user-select: text;
            user-select: text;
          }
          
          /* Enhanced tap highlights */
          a, button, [role="button"] {
            cursor: pointer;
            -webkit-tap-highlight-color: rgba(77, 124, 42, 0.1);
            -webkit-focus-ring-color: rgba(77, 124, 42, 0.3);
          }
          
          /* Better focus states for mobile */
          input:focus, select:focus, textarea:focus, button:focus {
            outline: 2px solid #4d7c2a;
            outline-offset: 2px;
            border-color: #4d7c2a;
          }
          
          /* Mobile-optimized spacing and layout */
          .mobile-optimized {
            padding-left: max(16px, env(safe-area-inset-left));
            padding-right: max(16px, env(safe-area-inset-right));
            padding-bottom: max(80px, calc(env(safe-area-inset-bottom) + 80px));
          }
          
          /* Enhanced pull-to-refresh */
          .pull-to-refresh {
            transform: translateY(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .pull-to-refresh.active {
            transform: translateY(0);
          }
          
          /* Improved loading states */
          .loading-skeleton {
            background: linear-gradient(
              90deg,
              rgba(240, 247, 237, 0.8) 25%,
              rgba(224, 235, 207, 0.8) 50%,
              rgba(240, 247, 237, 0.8) 75%
            );
            background-size: 200% 100%;
            animation: loading-shimmer 1.5s infinite;
          }
          
          @keyframes loading-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          
          /* Enhanced swipe gestures */
          .swipeable {
            touch-action: pan-x;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          
          .swipeable::-webkit-scrollbar {
            display: none;
          }
          
          /* iOS safe area support */
          .safe-area-inset {
            padding-top: env(safe-area-inset-top);
            padding-right: env(safe-area-inset-right);
            padding-bottom: env(safe-area-inset-bottom);
            padding-left: env(safe-area-inset-left);
          }
          
          /* Enhanced haptic feedback simulation */
          .haptic-light {
            transition: transform 0.1s ease-out;
          }
          
          .haptic-light:active {
            transform: scale(0.98);
          }
          
          /* Better contrast for mobile screens */
          .mobile-high-contrast {
            color: #1c3310;
            font-weight: 500;
          }
          
          /* Optimized image loading */
          img {
            will-change: transform;
            backface-visibility: hidden;
          }
          
          /* Enhanced focus indicators for accessibility */
          .focus-visible {
            outline: 3px solid #4d7c2a;
            outline-offset: 2px;
            border-radius: 8px;
          }
        }
        
        /* Enhanced Dark mode support */
        @media (prefers-color-scheme: dark) {
          .auto-dark {
            background-color: #1a1a1a;
            color: #ffffff;
          }
          
          .auto-dark .glass {
            background-color: rgba(26, 26, 26, 0.8);
            border-color: rgba(255, 255, 255, 0.1);
          }
        }
        
        /* Reduced motion preferences */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
          
          .respect-motion-preference {
            transform: none !important;
          }
        }
        
        /* High contrast support */
        @media (prefers-contrast: high) {
          .high-contrast {
            border: 2px solid currentColor;
            background-color: white;
            color: black;
          }
          
          button {
            border: 2px solid currentColor;
          }
        }
        
        /* Print optimizations */
        @media print {
          .no-print, .mobile-only {
            display: none !important;
          }
          
          .print-friendly {
            background: white !important;
            color: black !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Main Content with slide effect */}
      <div className={`${!isOnline ? 'pt-12' : ''} mobile-optimized`}>
        {children}
      </div>
    </div>
  );
};

export default MobileOptimization;