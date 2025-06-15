import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  Shield, 
  Trash2, 
  RefreshCw, 
  Crown,
  ShieldOff,
  Calendar,
  Mail,
  User
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  bio: string | null;
  expertise: string[] | null;
  is_admin: boolean;
  created_at: string;
  invite_code_used: string | null;
}

const UserManagement: React.FC = () => {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    regularUsers: 0
  });

  useEffect(() => {
    if (profile?.is_admin) {
      fetchUsers();
    }
  }, [profile]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const admins = data?.filter(user => user.is_admin).length || 0;
      const regularUsers = total - admins;

      setStats({ total, admins, regularUsers });
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const promoteToAdmin = async (userId: string) => {
    try {
      setActionLoading(userId);
      const { error } = await supabase.rpc('promote_user_to_admin', {
        target_user_id: userId
      });

      if (error) throw error;

      await fetchUsers();
    } catch (error) {
      console.error('Error promoting user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const revokeAdmin = async (userId: string) => {
    if (!confirm('Are you sure you want to revoke admin privileges for this user?')) return;

    try {
      setActionLoading(userId);
      const { error } = await supabase.rpc('revoke_admin_privileges', {
        target_user_id: userId
      });

      if (error) throw error;

      await fetchUsers();
    } catch (error) {
      console.error('Error revoking admin:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}'s account? This action cannot be undone.`)) return;

    try {
      setActionLoading(userId);
      
      // Delete user profile (cascading will handle related data)
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!profile?.is_admin) {
    return (
      <div className={`
        p-8 rounded-xl shadow-md text-center
        ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
      `}>
        <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className={theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}>
          You don't have permission to manage users.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`
          p-6 rounded-xl shadow-md
          ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
        `}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Total Users
              </p>
              <p className="text-2xl font-semibold">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-sage-500" />
          </div>
        </div>

        <div className={`
          p-6 rounded-xl shadow-md
          ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
        `}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Administrators
              </p>
              <p className="text-2xl font-semibold text-terracotta-500">{stats.admins}</p>
            </div>
            <Shield className="w-8 h-8 text-terracotta-500" />
          </div>
        </div>

        <div className={`
          p-6 rounded-xl shadow-md
          ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
        `}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Regular Users
              </p>
              <p className="text-2xl font-semibold text-blue-500">{stats.regularUsers}</p>
            </div>
            <User className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className={`
        rounded-xl shadow-md overflow-hidden
        ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
      `}>
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">User Management</h2>
            <button
              onClick={fetchUsers}
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
              Loading users...
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
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Expertise
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`
                          flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center
                          ${theme === 'dark' ? 'bg-neutral-700' : 'bg-sage-100'}
                        `}>
                          <User className="h-5 w-5 text-sage-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium">
                            {user.full_name}
                          </div>
                          <div className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.is_admin ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-terracotta-100 text-terracotta-800 dark:bg-terracotta-900/30 dark:text-terracotta-300">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          <User className="w-3 h-3 mr-1" />
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.expertise && user.expertise.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.expertise.slice(0, 2).map((skill, index) => (
                            <span
                              key={index}
                              className={`
                                inline-flex items-center px-2 py-1 rounded-md text-xs font-medium
                                ${theme === 'dark' 
                                  ? 'bg-sage-900/30 text-sage-300' 
                                  : 'bg-sage-100 text-sage-700'
                                }
                              `}
                            >
                              {skill}
                            </span>
                          ))}
                          {user.expertise.length > 2 && (
                            <span className={`text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                              +{user.expertise.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                          No expertise listed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-neutral-400" />
                        {formatDate(user.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {user.id !== profile.id && (
                          <>
                            {user.is_admin ? (
                              <button
                                onClick={() => revokeAdmin(user.id)}
                                disabled={actionLoading === user.id}
                                className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
                                title="Revoke admin privileges"
                              >
                                <ShieldOff className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => promoteToAdmin(user.id)}
                                disabled={actionLoading === user.id}
                                className="text-terracotta-600 hover:text-terracotta-800 dark:text-terracotta-400 dark:hover:text-terracotta-300 transition-colors"
                                title="Promote to admin"
                              >
                                <Crown className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteUser(user.id, user.full_name)}
                              disabled={actionLoading === user.id}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {actionLoading === user.id && (
                          <RefreshCw className="w-4 h-4 animate-spin text-neutral-400" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <p className={`${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  No users found.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;