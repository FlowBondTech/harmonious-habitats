import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useVibeSession } from './useVibeSession';
import { VibeGuard } from '../components/VibeGuard';

/**
 * Example 1: Protected Route Component
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useVibeSession();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-forest-600 border-t-transparent animate-spin mx-auto"></div>
          <p className="mt-4 text-forest-600">Loading your vibe...</p>
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

/**
 * Example 2: App Component with Vibe Session
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes wrapped in VibeGuard */}
        <Route
          path="/*"
          element={
            <VibeGuard>
              <AuthenticatedApp />
            </VibeGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

/**
 * Example 3: Component using session data
 */
const UserProfile: React.FC = () => {
  const { user, session, loading, error, signOut, refreshSession } = useVibeSession();

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {/* Shimmer loading effect */}
        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <h2 className="text-2xl font-bold text-forest-800 mb-6">Your Vibe</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg animate-fade-in-up">
          <p className="text-red-800">Error: {error.message}</p>
        </div>
      )}

      {user && (
        <div className="space-y-6 animate-fade-in">
          {/* User info */}
          <div className="p-4 bg-forest-50 rounded-lg">
            <h3 className="font-medium text-forest-800 mb-2">Session Info</h3>
            <div className="space-y-1 text-sm">
              <p className="text-forest-600">
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p className="text-forest-600">
                <span className="font-medium">ID:</span> {user.id}
              </p>
              <p className="text-forest-600">
                <span className="font-medium">Session expires:</span>{' '}
                {session?.expires_at ? new Date(session.expires_at).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={refreshSession}
              className="px-4 py-2 bg-forest-100 text-forest-700 rounded-lg hover:bg-forest-200 transition-all hover:scale-105"
              disabled={loading}
            >
              Refresh Vibe
            </button>
            
            <button
              onClick={signOut}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all hover:scale-105"
              disabled={loading}
            >
              End Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Example 4: Login Page that redirects after auth
 */
const LoginPage: React.FC = () => {
  const { user } = useVibeSession();
  const [loading, setLoading] = React.useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user) {
      // Smooth redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 100);
    }
  }, [user]);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // useVibeSession will handle the redirect
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-forest-600 border-t-transparent animate-spin mx-auto"></div>
          <p className="mt-4 text-forest-600">Redirecting to your vibe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest-50 to-earth-50">
      {/* Login form UI */}
    </div>
  );
};

/**
 * Example 5: Layout component with session awareness
 */
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useVibeSession();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-forest-800">Vibe App</h1>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">{user.email}</span>
                <button
                  onClick={signOut}
                  className="text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

// Export examples
export {
  App,
  ProtectedRoute,
  UserProfile,
  LoginPage,
  AppLayout,
};