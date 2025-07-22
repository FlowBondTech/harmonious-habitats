import React, { useState, useEffect } from 'react';
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
  Settings,
  Star,
  Plus,
  MapPin
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import Avatar from './Avatar';
import { Space, getSpaces } from '../lib/supabase';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onShareClick: () => void;
}

interface NavItemProps {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  badge?: number;
  isCollapsed: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ path, icon: Icon, label, isActive, badge, isCollapsed, onClick }) => {
  return (
    <Link
      to={path}
      onClick={onClick}
      className={`
        relative flex items-center gap-3 transition-all duration-200 group
        ${isActive 
          ? 'bg-gradient-to-r from-forest-100 to-earth-50 text-forest-700 shadow-sm rounded-r-xl' 
          : 'hover:bg-gray-50 text-gray-700 hover:text-forest-600 rounded-xl'
        }
        ${isCollapsed 
          ? `justify-center ${isActive ? '-mx-2 px-2 py-3' : 'px-3 py-3'}` 
          : `${isActive ? '-mx-4 px-8 py-3' : 'px-4 py-3'}`
        }
      `}
      title={isCollapsed ? label : ''}
    >
      <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-forest-600' : 'text-gray-500 group-hover:text-forest-600'}`} />
      {!isCollapsed && (
        <>
          <span className="font-medium transition-colors">{label}</span>
          {badge && badge > 0 && (
            <span className="ml-auto bg-forest-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
      {isActive && !isCollapsed && (
        <div className="absolute right-4 w-2 h-2 bg-forest-600 rounded-full"></div>
      )}
      {isActive && isCollapsed && (
        <div className="absolute -right-1 w-1 h-6 bg-forest-600 rounded-l-sm"></div>
      )}
    </Link>
  );
};

interface FavoriteSpaceProps {
  space: Space;
  isActive: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}

const FavoriteSpace: React.FC<FavoriteSpaceProps> = ({ space, isActive, isCollapsed, onClick }) => {
  return (
    <Link
      to={`/spaces/${space.id}`}
      onClick={onClick}
      className={`
        relative flex items-center gap-3 transition-all duration-200 group rounded-lg
        ${isActive 
          ? 'bg-forest-50 text-forest-700' 
          : 'hover:bg-gray-50 text-gray-600 hover:text-forest-600'
        }
        ${isCollapsed ? 'justify-center p-2' : 'px-3 py-2'}
      `}
      title={isCollapsed ? space.name : ''}
    >
      <div className={`rounded-md bg-forest-100 flex items-center justify-center ${isCollapsed ? 'w-8 h-8' : 'w-6 h-6'}`}>
        <span className="text-forest-600 font-medium text-xs">
          {space.name?.charAt(0).toUpperCase() || 'S'}
        </span>
      </div>
      {!isCollapsed && (
        <span className="text-sm font-medium truncate">{space.name}</span>
      )}
    </Link>
  );
};

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, onShareClick }) => {
  const location = useLocation();
  const { user, profile, isAdmin, signOut, openAuthModalGlobal } = useAuthContext();
  const [favoriteSpaces, setFavoriteSpaces] = useState<Space[]>([]);
  const [showAllFavorites, setShowAllFavorites] = useState(false);

  // Load favorite spaces
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) {
        setFavoriteSpaces([]);
        return;
      }
      
      try {
        const { data } = await getSpaces();
        if (data) {
          // For now, just get the first few spaces as favorites
          // In the future, this would be based on user's actual favorites
          setFavoriteSpaces(data.slice(0, 5));
        }
      } catch (error) {
        console.error('Failed to load favorite spaces:', error);
        setFavoriteSpaces([]);
      }
    };

    loadFavorites();
  }, [user]);

  const publicNavItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/map', icon: Map, label: 'Discover' },
    { path: '/neighborhoods', icon: MapPin, label: 'Neighborhoods' },
    { path: '/global-feed', icon: Globe, label: 'Global Feed' },
  ];

  const authenticatedNavItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/map', icon: Map, label: 'Discover' },
    { path: '/neighborhoods', icon: MapPin, label: 'Neighborhoods' },
    { path: '/global-feed', icon: Globe, label: 'Global Feed' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/create-event', icon: CalendarPlus, label: 'Create Event' },
    { path: '/activities', icon: Calendar, label: 'Activities' },
    { path: '/messages', icon: MessageCircle, label: 'Messages', badge: 3 },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  let navItems = user ? [...authenticatedNavItems] : [...publicNavItems];

  // Add admin link if user is admin
  if (user && isAdmin) {
    navItems.push({ path: '/admin', icon: Shield, label: 'Admin' });
  }

  const displayedFavorites = showAllFavorites ? favoriteSpaces : favoriteSpaces.slice(0, 3);

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
      <div className={`lg:hidden fixed inset-y-0 left-0 w-80 md:w-96 max-w-[85vw] bg-white shadow-2xl z-[90] transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Menu Header */}
        <div className="border-b border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-forest-50 rounded-xl">
                <Sprout className="h-6 w-6 text-forest-600" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-forest-800">Harmony Spaces</h2>
                <p className="text-xs md:text-sm text-gray-600">Community Connection</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Favorites Section */}
          {user && favoriteSpaces.length > 0 && (
            <div className="p-4 md:p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <h2 className="text-sm font-semibold text-gray-700">Favorite Spaces</h2>
                </div>
                <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-1">
                {displayedFavorites.map((space) => (
                  <FavoriteSpace 
                    key={space.id} 
                    space={space} 
                    isActive={location.pathname === `/spaces/${space.id}`}
                    isCollapsed={false}
                    onClick={onClose}
                  />
                ))}
              </div>

              {favoriteSpaces.length > 3 && (
                <button
                  onClick={() => setShowAllFavorites(!showAllFavorites)}
                  className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700 py-1 transition-colors"
                >
                  {showAllFavorites ? 'Show less' : `Show ${favoriteSpaces.length - 3} more`}
                </button>
              )}
            </div>
          )}

          {/* Main Navigation */}
          <nav className="p-4 md:p-6 space-y-1">
            {navItems.map((item) => (
              <NavItem
                key={item.path}
                {...item}
                isActive={location.pathname === item.path}
                isCollapsed={false}
                onClick={onClose}
              />
            ))}
          </nav>
        </div>

        {/* User Profile Section */}
        {user && (
          <div className="border-t border-gray-100 p-4 md:p-6">
            <div className="flex items-center gap-3 mb-3">
              <Avatar 
                name={profile?.full_name || user.email?.split('@')[0]}
                imageUrl={profile?.avatar_url}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.full_name || user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {/* Share Space Button */}
              <button
                onClick={() => {
                  onShareClick();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Share2 className="h-4 w-4" />
                Share Space
              </button>
              
              {/* Settings and Sign Out */}
              <div className="flex gap-2">
                <Link
                  to="/settings"
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Auth Section for Non-authenticated Users */}
        {!user && (
          <div className="border-t border-gray-100 p-4 md:p-6">
            <div className="space-y-3 mb-4">
              <p className="text-sm text-gray-600 text-center">
                Join our community to create events, discover local spaces, and connect with neighbors.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  openAuthModalGlobal('signup');
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-lg transition-colors font-medium"
              >
                <User className="h-5 w-5" />
                Join Harmony Spaces
              </button>
              <button
                onClick={() => {
                  openAuthModalGlobal('signin');
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-forest-600 hover:bg-forest-50 border border-forest-200 rounded-lg transition-colors font-medium"
              >
                <LogIn className="h-5 w-5" />
                Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MobileMenu;