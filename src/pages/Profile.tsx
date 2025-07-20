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

const Profile = () => {
  const { user, profile, loadUserProfile } = useAuthContext();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [hasEvents, setHasEvents] = useState(false);

  // Handle navigation state
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

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

  // Achievements data
  const achievements = [
    { id: 'first_event', name: 'First Event', description: 'Attended your first community event', completed: true, icon: Calendar, color: 'bg-green-100 text-green-600' },
    { id: 'host_event', name: 'Event Host', description: 'Hosted your first community event', completed: true, icon: Star, color: 'bg-purple-100 text-purple-600' },
    { id: 'share_space', name: 'Space Sharer', description: 'Shared your first space with the community', completed: false, icon: HomeIcon, color: 'bg-blue-100 text-blue-600' },
    { id: 'connector', name: 'Community Connector', description: 'Connected with 10+ neighbors', completed: true, icon: Users, color: 'bg-earth-100 text-earth-600' },
    { id: 'regular', name: 'Regular Participant', description: 'Attended 5+ events in a month', completed: true, icon: Award, color: 'bg-orange-100 text-orange-600' },
    { id: 'verified', name: 'Verified Member', description: 'Completed identity verification', completed: profile?.verified || false, icon: CheckCircle, color: 'bg-forest-100 text-forest-600' },
  ];

  const [showAchievements, setShowAchievements] = useState(false);

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
                <Link
                  to="/settings"
                  className="w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors text-forest-600 hover:bg-forest-50"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  <span>Settings</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Overview Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-semibold text-forest-800 mb-6">Profile Overview</h3>
                  
                  {/* Recent Activity */}
                  <div className="mb-8">
                    <h4 className="font-semibold text-forest-800 mb-4">Recent Activity</h4>
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
                  
                  {/* Analytics Dashboard for Organizers */}
                  {hasEvents && (
                    <div className="mt-8">
                      <h4 className="font-semibold text-forest-800 mb-4">Your Events Analytics</h4>
                      <EventAnalyticsDashboard />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Share Tab */}
            {activeTab === 'share' && (
              <div className="space-y-6">
                <ShareTab />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;