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
  Menu
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
}

const NavItem: React.FC<NavItemProps> = ({ path, icon: Icon, label, isActive, badge, isCollapsed }) => {
  return (
    <Link
      to={path}
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

const FavoriteSpace: React.FC<{ space: Space; isActive?: boolean; isCollapsed: boolean }> = ({ space, isActive, isCollapsed }) => {
  return (
    <Link
      to={`/spaces/${space.id}`}
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
  const { user, profile, isAdmin, signOut } = useAuthContext();
  const [favoriteSpaces, setFavoriteSpaces] = useState<Space[]>([]);
  const [showAllFavorites, setShowAllFavorites] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Navigation items
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/map', icon: Map, label: 'Discover' },
    { path: '/global-feed', icon: Globe, label: 'Global Feed' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/create-event', icon: CalendarPlus, label: 'Create Event' },
    { path: '/activities', icon: Calendar, label: 'My Activities' },
    { path: '/messages', icon: MessageCircle, label: 'Messages', badge: 3 },
    { path: '/account', icon: User, label: 'Account' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  if (isAdmin) {
    navItems.push({ path: '/admin', icon: Shield, label: 'Admin', badge: 0 });
  }

  // Load favorite spaces
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) return;
      
      try {
        // For now, just load the first 5 spaces as favorites
        // In a real app, you'd have a favorites system
        const result = await getSpaces({ limit: 5 });
        if (result && result.data) {
          setFavoriteSpaces(result.data);
        } else {
          setFavoriteSpaces([]);
        }
      } catch (error) {
        console.error('Failed to load favorite spaces:', error);
        setFavoriteSpaces([]);
      }
    };

    loadFavorites();
  }, [user]);

  const displayedFavorites = showAllFavorites ? favoriteSpaces : favoriteSpaces.slice(0, 3);
  const showSidebar = !isCollapsed || isHovered || isOpen;

  // Only show when explicitly opened (via menu trigger)
  const shouldShow = isOpen;
  
  // On desktop, when sidebar is open, disable collapse functionality
  const canCollapse = window.innerWidth >= 1024 && isOpen ? false : true;

  return (
    <>
      {/* Backdrop when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={onClose}
        />
      )}
      
      <aside 
        className={`fixed left-0 h-full bg-white border-r border-gray-200 flex flex-col overflow-hidden transition-all duration-300 z-50 ${
          (isCollapsed && !isOpen) ? 'w-20' : 'w-72'
        } ${
          shouldShow ? 'translate-x-0' : '-translate-x-full'
        } top-0 lg:top-16 lg:h-[calc(100vh-4rem)]`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {/* Toggle Button - Hide when sidebar is forced open on desktop */}
      {!isOpen && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors z-50"
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      )}
      
      {/* Logo/Brand - Removed since it's in the header */}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Favorites Section */}
        {user && favoriteSpaces.length > 0 && (
          <div className={`p-4 border-b border-gray-100 transition-all duration-300 ${!showSidebar ? 'px-2' : ''}`}>
            {showSidebar ? (
              <>
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
              </>
            ) : (
              <>
                <div className="flex justify-center mb-3">
                  <Star className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="space-y-1">
                  {favoriteSpaces.slice(0, 3).map((space) => (
                    <FavoriteSpace 
                      key={space.id} 
                      space={space} 
                      isActive={location.pathname === `/spaces/${space.id}`}
                      isCollapsed={true}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Main Navigation */}
        <nav className={`p-4 space-y-1 transition-all duration-300 ${!showSidebar ? 'px-2' : ''}`}>
          {navItems.map((item) => (
            <NavItem
              key={item.path}
              {...item}
              isActive={location.pathname === item.path}
              isCollapsed={!showSidebar}
            />
          ))}
        </nav>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className={`border-t border-gray-100 p-4 transition-all duration-300 ${!showSidebar ? 'px-2' : ''}`}>
          {showSidebar ? (
            <>
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
                  to="/account"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={signOut}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-center">
                <Avatar 
                  name={profile?.full_name || user.email?.split('@')[0]}
                  imageUrl={profile?.avatar_url}
                  size="md"
                />
              </div>
              <Link
                to="/account"
                className="relative flex justify-center p-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  Settings
                </div>
              </Link>
              <button
                onClick={signOut}
                className="relative w-full flex justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  Sign Out
                </div>
              </button>
            </div>
          )}
        </div>
      )}
      </aside>
    </>
  );
};

export default Sidebar;