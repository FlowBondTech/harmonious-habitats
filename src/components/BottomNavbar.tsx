import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSpaceFilter } from '../context/SpaceFilterContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Home, Calendar, Plus, User, Shield, Crown } from 'lucide-react';

interface BottomNavbarProps {
  onHoldSpace: () => void;
  onNavigationClick: (view: 'spaces' | 'admin' | 'profile') => void;
  isFormActive: boolean;
  currentView: 'spaces' | 'admin' | 'profile';
}

const BottomNavbar: React.FC<BottomNavbarProps> = ({ 
  onHoldSpace, 
  onNavigationClick, 
  isFormActive,
  currentView 
}) => {
  const { theme, toggleTheme } = useTheme();
  const { filter, setFilter } = useSpaceFilter();
  const { profile } = useAuth();

  const handleNavigation = (filterType: 'all' | 'attending' | 'holding') => {
    setFilter(filterType);
    onNavigationClick('spaces');
  };

  const navItems = [
    {
      id: 'all',
      icon: Home,
      label: 'All',
      action: () => handleNavigation('all'),
      isActive: filter === 'all' && !isFormActive && currentView === 'spaces'
    },
    {
      id: 'attending',
      icon: Calendar,
      label: 'Attending',
      action: () => handleNavigation('attending'),
      isActive: filter === 'attending' && !isFormActive && currentView === 'spaces'
    },
    {
      id: 'holding',
      icon: User,
      label: 'Hosting',
      action: () => handleNavigation('holding'),
      isActive: filter === 'holding' && !isFormActive && currentView === 'spaces'
    },
    {
      id: 'hold',
      icon: Plus,
      label: 'Hold',
      action: onHoldSpace,
      isActive: isFormActive,
      isSpecial: true
    },
    {
      id: 'profile',
      icon: profile?.is_admin ? Crown : User,
      label: 'Profile',
      action: () => onNavigationClick('profile'),
      isActive: currentView === 'profile',
      isAdmin: profile?.is_admin
    },
    ...(profile?.is_admin ? [{
      id: 'admin',
      icon: Shield,
      label: 'Admin',
      action: () => onNavigationClick('admin'),
      isActive: currentView === 'admin'
    }] : []),
    {
      id: 'theme',
      icon: theme === 'dark' ? Sun : Moon,
      label: 'Theme',
      action: toggleTheme,
      isActive: false
    }
  ];

  return (
    <nav className={`
      fixed bottom-0 left-0 right-0 z-50 
      ${theme === 'dark' 
        ? 'bg-neutral-800/95 border-neutral-700' 
        : 'bg-white/95 border-neutral-200'
      } 
      backdrop-blur-md border-t shadow-lg
    `}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className={`
                  flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 relative
                  ${item.isSpecial 
                    ? `
                      ${item.isActive 
                        ? 'bg-sage-500 text-white scale-110 shadow-lg' 
                        : 'bg-sage-500 text-white hover:bg-sage-600 hover:scale-105'
                      }
                      w-12 h-12 -mt-2
                    `
                    : `
                      ${item.isActive 
                        ? item.isAdmin
                          ? 'text-terracotta-500 bg-terracotta-50 dark:bg-terracotta-900/30'
                          : 'text-sage-500 bg-sage-50 dark:bg-sage-900/30'
                        : theme === 'dark' 
                          ? 'text-neutral-400 hover:text-sage-400 hover:bg-neutral-700/50' 
                          : 'text-neutral-500 hover:text-sage-500 hover:bg-sage-50'
                      }
                      min-w-[60px]
                    `
                  }
                `}
                aria-label={item.label}
              >
                <Icon size={item.isSpecial ? 24 : 20} />
                <span className={`
                  text-xs mt-1 font-medium
                  ${item.isSpecial ? 'hidden' : 'block'}
                `}>
                  {item.label}
                </span>
                {/* Admin indicator for profile button */}
                {item.id === 'profile' && item.isAdmin && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-terracotta-500 rounded-full border-2 border-white dark:border-neutral-800"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavbar;