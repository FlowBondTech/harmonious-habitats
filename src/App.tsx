import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './components/AuthProvider';
import AuthModal from './components/AuthModal';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Map from './pages/Map';
import MyActivities from './pages/MyActivities';
import Messages from './pages/Messages';
import Search from './pages/Search';
import Profile from './pages/Profile';
import CreateEvent from './pages/CreateEvent';
import ShareSpace from './pages/ShareSpace';
import GlobalFeed from './pages/GlobalFeed';
import AdminDashboard from './pages/AdminDashboard';
import MobileOptimization from './components/MobileOptimization';

const AppContent = () => {
  const { showAuthModalGlobal, globalAuthMode, closeAuthModalGlobal } = useAuthContext();

  return (
    <>
      <MobileOptimization>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
            <Navbar />
            <main className="pt-16">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/map" element={
                  <ProtectedRoute>
                    <Map />
                  </ProtectedRoute>
                } />
                <Route path="/search" element={
                  <ProtectedRoute>
                    <Search />
                  </ProtectedRoute>
                } />
                <Route path="/global-feed" element={
                  <ProtectedRoute>
                    <GlobalFeed />
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
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
          </div>
        </Router>
      </MobileOptimization>

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={showAuthModalGlobal}
        onClose={closeAuthModalGlobal}
        initialMode={globalAuthMode}
      />
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