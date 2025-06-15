import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Bell, BellOff, Settings } from 'lucide-react';

const NotificationSettings: React.FC = () => {
  const { theme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const disabled = localStorage.getItem('globalNotificationsDisabled') === 'true';
    setNotificationsEnabled(!disabled);
    
    // Show settings panel briefly when notifications are disabled
    if (disabled) {
      setShowSettings(true);
      setTimeout(() => setShowSettings(false), 5000);
    }
  }, []);

  const toggleNotifications = () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    
    if (newState) {
      localStorage.removeItem('globalNotificationsDisabled');
    } else {
      localStorage.setItem('globalNotificationsDisabled', 'true');
    }
    
    // Show brief confirmation
    setShowSettings(true);
    setTimeout(() => setShowSettings(false), 3000);
    
    // Reload page to apply changes
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Only show if notifications are disabled or temporarily showing settings
  if (notificationsEnabled && !showSettings) {
    return null;
  }

  return (
    <div className={`
      fixed bottom-20 right-4 p-4 rounded-xl shadow-lg border z-40 max-w-xs
      ${theme === 'dark' 
        ? 'bg-neutral-800 border-neutral-700' 
        : 'bg-white border-sage-100'
      }
      ${showSettings ? 'animate-in' : ''}
    `}>
      <div className="flex items-center gap-3">
        <div className={`
          p-2 rounded-full
          ${theme === 'dark' ? 'bg-neutral-700' : 'bg-sage-100'}
        `}>
          <Settings className="w-4 h-4 text-sage-500" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-medium text-sm mb-1">Test Phase Notifications</h4>
          <p className={`text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Get notified when new spaces are created
          </p>
        </div>
        
        <button
          onClick={toggleNotifications}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${notificationsEnabled
              ? 'bg-sage-500 text-white hover:bg-sage-600'
              : theme === 'dark'
                ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }
          `}
        >
          {notificationsEnabled ? (
            <>
              <Bell className="w-4 h-4" />
              On
            </>
          ) : (
            <>
              <BellOff className="w-4 h-4" />
              Off
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings;