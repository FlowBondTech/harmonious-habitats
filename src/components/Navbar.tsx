import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Map, 
  Globe, 
  CalendarPlus, 
  Calendar, 
  MessageCircle, 
  User, 
  LogOut, 
  LogIn, 
  Sprout, 
  Shield
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import MessagingSystem from './MessagingSystem';
import Avatar from './Avatar';

// Navigation configuration
const NAV_ITEMS = {
  public: [
    { path: '/', icon: Home, label: 'Home' },
  ],
  authenticated: [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/map', icon: Map, label: 'Discover' },
    { path: '/global-feed', icon: Globe, label: 'Global Feed' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/create-event', icon: CalendarPlus, label: 'Create Event' },
    { path: '/activities', icon: Calendar, label: 'Activities' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/account', icon: User, label: 'Account' },
  ],
  admin: { path: '/admin', icon: Shield, label: 'Admin' }
};


// NavLink Component
interface NavLinkProps {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  isAdmin?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ path, icon: Icon, label, isActive, isAdmin }) => {
  const baseStyles = "group relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center space-x-2 hover:scale-105 focus-ring";
  const activeStyles = "bg-gradient-to-r from-forest-100 to-earth-100 text-forest-800 shadow-sm border border-forest-200/50";
  const inactiveStyles = "text-forest-600 hover:bg-white/50 hover:text-forest-700 hover:shadow-sm";
  const adminStyles = isAdmin ? "border border-forest-300 bg-gradient-to-r from-purple-50 to-blue-50" : "";

  return (
    <Link
      to={path}
      className={`${baseStyles} ${isActive ? activeStyles : inactiveStyles} ${adminStyles}`}
    >
      <Icon className={`h-4 w-4 transition-all duration-300 ${isActive ? 'text-forest-700' : 'text-forest-500 group-hover:text-forest-600'}`} />
      <span className="relative">
        {label}
        {isActive && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-forest-600 rounded-full animate-pulse-gentle"></div>
        )}
      </span>
    </Link>
  );
};

// UserProfile Component
interface UserProfileProps {
  user: any;
  profile: any;
  onSignOut: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, profile, onSignOut }) => {
  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-forest-50 to-earth-50 rounded-xl border border-forest-100">
        <Avatar 
          name={profile?.full_name || user.email?.split('@')[0]}
          imageUrl={profile?.avatar_url}
          size="sm"
        />
        <span className="text-sm font-medium text-forest-700 max-w-24 truncate">
          {profile?.full_name || user.email?.split('@')[0]}
        </span>
      </div>
      <button
        onClick={onSignOut}
        className="p-2.5 text-forest-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-300 hover:scale-110 focus-ring group"
        title="Sign Out"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </div>
  );
};

// AuthButtons Component
interface AuthButtonsProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

const AuthButtons: React.FC<AuthButtonsProps> = ({ onSignIn, onSignUp }) => {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onSignIn}
        className="btn-ghost text-sm"
      >
        <LogIn className="h-4 w-4 mr-2" />
        Sign In
      </button>
      <button
        onClick={onSignUp}
        className="btn-primary text-sm py-2.5"
      >
        <User className="h-4 w-4 mr-2" />
        Join
      </button>
    </div>
  );
};

// Main Navbar Component
interface NavbarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ isMenuOpen, setIsMenuOpen }) => {
  const location = useLocation();
  const [showMessages, setShowMessages] = useState(false);
  const { user, profile, isAdmin, signOut, openAuthModalGlobal } = useAuthContext();
  
  // Get navigation items based on user state
  const getNavItems = () => {
    const items = user ? [...NAV_ITEMS.authenticated] : [...NAV_ITEMS.public];
    if (user && isAdmin) {
      items.push(NAV_ITEMS.admin);
    }
    return items;
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Main Navbar - Fixed position */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 shadow-lg safe-area-top">
        <div className="container-responsive">
          <div className="flex justify-between items-center h-16 lg:h-18">
            {/* Mobile Menu Trigger / Desktop Logo */}
            <div className="flex items-center">
              {/* Mobile: User Avatar as menu trigger */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 -m-2 rounded-xl hover:bg-forest-50 transition-all duration-300"
              >
                <Avatar 
                  name={profile?.full_name || user?.email?.split('@')[0] || 'Guest'}
                  imageUrl={profile?.avatar_url}
                  size="md"
                />
              </button>
              
              {/* Desktop: Simple text logo */}
              <div className="hidden lg:block">
                <h1 className="font-bold text-xl lg:text-2xl text-gradient">
                  Harmony Spaces
                </h1>
              </div>
            </div>

            {/* Desktop: Empty space or minimal content since we have sidebar */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Could add search bar, notifications, etc. here in the future */}
            </div>



            {/* Auth Section - Only show on mobile since desktop has sidebar */}
            <div className="lg:hidden flex items-center space-x-3">
              {/* Mobile auth handled by avatar menu trigger */}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay - Removed, will be handled in App.tsx */}

      {/* Global Modals */}
      <MessagingSystem
        isOpen={showMessages}
        onClose={() => setShowMessages(false)}
      />
    </>
  );
};

export default Navbar;