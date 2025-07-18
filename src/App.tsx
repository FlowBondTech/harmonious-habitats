import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './components/AuthProvider';
import KeyboardNavHelper from './components/KeyboardNavHelper';
import AuthModal from './components/AuthModal';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import NotificationCenter from './components/NotificationCenter';
import MobileOptimization from './components/MobileOptimization';
import ScrollToTop from './components/ScrollToTop';
import { LoadingSpinner } from './components/LoadingStates';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Map = lazy(() => import('./pages/Map'));
const Search = lazy(() => import('./pages/Search'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const ShareSpace = lazy(() => import('./pages/ShareSpace'));
const MyActivities = lazy(() => import('./pages/MyActivities'));
const Messages = lazy(() => import('./pages/Messages'));
const Profile = lazy(() => import('./pages/Profile'));
const GlobalFeed = lazy(() => import('./pages/GlobalFeed'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const EventFeedbackForm = lazy(() => import('./components/EventFeedbackForm'));
const EventCalendarPage = lazy(() => import('./pages/EventCalendar'));

const AppContent = () => {
  const { showAuthModalGlobal, globalAuthMode, closeAuthModalGlobal } = useAuthContext();

  return (
    <>
      <KeyboardNavHelper />
      <Router>
        <MobileOptimization>
          <ScrollToTop />
          <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-earth-50/30 relative overflow-x-hidden">
            {/* Background Pattern */}
            <div className="fixed inset-0 opacity-[0.02] pointer-events-none">
              <div 
                className="absolute inset-0 bg-repeat"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234d7c2a' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
              ></div>
            </div>
            
            {/* Navigation */}
            <Navbar />
            
            {/* Notification Center */}
            <NotificationCenter />
            
            {/* Main Content with responsive padding */}
            <main id="main" className="pt-16 pb-20 md:pb-8 min-h-screen relative z-10">
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
                  
                  {/* Fallback Routes */}
                  <Route path="/my-activities" element={<Navigate to="/activities" replace />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </main>
            
            {/* Global Modals */}
            <AuthModal
              isOpen={showAuthModalGlobal}
              onClose={closeAuthModalGlobal}
              initialMode={globalAuthMode}
            />
            
            {/* Background Elements for Visual Interest */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
              <div className="absolute top-1/4 -left-32 w-64 h-64 bg-forest-100/20 rounded-full blur-3xl animate-float"></div>
              <div className="absolute top-3/4 -right-32 w-80 h-80 bg-earth-100/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
              <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-blue-100/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
            </div>
          </div>
        </MobileOptimization>
      </Router>
    </>
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