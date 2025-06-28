import React, { useState } from 'react';
import { User, MapPin, Settings, Badge, Star, Calendar, Users, Heart, Edit, Camera, Target, Sprout, Bot as Lotus, ChefHat, Palette, Stethoscope, Music, Shield, Bell, Eye, Clock } from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import { updateProfile } from '../lib/supabase';

const Profile = () => {
  const { user, profile, loadUserProfile } = useAuthContext();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [discoveryRadius, setDiscoveryRadius] = useState(1);
  const [notifications, setNotifications] = useState({
    newEvents: true,
    messages: true,
    reminders: true,
    community: false
  });
  
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
      community: false
    }
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
        }
      });
      setDiscoveryRadius(profile.discovery_radius || 1);
      setNotifications(profile.notification_preferences || {
        newEvents: true,
        messages: true,
        reminders: true,
        community: false
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
        username: formData.username || null,
        bio: formData.bio || null,
        neighborhood: formData.neighborhood || null,
        discovery_radius: discoveryRadius,
        holistic_interests: formData.holistic_interests,
        notification_preferences: notifications,
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-forest-600 to-earth-500 h-32 relative">
                <button className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm p-2 rounded-lg text-white hover:bg-white/30 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="relative px-6 pb-6">
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
                  <div className="flex items-center justify-center mt-2">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.floor(profile.rating) ? 'text-earth-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-forest-600">{profile.rating.toFixed(1)} rating ({profile.total_reviews} reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
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
                <div className="bg-white rounded-xl shadow-sm p-6">
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
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-semibold text-forest-800 mb-6">Recent Activity</h3>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-forest-50 rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.type === 'event' ? 'bg-earth-100 text-earth-600' :
                          activity.type === 'connection' ? 'bg-blue-100 text-blue-600' :
                          activity.type === 'hosting' ? 'bg-green-100 text-green-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          {activity.type === 'event' && <Calendar className="h-4 w-4" />}
                          {activity.type === 'connection' && <Users className="h-4 w-4" />}
                          {activity.type === 'hosting' && <Star className="h-4 w-4" />}
                          {activity.type === 'favorite' && <Heart className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-forest-800">{activity.action}</p>
                          <p className="text-sm text-forest-600">{activity.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
                      <div className="grid grid-cols-4 gap-3">
                        {[0.5, 1, 2, 3].map((radius) => (
                          <button
                            key={radius}
                            onClick={() => setDiscoveryRadius(radius)}
                            className={`p-3 rounded-lg border-2 text-center transition-colors ${
                              discoveryRadius === radius
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
                      </div>
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
                  
                  <div className="space-y-4">
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
                    Privacy & Safety
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