import React, { useState, useEffect } from 'react';
import { useAuthContext } from './AuthProvider';
import { 
  Smartphone, 
  Wifi, 
  Download, 
  X
} from 'lucide-react';

interface MobileOptimizationProps {
  children: React.ReactNode;
}

const MobileOptimization: React.FC<MobileOptimizationProps> = ({ children }) => {
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
                <h4 className="heading-md text-forest-800 mb-2">Install Harmonik Space</h4>
                <p className="body-sm text-forest-600 mb-4 leading-relaxed">
                  Get quick access, offline features, and native notifications by installing our app!
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleInstallClick}
                    className="btn-primary btn-sm flex items-center space-x-2 hover-lift focus-ring"
                  >
                    <Download className="icon-sm" />
                    <span>Install</span>
                  </button>
                  <button
                    onClick={() => setShowInstallPrompt(false)}
                    className="btn-outline btn-sm focus-ring"
                  >
                    Later
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="flex-shrink-0 p-1.5 text-forest-400 hover:text-forest-600 rounded-lg hover:bg-forest-50 transition-all duration-200 focus-ring"
              >
                <X className="icon-sm" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Removed - Using sidebar menu instead */}

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
            padding-bottom: max(16px, env(safe-area-inset-bottom));
          }
          
          /* Enhanced pull-to-refresh */
          .pull-to-refresh {
            position: relative;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }
          
          /* Mobile card optimization */
          .card {
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            background: rgba(255, 255, 255, 0.95);
          }
          
          /* Enhanced shadow for mobile */
          .mobile-shadow {
            box-shadow: 
              0 1px 3px rgba(0, 0, 0, 0.12),
              0 1px 2px rgba(0, 0, 0, 0.24);
          }
          
          /* Improved mobile navigation gestures */
          .swipe-container {
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          .swipe-container::-webkit-scrollbar {
            display: none;
          }
          
          .swipe-item {
            scroll-snap-align: center;
            flex-shrink: 0;
          }
          
          /* PWA-specific styles */
          @media (display-mode: standalone) {
            body {
              padding-top: max(20px, env(safe-area-inset-top));
            }
          }
          
          /* Prevent iOS bounce effect on main content */
          .main-content {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            overflow: auto;
            -webkit-overflow-scrolling: touch;
          }
          
          /* Enhanced form experience */
          input[type="date"],
          input[type="time"],
          input[type="datetime-local"] {
            appearance: none;
            -webkit-appearance: none;
            background-color: white;
          }
          
          /* Better mobile modals */
          .mobile-modal {
            max-height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }
          
          /* Mobile-optimized images */
          img {
            max-width: 100%;
            height: auto;
            -webkit-touch-callout: none;
          }
          
          /* Improved mobile performance */
          .hardware-accelerated {
            transform: translateZ(0);
            -webkit-transform: translateZ(0);
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
            perspective: 1000px;
            -webkit-perspective: 1000px;
          }
        }
        
        /* Safe area adjustments for different devices */
        @supports (padding: max(0px)) {
          .safe-area-top {
            padding-top: max(16px, env(safe-area-inset-top));
          }
          
          .safe-area-bottom {
            padding-bottom: max(16px, env(safe-area-inset-bottom));
          }
          
          .safe-area-left {
            padding-left: max(16px, env(safe-area-inset-left));
          }
          
          .safe-area-right {
            padding-right: max(16px, env(safe-area-inset-right));
          }
        }
      `}</style>

      {children}
    </div>
  );
};

export default MobileOptimization;