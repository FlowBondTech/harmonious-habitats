import React from 'react';
import { Navigate } from 'react-router-dom';
import { useVibeSession } from '../hooks/useVibeSession';

interface VibeGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * A smooth authentication guard component that uses useVibeSession
 * Provides graceful loading states and redirects
 */
export const VibeGuard: React.FC<VibeGuardProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, loading, error } = useVibeSession();

  // Smooth loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest-50 to-earth-50">
        <div className="text-center space-y-4">
          <div className="relative">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-forest-200 animate-pulse"></div>
            
            {/* Inner spinning circle */}
            <div className="w-16 h-16 rounded-full border-4 border-forest-600 border-t-transparent animate-spin"></div>
          </div>
          
          <p className="text-forest-600 font-medium animate-fade-in">
            Tuning into your vibe...
          </p>
        </div>
      </div>
    );
  }

  // Error state with smooth styling
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest-50 to-earth-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 animate-fade-in-up">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900">
              Vibe Check Failed
            </h3>
            
            <p className="text-gray-600">
              {error.message || 'Something went wrong. Please try again.'}
            </p>
            
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If no user, component will handle redirect via the hook
  if (!user) {
    return fallback || null;
  }

  // User authenticated, render children
  return <>{children}</>;
};

// Example usage component
export const VibeSessionExample: React.FC = () => {
  const { user, session, loading, error, signOut, refreshSession } = useVibeSession();

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <h2 className="text-xl font-bold text-forest-800 mb-4">Session Vibes</h2>
      
      {loading && (
        <div className="flex items-center space-x-2 text-forest-600">
          <div className="w-4 h-4 rounded-full border-2 border-forest-600 border-t-transparent animate-spin"></div>
          <span>Checking vibes...</span>
        </div>
      )}

      {user && (
        <div className="space-y-4">
          <div className="p-4 bg-forest-50 rounded-lg">
            <p className="text-sm text-forest-600">Signed in as</p>
            <p className="font-medium text-forest-800">{user.email}</p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={refreshSession}
              className="px-4 py-2 bg-forest-100 text-forest-700 rounded-lg hover:bg-forest-200 transition-colors"
            >
              Refresh Session
            </button>
            
            <button
              onClick={signOut}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error.message}</p>
        </div>
      )}
    </div>
  );
};