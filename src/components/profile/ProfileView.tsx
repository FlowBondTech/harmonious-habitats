import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  User, 
  Mail, 
  Calendar, 
  Tag, 
  MapPin, 
  Shield, 
  Crown,
  Edit3,
  LogOut,
  Settings,
  Activity,
  Award,
  Clock,
  TrendingUp,
  Heart,
  Star,
  ChevronRight,
  Camera,
  AlertCircle,
  Gift,
  Users,
  Bell,
  BellOff
} from 'lucide-react';
import ProfileEditor from './ProfileEditor';
import UserInviteCodes from './UserInviteCodes';

type ProfileTab = 'overview' | 'invite-codes';

const ProfileView: React.FC = () => {
  const { profile, user, signOut } = useAuth();
  const { theme } = useTheme();
  const [showEditor, setShowEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [isHovered, setIsHovered] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    // Check notification status from localStorage
    const disabled = localStorage.getItem('globalNotificationsDisabled') === 'true';
    setNotificationsEnabled(!disabled);
  }, []);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      setLoggingOut(true);
      try {
        const result = await signOut();
        if (!result.success) {
          console.error('Logout failed:', result.error);
          alert(result.error || 'Failed to sign out. Please try again.');
        }
      } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to sign out. Please try again.');
      } finally {
        setLoggingOut(false);
      }
    }
  };

  const toggleNotifications = () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    
    if (newState) {
      localStorage.removeItem('globalNotificationsDisabled');
    } else {
      localStorage.setItem('globalNotificationsDisabled', 'true');
    }
    
    // Reload page to apply changes
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const profileCompleteness = () => {
    let completeness = 0;
    if (profile?.bio) completeness += 25;
    if (profile?.expertise && profile.expertise.length > 0) completeness += 25;
    if (profile?.address) completeness += 25;
    if (profile?.profile_setup_completed) completeness += 25;
    return completeness;
  };

  if (!profile || !user) {
    return (
      <div className={`
        min-h-screen flex items-center justify-center p-4
        ${theme === 'dark' ? 'bg-neutral-900' : 'bg-sage-50/50'}
      `}>
        <div className={`
          text-center p-8 rounded-2xl shadow-xl
          ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
        `}>
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-semibold mb-2">Profile Loading Error</h1>
          <p className={`mb-4 ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Unable to load your profile information.
          </p>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (showEditor) {
    return (
      <ProfileEditor 
        onClose={() => setShowEditor(false)}
        onSave={() => setShowEditor(false)}
      />
    );
  }

  const completeness = profileCompleteness();

  return (
    <div className={`
      min-h-screen p-4
      ${theme === 'dark' ? 'bg-neutral-900' : 'bg-sage-50/50'}
    `}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">Your Profile</h1>
              {profile.is_admin && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-terracotta-500 to-terracotta-600 rounded-full shadow-lg">
                  <Crown className="w-4 h-4 text-white" />
                  <span className="text-sm font-medium text-white">
                    Administrator
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`
          flex gap-2 mb-8 p-1 rounded-xl
          ${theme === 'dark' ? 'bg-neutral-800' : 'bg-white shadow-md'}
        `}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200
              ${activeTab === 'overview'
                ? 'bg-sage-500 text-white shadow-md'
                : theme === 'dark'
                  ? 'text-neutral-300 hover:bg-neutral-700'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }
            `}
          >
            <User className="w-5 h-5" />
            Overview
          </button>
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
            <Gift className="w-5 h-5" />
            Invite Codes
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'invite-codes' ? (
          <UserInviteCodes />
        ) : (
          <>
            {/* Main Profile Card */}
            <div className={`
              relative p-8 rounded-2xl shadow-xl mb-8 overflow-hidden
              ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
            `}>
              {/* Background Gradient */}
              <div className={`
                absolute inset-0 bg-gradient-to-br opacity-5
                ${profile.is_admin 
                  ? 'from-terracotta-500 to-terracotta-600' 
                  : 'from-sage-500 to-sage-600'
                }
              `} />
              
              <div className="relative">
                {/* Profile Header */}
                <div className="flex items-start gap-8 mb-8">
                  <div 
                    className="relative group cursor-pointer"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    <div className={`
                      w-32 h-32 rounded-2xl flex items-center justify-center text-white text-4xl font-bold
                      transition-all duration-300 transform group-hover:scale-105
                      ${profile.is_admin 
                        ? 'bg-gradient-to-br from-terracotta-500 to-terracotta-600 shadow-terracotta-500/25' 
                        : 'bg-gradient-to-br from-sage-500 to-sage-600 shadow-sage-500/25'
                      }
                      shadow-lg group-hover:shadow-xl
                    `}>
                      {profile.is_admin ? (
                        <Crown className="w-16 h-16" />
                      ) : (
                        profile.full_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    
                    {/* Hover overlay */}
                    <div className={`
                      absolute inset-0 rounded-2xl bg-black/20 flex items-center justify-center
                      transition-opacity duration-300
                      ${isHovered ? 'opacity-100' : 'opacity-0'}
                    `}>
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold mb-3">{profile.full_name}</h2>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-neutral-400" />
                        <span className={`text-lg ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-600'}`}>
                          {profile.email}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-neutral-400" />
                        <span className={`${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                          Member since {formatDate(profile.created_at)}
                        </span>
                      </div>
                      
                      {profile.is_admin && (
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-terracotta-500" />
                          <span className="text-terracotta-600 dark:text-terracotta-400 font-semibold">
                            System Administrator
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Profile Completeness */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Profile Completeness</span>
                        <span className="text-sm font-bold text-sage-600 dark:text-sage-400">
                          {completeness}%
                        </span>
                      </div>
                      <div className={`
                        w-full h-2 rounded-full
                        ${theme === 'dark' ? 'bg-neutral-700' : 'bg-neutral-200'}
                      `}>
                        <div
                          className="h-full bg-gradient-to-r from-sage-500 to-sage-600 rounded-full transition-all duration-500"
                          style={{ width: `${completeness}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <button
                        onClick={() => setShowEditor(true)}
                        className={`
                          flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200
                          transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl
                          ${theme === 'dark'
                            ? 'bg-sage-600 text-white hover:bg-sage-500'
                            : 'bg-sage-500 text-white hover:bg-sage-600'
                          }
                        `}
                      >
                        <Edit3 className="w-5 h-5" />
                        Edit Profile
                      </button>
                      
                      <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className={`
                          flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200
                          transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl
                          ${loggingOut
                            ? 'bg-neutral-400 text-neutral-600 cursor-not-allowed'
                            : theme === 'dark'
                              ? 'bg-red-600 text-white hover:bg-red-500'
                              : 'bg-red-500 text-white hover:bg-red-600'
                          }
                        `}
                      >
                        <LogOut className="w-5 h-5" />
                        {loggingOut ? 'Signing Out...' : 'Sign Out'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Content Sections */}
              <div className="lg:col-span-2 space-y-8">
                {/* About Section */}
                <div className={`
                  p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300
                  ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
                `}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-3">
                      <User className="w-6 h-6 text-sage-500" />
                      About Me
                    </h3>
                    <ChevronRight className="w-5 h-5 text-neutral-400" />
                  </div>
                  
                  {profile.bio ? (
                    <p className={`text-lg leading-relaxed ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      {profile.bio}
                    </p>
                  ) : (
                    <div className={`
                      p-6 rounded-xl border-2 border-dashed text-center
                      ${theme === 'dark' ? 'border-neutral-600 bg-neutral-700/30' : 'border-neutral-300 bg-neutral-50'}
                    `}>
                      <p className={`italic mb-3 ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Share your story and what you're passionate about
                      </p>
                      <button
                        onClick={() => setShowEditor(true)}
                        className="text-sage-500 hover:text-sage-600 font-medium"
                      >
                        Add your bio →
                      </button>
                    </div>
                  )}
                </div>

                {/* Expertise Section */}
                <div className={`
                  p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300
                  ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
                `}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-3">
                      <Tag className="w-6 h-6 text-sage-500" />
                      Areas of Expertise
                    </h3>
                    <ChevronRight className="w-5 h-5 text-neutral-400" />
                  </div>
                  
                  {profile.expertise && profile.expertise.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {profile.expertise.map((skill, index) => (
                        <span
                          key={index}
                          className={`
                            px-4 py-2 rounded-xl text-sm font-medium
                            transition-all duration-200 hover:scale-105 cursor-default
                            ${theme === 'dark' 
                              ? 'bg-sage-900/40 text-sage-300 border border-sage-700/50' 
                              : 'bg-sage-100 text-sage-700 border border-sage-200/50'
                            }
                            shadow-md hover:shadow-lg
                          `}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className={`
                      p-6 rounded-xl border-2 border-dashed text-center
                      ${theme === 'dark' ? 'border-neutral-600 bg-neutral-700/30' : 'border-neutral-300 bg-neutral-50'}
                    `}>
                      <p className={`italic mb-3 ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Share your skills and areas of expertise
                      </p>
                      <button
                        onClick={() => setShowEditor(true)}
                        className="text-sage-500 hover:text-sage-600 font-medium"
                      >
                        Add expertise →
                      </button>
                    </div>
                  )}
                </div>

                {/* Location Section */}
                <div className={`
                  p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300
                  ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
                `}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-3">
                      <MapPin className="w-6 h-6 text-sage-500" />
                      Location
                    </h3>
                    <ChevronRight className="w-5 h-5 text-neutral-400" />
                  </div>
                  
                  {profile.address ? (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-neutral-400" />
                      <span className={`text-lg ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'}`}>
                        {profile.address}
                      </span>
                    </div>
                  ) : (
                    <div className={`
                      p-6 rounded-xl border-2 border-dashed text-center
                      ${theme === 'dark' ? 'border-neutral-600 bg-neutral-700/30' : 'border-neutral-300 bg-neutral-50'}
                    `}>
                      <p className={`italic mb-3 ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Add your location to discover nearby spaces
                      </p>
                      <button
                        onClick={() => setShowEditor(true)}
                        className="text-sage-500 hover:text-sage-600 font-medium"
                      >
                        Add location →
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Notification Settings */}
                <div className={`
                  p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300
                  ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
                `}>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-sage-500" />
                    Notifications
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-sage-50 to-sage-100 dark:from-sage-900/20 dark:to-sage-800/20">
                      <div className="flex items-center gap-3">
                        {notificationsEnabled ? (
                          <Bell className="w-5 h-5 text-sage-500" />
                        ) : (
                          <BellOff className="w-5 h-5 text-neutral-400" />
                        )}
                        <div>
                          <span className="font-medium text-sm">Global Notifications</span>
                          <p className={`text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            New space alerts during test phase
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={toggleNotifications}
                        className={`
                          px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
                          ${notificationsEnabled
                            ? 'bg-sage-500 text-white hover:bg-sage-600'
                            : theme === 'dark'
                              ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                              : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                          }
                        `}
                      >
                        {notificationsEnabled ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className={`
                  p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300
                  ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
                `}>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-sage-500" />
                    Your Impact
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-sage-50 to-sage-100 dark:from-sage-900/20 dark:to-sage-800/20">
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-sage-500" />
                        <span className="font-medium">Spaces Hosted</span>
                      </div>
                      <span className="text-2xl font-bold text-sage-600 dark:text-sage-400">0</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <span className="font-medium">Attended</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-terracotta-50 to-terracotta-100 dark:from-terracotta-900/20 dark:to-terracotta-800/20">
                      <div className="flex items-center gap-3">
                        <Star className="w-5 h-5 text-terracotta-500" />
                        <span className="font-medium">Connections</span>
                      </div>
                      <span className="text-2xl font-bold text-terracotta-600 dark:text-terracotta-400">0</span>
                    </div>
                  </div>
                </div>

                {/* Account Status */}
                <div className={`
                  p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300
                  ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
                `}>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-sage-500" />
                    Account Status
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Profile</span>
                      <span className={`
                        px-3 py-1 rounded-full text-sm font-medium
                        ${completeness === 100
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : completeness >= 50
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }
                      `}>
                        {completeness === 100 ? 'Complete' : 'Incomplete'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Account Type</span>
                      <span className={`
                        px-3 py-1 rounded-full text-sm font-medium
                        ${profile.is_admin
                          ? 'bg-terracotta-100 text-terracotta-700 dark:bg-terracotta-900/30 dark:text-terracotta-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }
                      `}>
                        {profile.is_admin ? 'Admin' : 'Member'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Location</span>
                      <span className={`
                        px-3 py-1 rounded-full text-sm font-medium
                        ${profile.address
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                        }
                      `}>
                        {profile.address ? 'Set' : 'Not Set'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-medium">Notifications</span>
                      <span className={`
                        px-3 py-1 rounded-full text-sm font-medium
                        ${notificationsEnabled
                          ? 'bg-sage-100 text-sage-700 dark:bg-sage-900/30 dark:text-sage-300'
                          : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-900/30 dark:text-neutral-300'
                        }
                      `}>
                        {notificationsEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className={`
                  p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300
                  ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
                `}>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-sage-500" />
                    Recent Activity
                  </h3>
                  
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
                    <p className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      No recent activity
                    </p>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-400'}`}>
                      Join or host a space to see activity here
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileView;