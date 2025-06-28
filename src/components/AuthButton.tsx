import React from 'react';
import { LogIn, LogOut, User } from 'lucide-react';
import { useAuthContext } from './AuthProvider';

const AuthButton: React.FC = () => {
  const { user, profile, signOut, loading, openAuthModalGlobal } = useAuthContext();

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="w-8 h-8 border-2 border-forest-200 border-t-forest-600 rounded-full animate-spin"></div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-3">
        <div className="hidden sm:flex items-center space-x-2">
          <div className="w-8 h-8 bg-forest-100 rounded-full flex items-center justify-center">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name || 'User'} 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-forest-600" />
            )}
          </div>
          <span className="text-sm font-medium text-forest-700">
            {profile?.full_name || user.email}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-2 px-4 py-2 text-forest-600 hover:bg-forest-50 rounded-xl transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => openAuthModalGlobal('signin')}
        className="flex items-center space-x-2 px-4 py-2 text-forest-600 hover:bg-forest-50 rounded-xl transition-colors"
      >
        <LogIn className="h-4 w-4" />
        <span>Sign In</span>
      </button>
      <button
        onClick={() => openAuthModalGlobal('signup')}
        className="flex items-center space-x-2 bg-gradient-to-r from-forest-600 to-forest-700 hover:from-forest-700 hover:to-forest-800 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm hover:shadow-md"
      >
        <User className="h-4 w-4" />
        <span>Join</span>
      </button>
    </div>
  );
};

export default AuthButton;