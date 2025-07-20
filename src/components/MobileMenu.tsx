import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Map, 
  Globe, 
  CalendarPlus, 
  Calendar, 
  MessageCircle, 
  User, 
  X, 
  LogOut, 
  LogIn, 
  Sprout, 
  Shield,
  Share2,
  Settings
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onShareClick: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, onShareClick }) => {
  const location = useLocation();
  const { user, profile, isAdmin, signOut, openAuthModalGlobal } = useAuthContext();

  const publicNavItems = [
    { path: '/', icon: Home, label: 'Home' },
  ];

  const authenticatedNavItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/map', icon: Map, label: 'Discover' },
    { path: '/global-feed', icon: Globe, label: 'Global Feed' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/create-event', icon: CalendarPlus, label: 'Create Event' },
    { path: '/activities', icon: Calendar, label: 'Activities' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/account', icon: User, label: 'Account' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const navItems = user ? authenticatedNavItems : publicNavItems;

  // Add admin link if user is admin
  if (user && isAdmin) {
    navItems.push({ path: '/admin', icon: Shield, label: 'Admin' });
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`lg:hidden fixed inset-0 bg-black/20 z-[89] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Slide-out Menu */}
      <div className={`lg:hidden fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl z-[90] transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Menu Header */}
        <div className="bg-gradient-to-br from-forest-100 to-earth-100 border-b border-forest-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
                <Sprout className="h-6 w-6 text-forest-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-forest-800">Harmony Spaces</h2>
                <p className="text-sm text-forest-600">Community Connection</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-forest-600 hover:text-forest-800 hover:bg-forest-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {user && profile && (
            <div className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-forest-200">
              <img
                src={profile.avatar_url || 'https://images.pexels.com/photos/3772622/pexels-photo-3772622.jpeg?auto=compress&cs=tinysrgb&w=100'}
                alt={profile.full_name || 'User'}
                className="w-12 h-12 rounded-full border-2 border-forest-300"
              />
              <div className="flex-1">
                <p className="font-semibold text-forest-800">{profile.full_name || 'Welcome'}</p>
                <p className="text-sm text-forest-600">{user.email}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Menu Content */}
        <div className="flex-1 overflow-y-auto py-6 px-4">
          {/* Navigation Items */}
          <div className="space-y-2">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                onClick={onClose}
                className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-300 group hover:scale-[1.02] ${
                  location.pathname === path
                    ? 'bg-gradient-to-r from-forest-100 to-earth-100 text-forest-800 shadow-sm border border-forest-200'
                    : 'text-forest-700 hover:bg-forest-50 hover:shadow-sm active:bg-forest-100'
                } ${path === '/admin' ? 'border border-purple-300 bg-gradient-to-r from-purple-100 to-blue-100' : ''}`}
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
            <div className="space-y-2 pt-4 border-t border-forest-100 mt-4">
              <button
                onClick={() => {
                  onShareClick();
                  onClose();
                }}
                className="w-full px-4 py-3.5 bg-gradient-to-r from-forest-600 to-earth-600 text-white rounded-xl text-base font-medium transition-all duration-300 flex items-center justify-center space-x-3 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Share2 className="h-5 w-5" />
                <span>Share Space</span>
              </button>
            </div>
          )}
          
          {/* Mobile Auth Section */}
          <div className="border-t border-forest-100 pt-4 mt-4 space-y-3">
            {user ? (
              <button
                onClick={() => {
                  signOut();
                  onClose();
                }}
                className="w-full flex items-center space-x-3 px-4 py-3.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 group font-medium"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    openAuthModalGlobal('signin');
                    onClose();
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3.5 text-forest-600 hover:bg-forest-50 rounded-xl transition-all duration-300 group font-medium"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => {
                    openAuthModalGlobal('signup');
                    onClose();
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
    </>
  );
};

export default MobileMenu;