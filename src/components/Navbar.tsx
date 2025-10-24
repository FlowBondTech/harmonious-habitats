import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  User,
  Settings,
  LogOut,
  CalendarPlus,
  LayoutDashboard,
  Search,
  ChevronDown,
  LogIn,
  X,
  Home,
  Sprout
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import Avatar from './Avatar';
import NotificationCenter from './NotificationCenter';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { DEMO_MODE } from '../lib/demo-mode';

interface NavbarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ isMenuOpen, setIsMenuOpen }) => {
  const { user, profile, signOut, openAuthModalGlobal } = useAuthContext();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  
  const { scrollDirection, isAtTop } = useScrollDirection();
  const isVisible = scrollDirection === 'up' || isAtTop || isMenuOpen;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (showSearch && searchRef.current) {
      searchRef.current.focus();
    }
  }, [showSearch]);

  // Close dropdowns when navbar hides
  useEffect(() => {
    if (!isVisible) {
      setShowProfileDropdown(false);
      setShowSearch(false);
    }
  }, [isVisible]);

  const handleSignOut = async () => {
    // Close dropdown immediately to prevent awkward animation
    setShowProfileDropdown(false);
    // Wait a moment for animation to complete
    await new Promise(resolve => setTimeout(resolve, 200));
    await signOut();
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  return (
    <header className={`lg:hidden fixed ${DEMO_MODE ? 'top-9' : 'top-0'} left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="max-h-screen overflow-y-auto scrollbar-hide">
        <div className="min-h-16 px-4 flex items-center justify-between py-2 relative">
          {/* Left Section - Menu & Logo */}
          <div className="flex items-center space-x-3">
            {user && (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="h-6 w-6 text-gray-700" />
              </button>
            )}
            
            <Link to="/" className="flex items-center">
              <h1 className="text-lg font-bold text-forest-700 dark:text-forest-300">Harmonik Space</h1>
            </Link>
          </div>

          {/* Right Section - Search, Notifications & Profile */}
          <div className="flex items-center space-x-2 relative">
          {/* Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 hover:bg-gray-100 rounded-lg transition-all duration-300 ${
              showSearch ? 'bg-gray-100 scale-110' : ''
            }`}
            aria-label="Search"
          >
            <Search className={`h-5 w-5 text-gray-700 transition-transform duration-300 ${
              showSearch ? 'rotate-90' : ''
            }`} />
          </button>

          {/* Notifications */}
          {user && <NotificationCenter />}

          {/* Profile Dropdown */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowProfileDropdown(!showProfileDropdown);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
              >
                <Avatar
                  name={profile?.full_name || user.email?.split('@')[0]}
                  imageUrl={profile?.avatar_url}
                  size="sm"
                />
              </button>

              {/* Profile Menu - Mobile Full Screen Modal */}
              {showProfileDropdown && (
                <>
                  {/* Backdrop - Mobile Only */}
                  <div
                    className="sm:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300"
                    onClick={() => setShowProfileDropdown(false)}
                  />

                  {/* Menu Content */}
                  <div className="sm:absolute fixed sm:right-0 sm:mt-2 inset-x-0 bottom-0 sm:inset-auto sm:w-72 bg-white sm:rounded-xl rounded-t-3xl shadow-2xl border-t sm:border border-gray-200 py-2 z-[70] animate-slide-up sm:animate-none sm:max-h-[90vh] sm:overflow-y-auto">
                    {/* Close Button - Mobile Only */}
                    <button
                      onClick={() => setShowProfileDropdown(false)}
                      className="sm:hidden absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Close menu"
                    >
                      <X className="h-5 w-5" />
                    </button>

                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {profile?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setShowProfileDropdown(false)}
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      >
                        <User className="h-5 w-5" />
                        <span>Profile</span>
                      </Link>

                      <Link
                        to="/create-event"
                        onClick={() => setShowProfileDropdown(false)}
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      >
                        <CalendarPlus className="h-5 w-5" />
                        <span>Create Event</span>
                      </Link>

                      <Link
                        to="/"
                        onClick={() => setShowProfileDropdown(false)}
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      >
                        <Home className="h-5 w-5" />
                        <span>Home</span>
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setShowProfileDropdown(false)}
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      >
                        <Settings className="h-5 w-5" />
                        <span>Settings</span>
                      </Link>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors w-full text-left"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Sign Out</span>
                      </button>
                    </div>

                    {/* Safe Area Padding - Mobile Only */}
                    <div className="sm:hidden h-safe-area-inset-bottom" />
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModalGlobal('signin')}
              className="h-9 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-forest-600 to-earth-600 hover:from-forest-700 hover:to-earth-700 rounded-lg transition-all transform hover:scale-105 inline-flex items-center shadow-md hover:shadow-lg"
            >
              <Sprout className="h-4 w-4 mr-2" />
              Harmonize Now
            </button>
          )}
        </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {showSearch && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-300"
            onClick={() => setShowSearch(false)}
          />

          {/* Search Bar */}
          <div className={`lg:hidden fixed ${DEMO_MODE ? 'top-[84px]' : 'top-16'} left-0 right-0 z-50 p-4 bg-white border-b border-gray-200 shadow-lg transition-transform duration-300 ${
            showSearch ? 'translate-y-0' : '-translate-y-full'
          }`}>
            <form onSubmit={handleSearch} className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events, spaces, users..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={() => setShowSearch(false)}
                className="p-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </button>
            </form>
          </div>
        </>
      )}
    </header>
  );
};

export default Navbar;