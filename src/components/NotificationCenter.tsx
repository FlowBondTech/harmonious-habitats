import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, X, Check, AlertCircle, Calendar, Users, MessageSquare, 
  Star, UserCheck, CheckCircle, XCircle, Clock, Send, 
  ChevronLeft, Filter, Shield
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate, Link } from 'react-router-dom';

interface Notification {
  id: string;
  created_at: string;
  type: string;
  title: string;
  message: string;
  read_at?: string;
  event_id?: string;
  space_id?: string;
  conversation_id?: string;
  related_user_id?: string;
  metadata?: any;
  scheduled_for?: string;
  expires_at?: string;
}

const NotificationCenter: React.FC = () => {
  const { user, isAdmin } = useAuthContext();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'reminders' | 'feedback' | 'applications' | 'messages'>('all');

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      // Apply filters
      if (filter === 'unread') {
        query = query.is('read_at', null);
      } else if (filter === 'reminders') {
        query = query.in('type', ['event_reminder_24h', 'event_reminder_1h', 'event_starting_soon']);
      } else if (filter === 'feedback') {
        query = query.eq('type', 'feedback_request');
      } else if (filter === 'applications') {
        query = query.in('type', ['space_booking_request', 'space_booking_approved', 'space_booking_rejected']);
      } else if (filter === 'messages') {
        query = query.eq('type', 'new_message');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading notifications:', error);
      } else {
        setNotifications(data || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    if (user && showDropdown) {
      loadNotifications();
    }
  }, [user, showDropdown, loadNotifications]);


  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const unreadIds = notifications
        .filter(notif => !notif.read_at)
        .map(notif => notif.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);

      if (error) {
        console.error('Error marking all as read:', error);
        return;
      }

      setNotifications(prev =>
        prev.map(notif => ({
          ...notif,
          read_at: notif.read_at || new Date().toISOString()
        }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event_reminder_24h':
      case 'event_reminder_1h':
      case 'event_starting_soon':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'feedback_request':
        return <Star className="h-4 w-4 text-green-600" />;
      case 'registration_confirmed':
      case 'waitlist_promoted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'event_cancelled':
      case 'event_updated':
      case 'registration_cancelled':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'space_booking_request':
        return <Send className="h-4 w-4 text-purple-600" />;
      case 'space_booking_approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'space_booking_rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'new_message':
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'community':
        return <Users className="h-4 w-4 text-forest-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'event_reminder_24h':
      case 'event_reminder_1h':
      case 'event_starting_soon':
        return 'bg-blue-100 text-blue-800';
      case 'feedback_request':
        return 'bg-green-100 text-green-800';
      case 'registration_confirmed':
      case 'waitlist_promoted':
      case 'space_booking_approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'event_cancelled':
      case 'registration_cancelled':
      case 'space_booking_rejected':
        return 'bg-red-100 text-red-800';
      case 'event_updated':
        return 'bg-orange-100 text-orange-800';
      case 'space_booking_request':
        return 'bg-purple-100 text-purple-800';
      case 'new_message':
      case 'message':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatNotificationType = (type: string) => {
    switch (type) {
      case 'event_reminder_24h':
        return 'Reminder';
      case 'event_reminder_1h':
        return 'Starting Soon';
      case 'event_starting_soon':
        return 'Starting Now';
      case 'feedback_request':
        return 'Feedback';
      case 'registration_confirmed':
        return 'Registered';
      case 'waitlist_promoted':
        return 'Promoted';
      case 'event_cancelled':
        return 'Cancelled';
      case 'event_updated':
        return 'Updated';
      case 'registration_cancelled':
        return 'Registration Update';
      case 'space_booking_request':
        return 'Booking Request';
      case 'space_booking_approved':
        return 'Booking Approved';
      case 'space_booking_rejected':
        return 'Booking Declined';
      case 'new_message':
        return 'Message';
      default:
        return 'Notification';
    }
  };

  const getNotificationActions = (notification: Notification) => {
    if (notification.type === 'new_message' && notification.conversation_id) {
      return (
        <div className="flex space-x-2 mt-2">
          <button
            onClick={() => {
              navigate(`/messages?conversation=${notification.conversation_id}`);
              setShowDropdown(false);
            }}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
          >
            <MessageSquare className="h-3 w-3" />
            <span>View Message</span>
          </button>
        </div>
      );
    }

    if (notification.type === 'feedback_request' && notification.event_id) {
      return (
        <div className="flex space-x-2 mt-2">
          <button
            onClick={() => {
              // Navigate to feedback form
              navigate(`/events/${notification.event_id}/feedback`);
              setShowDropdown(false);
            }}
            className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
          >
            <Star className="h-3 w-3" />
            <span>Leave Feedback</span>
          </button>
        </div>
      );
    }
    
    if (notification.type === 'space_booking_request' && notification.metadata?.application_id) {
      return (
        <div className="flex space-x-2 mt-2">
          <button
            onClick={() => handleApplicationAction(notification.metadata.application_id, 'approved')}
            className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
          >
            <CheckCircle className="h-3 w-3" />
            <span>Approve</span>
          </button>
          <button
            onClick={() => handleApplicationAction(notification.metadata.application_id, 'rejected')}
            className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
          >
            <XCircle className="h-3 w-3" />
            <span>Decline</span>
          </button>
          <button
            onClick={() => viewApplicationDetails(notification.metadata.application_id)}
            className="flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors"
          >
            <Clock className="h-3 w-3" />
            <span>Review</span>
          </button>
        </div>
      );
    }

    if ((notification.type === 'event_reminder_24h' || 
         notification.type === 'event_reminder_1h' || 
         notification.type === 'event_starting_soon') && notification.event_id) {
      return (
        <div className="flex space-x-2 mt-2">
          <button
            onClick={() => {
              navigate(`/events/${notification.event_id}`);
              setShowDropdown(false);
            }}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
          >
            <Calendar className="h-3 w-3" />
            <span>View Event</span>
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

  const unreadCount = notifications.filter(n => !n.read_at).length;

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
            className="fixed inset-0 z-[110] bg-black/20"
            onClick={() => setShowDropdown(false)}
          />
          <div className="fixed right-2 sm:right-4 top-16 sm:top-20 w-[calc(100vw-1rem)] sm:w-80 max-w-md bg-white rounded-2xl shadow-xl border border-forest-100 z-[120] max-h-[calc(100vh-5rem)] sm:max-h-96 overflow-hidden flex flex-col">
            <div className="p-3 sm:p-4 border-b border-forest-100 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-forest-800">Notifications</h3>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-1 text-forest-400 hover:text-forest-600 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Filter buttons */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'unread', label: 'Unread' },
                  { key: 'reminders', label: 'Reminders' },
                  { key: 'feedback', label: 'Feedback' },
                  { key: 'applications', label: 'Applications' },
                  { key: 'messages', label: 'Messages' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key as any)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      filter === key
                        ? 'bg-forest-600 text-white'
                        : 'bg-forest-100 text-forest-700 hover:bg-forest-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Mark all as read */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="mt-2 text-xs text-forest-600 hover:text-forest-800 underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
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
                      className={`p-3 sm:p-4 hover:bg-forest-25 transition-colors ${
                        !notification.read_at ? 'bg-forest-50 border-l-2 sm:border-l-4 border-l-forest-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getNotificationBadgeColor(notification.type)}`}>
                              {formatNotificationType(notification.type)}
                            </span>
                            <span className="text-xs text-forest-500">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <h4 className="text-sm font-medium text-forest-800 mb-1">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-forest-600 mb-2">
                            {notification.message}
                          </p>
                          {getNotificationActions(notification)}
                        </div>
                        {!notification.read_at && (
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

            {/* Admin Link for Admin Users */}
            {isAdmin && (
              <div className="p-3 border-t border-forest-100 bg-gradient-to-r from-purple-50 to-blue-50 flex-shrink-0">
                <Link
                  to="/admin"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium text-sm hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-[1.02]"
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin Dashboard</span>
                </Link>
              </div>
            )}

            {notifications.length > 0 && (
              <div className="p-3 border-t border-forest-100 bg-forest-25 flex-shrink-0">
                <Link
                  to="/settings"
                  state={{ activeSection: 'notifications' }}
                  onClick={() => setShowDropdown(false)}
                  className="block w-full text-center text-sm text-forest-600 hover:text-forest-800 font-medium transition-colors"
                >
                  View all notifications
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;