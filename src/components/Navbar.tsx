import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, Calendar, MessageCircle, User, Menu, X, Sprout, Globe, Shield, CalendarPlus, Home as HomePlus, LogIn, LogOut, Users, BarChart3 } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import AuthButton from './AuthButton';
import NotificationCenter from './NotificationCenter';
import MessagingSystem from './MessagingSystem';
import CommunityFeatures from './CommunityFeatures';
import AnalyticsDashboard from './AnalyticsDashboard';

const Navbar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { user, profile, isAdmin, signOut, openAuthModalGlobal } = useAuthContext();

  const publicNavItems = [
    { path: '/', icon: Home, label: 'Home' },
  ];

  const authenticatedNavItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/map', icon: Map, label: 'Discover' },
    { path: '/global-feed', icon: Globe, label: 'Global Feed' },
    { path: '/create-event', icon: CalendarPlus, label: 'Create Event' },
    { path: '/share-space', icon: HomePlus, label: 'Share Space' },
    { path: '/activities', icon: Calendar, label: 'Activities' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const navItems = user ? authenticatedNavItems : publicNavItems;

  // Add admin link if user is admin
  if (user && isAdmin) {
    navItems.push({ path: '/admin', icon: Shield, label: 'Admin' });
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-forest-100/50 shadow-sm" role="navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-forest-600 hover:text-forest-700 transition-colors group" aria-label="Home">
            <div className="p-1 rounded-lg group-hover:bg-forest-50 transition-colors">
              <Sprout className="h-7 w-7" />
            </div>
            <span className="font-bold text-xl hidden sm:block">Harmony Spaces</span>
            <span className="font-bold text-lg sm:hidden">Harmony</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2 hover:scale-105 ${
                  location.pathname === path
                    ? 'bg-forest-100 text-forest-700 shadow-sm'
                    : 'text-forest-600 hover:bg-forest-50 hover:text-forest-700'
                } ${path === '/admin' ? 'border border-forest-200' : ''}`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* Quick Action Buttons */}
          {user && (
            <div className="hidden lg:flex items-center space-x-2">
              <button
                onClick={() => setShowMessages(true)}
                className="p-2 text-forest-600 hover:bg-forest-50 rounded-xl transition-colors"
                title="Messages"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Auth Button, Notifications & Mobile Menu Button */}
          <div className="flex items-center space-x-3">
            {user && (
              <div className="hidden lg:block" role="menu">
                <NotificationCenter />
              </div>
            )}
            
            <div className="hidden lg:block">
              <AuthButton />
            </div>
            
                  ? 'bg-forest-100 text-forest-700 shadow-sm' 
                  : 'text-forest-600 hover:bg-forest-50 hover:text-forest-700' 
              className="lg:hidden p-2 rounded-xl text-forest-600 hover:bg-forest-50 transition-all duration-200 hover:scale-105"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-current={location.pathname === path ? 'page' : undefined}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div id="mobile-menu" className="lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-b border-forest-100/50 shadow-lg" role="menu">
            <div className="px-4 py-6 space-y-3">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location.pathname === path
                      ? 'bg-forest-100 text-forest-700 shadow-sm'
                      : 'text-forest-600 hover:bg-forest-50 active:bg-forest-100'
                  } ${path === '/admin' ? 'border border-forest-200' : ''}`}
                  aria-current={location.pathname === path ? 'page' : undefined}
                  role="menuitem"
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </Link>
              ))}
              
              {/* Mobile Notifications */}
              {user && (
                <div className="px-4 py-3">
                  <NotificationCenter />
                </div>
              )}
              
              {/* Mobile Auth Buttons */}
              <div className="border-t border-forest-100 pt-4 mt-4">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 px-4 py-3">
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
                      onClick={() => {
                        signOut();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-forest-600 hover:bg-forest-50 rounded-xl transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        openAuthModalGlobal('signin');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-forest-600 hover:bg-forest-50 rounded-xl transition-colors"
                    >
                      <LogIn className="h-4 w-4" />
                      <span>Sign In</span>
                    </button>
                    <button
                      onClick={() => {
                        openAuthModalGlobal('signup');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 bg-gradient-to-r from-forest-600 to-forest-700 hover:from-forest-700 hover:to-forest-800 text-white px-4 py-3 rounded-xl font-medium transition-colors shadow-sm"
                    >
                      <User className="h-4 w-4" />
                      <span>Join</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Modals */}
      <MessagingSystem
        isOpen={showMessages}
        onClose={() => setShowMessages(false)}
      />
    </nav>
  );
};

export default Navbar;