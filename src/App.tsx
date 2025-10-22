import React, { Suspense, lazy, useState } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './components/AuthProvider';
import KeyboardNavHelper from './components/KeyboardNavHelper';
import AuthModal from './components/AuthModal';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DesktopHeader from './components/DesktopHeader';
import MobileOptimization from './components/MobileOptimization';
import ScrollToTop from './components/ScrollToTop';
import { LoadingSpinner } from './components/LoadingStates';
import { ShareModal } from './components/ShareModal';
import OnboardingModal from './components/OnboardingModal';
import ShareOptionsModal from './components/ShareOptionsModal';
import BottomNavbar from './components/BottomNavbar';
import { ErrorBoundary, ErrorBoundaryClass } from './components/ErrorBoundary';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Map = lazy(() => import('./pages/Map'));
const Search = lazy(() => import('./pages/Search'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const CreateEventSimple = lazy(() => import('./pages/CreateEventSimple'));
const TestMinimalEvent = lazy(() => import('./pages/TestMinimalEvent'));
const EventTemplates = lazy(() => import('./pages/EventTemplates'));
const ShareSpace = lazy(() => import('./pages/ShareSpace'));
const MyActivities = lazy(() => import('./pages/MyActivities'));
const Messages = lazy(() => import('./pages/Messages'));
const Profile = lazy(() => import('./pages/Profile'));
const GlobalFeed = lazy(() => import('./pages/GlobalFeed'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const EventFeedbackForm = lazy(() => import('./components/EventFeedbackForm'));
const EventCalendarPage = lazy(() => import('./pages/EventCalendar'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const Settings = lazy(() => import('./pages/Settings'));
const Spaces = lazy(() => import('./pages/Spaces'));
const SpaceDetail = lazy(() => import('./pages/SpaceDetail'));
const Neighborhoods = lazy(() => import('./pages/Neighborhoods'));
const NeighborhoodDetail = lazy(() => import('./pages/NeighborhoodDetail'));
const SpaceHolderDashboard = lazy(() => import('./pages/SpaceHolderDashboard'));
const BecomeFacilitator = lazy(() => import('./pages/BecomeFacilitator'));
const HyperlocalEvents = lazy(() => import('./pages/HyperlocalEvents'));
const LocationStats = lazy(() => import('./pages/LocationStats'));

// Layout component that wraps all routes
const RootLayout = () => {
  const {
    user,
    showAuthModalGlobal,
    globalAuthMode,
    closeAuthModalGlobal,
    showOnboarding,
    showShareOptions,
    closeOnboarding,
    completeOnboarding,
    closeShareOptions
  } = useAuthContext();
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check if we should hide sidebar/menu (any unauthenticated user)
  const shouldHideSidebar = !user;

  return (
    <MobileOptimization>
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-earth-50/30 relative">
        <ScrollToTop />
        {/* Desktop Header - Always show on desktop */}
        <div className="hidden lg:block">
          <DesktopHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
        </div>

        {/* Sidebar - Show on all screen sizes when user is authenticated */}
        {!shouldHideSidebar && (
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        )}

        {/* Main Content Area - No permanent margin, add top padding for desktop header */}
        <div className={`min-h-screen relative overflow-x-hidden transition-transform duration-300 ease-in-out`}>
          {/* Background Pattern */}
          <div className="fixed inset-0 opacity-[0.02] pointer-events-none">
            <div
              className="absolute inset-0 bg-repeat"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234d7c2a' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}
            ></div>
          </div>

          {/* Navigation - Always show on mobile */}
          <Navbar isMenuOpen={isSidebarOpen} setIsMenuOpen={setIsSidebarOpen} />

          {/* Bottom Navigation for Mobile */}
          <BottomNavbar />


          {/* Main Content with responsive padding - add padding for bottom nav on mobile */}
          <main id="main" className={`pt-12 lg:pt-16 pb-20 md:pb-8 relative z-10 ${
            !shouldHideSidebar && isSidebarOpen ? 'lg:ml-64' : ''
          }`}>
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" text="Loading..." />
              </div>
            }>
              <Outlet />
            </Suspense>
          </main>

          {/* Background Elements for Visual Interest */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute top-1/4 -left-32 w-64 h-64 bg-forest-100/20 rounded-full blur-3xl animate-float"></div>
            <div className="absolute top-3/4 -right-32 w-80 h-80 bg-earth-100/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-blue-100/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Disabled, using Sidebar instead */}
      {/* <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onShareClick={() => setShowShareModal(true)}
      /> */}

      {/* Global Modals - Outside of transformed content */}
      <AuthModal
        isOpen={showAuthModalGlobal}
        onClose={closeAuthModalGlobal}
        initialMode={globalAuthMode}
      />

      {/* Share Modal - Outside of transformed content */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={closeOnboarding}
        onComplete={completeOnboarding}
      />

      {/* Share Options Modal */}
      <ShareOptionsModal
        isOpen={showShareOptions}
        onClose={closeShareOptions}
      />
    </MobileOptimization>
  );
};

// Create router with future flag and routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'map',
        element: <Map />
      },
      {
        path: 'search',
        element: <Search />
      },
      {
        path: 'global-feed',
        element: <GlobalFeed />
      },
      {
        path: 'create-event',
        element: (
          <ProtectedRoute>
            <CreateEvent />
          </ProtectedRoute>
        )
      },
      {
        path: 'create-event-simple',
        element: (
          <ProtectedRoute>
            <CreateEventSimple />
          </ProtectedRoute>
        )
      },
      {
        path: 'test-minimal-event',
        element: (
          <ProtectedRoute>
            <TestMinimalEvent />
          </ProtectedRoute>
        )
      },
      {
        path: 'event-templates',
        element: (
          <ProtectedRoute>
            <EventTemplates />
          </ProtectedRoute>
        )
      },
      {
        path: 'share-space',
        element: (
          <ProtectedRoute>
            <ShareSpace />
          </ProtectedRoute>
        )
      },
      {
        path: 'activities',
        element: (
          <ProtectedRoute>
            <MyActivities />
          </ProtectedRoute>
        )
      },
      {
        path: 'messages',
        element: (
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        )
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        )
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        )
      },
      {
        path: 'location-stats',
        element: (
          <ProtectedRoute>
            <LocationStats />
          </ProtectedRoute>
        )
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        )
      },
      {
        path: 'events/:eventId/feedback',
        element: (
          <ProtectedRoute>
            <EventFeedbackForm />
          </ProtectedRoute>
        )
      },
      {
        path: 'calendar',
        element: <EventCalendarPage />
      },
      {
        path: 'events/:eventId',
        element: <EventDetail />
      },
      {
        path: 'spaces',
        element: <Spaces />
      },
      {
        path: 'spaces/:slug',
        element: <SpaceDetail />
      },
      {
        path: 'neighborhoods',
        element: <Neighborhoods />
      },
      {
        path: 'neighborhoods/:slug',
        element: <NeighborhoodDetail />
      },
      {
        path: 'space-holder-dashboard',
        element: (
          <ProtectedRoute>
            <SpaceHolderDashboard />
          </ProtectedRoute>
        )
      },
      {
        path: 'become-facilitator',
        element: (
          <ProtectedRoute>
            <BecomeFacilitator />
          </ProtectedRoute>
        )
      },
      {
        path: 'hyperlocal',
        element: <HyperlocalEvents />
      },
      {
        path: 'my-activities',
        element: <Navigate to="/activities" replace />
      },
      {
        path: 'account',
        element: <Navigate to="/profile" replace />
      },
      {
        path: '*',
        element: <Navigate to="/" replace />
      }
    ]
  }
], {
  // Enable the v7_startTransition future flag
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true
  }
});

function App() {
  return (
    <ErrorBoundaryClass>
      <AuthProvider>
        <KeyboardNavHelper />
        <RouterProvider router={router} />
      </AuthProvider>
    </ErrorBoundaryClass>
  );
}

export default App;