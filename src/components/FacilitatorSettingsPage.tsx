import React, { useState, useEffect } from 'react';
import {
  User,
  Calendar,
  Star,
  History,
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Award,
  BookOpen,
  Loader2
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { FacilitatorAvailability } from './FacilitatorAvailability';
import { FacilitatorOnboardingWizard } from './FacilitatorOnboardingWizard';
import { supabase } from '../lib/supabase';

type TabId = 'overview' | 'profile' | 'availability' | 'specialties' | 'history' | 'upcoming' | 'applications';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'availability', label: 'Availability', icon: Calendar },
  { id: 'specialties', label: 'Specialties', icon: Star },
  { id: 'history', label: 'Event History', icon: History },
  { id: 'upcoming', label: 'Upcoming', icon: ClipboardList }
];

export const FacilitatorSettingsPage: React.FC = () => {
  const { user, profile } = useAuthContext();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    avgRating: 0,
    totalHours: 0
  });

  useEffect(() => {
    if (user) {
      loadFacilitatorStats();
    }
  }, [user]);

  const loadFacilitatorStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get facilitator event stats
      const { data: facilitatorEvents, error } = await supabase
        .from('event_facilitators')
        .select('id, event_id, status, confirmed_at, event:events(id, date, start_time, end_time)')
        .eq('user_id', user.id);

      if (error) throw error;

      const now = new Date();
      const completed = facilitatorEvents?.filter((ef: any) =>
        ef.event && new Date(ef.event.date) < now
      ).length || 0;

      const upcoming = facilitatorEvents?.filter((ef: any) =>
        ef.event && new Date(ef.event.date) >= now && ef.status === 'confirmed'
      ).length || 0;

      setStats({
        totalEvents: facilitatorEvents?.length || 0,
        upcomingEvents: upcoming,
        completedEvents: completed,
        avgRating: profile?.facilitator_rating || 0,
        totalHours: profile?.facilitator_total_sessions || 0
      });
    } catch (err) {
      console.error('Error loading facilitator stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async (data: any) => {
    // Save facilitator data
    console.log('Facilitator onboarding complete:', data);
    setShowOnboarding(false);
    // Refresh stats
    loadFacilitatorStats();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-forest-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Events</p>
                    <p className="text-3xl font-bold text-forest-800">{stats.totalEvents}</p>
                  </div>
                  <History className="h-10 w-10 text-forest-400" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Upcoming</p>
                    <p className="text-3xl font-bold text-blue-800">{stats.upcomingEvents}</p>
                  </div>
                  <Calendar className="h-10 w-10 text-blue-400" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-3xl font-bold text-green-800">{stats.completedEvents}</p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-green-400" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Rating</p>
                    <p className="text-3xl font-bold text-yellow-800">
                      {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A'}
                    </p>
                  </div>
                  <Star className="h-10 w-10 text-yellow-400" />
                </div>
              </div>
            </div>

            {/* Availability Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-forest-800">Availability Status</h3>
                <button
                  onClick={() => setActiveTab('availability')}
                  className="text-forest-600 hover:text-forest-800 text-sm font-medium"
                >
                  Edit →
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${profile?.is_available_facilitator ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-gray-700">
                  {profile?.is_available_facilitator ? 'Active - Accepting bookings' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-forest-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('availability')}
                  className="p-4 border border-forest-200 rounded-lg hover:bg-forest-50 transition-colors text-left"
                >
                  <Calendar className="h-6 w-6 text-forest-600 mb-2" />
                  <p className="font-medium text-forest-800">Update Availability</p>
                  <p className="text-sm text-gray-600">Manage your schedule</p>
                </button>

                <button
                  onClick={() => setActiveTab('specialties')}
                  className="p-4 border border-forest-200 rounded-lg hover:bg-forest-50 transition-colors text-left"
                >
                  <Star className="h-6 w-6 text-forest-600 mb-2" />
                  <p className="font-medium text-forest-800">Manage Specialties</p>
                  <p className="text-sm text-gray-600">Update your skills</p>
                </button>

                <button
                  onClick={() => setActiveTab('upcoming')}
                  className="p-4 border border-forest-200 rounded-lg hover:bg-forest-50 transition-colors text-left"
                >
                  <ClipboardList className="h-6 w-6 text-forest-600 mb-2" />
                  <p className="font-medium text-forest-800">View Schedule</p>
                  <p className="text-sm text-gray-600">See upcoming events</p>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            {stats.totalEvents === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <Award className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Ready to Start Facilitating?
                </h3>
                <p className="text-blue-700 mb-4">
                  Complete your profile and availability to start receiving event invitations
                </p>
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Complete Setup
                </button>
              </div>
            )}
          </div>
        );

      case 'profile':
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-forest-800 mb-6">Facilitator Profile</h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  value={profile?.facilitator_bio || ''}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500"
                  placeholder="Tell the community about your experience and what you love to facilitate..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                <input
                  type="number"
                  value={profile?.facilitator_experience_years || 0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                <div className="space-y-2">
                  {profile?.facilitator_certifications?.map((cert: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-forest-600" />
                      <span className="text-gray-700">{cert}</span>
                    </div>
                  )) || <p className="text-gray-500 italic">No certifications added yet</p>}
                </div>
              </div>

              <button className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        );

      case 'availability':
        return <FacilitatorAvailability />;

      case 'specialties':
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-forest-800 mb-6">Your Specialties</h3>
            <p className="text-gray-600 mb-6">
              Manage the areas where you can facilitate workshops, classes, or events
            </p>
            {/* Add specialty management UI here */}
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>Specialty management coming soon</p>
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-forest-800 mb-6">Event History</h3>
            {stats.completedEvents === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <History className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>No completed events yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Add event history list here */}
                <p className="text-gray-600">Past events will appear here</p>
              </div>
            )}
          </div>
        );

      case 'upcoming':
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-forest-800 mb-6">Upcoming Events</h3>
            {stats.upcomingEvents === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Add upcoming events list here */}
                <p className="text-gray-600">Upcoming events will appear here</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (showOnboarding) {
    return (
      <FacilitatorOnboardingWizard
        onComplete={handleOnboardingComplete}
        onCancel={() => setShowOnboarding(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-forest-800">Facilitator Dashboard</h2>
            <p className="text-gray-600 mt-1">
              Manage your availability, specialties, and facilitation schedule
            </p>
          </div>

          {!profile?.is_available_facilitator && (
            <button
              onClick={() => setShowOnboarding(true)}
              className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Complete Setup
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-forest-500 text-forest-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-forest-600" />
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>
    </div>
  );
};

export default FacilitatorSettingsPage;
