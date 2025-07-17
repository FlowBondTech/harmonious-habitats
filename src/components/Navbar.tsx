import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Map, 
  Globe, 
  CalendarPlus, 
  Home as HomePlus, 
  Calendar, 
  MessageCircle, 
  User, 
  Menu, 
  X, 
  LogOut, 
  LogIn, 
  Sprout, 
  Shield,
  Heart
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import MessagingSystem from './MessagingSystem';

const Navbar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
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

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 shadow-lg safe-area-top">
        <div className="container-responsive">
          <div className="flex justify-between items-center h-16 lg:h-18">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-forest-600 hover:text-forest-700 transition-all duration-300 group focus-ring rounded-lg p-2 -m-2"
              onClick={closeMenu}
            >
              <div className="p-2 bg-gradient-to-br from-forest-100 to-earth-100 rounded-xl group-hover:from-forest-200 group-hover:to-earth-200 transition-all duration-300 shadow-sm group-hover:shadow-md transform group-hover:scale-105">
                <Sprout className="h-6 w-6 lg:h-7 lg:w-7 text-forest-600 group-hover:text-forest-700 animate-float" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-xl lg:text-2xl text-gradient">
                  Harmony Spaces
                </h1>
                <p className="text-xs text-forest-500 -mt-1">Community Connection</p>
              </div>
              <span className="font-bold text-lg sm:hidden text-gradient">Harmony</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`group relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center space-x-2 hover:scale-105 focus-ring ${
                    location.pathname === path
                      ? 'bg-gradient-to-r from-forest-100 to-earth-100 text-forest-800 shadow-sm border border-forest-200/50'
                      : 'text-forest-600 hover:bg-white/50 hover:text-forest-700 hover:shadow-sm'
                  } ${path === '/admin' ? 'border border-forest-300 bg-gradient-to-r from-purple-50 to-blue-50' : ''}`}
                >
                  <Icon className={`h-4 w-4 transition-all duration-300 ${
                    location.pathname === path ? 'text-forest-700' : 'text-forest-500 group-hover:text-forest-600'
                  }`} />
                  <span className="relative">
                    {label}
                    {location.pathname === path && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-forest-600 rounded-full animate-pulse-gentle"></div>
                    )}
                  </span>
                </Link>
              ))}
            </div>



            {/* Auth Button & Mobile Menu Button */}
            <div className="flex items-center space-x-3">
              
              <div className="hidden lg:block">
                {user ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-forest-50 to-earth-50 rounded-xl border border-forest-100">
                      <div className="w-8 h-8 bg-gradient-to-br from-forest-100 to-earth-100 rounded-full flex items-center justify-center overflow-hidden shadow-sm">
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
                      <span className="text-sm font-medium text-forest-700 max-w-24 truncate">
                        {profile?.full_name || user.email?.split('@')[0]}
                      </span>
                    </div>
                    <button
                      onClick={signOut}
                      className="p-2.5 text-forest-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-300 hover:scale-110 focus-ring group"
                      title="Sign Out"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openAuthModalGlobal('signin')}
                      className="btn-ghost text-sm"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </button>
                    <button
                      onClick={() => openAuthModalGlobal('signup')}
                      className="btn-primary text-sm py-2.5"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Join
                    </button>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2.5 rounded-xl text-forest-600 hover:bg-white/50 transition-all duration-300 hover:scale-110 focus-ring"
              >
                {isMenuOpen ? 
                  <X className="h-6 w-6 animate-fade-in" /> : 
                  <Menu className="h-6 w-6 animate-fade-in" />
                }
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden absolute top-full left-0 right-0 glass border-b border-white/10 shadow-2xl animate-fade-in-down">
              <div className="container-responsive py-6 space-y-4">
                {/* Navigation Items */}
                <div className="space-y-2">
                  {navItems.map(({ path, icon: Icon, label }) => (
                    <Link
                      key={path}
                      to={path}
                      onClick={closeMenu}
                      className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-300 group hover:scale-[1.02] ${
                        location.pathname === path
                          ? 'bg-gradient-to-r from-forest-100 to-earth-100 text-forest-800 shadow-md border border-forest-200/50'
                          : 'text-forest-600 hover:bg-white/50 hover:shadow-sm active:bg-forest-100'
                      } ${path === '/admin' ? 'border border-forest-300 bg-gradient-to-r from-purple-50 to-blue-50' : ''}`}
                    >
                      <Icon className={`h-5 w-5 transition-colors ${
                        location.pathname === path ? 'text-forest-700' : 'text-forest-500 group-hover:text-forest-600'
                      }`} />
                      <span className="flex-1">{label}</span>
                      {location.pathname === path && (
                        <div className="w-2 h-2 bg-forest-600 rounded-full animate-pulse-gentle"></div>
                      )}
                    </Link>
                  ))}
                </div>
                
                {/* Mobile Quick Actions */}
                {user && (
                  <div className="space-y-2 pt-4 border-t border-white/20">
                    {/* Additional quick actions can go here */}
                  </div>
                )}
                
                {/* Mobile Auth Section */}
                <div className="border-t border-white/20 pt-4 space-y-3">
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-forest-50 to-earth-50 rounded-xl border border-forest-100">
                        <div className="w-10 h-10 bg-gradient-to-br from-forest-100 to-earth-100 rounded-full flex items-center justify-center overflow-hidden shadow-sm">
                          {profile?.avatar_url ? (
                            <img 
                              src={profile.avatar_url} 
                              alt={profile.full_name || 'User'} 
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-forest-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-forest-800 truncate">
                            {profile?.full_name || 'Welcome'}
                          </p>
                          <p className="text-sm text-forest-600 truncate">
                            {user.email}
                          </p>
                        </div>
                        <Heart className="h-5 w-5 text-earth-500 animate-pulse-gentle" />
                      </div>
                      <button
                        onClick={() => {
                          signOut();
                          closeMenu();
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 group font-medium"
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
                          closeMenu();
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3.5 text-forest-600 hover:bg-white/50 rounded-xl transition-all duration-300 group font-medium"
                      >
                        <LogIn className="h-5 w-5" />
                        <span>Sign In</span>
                      </button>
                      <button
                        onClick={() => {
                          openAuthModalGlobal('signup');
                          closeMenu();
                        }}
                        className="w-full btn-primary justify-center"
                      >
                        <User className="h-5 w-5 mr-2" />
                        <span>Join Harmony Spaces</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Backdrop for mobile menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={closeMenu}
        />
      )}

      {/* Global Modals */}
      <MessagingSystem
        isOpen={showMessages}
        onClose={() => setShowMessages(false)}
      />
    </>
  );
};

export default Navbar;