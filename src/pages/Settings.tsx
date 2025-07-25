import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  ArrowLeft,
  Menu,
  X,
  Edit,
  Camera,
  MapPin,
  Globe,
  Sprout,
  Bot as Lotus,
  ChefHat,
  Palette,
  Stethoscope,
  Music,
  Activity,
  CheckCircle,
  Users as UsersIcon,
  Navigation,
  BarChart3
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../components/AuthProvider';
import { updateProfile } from '../lib/supabase';
import { FacilitatorAvailability } from '../components/FacilitatorAvailability';
import { LocationSettings } from '../components/LocationSettings';
import { ConnectorsSection } from '../components/ConnectorsSection';

interface SettingSection {
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  badge?: string;
  color?: string;
  category?: string;
}

const Settings = () => {
  const { user, profile, loadUserProfile } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<string | null>('edit-profile');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(window.innerWidth >= 1024);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  
  // On desktop, always keep sidebar expanded
  const shouldShowExpanded = isDesktop || isSidebarExpanded;
  
  // Handle incoming navigation state
  useEffect(() => {
    if (location.state?.activeSection) {
      setActiveSection(location.state.activeSection);
    }
  }, [location.state]);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      
      // Auto-collapse sidebar on mobile/tablet
      if (!desktop && isSidebarExpanded) {
        setIsSidebarExpanded(false);
      }
    };

    handleResize(); // Call on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Click outside handler for mobile and tablet
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only apply on mobile and tablet (< 1024px)
      if (!isDesktop && isSidebarExpanded) {
        const sidebar = document.getElementById('settings-sidebar');
        const expandButton = document.getElementById('sidebar-expand-button');
        
        if (sidebar && !sidebar.contains(event.target as Node) && 
            expandButton && !expandButton.contains(event.target as Node)) {
          setIsSidebarExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarExpanded, isDesktop]);
  
  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    neighborhood: profile?.neighborhood || '',
    discovery_radius: profile?.discovery_radius || 1,
    holistic_interests: profile?.holistic_interests || []
  });
  
  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        neighborhood: profile.neighborhood || '',
        discovery_radius: profile.discovery_radius || 1,
        holistic_interests: profile.holistic_interests || []
      });
    }
  }, [profile]);

  const settingSections: SettingSection[] = [
    {
      id: 'edit-profile',
      title: 'Edit Profile',
      description: 'Update your profile information and photo',
      icon: User,
      color: 'text-forest-600',
      category: 'account'
    },
    {
      id: 'personal-info',
      title: 'Personal Info',
      description: 'Manage your personal details and contact information',
      icon: UserCircle,
      color: 'text-blue-600',
      category: 'account'
    },
    {
      id: 'account-management',
      title: 'Account Management',
      description: 'Security settings, password, and account preferences',
      icon: SettingsIcon,
      color: 'text-gray-600',
      category: 'account'
    },
    {
      id: 'email-updates',
      title: 'Email Updates',
      description: 'Control what emails you receive from us',
      icon: Mail,
      color: 'text-purple-600',
      category: 'notifications'
    },
    {
      id: 'privacy',
      title: 'Privacy',
      description: 'Manage your privacy settings and data sharing',
      icon: Shield,
      color: 'text-red-600',
      category: 'account'
    },
    {
      id: 'connectors',
      title: 'Connectors',
      description: 'Connect your social media and event platform accounts',
      icon: Share2,
      color: 'text-blue-600',
      category: 'connectors'
    },
    {
      id: 'interests',
      title: 'Interests',
      description: 'Select topics and categories you\'re interested in',
      icon: Heart,
      color: 'text-earth-600',
      category: 'preferences'
    },
    {
      id: 'location-settings',
      title: 'Location Settings',
      description: 'Manage your locations and get personalized class suggestions',
      icon: Navigation,
      color: 'text-forest',
      category: 'preferences'
    },
    {
      id: 'location-stats',
      title: 'Location Statistics',
      description: 'View your movement patterns and frequent locations',
      icon: BarChart3,
      color: 'text-sage',
      path: '/location-stats',
      category: 'preferences'
    },
    {
      id: 'facilitator-settings',
      title: 'Facilitator Settings',
      description: 'Manage your availability and preferences as a facilitator',
      icon: UsersIcon,
      color: 'text-purple-600',
      category: 'preferences'
    },
    {
      id: 'mobile-notifications',
      title: 'Mobile Notifications',
      description: 'Configure push notifications for mobile app',
      icon: Bell,
      color: 'text-orange-600',
      category: 'notifications'
    },
    {
      id: 'organizer-subscription',
      title: 'Organizer Subscription',
      description: 'Manage your event organizer features',
      icon: UserCheck,
      color: 'text-indigo-600',
      badge: 'PRO',
      category: 'subscriptions'
    },
    {
      id: 'meetup-plus',
      title: 'Harmony+ Subscription',
      description: 'Premium features and benefits',
      icon: Crown,
      color: 'text-yellow-600',
      badge: 'PLUS',
      category: 'subscriptions'
    },
    {
      id: 'payment-methods',
      title: 'Payment Methods',
      description: 'Manage your cards and payment options',
      icon: CreditCard,
      color: 'text-green-600',
      category: 'payments'
    },
    {
      id: 'payments-made',
      title: 'Payments Made',
      description: 'View your payment history and receipts',
      icon: DollarSign,
      color: 'text-emerald-600',
      category: 'payments'
    },
    {
      id: 'payments-received',
      title: 'Payments Received',
      description: 'Track payments from your events',
      icon: Receipt,
      color: 'text-teal-600',
      category: 'payments'
    },
    {
      id: 'apps',
      title: 'Apps',
      description: 'Connected applications and integrations',
      icon: Smartphone,
      color: 'text-cyan-600',
      category: 'developer'
    },
    {
      id: 'api-guide',
      title: 'API Guide',
      description: 'Developer documentation and API keys',
      icon: Code,
      color: 'text-slate-600',
      category: 'developer'
    },
    {
      id: 'help',
      title: 'Help',
      description: 'Get support and find answers',
      icon: HelpCircle,
      color: 'text-forest-600',
      category: 'support'
    }
  ];

  const categories = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Heart },
    { id: 'connectors', label: 'Connectors', icon: Share2 },
    { id: 'subscriptions', label: 'Subscriptions', icon: Crown },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'developer', label: 'Developer', icon: Code },
    { id: 'support', label: 'Support', icon: HelpCircle }
  ];

  const handleSectionClick = (section: SettingSection) => {
    setActiveSection(section.id);
  };
  
  const handleInputChange = (field: string, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };
  
  const handleSaveProfile = async () => {
    if (!user) {
      setError('No user found. Please sign in again.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!formData.full_name?.trim()) {
        setError('Full name is required');
        setLoading(false);
        return;
      }

      const updates = {
        full_name: formData.full_name.trim(),
        username: formData.username?.trim() || null,
        bio: formData.bio?.trim() || null,
        neighborhood: formData.neighborhood?.trim() || null,
        discovery_radius: formData.discovery_radius,
        holistic_interests: formData.holistic_interests
      };

      const { data, error } = await updateProfile(user.id, updates);
      
      if (error) {
        console.error('Profile update error:', error);
        setError(error.message || 'Failed to update profile');
      } else {
        setSuccess('Profile updated successfully!');
        await loadUserProfile();
        setIsEditing(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }
    } catch (err) {
      console.error('Unexpected error updating profile:', err);
      setError(`An unexpected error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleInterest = (interestId: string) => {
    const updated = formData.holistic_interests.includes(interestId)
      ? formData.holistic_interests.filter((i: string) => i !== interestId)
      : [...formData.holistic_interests, interestId];
    handleInputChange('holistic_interests', updated);
  };

  const renderSectionContent = () => {
    const section = settingSections.find(s => s.id === activeSection);
    if (!section) return null;

    switch (activeSection) {
      case 'edit-profile':
        return (
          <div className="space-y-6">
            {/* Success/Error Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-forest-800">Profile Information</h3>
                {isEditing ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setError(null);
                        setSuccess(null);
                      }}
                      className="px-4 py-2 border border-forest-300 text-forest-700 rounded-lg hover:bg-forest-50 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="bg-forest-600 hover:bg-forest-700 disabled:bg-forest-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Edit className="h-4 w-4" />
                      )}
                      <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    readOnly={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Choose a unique username"
                    className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    readOnly={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">Neighborhood</label>
                  <input
                    type="text"
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    placeholder="e.g., Downtown, Riverside, etc."
                    className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    readOnly={!isEditing}
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-forest-700 mb-2">Bio</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell your neighbors about yourself and your interests..."
                  className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  readOnly={!isEditing}
                />
              </div>
            </div>

            {/* Holistic Interests */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h3 className="text-xl font-semibold text-forest-800 mb-6">Holistic Interests</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { id: 'gardening', name: 'Gardening', icon: Sprout },
                  { id: 'yoga', name: 'Yoga & Meditation', icon: Lotus },
                  { id: 'cooking', name: 'Cooking', icon: ChefHat },
                  { id: 'art', name: 'Art & Creativity', icon: Palette },
                  { id: 'healing', name: 'Healing & Wellness', icon: Stethoscope },
                  { id: 'music', name: 'Music & Movement', icon: Music },
                ].map(interest => {
                  const Icon = interest.icon;
                  const isSelected = formData.holistic_interests.includes(interest.id);
                  return (
                    <button
                      key={interest.id}
                      onClick={() => isEditing && toggleInterest(interest.id)}
                      disabled={!isEditing}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-forest-500 bg-forest-50'
                          : 'border-gray-200 hover:border-forest-300'
                      } ${!isEditing ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                    >
                      <Icon className={`h-8 w-8 mx-auto mb-2 ${isSelected ? 'text-forest-600' : 'text-gray-400'}`} />
                      <p className={`text-sm font-medium ${isSelected ? 'text-forest-700' : 'text-gray-600'}`}>
                        {interest.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discovery Radius */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h3 className="text-xl font-semibold text-forest-800 mb-6">Discovery Settings</h3>
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-3">
                  <Globe className="h-4 w-4 inline mr-2" />
                  Discovery Radius
                </label>
                <select
                  value={formData.discovery_radius}
                  onChange={(e) => handleInputChange('discovery_radius', Number(e.target.value))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                >
                  <option value={0.5}>0.5 miles (walking distance)</option>
                  <option value={1}>1 mile</option>
                  <option value={2}>2 miles</option>
                  <option value={5}>5 miles</option>
                  <option value={10}>10 miles</option>
                </select>
                <p className="mt-2 text-sm text-forest-600">
                  This controls how far away events and neighbors will appear in your local feed.
                </p>
              </div>
            </div>
          </div>
        );
      case 'personal-info':
        return <PersonalInfoSection />;
      case 'account-management':
        return <AccountManagementSection />;
      case 'email-updates':
        return <EmailUpdatesSection />;
      case 'privacy':
        return <PrivacySection />;
      case 'connectors':
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-forest-800 mb-6">Connectors</h2>
            <p className="text-gray-600 mb-6">
              Connect your social media and event platform accounts to enhance your Harmony Spaces experience.
            </p>
            {user && <ConnectorsSection userId={user.id} />}
          </div>
        );
      case 'interests':
        return <InterestsSection />;
      case 'location-settings':
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-forest-800 mb-6">Location Settings</h2>
            <p className="text-gray-600 mb-6">
              Manage your favorite locations and enable GPS tracking to get personalized class suggestions.
            </p>
            {user && <LocationSettings userId={user.id} />}
          </div>
        );
      case 'facilitator-settings':
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-forest-800 mb-6">Facilitator Settings</h2>
            <p className="text-gray-600 mb-6">
              Manage your availability, specialties, and preferences for hosting events and workshops.
            </p>
            <FacilitatorAvailability />
          </div>
        );
      case 'mobile-notifications':
        return <MobileNotificationsSection />;
      case 'payment-methods':
        return <PaymentMethodsSection />;
      case 'payments-made':
        return <PaymentsMadeSection />;
      case 'payments-received':
        return <PaymentsReceivedSection />;
      case 'organizer-subscription':
        return <OrganizerSubscriptionSection />;
      case 'meetup-plus':
        return <HarmonicSubscriptionSection />;
      default:
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-forest-800 mb-6">{section.title}</h2>
            <p className="text-gray-600">{section.description}</p>
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">This section is coming soon.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="flex h-screen">
        {/* Backdrop for mobile */}
        {!isDesktop && isSidebarExpanded && (
          <div 
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setIsSidebarExpanded(false)}
          />
        )}
        
        {/* Sidebar */}
        <div 
          id="settings-sidebar"
          className={`${
            shouldShowExpanded ? 'w-64' : 'w-16'
          } bg-white shadow-lg transition-all duration-300 flex flex-col ${
            !isDesktop ? 'fixed left-0 top-0 h-full z-50' : 'relative'
          }`}
        >
          
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {shouldShowExpanded && (
                <h2 className="text-xl font-bold text-forest-800">Settings</h2>
              )}
              {/* Only show expand/collapse button on mobile/tablet */}
              {!isDesktop && (
                <button
                  id="sidebar-expand-button"
                  onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                  className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${
                    !isSidebarExpanded ? 'mx-auto' : 'ml-auto'
                  }`}
                  title={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                  {isSidebarExpanded ? (
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="flex-1 overflow-y-auto py-4">
            {categories.map((category) => {
              const Icon = category.icon;
              const sectionCount = settingSections.filter(s => s.category === category.id).length;
              
              return (
                <div key={category.id} className={shouldShowExpanded ? "mb-6" : "mb-2"}>
                  {shouldShowExpanded && (
                    <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      {category.label}
                    </h3>
                  )}
                  
                  <div className="space-y-1">
                    {settingSections
                      .filter(section => section.category === category.id)
                      .map((section) => {
                        const SectionIcon = section.icon;
                        const isActive = activeSection === section.id;
                        
                        return (
                          <button
                            key={section.id}
                            onClick={() => handleSectionClick(section)}
                            className={`w-full flex items-center ${
                              shouldShowExpanded ? 'px-4 py-2' : 'px-2 py-2 justify-center'
                            } hover:bg-gray-50 transition-colors relative group ${
                              isActive ? (shouldShowExpanded ? 'bg-forest-50 border-r-4 border-forest-600' : 'bg-forest-100') : ''
                            }`}
                          >
                            <SectionIcon className={`h-5 w-5 ${
                              isActive ? section.color : 'text-gray-600 group-hover:text-gray-800'
                            }`} />
                            
                            {shouldShowExpanded && (
                              <>
                                <span className={`ml-3 text-sm ${
                                  isActive ? 'font-semibold text-forest-800' : 'text-gray-700'
                                }`}>
                                  {section.title}
                                </span>
                                {section.badge && (
                                  <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-earth-400 to-earth-500 text-white rounded-full">
                                    {section.badge}
                                  </span>
                                )}
                              </>
                            )}
                            
                            {/* Tooltip for collapsed state */}
                            {!shouldShowExpanded && (
                              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                {section.title}
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom expand button for collapsed state - only on mobile/tablet */}
          {!isDesktop && !isSidebarExpanded && (
            <div className="p-2 border-t border-gray-200">
              <button
                onClick={() => setIsSidebarExpanded(true)}
                className="w-full p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
                title="Expand sidebar"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          )}

        </div>

        {/* Main Content */}
        <div className={`flex-1 overflow-y-auto ${
          !isDesktop && !shouldShowExpanded ? 'ml-16' : ''
        }`}>
          <div className="p-6 md:p-8">
            {/* Back Button */}
            <div className="mb-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-forest-600 hover:text-forest-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Back</span>
              </button>
            </div>
            
            {/* Content */}
            {renderSectionContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Individual Section Components

const PersonalInfoSection: React.FC = () => {
  const { profile } = useAuthContext();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-forest-800 mb-6">Personal Info</h2>
      <div className="space-y-6">
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
  );
};

const AccountManagementSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-forest-800 mb-6">Account Management</h2>
        
        <div className="space-y-6">
          <div>
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

          <div>
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

          <div>
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
  );
};

const EmailUpdatesSection: React.FC = () => {
  const [emailPrefs, setEmailPrefs] = useState({
    eventReminders: true,
    newEvents: true,
    messages: true,
    newsletter: false,
    marketing: false,
    communityUpdates: true
  });

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-forest-800 mb-6">Email Updates</h2>
      
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
  );
};

const PrivacySection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-forest-800 mb-6">Privacy Settings</h2>
        
        <div className="space-y-6">
          <div>
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

          <div>
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

          <div>
            <h3 className="font-semibold text-forest-800 mb-4">Download Your Data</h3>
            <p className="text-gray-600 mb-4">Get a copy of all your Harmony Spaces data</p>
            <button className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Request Data Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SocialMediaSection: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-forest-800 mb-6">Social Media Connections</h2>
      
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
  );
};

const InterestsSection: React.FC = () => {
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
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-forest-800 mb-6">Your Interests</h2>
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
  );
};

const MobileNotificationsSection: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-forest-800 mb-6">Mobile Notifications</h2>
      
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
  );
};

const PaymentMethodsSection: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-forest-800 mb-6">Payment Methods</h2>
      
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
  );
};

const PaymentsMadeSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-forest-800 mb-6">Payment History</h3>
        
        <div className="space-y-4">
          <div className="p-4 border border-forest-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-forest-800">Yoga Workshop - Sarah Chen</p>
                <p className="text-sm text-forest-600">January 15, 2025</p>
              </div>
              <p className="font-semibold text-forest-800">$15.00</p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-forest-600">Donation</span>
              <span className="text-green-600">Completed</span>
            </div>
          </div>
          
          <div className="p-4 border border-forest-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-forest-800">Community Garden Space</p>
                <p className="text-sm text-forest-600">January 10, 2025</p>
              </div>
              <p className="font-semibold text-forest-800">$10.00</p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-forest-600">Space Rental</span>
              <span className="text-green-600">Completed</span>
            </div>
          </div>
          
          <div className="p-4 border border-forest-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-forest-800">Harmonic Subscription - January</p>
                <p className="text-sm text-forest-600">January 1, 2025</p>
              </div>
              <p className="font-semibold text-forest-800">$9.00</p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-forest-600">Subscription</span>
              <span className="text-green-600">Completed</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between p-4 bg-forest-50 rounded-lg">
          <span className="font-medium text-forest-800">Total This Month</span>
          <span className="text-xl font-bold text-forest-800">$34.00</span>
        </div>
      </div>
    </div>
  );
};

const PaymentsReceivedSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-forest-800 mb-6">Payments Received</h3>
        
        <div className="text-center py-12">
          <Activity className="h-16 w-16 text-forest-300 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-forest-800 mb-2">No payments received yet</h4>
          <p className="text-forest-600 mb-6">Start hosting events or sharing spaces to receive payments</p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/events/create"
              className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create Event
            </Link>
            <Link
              to="/spaces/share"
              className="bg-earth-500 hover:bg-earth-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Share Space
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrganizerSubscriptionSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-forest-800 mb-6">Organizer Subscription</h3>
        
        <div className="bg-gradient-to-br from-forest-50 to-earth-50 p-6 rounded-lg mb-6">
          <h4 className="text-2xl font-bold text-forest-800 mb-2">Become an Event Organizer</h4>
          <p className="text-forest-600 mb-4">Host events and share your expertise with the community</p>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-forest-700">Create unlimited events</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-forest-700">Advanced event management tools</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-forest-700">Priority listing in search results</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-forest-700">Analytics and insights</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-forest-700">Verified organizer badge</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-forest-800">$15<span className="text-lg font-normal">/month</span></p>
              <p className="text-sm text-forest-600">or $150/year (save 17%)</p>
            </div>
            <button className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Subscribe Now
            </button>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <h4 className="font-medium text-forest-800 mb-3">Current Status</h4>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600">You are not currently subscribed as an organizer</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const HarmonicSubscriptionSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-forest-800 mb-6">Harmonic Membership</h3>
        
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Crown className="h-8 w-8 text-purple-600" />
            <h4 className="text-2xl font-bold text-purple-800">Harmonic Premium</h4>
          </div>
          <p className="text-purple-600 mb-4">Unlock the full potential of holistic community connection</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-purple-500" />
                <span className="text-purple-700">Unlimited event bookings</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-purple-500" />
                <span className="text-purple-700">Priority access to spaces</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-purple-500" />
                <span className="text-purple-700">Advanced search filters</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-purple-500" />
                <span className="text-purple-700">Exclusive community events</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-purple-500" />
                <span className="text-purple-700">Direct messaging</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-purple-500" />
                <span className="text-purple-700">Profile customization</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-purple-500" />
                <span className="text-purple-700">Ad-free experience</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-purple-500" />
                <span className="text-purple-700">Early feature access</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-purple-800">$9<span className="text-lg font-normal">/month</span></p>
              <p className="text-sm text-purple-600">or $90/year (save 17%)</p>
            </div>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Upgrade to Harmonic
            </button>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <h4 className="font-medium text-forest-800 mb-3">Current Plan</h4>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Free Community Member</p>
            <p className="text-sm text-gray-500 mt-1">Basic access to events and spaces</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;