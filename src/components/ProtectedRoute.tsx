import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from './AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true, 
  requireAdmin = false 
}) => {
  const { user, loading, isAdmin, openAuthModalGlobal } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && requireAuth && !user) {
      openAuthModalGlobal('signin');
      navigate('/');
    }
  }, [user, loading, requireAuth, openAuthModalGlobal, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-forest-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    // User will be redirected to home and modal will be shown
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-forest-800 mb-2">Access Denied</h2>
          <p className="text-forest-600">
            You don't have permission to access this page. Admin privileges are required.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;