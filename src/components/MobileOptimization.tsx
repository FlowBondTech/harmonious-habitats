import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Wifi, 
  Bell, 
  Download, 
  Share2, 
  Home, 
  Search, 
  Calendar, 
  MessageCircle, 
  User,
  Menu,
  X,
  MapPin,
  Heart,
  Settings
} from 'lucide-react';

interface MobileOptimizationProps {
  children: React.ReactNode;
}

const MobileOptimization: React.FC<MobileOptimizationProps> = ({ children }) => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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

  const shareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Harmony Spaces',
          text: 'Join your neighborhood community for holistic events and shared spaces',
          url: window.location.origin
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.origin);
      alert('Link copied to clipboard!');
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('Harmony Spaces', {
          body: 'You\'ll now receive notifications about community events!',
          icon: '/icon-192x192.png'
        });
      }
    }
  };

  return (
    <div className="relative">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center text-sm z-50">
          <div className="flex items-center justify-center space-x-2">
            <Wifi className="h-4 w-4" />
            <span>You're offline. Some features may be limited.</span>
          </div>
        </div>
      )}

      {/* PWA Install Prompt */}
      {showInstallPrompt && isInstallable && (
        <div className="fixed bottom-4 left-4 right-4 bg-white rounded-2xl shadow-xl border border-forest-100 p-4 z-50 md:max-w-sm md:left-auto">
          <div className="flex items-start space-x-3">
            <div className="bg-forest-100 p-2 rounded-lg">
              <Smartphone className="h-5 w-5 text-forest-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-forest-800 mb-1">Install Harmony Spaces</h4>
              <p className="text-sm text-forest-600 mb-3">
                Get quick access and offline features by installing our app!
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={handleInstallClick}
                  className="bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Install</span>
                </button>
                <button
                  onClick={() => setShowInstallPrompt(false)}
                  className="bg-forest-100 text-forest-700 hover:bg-forest-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="p-1 text-forest-400 hover:text-forest-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Quick Actions */}
      <div className="md:hidden fixed bottom-4 right-4 z-40">
        <div className="flex flex-col space-y-3">
          {/* Share Button */}
          <button
            onClick={shareApp}
            className="bg-earth-500 hover:bg-earth-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110"
          >
            <Share2 className="h-5 w-5" />
          </button>

          {/* Notification Button */}
          {Notification.permission !== 'granted' && (
            <button
              onClick={requestNotificationPermission}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110"
            >
              <Bell className="h-5 w-5" />
            </button>
          )}

          {/* Quick Menu */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="bg-forest-600 hover:bg-forest-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110"
          >
            {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Quick Menu Overlay */}
        {showMobileMenu && (
          <div className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-xl border border-forest-100 p-4 w-64">
            <h4 className="font-semibold text-forest-800 mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-forest-50 rounded-lg transition-colors">
                <Search className="h-5 w-5 text-forest-600" />
                <span className="text-forest-700">Search Events</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-forest-50 rounded-lg transition-colors">
                <Calendar className="h-5 w-5 text-forest-600" />
                <span className="text-forest-700">Create Event</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-forest-50 rounded-lg transition-colors">
                <Home className="h-5 w-5 text-forest-600" />
                <span className="text-forest-700">Share Space</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-forest-50 rounded-lg transition-colors">
                <MessageCircle className="h-5 w-5 text-forest-600" />
                <span className="text-forest-700">Messages</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-forest-50 rounded-lg transition-colors">
                <MapPin className="h-5 w-5 text-forest-600" />
                <span className="text-forest-700">Nearby Events</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Touch-Optimized Styles */}
      <style jsx global>{`
        /* Touch-friendly button sizes */
        @media (max-width: 768px) {
          button {
            min-height: 44px;
            min-width: 44px;
          }
          
          input, select, textarea {
            min-height: 44px;
            font-size: 16px; /* Prevents zoom on iOS */
          }
          
          /* Smooth scrolling */
          html {
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
          }
          
          /* Prevent zoom on double tap */
          * {
            touch-action: manipulation;
          }
          
          /* Improve tap targets */
          a, button, [role="button"] {
            cursor: pointer;
            -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
          }
          
          /* Better focus states for mobile */
          input:focus, select:focus, textarea:focus {
            outline: 2px solid #4d7c2a;
            outline-offset: 2px;
          }
          
          /* Optimize for mobile viewport */
          .mobile-optimized {
            padding-left: max(16px, env(safe-area-inset-left));
            padding-right: max(16px, env(safe-area-inset-right));
            padding-bottom: max(16px, env(safe-area-inset-bottom));
          }
          
          /* Swipe gestures */
          .swipeable {
            touch-action: pan-x;
          }
          
          /* Loading states */
          .loading-skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
          }
          
          @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          
          /* Pull-to-refresh indicator */
          .pull-to-refresh {
            transform: translateY(-100%);
            transition: transform 0.3s ease;
          }
          
          .pull-to-refresh.active {
            transform: translateY(0);
          }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .auto-dark {
            background-color: #1a1a1a;
            color: #ffffff;
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        /* High contrast support */
        @media (prefers-contrast: high) {
          .high-contrast {
            border: 2px solid currentColor;
          }
        }
      `}</style>

      {/* Main Content */}
      <div className={`${!isOnline ? 'pt-12' : ''} mobile-optimized`}>
        {children}
      </div>

      {/* Mobile Bottom Navigation (if needed) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-forest-100 safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          <button className="flex flex-col items-center p-2 text-forest-600 hover:text-forest-800 transition-colors">
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button className="flex flex-col items-center p-2 text-forest-600 hover:text-forest-800 transition-colors">
            <Search className="h-5 w-5" />
            <span className="text-xs mt-1">Search</span>
          </button>
          <button className="flex flex-col items-center p-2 text-forest-600 hover:text-forest-800 transition-colors">
            <Calendar className="h-5 w-5" />
            <span className="text-xs mt-1">Events</span>
          </button>
          <button className="flex flex-col items-center p-2 text-forest-600 hover:text-forest-800 transition-colors">
            <MessageCircle className="h-5 w-5" />
            <span className="text-xs mt-1">Messages</span>
          </button>
          <button className="flex flex-col items-center p-2 text-forest-600 hover:text-forest-800 transition-colors">
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileOptimization;