import React, { useState, useEffect } from 'react';
import { User, MapPin, Settings, Badge, Star, Calendar, Users, Heart, Edit, Camera, Target, Sprout, Bot as Lotus, ChefHat, Palette, Stethoscope, Music, Shield, Bell, Clock, Award, CheckCircle, MessageCircle, Share2, Image, Home as HomeIcon, Globe, Map, GraduationCap, Package, Briefcase, Languages, Accessibility, X, BarChart3, Mail, Lock, CreditCard, DollarSign, UserCircle, Activity, Smartphone, UserPlus, Crown } from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import { updateProfile, supabase } from '../lib/supabase';
import { Link, useLocation } from 'react-router-dom';
import ProfileSkillsSection from '../components/ProfileSkillsSection';
import ProfileOfferingsSection from '../components/ProfileOfferingsSection';
import { ShareTab } from '../components/ShareTab';
import EventAnalyticsDashboard from '../components/EventAnalyticsDashboard';
import { DEFAULT_AVATAR } from '../utils/defaults';

const Account = () => {
  const { user, profile, loadUserProfile } = useAuthContext();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('settings');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [discoveryRadius, setDiscoveryRadius] = useState(1);
  const [customRadius, setCustomRadius] = useState(5);
  const [showCustomRadius, setShowCustomRadius] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [notifications, setNotifications] = useState({
    newEvents: true,
    messages: true,
    reminders: true,
    community: false,
    globalEvents: true
  });
  const [hasEvents, setHasEvents] = useState(false);

  // Handle navigation state
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    neighborhood: profile?.neighborhood || '',
    discovery_radius: profile?.discovery_radius || 1,
    holistic_interests: profile?.holistic_interests || [],
    notification_preferences: profile?.notification_preferences || {
      newEvents: true,
      messages: true,
      reminders: true,
      community: false,
      globalEvents: true
    },
    // Enhanced profile capabilities
    skills: profile?.skills || [],
    offerings: profile?.offerings || [],
    languages: profile?.languages || [],
    accessibility_needs: profile?.accessibility_needs || [],
    accessibility_provided: profile?.accessibility_provided || [],
    experience_since: profile?.experience_since || '',
    teaching_experience: profile?.teaching_experience || 0,
    mentorship_available: profile?.mentorship_available || false
  });

  // Check if user has events
  useEffect(() => {
    const checkUserEvents = async () => {
      if (user) {
        const { count } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('organizer_id', user.id);
        
        setHasEvents((count || 0) > 0);
      }
    };
    
    checkUserEvents();
  }, [user]);

  // Update form data when profile changes
  React.useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        neighborhood: profile.neighborhood || '',
        discovery_radius: profile.discovery_radius || 1,
        holistic_interests: profile.holistic_interests || [],
        notification_preferences: profile.notification_preferences || {
          newEvents: true,
          messages: true,
          reminders: true,
          community: false
        },
        // Enhanced profile capabilities
        skills: profile.skills || [],
        offerings: profile.offerings || [],
        languages: profile.languages || [],
        accessibility_needs: profile.accessibility_needs || [],
        accessibility_provided: profile.accessibility_provided || [],
        experience_since: profile.experience_since || '',
        teaching_experience: profile.teaching_experience || 0,
        mentorship_available: profile.mentorship_available || false
      });
      setDiscoveryRadius(profile.discovery_radius || 1);
      const defaultNotifications = {
        newEvents: true,
        messages: true,
        reminders: true,
        community: false,
        globalEvents: true
      };
      setNotifications({
        ...defaultNotifications,
        ...profile.notification_preferences
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updates = {
        full_name: formData.full_name,
        username: formData.username || undefined,
        bio: formData.bio || undefined,
        neighborhood: formData.neighborhood || undefined,
        discovery_radius: discoveryRadius,
        holistic_interests: formData.holistic_interests,
        notification_preferences: notifications,
        // Enhanced profile capabilities
        skills: formData.skills,
        offerings: formData.offerings,
        languages: formData.languages,
        accessibility_needs: formData.accessibility_needs,
        accessibility_provided: formData.accessibility_provided,
        experience_since: formData.experience_since,
        teaching_experience: formData.teaching_experience,
        mentorship_available: formData.mentorship_available,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await updateProfile(user.id, updates);
      
      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        // Reload the profile data
        await loadUserProfile(user.id);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Achievements data
  const achievements = [
    { id: 'first_event', name: 'First Event', description: 'Attended your first community event', completed: true, icon: Calendar, color: 'bg-green-100 text-green-600' },
    { id: 'host_event', name: 'Event Host', description: 'Hosted your first community event', completed: true, icon: Star, color: 'bg-purple-100 text-purple-600' },
    { id: 'share_space', name: 'Space Sharer', description: 'Shared your first space with the community', completed: false, icon: HomeIcon, color: 'bg-blue-100 text-blue-600' },
    { id: 'connector', name: 'Community Connector', description: 'Connected with 10+ neighbors', completed: true, icon: Users, color: 'bg-earth-100 text-earth-600' },
    { id: 'regular', name: 'Regular Participant', description: 'Attended 5+ events in a month', completed: true, icon: Award, color: 'bg-orange-100 text-orange-600' },
    { id: 'verified', name: 'Verified Member', description: 'Completed identity verification', completed: profile?.verified || false, icon: CheckCircle, color: 'bg-forest-100 text-forest-600' },
  ];

  const toggleInterest = (interestId: string) => {
    const current = formData.holistic_interests;
    const updated = current.includes(interestId)
      ? current.filter(id => id !== interestId)
      : [...current, interestId];
    handleInputChange('holistic_interests', updated);
  };
  const holisticInterests = [
    { id: 'gardening', name: 'Gardening', icon: Sprout, selected: true },
    { id: 'yoga', name: 'Yoga & Meditation', icon: Lotus, selected: true },
    { id: 'cooking', name: 'Cooking', icon: ChefHat, selected: false },
    { id: 'art', name: 'Art & Creativity', icon: Palette, selected: true },
    { id: 'healing', name: 'Healing & Wellness', icon: Stethoscope, selected: false },
    { id: 'music', name: 'Music & Movement', icon: Music, selected: false },
  ];

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-forest-600">Loading account...</p>
        </div>
      </div>
    );
  }
  const communityStats = [
    { label: 'Events Attended', value: 47, icon: Calendar },
    { label: 'Hours Contributed', value: 124, icon: Clock },
    { label: 'Neighbors Met', value: 38, icon: Users },
    { label: 'Community Rating', value: '4.9', icon: Star },
  ];

  const recentActivity = [
    { action: 'Joined Fermentation Workshop', date: '2 days ago', type: 'event' },
    { action: 'Connected with Emma Thompson', date: '1 week ago', type: 'connection' },
    { action: 'Hosted Meditation Circle', date: '1 week ago', type: 'hosting' },
    { action: 'Favorited Pottery Circle', date: '2 weeks ago', type: 'favorite' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="container-responsive py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8">
          {/* Profile Sidebar */}
                      <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-forest-600 to-earth-500 h-32 relative">
                <button className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm p-2 rounded-lg text-white hover:bg-white/30 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
                              <div className="relative px-4 pb-4 sm:px-6 sm:pb-6">
                <div className="flex justify-center">
                  <div className="relative -mt-12">
                    <img
                      src={profile.avatar_url || DEFAULT_AVATAR}
                      alt={profile.full_name || 'Profile'}
                      className="w-24 h-24 rounded-full border-4 border-white object-cover"
                    />
                    {profile.verified && (
                      <div className="absolute -bottom-1 -right-1 bg-forest-600 text-white p-1 rounded-full">
                        <Badge className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-center mt-4">
                  <h2 className="text-xl font-bold text-forest-800">{profile.full_name || profile.username || 'Community Member'}</h2>
                  <p className="text-forest-600">{profile.bio || 'Holistic wellness enthusiast'}</p>
                  <div className="flex items-center justify-center mt-2 text-sm text-forest-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{profile.neighborhood || 'Neighborhood not set'}</span>
                  </div>
                  {/* Rating Section */}
                  <div className="flex items-center justify-center mt-2">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.floor(profile.rating) ? 'text-earth-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-forest-600">{profile.rating.toFixed(1)} rating ({profile.total_reviews} reviews)</span>
                  </div>

                  {/* Global Discovery Section */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-forest-700 mb-3">
                      <Globe className="h-4 w-4 inline mr-2" />
                      Global Discovery
                    </label>
                    <div className="bg-earth-50 rounded-lg p-4 border border-earth-200">
                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked={true}
                          className="mt-1 w-4 h-4 text-forest-600 bg-forest-100 border-forest-300 rounded focus:ring-forest-500 focus:ring-2"
                        />
                        <div>
                          <p className="font-medium text-forest-800">Discover global events</p>
                          <p className="text-sm text-forest-600 mt-1">
                            Allow me to discover virtual and global events beyond my local radius
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-forest-800">Community Achievements</h3>
                <button 
                  onClick={() => setShowAchievements(!showAchievements)}
                  className="text-sm text-forest-600 hover:text-forest-800"
                >
                  {showAchievements ? 'Show less' : 'Show all'}
                </button>
              </div>
              <div className="space-y-3">
                {achievements.slice(0, showAchievements ? achievements.length : 3).map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div 
                      key={achievement.id} 
                      className={`flex items-center p-3 rounded-lg ${achievement.completed ? 'bg-forest-50' : 'bg-gray-50 opacity-60'}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${achievement.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-forest-800">{achievement.name}</h4>
                        <p className="text-sm text-forest-600">{achievement.description}</p>
                      </div>
                      {achievement.completed && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h3 className="font-semibold text-forest-800 mb-4">Community Impact</h3>
              <div className="space-y-4">
                {communityStats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Icon className="h-4 w-4 text-earth-400 mr-2" />
                        <span className="text-sm text-forest-600">{stat.label}</span>
                      </div>
                      <span className="font-semibold text-forest-800">{stat.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-xl shadow-sm p-2">
              <nav className="space-y-1">
                {[
                  { id: 'settings', label: 'Settings', icon: Settings },
                  { id: 'edit-profile', label: 'Edit Profile', icon: Edit },
                  { id: 'personal-info', label: 'Personal Info', icon: UserCircle },
                  { id: 'account-management', label: 'Account Management', icon: User },
                  { id: 'email-updates', label: 'Email Updates', icon: Mail },
                  { id: 'privacy', label: 'Privacy', icon: Shield },
                  { id: 'social-media', label: 'Social Media', icon: Share2 },
                  { id: 'interests', label: 'Interests', icon: Heart },
                  { id: 'mobile-notifications', label: 'Mobile Notifications', icon: Smartphone },
                  { id: 'organizer-subscription', label: 'Organizer Subscription', icon: UserPlus },
                  { id: 'harmonic-subscription', label: 'Harmonic Subscription', icon: Crown },
                  { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard },
                  { id: 'payments-made', label: 'Payments Made', icon: DollarSign },
                  { id: 'payments-received', label: 'Payments Received', icon: Activity },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === item.id
                          ? 'bg-forest-100 text-forest-700'
                          : 'text-forest-600 hover:bg-forest-50'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-semibold text-forest-800 mb-6">Account Settings</h3>
                  <p className="text-forest-600 mb-6">
                    Manage your account settings and preferences. Select a category from the left to get started.
                  </p>
                  
                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setActiveTab('edit-profile')}
                      className="p-4 border border-forest-200 rounded-lg hover:bg-forest-50 transition-colors text-left"
                    >
                      <Edit className="h-5 w-5 text-forest-600 mb-2" />
                      <h4 className="font-medium text-forest-800">Edit Profile</h4>
                      <p className="text-sm text-forest-600">Update your profile information</p>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('privacy')}
                      className="p-4 border border-forest-200 rounded-lg hover:bg-forest-50 transition-colors text-left"
                    >
                      <Shield className="h-5 w-5 text-forest-600 mb-2" />
                      <h4 className="font-medium text-forest-800">Privacy Settings</h4>
                      <p className="text-sm text-forest-600">Control your privacy preferences</p>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('email-updates')}
                      className="p-4 border border-forest-200 rounded-lg hover:bg-forest-50 transition-colors text-left"
                    >
                      <Mail className="h-5 w-5 text-forest-600 mb-2" />
                      <h4 className="font-medium text-forest-800">Email Preferences</h4>
                      <p className="text-sm text-forest-600">Manage email notifications</p>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('payment-methods')}
                      className="p-4 border border-forest-200 rounded-lg hover:bg-forest-50 transition-colors text-left"
                    >
                      <CreditCard className="h-5 w-5 text-forest-600 mb-2" />
                      <h4 className="font-medium text-forest-800">Payment Methods</h4>
                      <p className="text-sm text-forest-600">Manage payment options</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Profile Tab */}
            {activeTab === 'edit-profile' && (
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
                        value={user.email || ''}
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

                {/* Profile Photos */}
                <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-forest-800">Profile Photos</h3>
                    {isEditing && (
                      <button className="bg-forest-100 hover:bg-forest-200 text-forest-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2">
                        <Camera className="h-4 w-4" />
                        <span>Add Photos</span>
                      </button>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="aspect-square bg-forest-50 rounded-lg flex items-center justify-center border-2 border-dashed border-forest-200">
                        <div className="text-center p-4">
                          <Image className="h-8 w-8 text-forest-400 mx-auto mb-2" />
                          <p className="text-sm text-forest-600">Add profile photo</p>
                        </div>
                      </div>
                      <div className="aspect-square bg-forest-50 rounded-lg flex items-center justify-center border-2 border-dashed border-forest-200">
                        <div className="text-center p-4">
                          <Image className="h-8 w-8 text-forest-400 mx-auto mb-2" />
                          <p className="text-sm text-forest-600">Add cover photo</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Image className="h-16 w-16 text-forest-300 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-forest-800 mb-2">No photos yet</h4>
                      <p className="text-forest-600 mb-4">Add photos to personalize your profile</p>
                    </div>
                  )}
                </div>

                {/* Holistic Interests */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-forest-800">Holistic Interests</h3>
                    {isEditing && (
                      <p className="text-sm text-forest-600">Click to toggle interests</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {holisticInterests.map((interest) => {
                      const Icon = interest.icon;
                      const isSelected = formData.holistic_interests.includes(interest.id);
                      return (
                        <button
                          key={interest.id}
                          type="button"
                          onClick={() => isEditing && toggleInterest(interest.id)}
                          disabled={!isEditing}
                          className={`p-4 rounded-lg border-2 transition-colors ${
                            isSelected
                              ? 'border-forest-300 bg-forest-50'
                              : 'border-forest-100 bg-gray-50'
                          } ${isEditing ? 'cursor-pointer hover:bg-forest-25' : 'cursor-default'}`}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className={`h-6 w-6 ${
                              isSelected ? 'text-forest-600' : 'text-gray-400'
                            }`} />
                            <span className={`font-medium ${
                              isSelected ? 'text-forest-800' : 'text-gray-500'
                            }`}>
                              {interest.name}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-forest-800">Recent Activity</h3>
                    <Link to="/activities" className="text-sm text-forest-600 hover:text-forest-800">
                      View all
                    </Link>
                  </div>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center space-x-4 p-3 bg-forest-50 rounded-lg hover:bg-forest-100 transition-colors">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            activity.type === 'event' ? 'bg-earth-100 text-earth-600' :
                            activity.type === 'connection' ? 'bg-blue-100 text-blue-600' :
                            activity.type === 'hosting' ? 'bg-green-100 text-green-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            {activity.type === 'event' && <Calendar className="h-5 w-5" />}
                            {activity.type === 'connection' && <Users className="h-5 w-5" />}
                            {activity.type === 'hosting' && <Star className="h-5 w-5" />}
                            {activity.type === 'favorite' && <Heart className="h-5 w-5" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-forest-800">{activity.action}</p>
                            <p className="text-sm text-forest-600">{activity.date}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button className="p-2 text-forest-600 hover:bg-white rounded-full transition-colors">
                              <MessageCircle className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-forest-600 hover:bg-white rounded-full transition-colors">
                              <Share2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-forest-300 mx-auto mb-3" />
                        <h4 className="text-lg font-semibold text-forest-800 mb-2">No recent activity</h4>
                        <p className="text-forest-600 mb-4">Join events to see your activity here</p>
                        <Link
                          to="/map"
                          className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center space-x-2"
                        >
                          <Map className="h-4 w-4" />
                          <span>Discover Events</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Personal Info Tab */}
            {activeTab === 'personal-info' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-semibold text-forest-800 mb-6">Personal Information</h3>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-forest-700 mb-2">Date of Birth</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-forest-700 mb-2">Gender</label>
                        <select className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500">
                          <option>Prefer not to say</option>
                          <option>Female</option>
                          <option>Male</option>
                          <option>Non-binary</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">Address</label>
                      <input
                        type="text"
                        placeholder="Street Address"
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 mb-3"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="City"
                          className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                        />
                        <input
                          type="text"
                          placeholder="ZIP Code"
                          className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <button className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                        Save Personal Information
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account Management Tab */}
            {activeTab === 'account-management' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-semibold text-forest-800 mb-6">Account Management</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-forest-800 mb-3">Change Password</h4>
                      <div className="space-y-3">
                        <input
                          type="password"
                          placeholder="Current Password"
                          className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                        />
                        <input
                          type="password"
                          placeholder="New Password"
                          className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                        />
                        <input
                          type="password"
                          placeholder="Confirm New Password"
                          className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                        />
                        <button className="bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                          Update Password
                        </button>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="font-medium text-forest-800 mb-3">Two-Factor Authentication</h4>
                      <p className="text-sm text-forest-600 mb-4">Add an extra layer of security to your account</p>
                      <button className="bg-forest-100 hover:bg-forest-200 text-forest-700 px-4 py-2 rounded-lg font-medium transition-colors">
                        Enable 2FA
                      </button>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="font-medium text-forest-800 mb-3">Account Status</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-forest-50 rounded-lg">
                          <span className="text-forest-700">Account Created</span>
                          <span className="font-medium text-forest-800">January 15, 2023</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-forest-50 rounded-lg">
                          <span className="text-forest-700">Last Login</span>
                          <span className="font-medium text-forest-800">Today at 3:45 PM</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-forest-50 rounded-lg">
                          <span className="text-forest-700">Account Type</span>
                          <span className="font-medium text-forest-800">Community Member</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="font-medium text-red-800 mb-3">Danger Zone</h4>
                      <div className="space-y-3">
                        <button className="bg-white border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-medium transition-colors">
                          Deactivate Account
                        </button>
                        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                          Delete Account Permanently
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Email Updates Tab */}
            {activeTab === 'email-updates' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-semibold text-forest-800 mb-6">Email Update Preferences</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-forest-50 rounded-lg">
                      <label className="flex items-start space-x-3">
                        <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-forest-600" />
                        <div>
                          <div className="font-medium text-forest-800">Weekly Community Digest</div>
                          <div className="text-sm text-forest-600">Summary of events and activities in your area</div>
                        </div>
                      </label>
                    </div>
                    
                    <div className="p-4 bg-forest-50 rounded-lg">
                      <label className="flex items-start space-x-3">
                        <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-forest-600" />
                        <div>
                          <div className="font-medium text-forest-800">Event Reminders</div>
                          <div className="text-sm text-forest-600">Notifications about upcoming events you're attending</div>
                        </div>
                      </label>
                    </div>
                    
                    <div className="p-4 bg-forest-50 rounded-lg">
                      <label className="flex items-start space-x-3">
                        <input type="checkbox" className="mt-1 w-4 h-4 text-forest-600" />
                        <div>
                          <div className="font-medium text-forest-800">New Member Spotlights</div>
                          <div className="text-sm text-forest-600">Meet new members in your community</div>
                        </div>
                      </label>
                    </div>
                    
                    <div className="p-4 bg-forest-50 rounded-lg">
                      <label className="flex items-start space-x-3">
                        <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-forest-600" />
                        <div>
                          <div className="font-medium text-forest-800">Space Availability</div>
                          <div className="text-sm text-forest-600">Updates when new spaces become available</div>
                        </div>
                      </label>
                    </div>
                    
                    <div className="p-4 bg-forest-50 rounded-lg">
                      <label className="flex items-start space-x-3">
                        <input type="checkbox" className="mt-1 w-4 h-4 text-forest-600" />
                        <div>
                          <div className="font-medium text-forest-800">Tips & Resources</div>
                          <div className="text-sm text-forest-600">Holistic wellness tips and community resources</div>
                        </div>
                      </label>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="font-medium text-forest-800 mb-3">Email Frequency</h4>
                      <select className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500">
                        <option>Real-time (as events happen)</option>
                        <option>Daily digest</option>
                        <option>Weekly digest</option>
                        <option>Monthly summary</option>
                      </select>
                    </div>
                    
                    <div className="pt-4">
                      <button className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                        Save Email Preferences
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Social Media Tab */}
            {activeTab === 'social-media' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-semibold text-forest-800 mb-6">Social Media Connections</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 border border-forest-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-forest-800">Instagram</h4>
                          <p className="text-sm text-forest-600">Share your events and activities</p>
                        </div>
                        <button className="bg-forest-100 hover:bg-forest-200 text-forest-700 px-4 py-2 rounded-lg font-medium transition-colors">
                          Connect
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4 border border-forest-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-forest-800">Facebook</h4>
                          <p className="text-sm text-forest-600">Find friends in the community</p>
                        </div>
                        <button className="bg-forest-100 hover:bg-forest-200 text-forest-700 px-4 py-2 rounded-lg font-medium transition-colors">
                          Connect
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4 border border-forest-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-forest-800">LinkedIn</h4>
                          <p className="text-sm text-forest-600">Professional wellness connections</p>
                        </div>
                        <button className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-medium transition-colors">
                          Disconnect
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-earth-50 rounded-lg">
                    <h4 className="font-medium text-earth-800 mb-2">Sharing Preferences</h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-forest-600" />
                        <span className="text-sm text-earth-700">Auto-share events I'm attending</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" className="w-4 h-4 text-forest-600" />
                        <span className="text-sm text-earth-700">Share my achievements and milestones</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-forest-600" />
                        <span className="text-sm text-earth-700">Allow friends to find me on Harmony Spaces</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Interests Tab */}
            {activeTab === 'interests' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-forest-800">My Interests</h3>
                    <button className="bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                      Save Interests
                    </button>
                  </div>
                  
                  {/* Holistic Interests */}
                  <div className="mb-6">
                    <h4 className="font-medium text-forest-800 mb-4">Holistic Practices</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {holisticInterests.map((interest) => {
                        const Icon = interest.icon;
                        const isSelected = formData.holistic_interests.includes(interest.id);
                        return (
                          <button
                            key={interest.id}
                            type="button"
                            onClick={() => toggleInterest(interest.id)}
                            className={`p-4 rounded-lg border-2 transition-colors ${
                              isSelected
                                ? 'border-forest-300 bg-forest-50'
                                : 'border-forest-100 bg-gray-50'
                            } hover:bg-forest-25 cursor-pointer`}
                          >
                            <div className="flex items-center space-x-3">
                              <Icon className={`h-6 w-6 ${
                                isSelected ? 'text-forest-600' : 'text-gray-400'
                              }`} />
                              <span className={`font-medium ${
                                isSelected ? 'text-forest-800' : 'text-gray-500'
                              }`}>
                                {interest.name}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Additional Interests */}
                  <div className="mb-6">
                    <h4 className="font-medium text-forest-800 mb-4">Additional Interests</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {['Permaculture', 'Herbalism', 'Energy Healing', 'Sound Therapy', 'Breathwork', 'Dance Movement', 'Nutrition', 'Sustainability', 'Community Building', 'Aromatherapy', 'Mindfulness', 'Sacred Geometry'].map((interest) => {
                        return (
                          <label key={interest} className="flex items-center space-x-2 p-2">
                            <input type="checkbox" className="w-4 h-4 text-forest-600" />
                            <span className="text-sm text-forest-700">{interest}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Interest Intensity */}
                  <div className="mb-6">
                    <h4 className="font-medium text-forest-800 mb-4">How involved are you?</h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input type="radio" name="involvement" className="w-4 h-4 text-forest-600" />
                        <div>
                          <div className="font-medium text-forest-800">Curious Explorer</div>
                          <div className="text-sm text-forest-600">Just starting my holistic journey</div>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="radio" name="involvement" defaultChecked className="w-4 h-4 text-forest-600" />
                        <div>
                          <div className="font-medium text-forest-800">Active Participant</div>
                          <div className="text-sm text-forest-600">Regular practice and community involvement</div>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="radio" name="involvement" className="w-4 h-4 text-forest-600" />
                        <div>
                          <div className="font-medium text-forest-800">Dedicated Practitioner</div>
                          <div className="text-sm text-forest-600">Deep commitment to holistic lifestyle</div>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  {/* Custom Interests */}
                  <div>
                    <h4 className="font-medium text-forest-800 mb-2">Other Interests</h4>
                    <textarea
                      placeholder="Tell us about any other interests or practices you'd like to explore..."
                      rows={3}
                      className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Notifications Tab */}
            {activeTab === 'mobile-notifications' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-semibold text-forest-800 mb-6">Mobile Notification Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-forest-50 rounded-lg">
                      <h4 className="font-medium text-forest-800 mb-3">Push Notifications</h4>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <span className="text-forest-700">Event Reminders</span>
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-forest-600" />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-forest-700">New Messages</span>
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-forest-600" />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-forest-700">Event Updates</span>
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-forest-600" />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-forest-700">Community Announcements</span>
                          <input type="checkbox" className="w-4 h-4 text-forest-600" />
                        </label>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-forest-50 rounded-lg">
                      <h4 className="font-medium text-forest-800 mb-3">Quiet Hours</h4>
                      <p className="text-sm text-forest-600 mb-3">Pause notifications during these hours</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-forest-700 mb-1">From</label>
                          <input type="time" defaultValue="22:00" className="w-full px-3 py-2 border border-forest-200 rounded-lg" />
                        </div>
                        <div>
                          <label className="block text-sm text-forest-700 mb-1">To</label>
                          <input type="time" defaultValue="08:00" className="w-full px-3 py-2 border border-forest-200 rounded-lg" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-forest-50 rounded-lg">
                      <h4 className="font-medium text-forest-800 mb-3">Notification Sound</h4>
                      <select className="w-full px-3 py-2 border border-forest-200 rounded-lg">
                        <option>Default</option>
                        <option>Gentle Chime</option>
                        <option>Nature Sound</option>
                        <option>Vibrate Only</option>
                        <option>Silent</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Organizer Subscription Tab */}
            {activeTab === 'organizer-subscription' && (
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
            )}

            {/* Harmonic Subscription Tab */}
            {activeTab === 'harmonic-subscription' && (
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
            )}

            {/* Payment Methods Tab */}
            {activeTab === 'payment-methods' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-forest-800">Payment Methods</h3>
                    <button className="bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                      Add Payment Method
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 border border-forest-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="h-8 w-8 text-forest-600" />
                          <div>
                            <p className="font-medium text-forest-800">•••• •••• •••• 4242</p>
                            <p className="text-sm text-forest-600">Expires 12/25</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-forest-100 text-forest-700 px-3 py-1 rounded-full text-sm">Default</span>
                          <button className="text-forest-600 hover:text-forest-800">
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="h-8 w-8 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-800">•••• •••• •••• 5555</p>
                            <p className="text-sm text-gray-600">Expires 03/24</p>
                          </div>
                        </div>
                        <button className="text-red-600 hover:text-red-800">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-earth-50 rounded-lg">
                    <h4 className="font-medium text-earth-800 mb-2">Accepted Payment Methods</h4>
                    <p className="text-sm text-earth-600">We accept all major credit cards, debit cards, and digital wallets including Apple Pay and Google Pay.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payments Made Tab */}
            {activeTab === 'payments-made' && (
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
            )}

            {/* Payments Received Tab */}
            {activeTab === 'payments-received' && (
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
            )}

            {/* Privacy Tab - Keep existing */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                {/* Discovery Settings */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-semibold text-forest-800 mb-6">Discovery Settings</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-3">
                        <Target className="h-4 w-4 inline mr-2" />
                        Discovery Radius
                      </label>
                      <div className="grid grid-cols-5 gap-3">
                        {[0.5, 1, 2, 3].map((radius) => (
                          <button
                            key={radius}
                            onClick={() => {
                              setDiscoveryRadius(radius);
                              setShowCustomRadius(false);
                            }}
                            className={`p-3 rounded-lg border-2 text-center transition-colors ${
                              discoveryRadius === radius && !showCustomRadius
                                ? 'border-forest-300 bg-forest-50 text-forest-700'
                                : 'border-forest-100 bg-gray-50 text-forest-600 hover:bg-forest-50'
                            }`}
                          >
                            <div className="font-semibold">{radius} mi</div>
                            <div className="text-xs mt-1">
                              {radius === 0.5 ? '5-8 min' : 
                               radius === 1 ? '12-15 min' : 
                               radius === 2 ? '25-30 min' : '5-8 min bike'}
                            </div>
                          </button>
                        ))}
                        
                        {/* Custom Radius Button */}
                        <button
                          onClick={() => {
                            setShowCustomRadius(true);
                            setDiscoveryRadius(customRadius);
                          }}
                          className={`p-3 rounded-lg border-2 text-center transition-colors ${
                            showCustomRadius
                              ? 'border-forest-300 bg-forest-50 text-forest-700'
                              : 'border-forest-100 bg-gray-50 text-forest-600 hover:bg-forest-50'
                          }`}
                        >
                          <div className="font-semibold">5+ mi</div>
                          <div className="text-xs mt-1">Custom</div>
                        </button>
                      </div>
                      
                      {/* Custom Radius Input */}
                      {showCustomRadius && (
                        <div className="mt-4 p-4 bg-earth-50 rounded-lg border border-earth-200">
                          <label className="block text-sm font-medium text-forest-700 mb-2">
                            Custom Discovery Radius
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="number"
                              min="5"
                              max="50"
                              value={customRadius}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 5;
                                setCustomRadius(Math.min(Math.max(value, 5), 50));
                                setDiscoveryRadius(Math.min(Math.max(value, 5), 50));
                              }}
                              className="w-20 px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 text-center"
                            />
                            <span className="text-sm text-forest-600">miles</span>
                            <span className="text-xs text-forest-500">
                              (5-50 miles)
                            </span>
                          </div>
                          <p className="text-xs text-forest-600 mt-2">
                            Larger radius helps you discover more diverse holistic practices and connect with practitioners from wider communities.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {discoveryRadius !== (profile?.discovery_radius || 1) && (
                      <div className="bg-earth-50 border border-earth-200 rounded-lg p-4">
                        <p className="text-sm text-earth-700">
                          <strong>Note:</strong> Changes to discovery radius will be saved when you update your profile.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-semibold text-forest-800 mb-6">
                    <Bell className="h-5 w-5 inline mr-2" />
                    Notification Preferences
                  </h3>
                  <p className="text-forest-600 mb-4">Control how and when you receive notifications</p>
                  <div className="space-y-3">
                    {Object.entries(notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-forest-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-forest-800 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </h4>
                          <p className="text-sm text-forest-600">
                            {key === 'newEvents' && 'Get notified about new events in your area'}
                            {key === 'messages' && 'Receive notifications for new messages'}
                            {key === 'reminders' && 'Event reminders and updates'}
                            {key === 'community' && 'Community announcements and updates'}
                            {key === 'globalEvents' && 'Discover virtual and global events beyond your radius'}
                          </p>
                        </div>
                        <button
                          onClick={() => setNotifications(prev => ({ ...prev, [key]: !value }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            value ? 'bg-forest-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              value ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                    
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start space-x-3">
                        <Bell className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-800 mb-1">Communication Channels</h4>
                          <p className="text-sm text-blue-600 mb-3">
                            Choose how you'd like to receive notifications
                          </p>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2">
                              <input type="checkbox" defaultChecked className="w-4 h-4 text-forest-600" />
                              <span className="text-blue-700">In-app notifications</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input type="checkbox" defaultChecked className="w-4 h-4 text-forest-600" />
                              <span className="text-blue-700">Email notifications</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input type="checkbox" className="w-4 h-4 text-forest-600" />
                              <span className="text-blue-700">Push notifications</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-semibold text-forest-800 mb-6">
                    <Shield className="h-5 w-5 inline mr-2" />
                    Privacy Settings
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-forest-50 rounded-lg">
                      <h4 className="font-medium text-forest-800 mb-2">Profile Visibility</h4>
                      <p className="text-sm text-forest-600 mb-3">Control who can see your profile information</p>
                      <select className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500">
                        <option>Verified neighbors only</option>
                        <option>All community members</option>
                        <option>Private</option>
                      </select>
                    </div>
                    
                    <div className="p-4 bg-forest-50 rounded-lg">
                      <h4 className="font-medium text-forest-800 mb-2">Location Sharing</h4>
                      <p className="text-sm text-forest-600 mb-3">How precise location information is shared</p>
                      <select className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500">
                        <option>Neighborhood level</option>
                        <option>Street level</option>
                        <option>Exact address (for events only)</option>
                      </select>
                    </div>
                    
                    <div className="p-4 bg-forest-50 rounded-lg">
                      <h4 className="font-medium text-forest-800 mb-2">Contact Information</h4>
                      <p className="text-sm text-forest-600 mb-3">Who can see your contact details</p>
                      <select className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500">
                        <option>Event participants only</option>
                        <option>Verified neighbors</option>
                        <option>Never share</option>
                      </select>
                    </div>
                    
                    <div className="p-4 bg-forest-50 rounded-lg">
                      <h4 className="font-medium text-forest-800 mb-2">Data Preferences</h4>
                      <p className="text-sm text-forest-600 mb-3">Manage how your data is used</p>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3">
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-forest-600" />
                          <span className="text-sm text-forest-700">Allow community recommendations based on my interests</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-forest-600" />
                          <span className="text-sm text-forest-700">Show my profile in community searches</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input type="checkbox" className="w-4 h-4 text-forest-600" />
                          <span className="text-sm text-forest-700">Share my activity with my connections</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="font-medium text-red-800 mb-2">Account Management</h4>
                      <p className="text-sm text-red-600 mb-3">Manage your account data and settings</p>
                      <div className="flex space-x-3">
                        <button className="bg-white text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                          Download My Data
                        </button>
                        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Account;