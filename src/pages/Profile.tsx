import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, Calendar, Star, Users, Clock, Shield, MessageCircle, 
  Share2, Heart, ChevronRight, Award, CheckCircle, Home,
  GraduationCap, Package, Languages, Accessibility, Edit,
  Globe, Briefcase
} from 'lucide-react';
import { getUserProfile, Profile } from '../lib/supabase';
import { useAuthContext } from '../components/AuthProvider';
import { LoadingSpinner } from '../components/LoadingStates';
import Avatar from '../components/Avatar';
import { DEFAULT_AVATAR } from '../utils/defaults';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  
  const isOwnProfile = user?.id === id;

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const profileData = await getUserProfile(id);
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-forest-800 mb-4">Profile not found</h2>
          <Link to="/" className="btn-primary">Return Home</Link>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Events Attended', value: 47, icon: Calendar },
    { label: 'Hours Contributed', value: 124, icon: Clock },
    { label: 'Neighbors Met', value: 38, icon: Users },
    { label: 'Member Since', value: 'Jan 2023', icon: Award },
  ];

  const achievements = [
    { id: 'first_event', name: 'First Event', description: 'Attended first community event', completed: true, icon: Calendar },
    { id: 'host_event', name: 'Event Host', description: 'Hosted first community event', completed: true, icon: Star },
    { id: 'share_space', name: 'Space Sharer', description: 'Shared space with community', completed: false, icon: Home },
    { id: 'connector', name: 'Community Connector', description: 'Connected with 10+ neighbors', completed: true, icon: Users },
    { id: 'verified', name: 'Verified Member', description: 'Completed identity verification', completed: profile.verified, icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      {/* Hero Section */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-br from-forest-600 to-earth-500"></div>
        <div className="container-responsive">
          <div className="relative -mt-24 pb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={profile.avatar_url || DEFAULT_AVATAR}
                    alt={profile.full_name || 'Profile'}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
                  />
                  {profile.verified && (
                    <div className="absolute bottom-0 right-0 bg-forest-600 text-white p-2 rounded-full shadow-lg">
                      <Shield className="h-5 w-5" />
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-3xl font-bold text-forest-800">
                    {profile.full_name || profile.username || 'Community Member'}
                  </h1>
                  <p className="text-forest-600 mt-2 max-w-2xl">
                    {profile.bio || 'Holistic wellness enthusiast'}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-4 justify-center sm:justify-start">
                    <div className="flex items-center text-forest-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{profile.neighborhood || 'Location not set'}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < Math.floor(profile.rating) ? 'text-earth-400 fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="ml-2 text-forest-600">{profile.rating.toFixed(1)} ({profile.total_reviews} reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  {isOwnProfile ? (
                    <Link
                      to="/account"
                      state={{ activeTab: 'profile' }}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </Link>
                  ) : (
                    <>
                      <button className="btn-primary flex items-center space-x-2">
                        <MessageCircle className="h-4 w-4" />
                        <span>Message</span>
                      </button>
                      <button className="btn-secondary flex items-center space-x-2">
                        <Heart className="h-4 w-4" />
                        <span>Follow</span>
                      </button>
                      <button className="btn-ghost flex items-center space-x-2">
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-200">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <stat.icon className="h-5 w-5 text-earth-400" />
                    </div>
                    <div className="text-2xl font-bold text-forest-800">{stat.value}</div>
                    <div className="text-sm text-forest-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container-responsive pb-12">
        <div className="flex space-x-1 mb-8 bg-white rounded-lg p-1 shadow-sm">
          {['about', 'skills', 'offerings', 'achievements', 'reviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-forest-100 text-forest-800'
                  : 'text-forest-600 hover:text-forest-800 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* About Tab */}
            {activeTab === 'about' && (
              <>
                {/* Holistic Interests */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-semibold text-forest-800 mb-4">Holistic Interests</h3>
                  <div className="flex flex-wrap gap-3">
                    {profile.holistic_interests?.map((interest) => (
                      <span
                        key={interest}
                        className="px-4 py-2 bg-forest-100 text-forest-700 rounded-full text-sm font-medium"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                {profile.languages && profile.languages.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Languages className="h-5 w-5 text-forest-600" />
                      <h3 className="text-xl font-semibold text-forest-800">Languages</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {profile.languages.map((language) => (
                        <span
                          key={language}
                          className="px-4 py-2 bg-earth-50 text-earth-700 rounded-lg text-sm font-medium"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {(profile.experience_since || profile.teaching_experience > 0) && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <GraduationCap className="h-5 w-5 text-forest-600" />
                      <h3 className="text-xl font-semibold text-forest-800">Experience</h3>
                    </div>
                    <div className="space-y-3">
                      {profile.experience_since && (
                        <div>
                          <p className="text-forest-600">Started holistic journey in</p>
                          <p className="font-semibold text-forest-800">{profile.experience_since}</p>
                        </div>
                      )}
                      {profile.teaching_experience > 0 && (
                        <div>
                          <p className="text-forest-600">Teaching experience</p>
                          <p className="font-semibold text-forest-800">{profile.teaching_experience} years</p>
                        </div>
                      )}
                      {profile.mentorship_available && (
                        <div className="flex items-center space-x-2 text-forest-700 bg-forest-50 p-3 rounded-lg">
                          <Award className="h-5 w-5" />
                          <span className="font-medium">Available for mentorship</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Accessibility */}
                {((profile.accessibility_needs && profile.accessibility_needs.length > 0) || 
                  (profile.accessibility_provided && profile.accessibility_provided.length > 0)) && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Accessibility className="h-5 w-5 text-forest-600" />
                      <h3 className="text-xl font-semibold text-forest-800">Accessibility</h3>
                    </div>
                    <div className="space-y-4">
                      {profile.accessibility_provided && profile.accessibility_provided.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-forest-700 mb-2">Can provide accommodation for:</p>
                          <div className="flex flex-wrap gap-2">
                            {profile.accessibility_provided.map((item) => (
                              <span key={item} className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-full">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-forest-800 mb-4">Skills & Expertise</h3>
                {profile.skills && profile.skills.length > 0 ? (
                  <div className="space-y-4">
                    {profile.skills.map((skill, index) => (
                      <div key={index} className="border-l-4 border-forest-300 pl-4">
                        <h4 className="font-semibold text-forest-800">{skill.skill}</h4>
                        <p className="text-sm text-forest-600">{skill.category}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-forest-700">Level: {skill.experience_level}</span>
                          {skill.can_teach && (
                            <span className="bg-forest-100 text-forest-700 px-2 py-1 rounded">Can teach</span>
                          )}
                          {skill.want_to_learn && (
                            <span className="bg-earth-100 text-earth-700 px-2 py-1 rounded">Learning</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-forest-600">No skills listed yet</p>
                )}
              </div>
            )}

            {/* Offerings Tab */}
            {activeTab === 'offerings' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-forest-800 mb-4">What I Offer</h3>
                {profile.offerings && profile.offerings.length > 0 ? (
                  <div className="grid gap-4">
                    {profile.offerings.map((offering, index) => (
                      <div key={index} className="border border-forest-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-forest-800">{offering.title}</h4>
                            <p className="text-sm text-forest-600 mt-1">{offering.description}</p>
                            <div className="flex items-center gap-4 mt-3 text-sm">
                              <span className="text-forest-700">{offering.type}</span>
                              <span className="text-forest-700">{offering.cost_type}</span>
                              {offering.availability && (
                                <span className="text-forest-700">{offering.availability}</span>
                              )}
                            </div>
                          </div>
                          <Package className="h-5 w-5 text-forest-400 flex-shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-forest-600">No offerings listed yet</p>
                )}
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === 'achievements' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-forest-800 mb-4">Community Achievements</h3>
                <div className="space-y-3">
                  {achievements.map((achievement) => {
                    const Icon = achievement.icon;
                    return (
                      <div 
                        key={achievement.id} 
                        className={`flex items-center p-4 rounded-lg ${
                          achievement.completed ? 'bg-forest-50' : 'bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                          achievement.completed ? 'bg-forest-200 text-forest-700' : 'bg-gray-200 text-gray-500'
                        }`}>
                          <Icon className="h-6 w-6" />
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
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-forest-800 mb-4">Reviews</h3>
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-forest-300 mx-auto mb-3" />
                  <p className="text-forest-600">No reviews yet</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-forest-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/messages"
                  className="flex items-center justify-between p-3 bg-forest-50 rounded-lg hover:bg-forest-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="h-5 w-5 text-forest-600" />
                    <span className="text-forest-700">Send Message</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-forest-400" />
                </Link>
                
                <button className="w-full flex items-center justify-between p-3 bg-earth-50 rounded-lg hover:bg-earth-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-earth-600" />
                    <span className="text-earth-700">View Events</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-earth-400" />
                </button>
              </div>
            </div>

            {/* Global Discovery */}
            {profile.discovery_preferences?.allow_global && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Globe className="h-5 w-5 text-forest-600" />
                  <h3 className="font-semibold text-forest-800">Global Member</h3>
                </div>
                <p className="text-sm text-forest-600">
                  This member participates in virtual and global events beyond their local area.
                </p>
              </div>
            )}

            {/* Verification Status */}
            {profile.verified && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-forest-800">Verified Member</h3>
                </div>
                <p className="text-sm text-forest-600">
                  Identity has been verified by Harmony Spaces
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;