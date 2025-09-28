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
  Home
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
    await signOut();
    setShowProfileDropdown(false);
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
    <header className={`lg:hidden fixed ${DEMO_MODE ? 'top-9' : 'top-0'} left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="max-h-screen overflow-y-auto scrollbar-hide overflow-x-visible">
        <div className="min-h-16 px-4 flex items-center justify-between py-2 relative overflow-visible">
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
              <h1 className="text-lg font-bold text-gradient">Harmony Spaces</h1>
            </Link>
          </div>

          {/* Right Section - Search, Notifications & Profile */}
          <div className="flex items-center space-x-2">
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

              {/* Dropdown Menu */}
              {showProfileDropdown && (
                <div className="fixed right-4 top-16 w-64 sm:w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-[9999] max-w-[calc(100vw-2rem)]">
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
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>

                    <Link
                      to="/create-event"
                      onClick={() => setShowProfileDropdown(false)}
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <CalendarPlus className="h-4 w-4" />
                      <span>Create Event</span>
                    </Link>

                    <Link
                      to="/"
                      onClick={() => setShowProfileDropdown(false)}
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Home className="h-4 w-4" />
                      <span>Home</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setShowProfileDropdown(false)}
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </div>

                  {/* Sign Out */}
                  <div className="border-t border-gray-100 pt-1">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => openAuthModalGlobal('signin')}
                className="h-9 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors inline-flex items-center"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModalGlobal('signup')}
                className="h-9 px-3 py-2 text-sm font-medium text-white bg-forest-600 hover:bg-forest-700 rounded-lg transition-colors inline-flex items-center"
              >
                Join
              </button>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Compact Search Bar - Slides out from search icon */}
      {showSearch && (
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 z-50 pointer-events-none">
          <div className="relative h-full">
            <div className={`absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-out ${
              user ? 'right-[180px]' : 'right-[140px]'
            }`}>
              <form onSubmit={handleSearch} className={`flex items-center bg-white rounded-full shadow-xl border border-gray-200 transition-all duration-500 transform ${
                showSearch ? 'w-60 scale-100 opacity-100 pointer-events-auto' : 'w-0 scale-95 opacity-0 pointer-events-none'
              }`}>
                <div className="relative flex-1 flex items-center">
                  <Search className={`absolute left-3 h-4 w-4 text-gray-400 transition-all duration-300 ${
                    showSearch ? 'opacity-100' : 'opacity-0'
                  }`} />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search events, spaces..."
                    className={`w-full pl-10 pr-2 py-2.5 text-sm bg-transparent focus:outline-none transition-all duration-300 ${
                      showSearch ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowSearch(false)}
                  className={`p-2 mr-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-300 ${
                    showSearch ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Backdrop for search */}
      {showSearch && (
        <div 
          className="lg:hidden fixed inset-0 z-40 transition-opacity duration-300"
          onClick={() => setShowSearch(false)}
        />
      )}
    </header>
  );
};

export default Navbar;