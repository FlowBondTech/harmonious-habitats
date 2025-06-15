import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Plus, 
  Copy, 
  Check, 
  Calendar, 
  Users, 
  Key, 
  Trash2, 
  RefreshCw,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  Settings
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import UserManagement from './UserManagement';

interface InviteCode {
  id: string;
  code: string;
  created_by: string | null;
  used_by: string | null;
  is_used: boolean;
  expires_at: string | null;
  created_at: string;
  used_at: string | null;
  creator_name?: string;
  user_name?: string;
}

type AdminTab = 'invite-codes' | 'users';

const AdminPanel: React.FC = () => {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<AdminTab>('invite-codes');
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newCodeExpiry, setNewCodeExpiry] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    used: 0,
    unused: 0,
    expired: 0
  });

  useEffect(() => {
    if (profile?.is_admin && activeTab === 'invite-codes') {
      fetchInviteCodes();
    }
  }, [profile, activeTab]);

  const fetchInviteCodes = async () => {
    try {
      // First get the invite codes
      const { data: inviteCodesData, error: inviteCodesError } = await supabase
        .from('invite_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (inviteCodesError) throw inviteCodesError;

      // Then get user profile names for creators and users
      const codesWithNames = await Promise.all(
        (inviteCodesData || []).map(async (code) => {
          let creator_name = 'System';
          let user_name = null;

          // Get creator name if created_by exists
          if (code.created_by) {
            const { data: creatorData } = await supabase
              .from('user_profiles')
              .select('full_name')
              .eq('id', code.created_by)
              .maybeSingle();
            
            if (creatorData) {
              creator_name = creatorData.full_name;
            }
          }

          // Get user name if used_by exists
          if (code.used_by) {
            const { data: userData } = await supabase
              .from('user_profiles')
              .select('full_name')
              .eq('id', code.used_by)
              .maybeSingle();
            
            if (userData) {
              user_name = userData.full_name;
            }
          }

          return {
            ...code,
            creator_name,
            user_name
          };
        })
      );

      setInviteCodes(codesWithNames);
      
      // Calculate stats
      const now = new Date();
      const total = codesWithNames.length;
      const used = codesWithNames.filter(code => code.is_used).length;
      const unused = codesWithNames.filter(code => !code.is_used).length;
      const expired = codesWithNames.filter(code => 
        code.expires_at && new Date(code.expires_at) < now && !code.is_used
      ).length;

      setStats({ total, used, unused, expired });
    } catch (error) {
      console.error('Error fetching invite codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInviteCode = async () => {
    setCreating(true);
    try {
      const { data, error } = await supabase.rpc('generate_invite_code_admin', {
        expires_at: newCodeExpiry || null,
        created_by_id: profile?.id
      });

      if (error) throw error;

      await fetchInviteCodes();
      setNewCodeExpiry('');
    } catch (error) {
      console.error('Error generating invite code:', error);
    } finally {
      setCreating(false);
    }
  };

  const deleteInviteCode = async (codeId: string) => {
    if (!confirm('Are you sure you want to delete this invite code?')) return;

    try {
      const { error } = await supabase
        .from('invite_codes')
        .delete()
        .eq('id', codeId);

      if (error) throw error;

      await fetchInviteCodes();
    } catch (error) {
      console.error('Error deleting invite code:', error);
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

  if (!profile?.is_admin) {
    return (
      <div className={`
        min-h-screen flex items-center justify-center p-4
        ${theme === 'dark' ? 'bg-neutral-900' : 'bg-sage-50/50'}
      `}>
        <div className={`
          text-center p-8 rounded-2xl shadow-xl
          ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
        `}>
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
          <p className={`${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
            You don't have admin privileges to access this panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      min-h-screen p-4
      ${theme === 'dark' ? 'bg-neutral-900' : 'bg-sage-50/50'}
    `}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-semibold">Admin Panel</h1>
            <Sparkles className="w-8 h-8 text-sage-500" />
          </div>
          <p className={`${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Manage users, invite codes, and system settings
          </p>
        </div>

        {/* Tab Navigation */}
        <div className={`
          flex gap-2 mb-8 p-1 rounded-xl
          ${theme === 'dark' ? 'bg-neutral-800' : 'bg-white shadow-md'}
        `}>
          <button
            onClick={() => setActiveTab('invite-codes')}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200
              ${activeTab === 'invite-codes'
                ? 'bg-sage-500 text-white shadow-md'
                : theme === 'dark'
                  ? 'text-neutral-300 hover:bg-neutral-700'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }
            `}
          >
            <Key className="w-5 h-5" />
            Invite Codes
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200
              ${activeTab === 'users'
                ? 'bg-sage-500 text-white shadow-md'
                : theme === 'dark'
                  ? 'text-neutral-300 hover:bg-neutral-700'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }
            `}
          >
            <Users className="w-5 h-5" />
            User Management
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'invite-codes' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className={`
                p-6 rounded-xl shadow-md
                ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
              `}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      Total Codes
                    </p>
                    <p className="text-2xl font-semibold">{stats.total}</p>
                  </div>
                  <Key className="w-8 h-8 text-sage-500" />
                </div>
              </div>

              <div className={`
                p-6 rounded-xl shadow-md
                ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
              `}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      Used
                    </p>
                    <p className="text-2xl font-semibold text-green-500">{stats.used}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className={`
                p-6 rounded-xl shadow-md
                ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
              `}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      Available
                    </p>
                    <p className="text-2xl font-semibold text-blue-500">{stats.unused}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className={`
                p-6 rounded-xl shadow-md
                ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
              `}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      Expired
                    </p>
                    <p className="text-2xl font-semibold text-red-500">{stats.expired}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </div>
            </div>

            {/* Create New Code */}
            <div className={`
              p-6 rounded-xl shadow-md mb-8
              ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
            `}>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold">Generate New Invite Code</h2>
                <Sparkles className="w-5 h-5 text-sage-500" />
              </div>
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Creates beautiful word-based codes like <code className="bg-sage-100 dark:bg-sage-900/30 px-2 py-1 rounded text-sage-600 dark:text-sage-400">garden123</code>, <code className="bg-sage-100 dark:bg-sage-900/30 px-2 py-1 rounded text-sage-600 dark:text-sage-400">healing456</code>, or <code className="bg-sage-100 dark:bg-sage-900/30 px-2 py-1 rounded text-sage-600 dark:text-sage-400">mindful789</code>
              </p>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={newCodeExpiry}
                    onChange={(e) => setNewCodeExpiry(e.target.value)}
                    className={`
                      w-full px-4 py-3 rounded-lg border
                      ${theme === 'dark' 
                        ? 'bg-neutral-700 border-neutral-600 text-neutral-100' 
                        : 'bg-white border-neutral-300 text-neutral-900'
                      }
                      focus:ring-2 focus:ring-sage-500 focus:border-transparent
                    `}
                  />
                </div>
                <button
                  onClick={generateInviteCode}
                  disabled={creating}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-lg font-medium
                    transition-all duration-200 transform
                    ${creating
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                      : 'bg-sage-500 text-white hover:bg-sage-600 hover:scale-[1.02] active:scale-[0.98]'
                    }
                  `}
                >
                  {creating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Generate Code
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Invite Codes Table */}
            <div className={`
              rounded-xl shadow-md overflow-hidden
              ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
            `}>
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Invite Codes</h2>
                  <button
                    onClick={fetchInviteCodes}
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
                    Loading invite codes...
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                          Created By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Used By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Expires
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
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                Used
                              </span>
                            ) : isExpired(code.expires_at) ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                Expired
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                Available
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {code.creator_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {code.user_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {code.expires_at ? formatDate(code.expires_at) : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {!code.is_used && (
                              <button
                                onClick={() => deleteInviteCode(code.id)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                title="Delete code"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {inviteCodes.length === 0 && (
                    <div className="p-8 text-center">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <Key className="w-12 h-12 text-neutral-400" />
                        <Sparkles className="w-8 h-8 text-sage-400" />
                      </div>
                      <p className={`${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        No invite codes found. Generate your first beautiful code above!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <UserManagement />
        )}
      </div>
    </div>
  );
};

export default AdminPanel;