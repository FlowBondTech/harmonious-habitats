import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type NotificationType = 'announcement_info' | 'announcement_success' | 'announcement_warning' | 'announcement_error' | 'announcement_system';

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('announcement_info');
  const [actionUrl, setActionUrl] = useState('');
  const [actionLabel, setActionLabel] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const typeIcons = {
    announcement_info: Info,
    announcement_success: CheckCircle,
    announcement_warning: AlertTriangle,
    announcement_error: AlertCircle,
    announcement_system: AlertCircle
  };

  const typeColors = {
    announcement_info: 'bg-blue-100 text-blue-700',
    announcement_success: 'bg-green-100 text-green-700',
    announcement_warning: 'bg-yellow-100 text-yellow-700',
    announcement_error: 'bg-red-100 text-red-700',
    announcement_system: 'bg-purple-100 text-purple-700'
  };

  const typeLabels = {
    announcement_info: 'Info',
    announcement_success: 'Success',
    announcement_warning: 'Warning',
    announcement_error: 'Error',
    announcement_system: 'System'
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required');
      return;
    }

    setSending(true);
    setError('');

    try {
      // Get all user IDs
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id');

      if (usersError) throw usersError;

      if (!users || users.length === 0) {
        throw new Error('No users found');
      }

      // Create notifications for all users
      const notifications = users.map(user => ({
        user_id: user.id,
        title: title.trim(),
        message: message.trim(),
        type,
        action_url: actionUrl.trim() || null,
        is_read: false,
        metadata: {
          category: 'announcement',
          action_label: actionLabel.trim() || null
        }
      }));

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);

    } catch (err) {
      console.error('Error sending announcement:', err);
      setError(err instanceof Error ? err.message : 'Failed to send announcement');
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setType('info');
    setActionUrl('');
    setActionLabel('');
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    if (!sending) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-forest-600 to-forest-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Send className="h-6 w-6" />
            <span>Send Announcement</span>
          </h2>
          <button
            onClick={handleClose}
            disabled={sending}
            className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-green-100 p-6 rounded-full mb-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Announcement Sent!</h3>
              <p className="text-gray-600 text-center">
                Your announcement has been sent to all users successfully.
              </p>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="text-red-800 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Type Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(Object.keys(typeIcons) as NotificationType[]).map((t) => {
                    const Icon = typeIcons[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          type === t
                            ? `${typeColors[t]} border-current`
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <Icon className="h-5 w-5 mx-auto mb-1" />
                        <span className="text-xs font-medium">{typeLabels[t]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title Input */}
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Platform Maintenance Tomorrow"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  disabled={sending}
                />
              </div>

              {/* Message Input */}
              <div className="mb-4">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your announcement message here..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent resize-none"
                  disabled={sending}
                />
                <p className="mt-1 text-xs text-gray-500">
                  This message will be sent to all users in the platform.
                </p>
              </div>

              {/* Optional Action */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Optional Action Button
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="actionLabel" className="block text-xs font-medium text-gray-600 mb-1">
                      Button Text
                    </label>
                    <input
                      id="actionLabel"
                      type="text"
                      value={actionLabel}
                      onChange={(e) => setActionLabel(e.target.value)}
                      placeholder="e.g., Learn More"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                      disabled={sending}
                    />
                  </div>
                  <div>
                    <label htmlFor="actionUrl" className="block text-xs font-medium text-gray-600 mb-1">
                      URL
                    </label>
                    <input
                      id="actionUrl"
                      type="text"
                      value={actionUrl}
                      onChange={(e) => setActionUrl(e.target.value)}
                      placeholder="e.g., /settings"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                      disabled={sending}
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              {(title || message) && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${typeColors[type]}`}>
                        {React.createElement(typeIcons[type], { className: 'h-5 w-5' })}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{title || 'Announcement Title'}</h4>
                        <p className="text-sm text-gray-600 mt-1">{message || 'Your announcement message will appear here...'}</p>
                        {actionLabel && actionUrl && (
                          <button className="mt-2 text-sm text-forest-600 hover:text-forest-700 font-medium">
                            {actionLabel} →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={sending}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !title.trim() || !message.trim()}
              className="px-6 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-lg transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>Send to All Users</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
