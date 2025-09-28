import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './components/AuthProvider';
import { DEMO_MODE } from './lib/demo-mode';
import KeyboardNavHelper from './components/KeyboardNavHelper';
import AuthModal from './components/AuthModal';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DesktopHeader from './components/DesktopHeader';
import NotificationCenter from './components/NotificationCenter';
import MobileOptimization from './components/MobileOptimization';
import ScrollToTop from './components/ScrollToTop';
import { LoadingSpinner } from './components/LoadingStates';
import MobileMenu from './components/MobileMenu';
import { ShareModal } from './components/ShareModal';
import OnboardingModal from './components/OnboardingModal';
import ShareOptionsModal from './components/ShareOptionsModal';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Map = lazy(() => import('./pages/Map'));
const Search = lazy(() => import('./pages/Search'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const CreateEventSimple = lazy(() => import('./pages/CreateEventSimple'));
const TestMinimalEvent = lazy(() => import('./pages/TestMinimalEvent'));
const ShareSpace = lazy(() => import('./pages/ShareSpace'));
const MyActivities = lazy(() => import('./pages/MyActivities'));
const Messages = lazy(() => import('./pages/Messages'));
const Profile = lazy(() => import('./pages/Profile'));
const GlobalFeed = lazy(() => import('./pages/GlobalFeed'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const EventFeedbackForm = lazy(() => import('./components/EventFeedbackForm'));
const EventCalendarPage = lazy(() => import('./pages/EventCalendar'));
const Settings = lazy(() => import('./pages/Settings'));
const Spaces = lazy(() => import('./pages/Spaces'));
const SpaceDetail = lazy(() => import('./pages/SpaceDetail'));
const Neighborhoods = lazy(() => import('./pages/Neighborhoods'));
const NeighborhoodDetail = lazy(() => import('./pages/NeighborhoodDetail'));
const SpaceHolderDashboard = lazy(() => import('./pages/SpaceHolderDashboard'));
const BecomeFacilitator = lazy(() => import('./pages/BecomeFacilitator'));
const HyperlocalEvents = lazy(() => import('./pages/HyperlocalEvents'));
const LocationStats = lazy(() => import('./pages/LocationStats'));

const AppContent = () => {
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <KeyboardNavHelper />
      <Router>
        <AppRouter 
          user={user}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          showShareModal={showShareModal}
          setShowShareModal={setShowShareModal}
          showAuthModalGlobal={showAuthModalGlobal}
          globalAuthMode={globalAuthMode}
          closeAuthModalGlobal={closeAuthModalGlobal}
          showOnboarding={showOnboarding}
          showShareOptions={showShareOptions}
          closeOnboarding={closeOnboarding}
          completeOnboarding={completeOnboarding}
          closeShareOptions={closeShareOptions}
        />
      </Router>
    </>
  );
};

const AppRouter = ({ 
  user, 
  isMenuOpen, 
  setIsMenuOpen, 
  isSidebarOpen, 
  setIsSidebarOpen,
  showShareModal,
  setShowShareModal,
  showAuthModalGlobal,
  globalAuthMode,
  closeAuthModalGlobal,
  showOnboarding,
  showShareOptions,
  closeOnboarding,
  completeOnboarding,
  closeShareOptions
}: any) => {
  const location = useLocation();
  
  // Check if we should hide sidebar/menu (any unauthenticated user)
  const shouldHideSidebar = !user;

  return (
    <MobileOptimization>
      <ScrollToTop />
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-earth-50/30 relative">
        {/* Demo Mode Indicator */}
        {DEMO_MODE && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-sage to-forest text-white text-center py-2 px-4 text-sm font-medium shadow-md">
            🌿 Demo Mode - Experience Harmonious Habitats with sample holistic events and community spaces
          </div>
        )}
        {/* Desktop Header - Always show on desktop */}
        <div className={`hidden lg:block ${DEMO_MODE ? 'pt-9' : ''}`}>
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
          
          
          {/* Main Content with responsive padding */}
          <main id="main" className={`${DEMO_MODE ? 'pt-24 lg:pt-24' : 'pt-16 lg:pt-16'} pb-8 relative z-10 ${
            !shouldHideSidebar && isSidebarOpen ? 'lg:ml-64' : ''
          }`}>
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" text="Loading..." />
              </div>
            }>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/map" element={<Map />} />
                <Route path="/search" element={<Search />} />
                <Route path="/global-feed" element={<GlobalFeed />} />
                
                {/* Protected Routes */}
                <Route path="/create-event" element={
                  <ProtectedRoute>
                    <CreateEvent />
                  </ProtectedRoute>
                } />
                <Route path="/create-event-simple" element={
                  <ProtectedRoute>
                    <CreateEventSimple />
                  </ProtectedRoute>
                } />
                <Route path="/test-minimal-event" element={
                  <ProtectedRoute>
                    <TestMinimalEvent />
                  </ProtectedRoute>
                } />
                <Route path="/share-space" element={
                  <ProtectedRoute>
                    <ShareSpace />
                  </ProtectedRoute>
                } />
                <Route path="/activities" element={
                  <ProtectedRoute>
                    <MyActivities />
                  </ProtectedRoute>
                } />
                <Route path="/messages" element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/location-stats" element={
                  <ProtectedRoute>
                    <LocationStats />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/events/:eventId/feedback" element={
                  <ProtectedRoute>
                    <EventFeedbackForm />
                  </ProtectedRoute>
                } />
                <Route path="/calendar" element={
                  <EventCalendarPage />
                } />
                <Route path="/spaces" element={
                  <Spaces />
                } />
                <Route path="/spaces/:slug" element={
                  <SpaceDetail />
                } />
                <Route path="/neighborhoods" element={
                  <Neighborhoods />
                } />
                <Route path="/neighborhoods/:slug" element={
                  <NeighborhoodDetail />
                } />
                <Route path="/space-holder-dashboard" element={
                  <ProtectedRoute>
                    <SpaceHolderDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/become-facilitator" element={
                  <ProtectedRoute>
                    <BecomeFacilitator />
                  </ProtectedRoute>
                } />
                <Route path="/hyperlocal" element={
                  <HyperlocalEvents />
                } />
                
                {/* Fallback Routes */}
                <Route path="/my-activities" element={<Navigate to="/activities" replace />} />
                <Route path="/account" element={<Navigate to="/profile" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;