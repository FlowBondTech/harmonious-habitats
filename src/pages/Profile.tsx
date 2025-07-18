import React, { useState, useEffect } from 'react';
import { User, MapPin, Settings, Badge, Star, Calendar, Users, Heart, Edit, Camera, Target, Sprout, Bot as Lotus, ChefHat, Palette, Stethoscope, Music, Shield, Bell, Clock, Award, CheckCircle, MessageCircle, Share2, Image, Home as HomeIcon, Globe, Map, GraduationCap, Package, Briefcase, Languages, Accessibility, X } from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import { updateProfile } from '../lib/supabase';
import { Link, useLocation } from 'react-router-dom';
import ProfileSkillsSection from '../components/ProfileSkillsSection';
import ProfileOfferingsSection from '../components/ProfileOfferingsSection';
import { ShareTab } from '../components/ShareTab';

const Profile = () => {
  const { user, profile, loadUserProfile } = useAuthContext();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
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
          <p className="text-forest-600">Loading profile...</p>
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
                      src={profile.avatar_url || "https://images.pexels.com/photos/3772622/pexels-photo-3772622.jpeg?auto=compress&cs=tinysrgb&w=200"}
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
                  { id: 'profile', label: 'Profile', icon: User },
                  { id: 'skills', label: 'Skills', icon: GraduationCap },
                  { id: 'offerings', label: 'Offerings', icon: Package },
                  { id: 'capabilities', label: 'Capabilities', icon: Briefcase },
                  { id: 'share', label: 'My Shares', icon: Share2 },
                  { id: 'settings', label: 'Settings', icon: Settings },
                  { id: 'privacy', label: 'Privacy', icon: Shield },
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
            {/* Profile Tab */}
            {activeTab === 'profile' && (
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

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                <ProfileSkillsSection
                  skills={formData.skills}
                  onSkillsUpdate={(skills) => handleInputChange('skills', skills)}
                  isEditing={isEditing}
                />
              </div>
            )}

            {/* Offerings Tab */}
            {activeTab === 'offerings' && (
              <div className="space-y-6">
                <ProfileOfferingsSection
                  offerings={formData.offerings}
                  onOfferingsUpdate={(offerings) => handleInputChange('offerings', offerings)}
                  isEditing={isEditing}
                />
              </div>
            )}

            {/* Capabilities Tab */}
            {activeTab === 'capabilities' && (
              <div className="space-y-6">
                {/* Languages */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      <Languages className="h-5 w-5 text-forest-600" />
                      <h3 className="text-xl font-semibold text-forest-800">Languages</h3>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['English', 'Spanish', 'French', 'Portuguese', 'German', 'Italian', 'Mandarin', 'Japanese', 'Arabic', 'Hindi', 'Russian', 'Other'].map((language) => {
                      const isSelected = formData.languages.includes(language);
                      return (
                        <button
                          key={language}
                          type="button"
                          onClick={() => {
                            if (!isEditing) return;
                            const updated = isSelected 
                              ? formData.languages.filter(l => l !== language)
                              : [...formData.languages, language];
                            handleInputChange('languages', updated);
                          }}
                          disabled={!isEditing}
                          className={`p-3 rounded-lg border-2 text-center transition-colors ${
                            isSelected
                              ? 'border-forest-300 bg-forest-50 text-forest-700'
                              : 'border-forest-100 bg-gray-50 text-forest-600 hover:bg-forest-50'
                          } ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          <span className="font-medium">{language}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Experience & Teaching */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <GraduationCap className="h-5 w-5 text-forest-600" />
                    <h3 className="text-xl font-semibold text-forest-800">Experience & Teaching</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Started holistic journey in
                      </label>
                      <input
                        type="text"
                        value={formData.experience_since}
                        onChange={(e) => handleInputChange('experience_since', e.target.value)}
                        placeholder="e.g., 2018, Early 2020s"
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                        readOnly={!isEditing}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Years of teaching experience
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={formData.teaching_experience}
                        onChange={(e) => handleInputChange('teaching_experience', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                        readOnly={!isEditing}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.mentorship_available}
                        onChange={(e) => handleInputChange('mentorship_available', e.target.checked)}
                        disabled={!isEditing}
                        className="w-4 h-4 text-forest-600 rounded focus:ring-forest-500"
                      />
                      <div>
                        <div className="font-medium text-forest-800">Available for mentorship</div>
                        <div className="text-sm text-gray-600">I'm willing to mentor newcomers to holistic practices</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Accessibility */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <Accessibility className="h-5 w-5 text-forest-600" />
                    <h3 className="text-xl font-semibold text-forest-800">Accessibility</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-forest-800 mb-3">I need accommodation for:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {['Wheelchair access', 'Visual impairment support', 'Hearing impairment support', 'Cognitive support', 'Mobility assistance', 'Dietary restrictions', 'Chemical sensitivities', 'Other needs'].map((need) => {
                          const accessibilityNeeds = formData.accessibility_needs || [];
                          const isSelected = accessibilityNeeds.includes(need);
                          return (
                            <button
                              key={need}
                              type="button"
                              onClick={() => {
                                if (!isEditing) return;
                                const updated = isSelected 
                                  ? accessibilityNeeds.filter(n => n !== need)
                                  : [...accessibilityNeeds, need];
                                handleInputChange('accessibility_needs', updated);
                              }}
                              disabled={!isEditing}
                              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                                isSelected
                                  ? 'border-forest-300 bg-forest-50 text-forest-700'
                                  : 'border-forest-100 bg-gray-50 text-forest-600 hover:bg-forest-50'
                              } ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                              <span className="text-sm">{need}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-forest-800 mb-3">I can provide accommodation for:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {['Wheelchair accessible space', 'Visual aids available', 'Sign language interpretation', 'Quiet/sensory-friendly environment', 'Mobility assistance', 'Dietary accommodations', 'Scent-free environment', 'Flexible pacing'].map((accommodation) => {
                          const accessibilityProvided = formData.accessibility_provided || [];
                          const isSelected = accessibilityProvided.includes(accommodation);
                          return (
                            <button
                              key={accommodation}
                              type="button"
                              onClick={() => {
                                if (!isEditing) return;
                                const updated = isSelected 
                                  ? accessibilityProvided.filter(a => a !== accommodation)
                                  : [...accessibilityProvided, accommodation];
                                handleInputChange('accessibility_provided', updated);
                              }}
                              disabled={!isEditing}
                              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                                isSelected
                                  ? 'border-forest-300 bg-forest-50 text-forest-700'
                                  : 'border-forest-100 bg-gray-50 text-forest-600 hover:bg-forest-50'
                              } ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                              <span className="text-sm">{accommodation}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Share Tab - Dashboard for existing holders */}
            {activeTab === 'share' && <ShareTab />}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
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

export default Profile;