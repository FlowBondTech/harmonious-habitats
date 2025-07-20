import React, { useState } from 'react';
import { 
  User, 
  UserCircle, 
  Settings as SettingsIcon, 
  Mail, 
  Shield, 
  Share2, 
  Heart, 
  Bell, 
  UserCheck, 
  Crown, 
  CreditCard, 
  DollarSign, 
  Receipt, 
  Smartphone, 
  Code, 
  HelpCircle,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../components/AuthProvider';

interface SettingSection {
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  badge?: string;
  color?: string;
}

const Settings = () => {
  const { user, profile } = useAuthContext();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const settingSections: SettingSection[] = [
    {
      id: 'edit-profile',
      title: 'Edit Profile',
      description: 'Update your profile information and photo',
      icon: User,
      path: '/account',
      color: 'text-forest-600'
    },
    {
      id: 'personal-info',
      title: 'Personal Info',
      description: 'Manage your personal details and contact information',
      icon: UserCircle,
      color: 'text-blue-600'
    },
    {
      id: 'account-management',
      title: 'Account Management',
      description: 'Security settings, password, and account preferences',
      icon: SettingsIcon,
      color: 'text-gray-600'
    },
    {
      id: 'email-updates',
      title: 'Email Updates',
      description: 'Control what emails you receive from us',
      icon: Mail,
      color: 'text-purple-600'
    },
    {
      id: 'privacy',
      title: 'Privacy',
      description: 'Manage your privacy settings and data sharing',
      icon: Shield,
      color: 'text-red-600'
    },
    {
      id: 'social-media',
      title: 'Social Media',
      description: 'Connect and manage your social media accounts',
      icon: Share2,
      color: 'text-pink-600'
    },
    {
      id: 'interests',
      title: 'Interests',
      description: 'Select topics and categories you\'re interested in',
      icon: Heart,
      color: 'text-earth-600'
    },
    {
      id: 'mobile-notifications',
      title: 'Mobile Notifications',
      description: 'Configure push notifications for mobile app',
      icon: Bell,
      color: 'text-orange-600'
    },
    {
      id: 'organizer-subscription',
      title: 'Organizer Subscription',
      description: 'Manage your event organizer features',
      icon: UserCheck,
      color: 'text-indigo-600',
      badge: 'PRO'
    },
    {
      id: 'meetup-plus',
      title: 'Harmony+ Subscription',
      description: 'Premium features and benefits',
      icon: Crown,
      color: 'text-yellow-600',
      badge: 'PLUS'
    },
    {
      id: 'payment-methods',
      title: 'Payment Methods',
      description: 'Manage your cards and payment options',
      icon: CreditCard,
      color: 'text-green-600'
    },
    {
      id: 'payments-made',
      title: 'Payments Made',
      description: 'View your payment history and receipts',
      icon: DollarSign,
      color: 'text-emerald-600'
    },
    {
      id: 'payments-received',
      title: 'Payments Received',
      description: 'Track payments from your events',
      icon: Receipt,
      color: 'text-teal-600'
    },
    {
      id: 'apps',
      title: 'Apps',
      description: 'Connected applications and integrations',
      icon: Smartphone,
      color: 'text-cyan-600'
    },
    {
      id: 'api-guide',
      title: 'API Guide',
      description: 'Developer documentation and API keys',
      icon: Code,
      color: 'text-slate-600'
    },
    {
      id: 'help',
      title: 'Help',
      description: 'Get support and find answers',
      icon: HelpCircle,
      color: 'text-forest-600'
    }
  ];

  const handleSectionClick = (section: SettingSection) => {
    if (section.path) {
      navigate(section.path);
    } else {
      setActiveSection(section.id);
    }
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'personal-info':
        return <PersonalInfoSection onBack={() => setActiveSection(null)} />;
      case 'account-management':
        return <AccountManagementSection onBack={() => setActiveSection(null)} />;
      case 'email-updates':
        return <EmailUpdatesSection onBack={() => setActiveSection(null)} />;
      case 'privacy':
        return <PrivacySection onBack={() => setActiveSection(null)} />;
      case 'social-media':
        return <SocialMediaSection onBack={() => setActiveSection(null)} />;
      case 'interests':
        return <InterestsSection onBack={() => setActiveSection(null)} />;
      case 'mobile-notifications':
        return <MobileNotificationsSection onBack={() => setActiveSection(null)} />;
      case 'payment-methods':
        return <PaymentMethodsSection onBack={() => setActiveSection(null)} />;
      default:
        return null;
    }
  };

  if (activeSection) {
    return renderSectionContent();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-forest-600 hover:text-forest-800 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-forest-800">Settings</h1>
          <p className="text-forest-600 mt-2">Manage your account preferences and settings</p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settingSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => handleSectionClick(section)}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 text-left group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors`}>
                      <Icon className={`h-6 w-6 ${section.color || 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-forest-800">{section.title}</h3>
                        {section.badge && (
                          <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-earth-400 to-earth-500 text-white rounded-full">
                            {section.badge}
                          </span>
                        )}
                      </div>
                      {section.description && (
                        <p className="text-sm text-forest-600 mt-1">{section.description}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Individual Section Components

const PersonalInfoSection: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { profile } = useAuthContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="container-responsive py-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-forest-600 hover:text-forest-800 mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Settings</span>
          </button>

          <h2 className="text-2xl font-bold text-forest-800 mb-6">Personal Info</h2>

          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">Full Name</label>
              <input
                type="text"
                defaultValue={profile?.full_name || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">Email</label>
              <input
                type="email"
                defaultValue={profile?.email || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                disabled
              />
              <p className="text-sm text-gray-500 mt-1">Contact support to change your email</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">Phone Number</label>
              <input
                type="tel"
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">Date of Birth</label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">Location</label>
              <input
                type="text"
                placeholder="City, State"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
              />
            </div>

            <button className="w-full bg-forest-600 hover:bg-forest-700 text-white py-3 rounded-lg font-medium transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AccountManagementSection: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="container-responsive py-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-forest-600 hover:text-forest-800 mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Settings</span>
          </button>

          <h2 className="text-2xl font-bold text-forest-800 mb-6">Account Management</h2>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-forest-800 mb-4">Password & Security</h3>
              <div className="space-y-4">
                <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Change Password</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
                <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Two-Factor Authentication</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-forest-800 mb-4">Account Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Language</p>
                    <p className="text-sm text-gray-500">English (US)</p>
                  </div>
                  <button className="text-forest-600 hover:text-forest-800">Change</button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Time Zone</p>
                    <p className="text-sm text-gray-500">Pacific Time (PT)</p>
                  </div>
                  <button className="text-forest-600 hover:text-forest-800">Change</button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-red-600 mb-4">Danger Zone</h3>
              <div className="space-y-4">
                <button className="w-full text-left p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-red-600">Deactivate Account</span>
                    <ChevronRight className="h-5 w-5 text-red-400" />
                  </div>
                </button>
                <button className="w-full text-left p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-red-600">Delete Account</span>
                    <ChevronRight className="h-5 w-5 text-red-400" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmailUpdatesSection: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [emailPrefs, setEmailPrefs] = useState({
    eventReminders: true,
    newEvents: true,
    messages: true,
    newsletter: false,
    marketing: false,
    communityUpdates: true
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="container-responsive py-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-forest-600 hover:text-forest-800 mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Settings</span>
          </button>

          <h2 className="text-2xl font-bold text-forest-800 mb-6">Email Updates</h2>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="space-y-6">
              {Object.entries({
                eventReminders: 'Event Reminders',
                newEvents: 'New Events in Your Area',
                messages: 'Direct Messages',
                newsletter: 'Weekly Newsletter',
                marketing: 'Marketing & Promotions',
                communityUpdates: 'Community Updates'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-forest-800">{label}</p>
                    <p className="text-sm text-gray-500">
                      {key === 'eventReminders' && 'Get notified about upcoming events you\'re attending'}
                      {key === 'newEvents' && 'Discover new events based on your interests'}
                      {key === 'messages' && 'Receive notifications for new messages'}
                      {key === 'newsletter' && 'Weekly digest of community highlights'}
                      {key === 'marketing' && 'Special offers and promotional content'}
                      {key === 'communityUpdates' && 'Important updates about the platform'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailPrefs[key as keyof typeof emailPrefs]}
                      onChange={(e) => setEmailPrefs(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-forest-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest-600"></div>
                  </label>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <button className="w-full bg-forest-600 hover:bg-forest-700 text-white py-3 rounded-lg font-medium transition-colors">
                Save Email Preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PrivacySection: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="container-responsive py-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-forest-600 hover:text-forest-800 mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Settings</span>
          </button>

          <h2 className="text-2xl font-bold text-forest-800 mb-6">Privacy Settings</h2>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-forest-800 mb-4">Profile Visibility</h3>
              <div className="space-y-4">
                <label className="flex items-start space-x-3">
                  <input type="radio" name="visibility" className="mt-1" defaultChecked />
                  <div>
                    <p className="font-medium">Public</p>
                    <p className="text-sm text-gray-500">Anyone can see your profile and activities</p>
                  </div>
                </label>
                <label className="flex items-start space-x-3">
                  <input type="radio" name="visibility" className="mt-1" />
                  <div>
                    <p className="font-medium">Community Only</p>
                    <p className="text-sm text-gray-500">Only registered members can see your profile</p>
                  </div>
                </label>
                <label className="flex items-start space-x-3">
                  <input type="radio" name="visibility" className="mt-1" />
                  <div>
                    <p className="font-medium">Private</p>
                    <p className="text-sm text-gray-500">Only people you approve can see your profile</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-forest-800 mb-4">Data Sharing</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Share activity data for recommendations</p>
                    <p className="text-sm text-gray-500">Help us suggest better events</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-forest-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Analytics & Improvements</p>
                    <p className="text-sm text-gray-500">Help improve Harmony Spaces</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-forest-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-forest-800 mb-4">Download Your Data</h3>
              <p className="text-gray-600 mb-4">Get a copy of all your Harmony Spaces data</p>
              <button className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                Request Data Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SocialMediaSection: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="container-responsive py-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-forest-600 hover:text-forest-800 mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Settings</span>
          </button>

          <h2 className="text-2xl font-bold text-forest-800 mb-6">Social Media Connections</h2>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="space-y-4">
              {[
                { name: 'Facebook', connected: false, color: 'bg-blue-600' },
                { name: 'Twitter', connected: false, color: 'bg-sky-500' },
                { name: 'Instagram', connected: true, color: 'bg-pink-600' },
                { name: 'LinkedIn', connected: false, color: 'bg-blue-700' }
              ].map((platform) => (
                <div key={platform.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center text-white font-bold`}>
                      {platform.name[0]}
                    </div>
                    <div>
                      <p className="font-medium">{platform.name}</p>
                      <p className="text-sm text-gray-500">
                        {platform.connected ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <button className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    platform.connected 
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      : 'bg-forest-600 hover:bg-forest-700 text-white'
                  }`}>
                    {platform.connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InterestsSection: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const interests = [
    'Gardening', 'Yoga', 'Meditation', 'Cooking', 'Art', 'Music',
    'Dance', 'Healing', 'Sustainability', 'Community Building',
    'Permaculture', 'Herbalism', 'Crafts', 'Photography', 'Writing'
  ];

  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Gardening', 'Cooking', 'Community Building']);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="container-responsive py-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-forest-600 hover:text-forest-800 mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Settings</span>
          </button>

          <h2 className="text-2xl font-bold text-forest-800 mb-6">Your Interests</h2>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-600 mb-6">Select topics you're interested in to get personalized event recommendations</p>
            
            <div className="flex flex-wrap gap-3 mb-6">
              {interests.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full font-medium transition-all ${
                    selectedInterests.includes(interest)
                      ? 'bg-forest-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>

            <button className="w-full bg-forest-600 hover:bg-forest-700 text-white py-3 rounded-lg font-medium transition-colors">
              Save Interests
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MobileNotificationsSection: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="container-responsive py-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-forest-600 hover:text-forest-800 mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Settings</span>
          </button>

          <h2 className="text-2xl font-bold text-forest-800 mb-6">Mobile Notifications</h2>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  Download the Harmony Spaces mobile app to manage push notifications
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Event Reminders</p>
                    <p className="text-sm text-gray-500">1 hour before events</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-forest-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Messages</p>
                    <p className="text-sm text-gray-500">When someone messages you</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-forest-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Event Updates</p>
                    <p className="text-sm text-gray-500">Changes to events you're attending</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-forest-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentMethodsSection: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="container-responsive py-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-forest-600 hover:text-forest-800 mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Settings</span>
          </button>

          <h2 className="text-2xl font-bold text-forest-800 mb-6">Payment Methods</h2>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="space-y-4 mb-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
                      VISA
                    </div>
                    <div>
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-sm text-gray-500">Expires 12/25</p>
                    </div>
                  </div>
                  <button className="text-red-600 hover:text-red-800">Remove</button>
                </div>
              </div>
            </div>

            <button className="w-full bg-forest-600 hover:bg-forest-700 text-white py-3 rounded-lg font-medium transition-colors">
              Add Payment Method
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;