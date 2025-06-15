import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Bell, X, MapPin, Calendar, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SpaceNotification {
  id: string;
  title: string;
  date: string;
  location: string;
  holder_name: string;
  created_at: string;
}

const GlobalNotifications: React.FC = () => {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<SpaceNotification[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || !isEnabled) return;

    // Check localStorage for notification preference
    const notificationsDisabled = localStorage.getItem('globalNotificationsDisabled') === 'true';
    if (notificationsDisabled) {
      setIsEnabled(false);
      return;
    }

    // Subscribe to new spaces
    const subscription = supabase
      .channel('new-spaces')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'spaces'
        },
        async (payload) => {
          // Don't show notifications for spaces created by the current user
          if (payload.new.holder_id === user.id) return;

          // Get holder information
          const { data: holderData } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('id', payload.new.holder_id)
            .single();

          const newNotification: SpaceNotification = {
            id: payload.new.id,
            title: payload.new.title,
            date: payload.new.date,
            location: payload.new.location,
            holder_name: holderData?.full_name || 'Someone',
            created_at: payload.new.created_at
          };

          setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Keep only 5 most recent
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, isEnabled]);

  const handleDisableNotifications = () => {
    localStorage.setItem('globalNotificationsDisabled', 'true');
    setIsEnabled(false);
    setNotifications([]);
  };

  const handleDismissNotification = (notificationId: string) => {
    setDismissedNotifications(prev => new Set([...prev, notificationId]));
  };

  const visibleNotifications = notifications.filter(
    notification => !dismissedNotifications.has(notification.id)
  );

  if (!isEnabled || !user || visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm pb-24">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            p-4 rounded-xl shadow-lg border-l-4 border-sage-500 animate-in slide-in-from-right duration-300
            ${theme === 'dark' 
              ? 'bg-neutral-800 border-r border-t border-b border-neutral-700' 
              : 'bg-white border-r border-t border-b border-sage-100'
            }
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className={`
                p-2 rounded-full
                ${theme === 'dark' ? 'bg-sage-900/30' : 'bg-sage-100'}
              `}>
                <Bell className="w-4 h-4 text-sage-500" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-sage-600 dark:text-sage-400">
                    NEW SPACE
                  </span>
                  <span className="text-xs text-neutral-500">
                    just now
                  </span>
                </div>
                
                <h4 className="font-semibold text-sm mb-2 line-clamp-2">
                  {notification.title}
                </h4>
                
                <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>by {notification.holder_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(notification.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{notification.location}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => handleDismissNotification(notification.id)}
              className={`
                p-1 rounded-full transition-colors
                ${theme === 'dark' 
                  ? 'hover:bg-neutral-700 text-neutral-400' 
                  : 'hover:bg-neutral-100 text-neutral-500'
                }
              `}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      
      {/* Disable notifications link - positioned to avoid bottom navbar */}
      {visibleNotifications.length > 0 && (
        <div className="text-center mt-2">
          <button
            onClick={handleDisableNotifications}
            className={`
              text-xs underline transition-colors px-2 py-1 rounded
              ${theme === 'dark' 
                ? 'text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800/50' 
                : 'text-neutral-500 hover:text-neutral-600 hover:bg-white/50'
              }
            `}
          >
            Turn off notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default GlobalNotifications;