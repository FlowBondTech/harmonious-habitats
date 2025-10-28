import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Map,
  MessageCircle,
  User,
  Plus,
  Search,
  Zap
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
  requiresAuth?: boolean;
}

const BottomNavbar: React.FC = () => {
  const location = useLocation();
  const { user, openAuthModalGlobal } = useAuthContext();
  const [unreadMessages] = React.useState(2); // TODO: Get from actual data

  // Define navigation items
  const navItems: NavItem[] = [
    { path: '/activities', icon: Home, label: 'Home' },
    { path: '/map', icon: Map, label: 'Discover' },
    { path: '/hyperlocal', icon: Zap, label: 'Local' },
    { path: '/messages', icon: MessageCircle, label: 'Messages', badge: unreadMessages, requiresAuth: true },
    { path: '/profile', icon: User, label: 'Profile', requiresAuth: true }
  ];

  // Filter items based on auth state
  const visibleItems = navItems.filter(item => !item.requiresAuth || user);

  // Add non-authenticated items if not logged in
  const finalItems = user ? visibleItems : [
    ...visibleItems.slice(0, 3),
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/signin', icon: User, label: 'Sign In' }
  ];

  const handleNavClick = (item: NavItem) => {
    // Handle sign in click
    if (item.path === '/signin' && !user) {
      openAuthModalGlobal('signin');
      return false;
    }
    return true;
  };

  // Don't show for unauthenticated users
  if (!user) {
    return null;
  }

  // Don't show on certain pages
  const hiddenPaths = ['/admin', '/settings', '/create-event'];
  if (hiddenPaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  return (
    <>
      {/* Spacer to prevent content from being hidden */}
      <div className="h-16 md:hidden" />

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
        <div className="grid grid-cols-5 h-16">
          {finalItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            if (item.path === '/signin') {
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item)}
                  className="flex flex-col items-center justify-center relative group"
                >
                  <Icon className={`h-5 w-5 mb-1 transition-colors ${
                    isActive ? 'text-forest-600' : 'text-gray-500 group-active:text-forest-600'
                  }`} />
                  <span className={`text-[10px] transition-colors ${
                    isActive ? 'text-forest-600 font-medium' : 'text-gray-500 group-active:text-forest-600'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center relative group"
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-forest-600 rounded-b-full" />
                )}

                {/* Icon with badge */}
                <div className="relative">
                  <Icon className={`h-5 w-5 mb-1 transition-colors ${
                    isActive ? 'text-forest-600' : 'text-gray-500 group-active:text-forest-600'
                  }`} />

                  {/* Badge */}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold px-1 min-w-[16px] h-4 flex items-center justify-center rounded-full">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span className={`text-[10px] transition-colors ${
                  isActive ? 'text-forest-600 font-medium' : 'text-gray-500 group-active:text-forest-600'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Floating Action Button */}
      {user && (
        <Link
          to="/create-event"
          className="fixed bottom-20 right-4 w-14 h-14 bg-forest-600 rounded-full shadow-lg flex items-center justify-center z-50 md:hidden group active:scale-95 transition-transform"
        >
          <Plus className="h-6 w-6 text-white" />
          {/* Tooltip */}
          <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Create Event
          </span>
        </Link>
      )}
    </>
  );
};

export default BottomNavbar;