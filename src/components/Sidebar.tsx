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
  LogOut,
  Shield,
  Star,
  Plus,
  ChevronRight,
  ChevronLeft,
  Settings,
  Heart,
  Menu,
  MapPin,
  LogIn,
  Zap
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import Avatar from './Avatar';
import { Space, getSpaces } from '../lib/supabase';

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
      <Icon className={`h-5 w-5 ${isActive ? 'text-forest-600' : ''} ${isCollapsed ? 'mx-auto' : ''}`} />
      {!isCollapsed && <span className="font-medium">{label}</span>}
      {badge && badge > 0 && (
        <span className={`
          ${isCollapsed 
            ? 'absolute -top-1 -right-1 bg-forest-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full' 
            : 'ml-auto bg-forest-500 text-white text-xs px-2 py-0.5 rounded-full'
          }
        `}>
          {badge}
        </span>
      )}
      
      {/* Tooltip for collapsed mode */}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
          {label}
        </div>
      )}
    </Link>
  );
};

const FavoriteSpace: React.FC<{ space: Space; isActive?: boolean; isCollapsed: boolean; onClick?: () => void }> = ({ space, isActive, isCollapsed, onClick }) => {
  return (
    <Link
      to={`/spaces/${space.id}`}
      onClick={onClick}
      className={`
        relative flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group
        ${isActive 
          ? 'bg-forest-50 text-forest-700' 
          : 'hover:bg-gray-50 text-gray-600 hover:text-forest-600'
        }
        ${isCollapsed ? 'justify-center px-2' : ''}
      `}
      title={isCollapsed ? space.name : ''}
    >
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-forest-100 to-earth-100 flex items-center justify-center flex-shrink-0">
        {space.image_url ? (
          <img src={space.image_url} alt={space.name} className="w-full h-full rounded-lg object-cover" />
        ) : (
          <Home className="h-4 w-4 text-forest-600" />
        )}
      </div>
      {!isCollapsed && <span className="text-sm font-medium truncate">{space.name}</span>}
      
      {/* Tooltip for collapsed mode */}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
          {space.name}
        </div>
      )}
    </Link>
  );
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const location = useLocation();
  const { user, profile, isAdmin, signOut, openAuthModalGlobal } = useAuthContext();
  const [favoriteSpaces, setFavoriteSpaces] = useState<Space[]>([]);
  const [showAllFavorites, setShowAllFavorites] = useState(false);
  const [isSpaceHolder, setIsSpaceHolder] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024);

  // Navigation items - different for authenticated vs unauthenticated users
  const navItems = user ? [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/map', icon: Map, label: 'Discover' },
    { path: '/neighborhoods', icon: MapPin, label: 'Neighborhoods' },
    { path: '/hyperlocal', icon: Zap, label: 'Hyperlocal' },
    { path: '/global-feed', icon: Globe, label: 'Global Feed' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/create-event', icon: CalendarPlus, label: 'Create Event' },
    { path: '/activities', icon: Calendar, label: 'My Activities' },
    { path: '/messages', icon: MessageCircle, label: 'Messages', badge: 3 },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ] : [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/map', icon: Map, label: 'Discover' },
    { path: '/neighborhoods', icon: MapPin, label: 'Neighborhoods' },
    { path: '/hyperlocal', icon: Zap, label: 'Hyperlocal' },
    { path: '/global-feed', icon: Globe, label: 'Global Feed' },
  ];

  if (user && isAdmin) {
    navItems.push({ path: '/admin', icon: Shield, label: 'Admin', badge: 0 });
  }

  if (user && isSpaceHolder) {
    navItems.splice(7, 0, { path: '/space-holder-dashboard', icon: Home, label: 'Space & Facilitators', badge: 0 });
  }

  // Handle responsive state
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load favorite spaces and check if user is space holder
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        // Load user's spaces to check if they are a space holder
        const userSpacesResult = await getSpaces({ owner_id: user.id });
        if (userSpacesResult && userSpacesResult.data && userSpacesResult.data.length > 0) {
          setIsSpaceHolder(true);
        }

        // Load favorite spaces
        const result = await getSpaces({ limit: 5 });
        if (result && result.data) {
          setFavoriteSpaces(result.data);
        } else {
          setFavoriteSpaces([]);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setFavoriteSpaces([]);
      }
    };

    loadData();
  }, [user]);

  const displayedFavorites = showAllFavorites ? favoriteSpaces : favoriteSpaces.slice(0, 3);
  
  // Show based on isOpen state
  const shouldShow = isOpen;
  
  // Use consistent width across all desktop breakpoints (same as largest responsive mode)
  const sidebarWidth = 'w-64';

  return (
    <>
      {/* Backdrop when sidebar is open on mobile */}
      {isOpen && !isDesktop && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={onClose}
        />
      )}
      
      <aside 
        className={`fixed left-0 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-50 overflow-y-auto ${
          sidebarWidth
        } ${
          shouldShow ? 'translate-x-0' : '-translate-x-full'
        } top-0 lg:top-16 lg:h-[calc(100vh-4rem)]`}
      >
      {/* Logo/Brand - Removed since it's in the header */}

      {/* Scrollable Content with custom scrollbar */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll">
        {/* Favorites Section */}
        {user && favoriteSpaces.length > 0 && (
          <div className="p-4 border-b border-gray-100 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <h2 className="text-sm font-semibold text-gray-700">Favorite Spaces</h2>
              </div>
              <button className="btn-ghost btn-sm p-1 focus-ring">
                <Plus className="icon-sm" />
              </button>
            </div>
            
            <div className="space-y-1">
              {displayedFavorites.map((space) => (
                <FavoriteSpace 
                  key={space.id} 
                  space={space} 
                  isActive={location.pathname === `/spaces/${space.id}`}
                  isCollapsed={false}
                  onClick={isOpen ? onClose : undefined}
                />
              ))}
            </div>

            {favoriteSpaces.length > 3 && (
              <button
                onClick={() => setShowAllFavorites(!showAllFavorites)}
                className="flex items-center gap-1 text-sm text-forest-600 hover:text-forest-700 mt-2 px-4 py-1"
              >
                <ChevronRight className={`h-3 w-3 transition-transform ${showAllFavorites ? 'rotate-90' : ''}`} />
                {showAllFavorites ? 'Show less' : `Show ${favoriteSpaces.length - 3} more`}
              </button>
            )}
          </div>
        )}

        {/* Main Navigation */}
        <nav className="p-4 space-y-1 transition-all duration-300">
          {navItems.map((item) => (
            <NavItem
              key={item.path}
              {...item}
              isActive={location.pathname === item.path}
              isCollapsed={false}
              onClick={isOpen ? onClose : undefined}
            />
          ))}
        </nav>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className="border-t border-gray-100 p-4 transition-all duration-300">
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
          
          <div className="flex gap-2">
            <Link
              to="/settings"
              state={{ activeSection: 'edit-profile' }}
              onClick={isOpen ? onClose : undefined}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <button
              onClick={async () => {
                try {
                  await signOut();
                } catch (error) {
                  console.error('Sign out error:', error);
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
      
      {/* Auth Section for Non-authenticated Users */}
      {!user && (
        <div className="border-t border-gray-100 p-4 transition-all duration-300">
          <div className="space-y-3 mb-4">
            <p className="text-sm text-gray-600 text-center">
              Join our community to create events, discover local spaces, and connect with neighbors.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => openAuthModalGlobal('signup')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-lg transition-colors font-medium"
            >
              <User className="h-5 w-5" />
              Join Harmony Spaces
            </button>
            <button
              onClick={() => openAuthModalGlobal('signin')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-forest-600 hover:bg-forest-50 border border-forest-200 rounded-lg transition-colors font-medium"
            >
              <LogIn className="h-5 w-5" />
              Sign In
            </button>
          </div>
        </div>
      )}
      </aside>
    </>
  );
};

export default Sidebar;