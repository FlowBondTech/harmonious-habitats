import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu, User, Settings, LogOut, CalendarPlus, LayoutDashboard,
  Search, Sprout
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import Avatar from './Avatar';
import NotificationCenter from './NotificationCenter';
import { DEMO_MODE } from '../lib/demo-mode';

interface DesktopHeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

const DesktopHeader: React.FC<DesktopHeaderProps> = ({ onMenuClick, isSidebarOpen }) => {
  const { user, profile, signOut, openAuthModalGlobal } = useAuthContext();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

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

  // Handle scroll to show/hide header
  useEffect(() => {
    const controlHeader = () => {
      // Always show header when sidebar is open
      if (isSidebarOpen) {
        setIsVisible(true);
        return;
      }
      
      const currentScrollY = window.scrollY;
      
      // Show header when scrolling up or at the top of the page
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } 
      // Hide header when scrolling down
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
        setShowProfileDropdown(false); // Close dropdown when hiding
      }
      
      setLastScrollY(currentScrollY);
    };

    const throttledControlHeader = () => {
      let ticking = false;
      return () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            controlHeader();
            ticking = false;
          });
          ticking = true;
        }
      };
    };

    const scrollHandler = throttledControlHeader();
    window.addEventListener('scroll', scrollHandler);
    
    return () => window.removeEventListener('scroll', scrollHandler);
  }, [lastScrollY, isSidebarOpen]);

  // Ensure header is visible when sidebar opens
  useEffect(() => {
    if (isSidebarOpen) {
      setIsVisible(true);
    }
  }, [isSidebarOpen]);

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
    }
  };

  // Check if we should hide the menu button (any unauthenticated user)
  const shouldHideMenuButton = !user;

  return (
    <header className={`hidden lg:block fixed ${DEMO_MODE ? 'top-9' : 'top-0'} left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="h-16 px-4 grid grid-cols-3 items-center relative">
        {/* Left Section - Menu & Logo */}
        <div className="flex items-center space-x-3">
          {!shouldHideMenuButton && (
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>
          )}

          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-forest-700 dark:text-forest-300">Harmonious Habitats</h1>
          </Link>
        </div>

        {/* Center Section - Search */}
        <div className="flex justify-center">
          <form onSubmit={handleSearch} className="relative w-full max-w-md">
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, spaces, users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-all"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </form>
        </div>

        {/* Right Section - Notifications & Profile */}
        <div className="flex items-center justify-end space-x-2">
          {/* Notification Bell */}
          {user && <NotificationCenter />}

          {/* Profile Dropdown */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              {/* 
              
              FORMAT OPTIONS - Replace the button below with any of these:
              
              Option 1: Modern Card Style (Currently Active)
              - Gradient background with status indicator
              - Shows role/title below name
              - More prominent, card-like appearance
              
              Option 2: Minimal Clean
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Avatar
                  name={profile?.full_name || user.email?.split('@')[0]}
                  imageUrl={profile?.avatar_url}
                  size="sm"
                />
                <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${
                  showProfileDropdown ? 'rotate-180' : ''
                }`} />
              </button>
              
              Option 3: Avatar Only
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="relative p-1 hover:ring-2 hover:ring-forest-300 rounded-full transition-all"
              >
                <Avatar
                  name={profile?.full_name || user.email?.split('@')[0]}
                  imageUrl={profile?.avatar_url}
                  size="md"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-forest-600 text-white rounded-full flex items-center justify-center">
                  <ChevronDown className={`h-2.5 w-2.5 transition-transform ${
                    showProfileDropdown ? 'rotate-180' : ''
                  }`} />
                </div>
              </button>
              
              Option 4: Pill Style
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-full border border-gray-200 shadow-sm hover:shadow transition-all"
              >
                <Avatar
                  name={profile?.full_name || user.email?.split('@')[0]}
                  imageUrl={profile?.avatar_url}
                  size="sm"
                />
                <span className="text-sm font-medium text-gray-700 hidden xl:block">
                  {profile?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${
                  showProfileDropdown ? 'rotate-180' : ''
                }`} />
              </button>
              
              */}

              {/* Profile Button - Image Only */}
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Avatar
                  name={profile?.full_name || user.email?.split('@')[0]}
                  imageUrl={profile?.avatar_url}
                  size="sm"
                />
              </button>

              {/* Dropdown Menu */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 animate-fade-in z-[100]">
                  {/* User Info */}
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {profile?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setShowProfileDropdown(false)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>

                    <Link
                      to="/create-event"
                      onClick={() => setShowProfileDropdown(false)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <CalendarPlus className="h-4 w-4" />
                      <span>Create Event</span>
                    </Link>

                    <Link
                      to="/activities"
                      onClick={() => setShowProfileDropdown(false)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>

                    <Link
                      to="/settings"
                      state={{ activeSection: 'edit-profile' }}
                      onClick={() => setShowProfileDropdown(false)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
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
            <button
              onClick={() => openAuthModalGlobal('signin')}
              className="h-10 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-forest-600 to-earth-600 hover:from-forest-700 hover:to-earth-700 rounded-lg transition-all transform hover:scale-105 inline-flex items-center shadow-md hover:shadow-lg"
            >
              <Sprout className="h-4 w-4 mr-2" />
              Harmonize Now
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default DesktopHeader;