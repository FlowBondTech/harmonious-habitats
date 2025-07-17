import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Check, AlertCircle, Calendar, Users, MessageSquare, Star, UserCheck, CheckCircle, XCircle, Clock, Send } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { getUserNotifications, markNotificationAsRead, Notification } from '../lib/supabase';

const NotificationCenter: React.FC = () => {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await getUserNotifications(user.id);
      if (!error && data) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);


  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Calendar className="h-4 w-4 text-earth-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'community':
        return <Users className="h-4 w-4 text-forest-500" />;
      case 'review':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'space_application':
        return <Send className="h-4 w-4 text-purple-500" />;
      case 'application_status':
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationActions = (notification: Notification) => {
    if (notification.type === 'space_application' && notification.data?.application_id) {
      return (
        <div className="flex space-x-2 mt-2">
          <button
            onClick={() => handleApplicationAction(notification.data.application_id, 'approved')}
            className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
          >
            <CheckCircle className="h-3 w-3" />
            <span>Approve</span>
          </button>
          <button
            onClick={() => handleApplicationAction(notification.data.application_id, 'rejected')}
            className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
          >
            <XCircle className="h-3 w-3" />
            <span>Decline</span>
          </button>
          <button
            onClick={() => viewApplicationDetails(notification.data.application_id)}
            className="flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors"
          >
            <Clock className="h-3 w-3" />
            <span>Review</span>
          </button>
        </div>
      );
    }
    return null;
  };

  const handleApplicationAction = async (applicationId: string, status: 'approved' | 'rejected') => {
    try {
      const { updateSpaceApplication } = await import('../lib/supabase');
      await updateSpaceApplication(applicationId, { 
        status,
        owner_response: {
          message: status === 'approved' ? 'Your application has been approved!' : 'Thank you for your application.'
        }
      });
      
      // Refresh notifications
      loadNotifications();
    } catch (error) {
      console.error('Error updating application:', error);
    }
  };

  const viewApplicationDetails = (applicationId: string) => {
    // For now, just mark as read and close dropdown
    // In a full implementation, this would open an application details modal
    setShowDropdown(false);
    console.log('View application details:', applicationId);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-forest-600 hover:bg-forest-50 rounded-xl transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-forest-100 z-20 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-forest-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-forest-800">Notifications</h3>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-1 text-forest-400 hover:text-forest-600 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-forest-200 border-t-forest-600 rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-forest-600">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-forest-300 mx-auto mb-3" />
                  <p className="text-forest-600 font-medium">No notifications</p>
                  <p className="text-sm text-forest-500">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-forest-50">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-forest-25 transition-colors ${
                        !notification.is_read ? 'bg-forest-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-forest-800 mb-1">
                            {notification.title}
                          </h4>
                          {notification.content && (
                            <p className="text-sm text-forest-600 mb-2">
                              {notification.content}
                            </p>
                          )}
                          <p className="text-xs text-forest-500">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </p>
                          {getNotificationActions(notification)}
                        </div>
                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="flex-shrink-0 p-1 text-forest-400 hover:text-forest-600 rounded"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-forest-100 bg-forest-25">
                <button className="w-full text-sm text-forest-600 hover:text-forest-800 font-medium transition-colors">
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;