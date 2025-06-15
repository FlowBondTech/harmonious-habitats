import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Mail, Send, Loader2, X, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SendInviteFormProps {
  inviteCode: string;
  onClose: () => void;
}

const SendInviteForm: React.FC<SendInviteFormProps> = ({ inviteCode, onClose }) => {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const [emails, setEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateEmails = (emailString: string): string[] => {
    const emailArray = emailString.split(/[\n,;]+/).map(email => email.trim()).filter(email => email !== '');
    const validEmails: string[] = [];
    const invalidEmails: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    emailArray.forEach(email => {
      if (emailRegex.test(email)) {
        validEmails.push(email);
      } else {
        invalidEmails.push(email);
      }
    });

    if (invalidEmails.length > 0) {
      setError(`Invalid email addresses: ${invalidEmails.join(', ')}`);
      return [];
    }
    if (validEmails.length === 0) {
      setError('Please enter at least one email address.');
      return [];
    }
    return validEmails;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validEmails = validateEmails(emails);
    if (validEmails.length === 0) {
      return;
    }

    setLoading(true);

    try {
      // Call the Supabase Edge Function to send emails
      const { data, error: functionError } = await supabase.functions.invoke('send-invite-email', {
        body: {
          inviteCode: inviteCode,
          recipients: validEmails
        }
      });

      if (functionError) throw functionError;

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to send emails');
      }

      setSuccess(`🎉 Invite sent successfully to ${validEmails.length} recipient(s)!`);
      setEmails(''); // Clear the textarea

      // Auto-close after a delay
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (err: any) {
      console.error('Error sending invite:', err);
      
      // Handle different types of errors
      if (err.message?.includes('Unauthorized')) {
        setError('You are not authorized to send this invite code.');
      } else if (err.message?.includes('expired')) {
        setError('This invite code has expired. Please create a new one.');
      } else if (err.message?.includes('Resend API key')) {
        setError('Email service is not properly configured. Please contact support.');
      } else {
        setError(err.message || 'Failed to send invite. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`
        relative w-full max-w-md p-6 rounded-2xl shadow-xl
        ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
      `}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className={`
            inline-flex items-center justify-center w-12 h-12 rounded-full mb-3
            ${theme === 'dark' ? 'bg-sage-900/30' : 'bg-sage-100'}
          `}>
            <Mail className="w-6 h-6 text-sage-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-1">Send Invite Code</h2>
          <p className={`${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Share your invite code with friends via email
          </p>
        </div>

        <div className={`
          p-4 rounded-lg mb-6 text-center
          ${theme === 'dark' ? 'bg-sage-900/30 border border-sage-700/50' : 'bg-sage-50 border border-sage-200'}
        `}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="w-4 h-4 text-sage-500" />
            <span className="text-sm font-medium">From: {profile?.full_name}</span>
          </div>
          <p className="text-sm font-medium mb-2">Your Invite Code:</p>
          <code className={`
            text-lg font-mono tracking-wider px-3 py-2 rounded-md
            ${theme === 'dark' ? 'bg-sage-800 text-sage-300' : 'bg-sage-200 text-sage-700'}
          `}>
            {inviteCode.toLowerCase()}
          </code>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="emails" className="block text-sm font-medium mb-2">
              Recipient Email(s)
            </label>
            <textarea
              id="emails"
              value={emails}
              onChange={(e) => {
                setEmails(e.target.value);
                setError(''); // Clear error on input change
              }}
              rows={5}
              placeholder="Enter one or more email addresses&#10;Separate with commas, semicolons, or new lines&#10;&#10;Example:&#10;friend@example.com&#10;another@example.com"
              className={`
                w-full px-4 py-3 rounded-lg border resize-none
                ${error 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'focus:ring-sage-500 focus:border-transparent'
                }
                ${theme === 'dark' 
                  ? 'bg-neutral-700 border-neutral-600 text-neutral-100 placeholder-neutral-400' 
                  : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-500'
                }
                focus:ring-2 transition-all duration-200
              `}
              required
              disabled={loading}
            />
            <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
              Each recipient will receive a beautiful invitation email with your invite code
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !emails.trim()}
              className={`
                flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium
                transition-all duration-200 transform
                ${loading || !emails.trim()
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : 'bg-sage-500 text-white hover:bg-sage-600 hover:scale-[1.02] active:scale-[0.98]'
                }
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Invites
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`
                px-4 py-3 rounded-lg font-medium transition-all duration-200
                ${loading
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : theme === 'dark' 
                    ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600' 
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }
              `}
            >
              Cancel
            </button>
          </div>
        </form>

        <div className={`
          mt-4 p-3 rounded-lg text-xs
          ${theme === 'dark' ? 'bg-neutral-700/50 text-neutral-400' : 'bg-neutral-50 text-neutral-500'}
        `}>
          💡 <strong>Tip:</strong> Recipients will receive a beautiful email with your invite code and instructions to join Holistic Spaces.
        </div>
      </div>
    </div>
  );
};

export default SendInviteForm;