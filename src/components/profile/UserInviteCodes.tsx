import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Calendar,
  Key,
  Gift,
  AlertCircle,
  Send
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import SendInviteForm from './SendInviteForm';

interface UserInviteCode {
  id: string;
  code: string;
  is_used: boolean;
  expires_at: string | null;
  created_at: string;
  used_at: string | null;
  used_by_name: string | null;
}

const UserInviteCodes: React.FC = () => {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const [inviteCodes, setInviteCodes] = useState<UserInviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendingCode, setSendingCode] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      fetchUserInviteCodes();
    }
  }, [profile]);

  const fetchUserInviteCodes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_invite_codes');

      if (error) throw error;

      setInviteCodes(data || []);
    } catch (err) {
      console.error('Error fetching user invite codes:', err);
      setError('Failed to load your invite codes');
    } finally {
      setLoading(false);
    }
  };

  const generateInviteCode = async () => {
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const { data, error } = await supabase.rpc('generate_user_invite_code');

      if (error) throw error;

      setSuccess(`New invite code created: ${data}`);
      await fetchUserInviteCodes();
    } catch (err: any) {
      console.error('Error generating invite code:', err);
      setError(err.message || 'Failed to create invite code');
    } finally {
      setCreating(false);
    }
  };

  const deleteInviteCode = async (codeId: string, code: string) => {
    if (!confirm(`Are you sure you want to delete the invite code "${code.toLowerCase()}"?`)) return;

    try {
      const { error } = await supabase
        .from('invite_codes')
        .delete()
        .eq('id', codeId);

      if (error) throw error;

      setSuccess('Invite code deleted successfully');
      await fetchUserInviteCodes();
    } catch (err) {
      console.error('Error deleting invite code:', err);
      setError('Failed to delete invite code');
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code.toLowerCase());
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleSendInvite = (code: string) => {
    setSendingCode(code);
  };

  const closeSendInviteForm = () => {
    setSendingCode(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const formatCodeDisplay = (code: string) => {
    return code.toLowerCase();
  };

  const getStats = () => {
    const total = inviteCodes.length;
    const used = inviteCodes.filter(code => code.is_used).length;
    const active = inviteCodes.filter(code => !code.is_used && !isExpired(code.expires_at)).length;
    const expired = inviteCodes.filter(code => !code.is_used && isExpired(code.expires_at)).length;
    
    return { total, used, active, expired };
  };

  const stats = getStats();

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Gift className="w-7 h-7 text-sage-500" />
              Your Invite Codes
            </h2>
            <p className={`mt-2 ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Share these codes with friends to invite them to Holistic Spaces
            </p>
          </div>
          
          <button
            onClick={generateInviteCode}
            disabled={creating}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200
              transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl
              ${creating
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                : theme === 'dark'
                  ? 'bg-sage-600 text-white hover:bg-sage-500'
                  : 'bg-sage-500 text-white hover:bg-sage-600'
              }
            `}
          >
            {creating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Create Code
              </>
            )}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`
            p-4 rounded-xl shadow-md
            ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
          `}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Total
                </p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
              <Key className="w-6 h-6 text-sage-500" />
            </div>
          </div>

          <div className={`
            p-4 rounded-xl shadow-md
            ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
          `}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Active
                </p>
                <p className="text-2xl font-semibold text-green-500">{stats.active}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>

          <div className={`
            p-4 rounded-xl shadow-md
            ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
          `}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Used
                </p>
                <p className="text-2xl font-semibold text-blue-500">{stats.used}</p>
              </div>
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </div>

          <div className={`
            p-4 rounded-xl shadow-md
            ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
          `}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Expired
                </p>
                <p className="text-2xl font-semibold text-red-500">{stats.expired}</p>
              </div>
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className={`
          p-4 rounded-xl border
          ${theme === 'dark' ? 'bg-sage-900/20 border-sage-700/50' : 'bg-sage-50 border-sage-200'}
        `}>
          <div className="flex items-start gap-3">
            <Gift className="w-5 h-5 text-sage-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">How invite codes work:</p>
              <ul className={`space-y-1 ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                <li>• Create unlimited invite codes to share with friends</li>
                <li>• Each code expires after 30 days if not used</li>
                <li>• Use the "Send" button to email codes directly to friends</li>
                <li>• You can also copy codes to share manually</li>
                <li>• You can delete unused codes if needed</li>
                <li>• Once used, codes cannot be deleted (for tracking purposes)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Invite Codes List */}
        <div className={`
          rounded-xl shadow-md overflow-hidden
          ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
        `}>
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Invite Codes</h3>
              <button
                onClick={fetchUserInviteCodes}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  ${theme === 'dark' 
                    ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600' 
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }
                  transition-colors duration-200
                `}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-sage-500" />
              <p className={theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}>
                Loading your invite codes...
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {inviteCodes.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Gift className="w-12 h-12 text-neutral-400" />
                  </div>
                  <p className={`mb-4 ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    You haven't created any invite codes yet
                  </p>
                  <button
                    onClick={generateInviteCode}
                    disabled={creating}
                    className={`
                      inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium
                      transition-all duration-200 transform hover:scale-105
                      ${creating
                        ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                        : 'bg-sage-500 text-white hover:bg-sage-600'
                      }
                    `}
                  >
                    {creating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Your First Code
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <table className="w-full">
                  <thead className={`
                    ${theme === 'dark' ? 'bg-neutral-700/50' : 'bg-sage-50'}
                  `}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Expires
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Used By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {inviteCodes.map((code) => (
                      <tr key={code.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-sm bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300 px-3 py-1 rounded-lg">
                              {formatCodeDisplay(code.code)}
                            </code>
                            <button
                              onClick={() => copyToClipboard(code.code)}
                              className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                              title="Copy code"
                            >
                              {copiedCode === code.code ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-neutral-400" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {code.is_used ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              Used
                            </span>
                          ) : isExpired(code.expires_at) ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                              Expired
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-neutral-400" />
                            {formatDate(code.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {code.expires_at ? (
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-neutral-400" />
                              {formatDate(code.expires_at)}
                            </div>
                          ) : (
                            'Never'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {code.used_by_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            {!code.is_used && !isExpired(code.expires_at) && (
                              <button
                                onClick={() => handleSendInvite(code.code)}
                                className="p-1 rounded hover:bg-sage-100 dark:hover:bg-sage-900/30 transition-colors"
                                title="Send invite via email"
                              >
                                <Send className="w-4 h-4 text-sage-600 dark:text-sage-400" />
                              </button>
                            )}
                            {!code.is_used && (
                              <button
                                onClick={() => deleteInviteCode(code.id, code.code)}
                                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                title="Delete code"
                              >
                                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Send Invite Form Modal */}
      {sendingCode && (
        <SendInviteForm
          inviteCode={sendingCode}
          onClose={closeSendInviteForm}
        />
      )}
    </>
  );
};

export default UserInviteCodes;