import React, { useState, useEffect } from 'react';
import { User, MapPin, Settings, Badge, Star, Calendar, CalendarPlus, Users, Heart, Edit, Target, Sprout, Bot as Lotus, ChefHat, Palette, Stethoscope, Music, Shield, Bell, Clock, Award, CheckCircle, MessageCircle, Share2, Image, Home as HomeIcon, Globe, Map, GraduationCap, Package, Briefcase, Languages, Accessibility, X, BarChart3, Mail, Lock, CreditCard, DollarSign, UserCircle, Activity, Smartphone, UserPlus, Crown } from 'lucide-react';
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
        {/* 
        LAYOUT OPTIONS - Replace the grid div below with any of these:
        
        Option 1: Three Column Layout (Currently Active)
        - Hero section at top
        - Three columns below: stats, main content, sidebar
        - More balanced distribution of content
        
        Option 2: Wide Header + Two Columns
        - Full-width header with cover photo and profile info
        - Two columns below: main content and compact sidebar
        - More visual impact with larger header
        
        Option 3: Card-Based Dashboard
        - Profile summary card at top
        - Grid of dashboard cards below
        - More modern, dashboard-like feel
        
        */}
        
        {/* Option 1: Three Column Layout (Currently Active) */}
        <div className="space-y-6">
          {/* Hero Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="relative px-6 py-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6">
                <div className="flex justify-center lg:justify-start">
                  <div className="relative">
                    <img
                      src={profile.avatar_url || DEFAULT_AVATAR}
                      alt={profile.full_name || 'Profile'}
                      className="w-32 h-32 rounded-full border-4 border-forest-100 object-cover"
                    />
                    {profile.verified && (
                      <div className="absolute -bottom-1 -right-1 bg-forest-600 text-white p-1 rounded-full">
                        <Badge className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-center lg:text-left mt-4 lg:mt-0 flex-1">
                  <h1 className="text-2xl lg:text-3xl font-bold text-forest-800">{profile.full_name || profile.username || 'Community Member'}</h1>
                  <p className="text-forest-600 text-lg mt-1">{profile.bio || 'Holistic wellness enthusiast'}</p>
                  <div className="flex items-center justify-center lg:justify-start mt-2 text-forest-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{profile.neighborhood || 'Neighborhood not set'}</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start mt-2">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.floor(profile.rating) ? 'text-earth-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-forest-600">{profile.rating.toFixed(1)} rating ({profile.total_reviews} reviews)</span>
                  </div>
                </div>
                <div className="flex justify-center lg:justify-end mt-4 lg:mt-0">
                  <Link
                    to="/settings"
                    state={{ activeSection: 'edit-profile' }}
                    className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Three Column Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Stats Column */}
            <div className="lg:col-span-3 space-y-6">
              {/* Community Stats */}
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
              
              {/* Achievements */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-forest-800">Achievements</h3>
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
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${achievement.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-forest-800 text-sm">{achievement.name}</h4>
                          <p className="text-xs text-forest-600">{achievement.description}</p>
                        </div>
                        {achievement.completed && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Main Content Column */}
            <div className="lg:col-span-6">
              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-forest-800 mb-6">Recent Activity</h3>
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
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-semibold text-forest-800 mb-6">Your Events Analytics</h3>
                  <EventAnalyticsDashboard />
                </div>
              )}
            </div>
            
            {/* Sidebar Column */}
            <div className="lg:col-span-3 space-y-6">
              {/* Global Discovery Section */}
              <div className="bg-white rounded-xl shadow-sm p-6">
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
              
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-forest-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    to="/create-event"
                    className="w-full flex items-center px-4 py-3 bg-forest-600 hover:bg-forest-700 text-white rounded-lg transition-colors"
                  >
                    <CalendarPlus className="h-4 w-4 mr-3" />
                    <span>Create Event</span>
                  </Link>
                  <Link
                    to="/share-space"
                    className="w-full flex items-center px-4 py-3 bg-earth-600 hover:bg-earth-700 text-white rounded-lg transition-colors"
                  >
                    <HomeIcon className="h-4 w-4 mr-3" />
                    <span>Share Space</span>
                  </Link>
                  <Link
                    to="/map"
                    className="w-full flex items-center px-4 py-3 border border-forest-200 text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"
                  >
                    <Map className="h-4 w-4 mr-3" />
                    <span>Discover Events</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;