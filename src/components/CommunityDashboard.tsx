import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  MapPin, 
  Award, 
  Activity,
  Clock,
  Target,
  PieChart,
  Zap
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase, Event, Space, Profile } from '../lib/supabase';
import { DashboardStatsSkeleton, PageLoader } from './LoadingStates';
import { logger } from '../lib/logger';

interface CommunityStats {
  totalEvents: number;
  totalSpaces: number;
  totalMembers: number;
  userParticipation: number;
  weeklyGrowth: number;
  popularCategories: { name: string; count: number; color: string }[];
  upcomingEvents: Event[];
  nearbySpaces: Space[];
  recentMembers: Profile[];
  personalStats: {
    eventsAttended: number;
    spacesShared: number;
    hoursContributed: number;
    impactScore: number;
  };
}

interface CommunityDashboardProps {
  variant?: 'full' | 'compact';
  showPersonalStats?: boolean;
}

const CommunityDashboard: React.FC<CommunityDashboardProps> = ({ 
  variant = 'full', 
  showPersonalStats = true 
}) => {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCommunityStats();
  }, [user, timeRange, loadCommunityStats]);

  const loadCommunityStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const [
        eventsResult,
        spacesResult,
        membersResult,
        userEventsResult,
        userSpacesResult,
        recentMembersResult
      ] = await Promise.all([
        supabase.from('events').select('*').eq('status', 'active'),
        supabase.from('spaces').select('*').eq('status', 'available'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('event_participants').select('*').eq('user_id', user.id),
        supabase.from('spaces').select('*').eq('owner_id', user.id),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      // Process category data
      const events = eventsResult.data || [];
      const categoryCount = events.reduce((acc, event) => {
        acc[event.category] = (acc[event.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const categoryColors = {
        'Yoga': '#8B5CF6',
        'Gardening': '#10B981',
        'Meditation': '#6366F1',
        'Cooking': '#F59E0B',
        'Art': '#EF4444',
        'Music': '#EC4899',
        'Fitness': '#06B6D4',
        'Community': '#84CC16'
      };

      const popularCategories = Object.entries(categoryCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({
          name,
          count,
          color: categoryColors[name as keyof typeof categoryColors] || '#6B7280'
        }));

      // Calculate personal stats
      const personalStats = {
        eventsAttended: userEventsResult.data?.length || 0,
        spacesShared: userSpacesResult.data?.length || 0,
        hoursContributed: Math.floor(Math.random() * 50) + 10, // Simulated for now
        impactScore: Math.floor(Math.random() * 100) + 50 // Simulated for now
      };

      const communityStats: CommunityStats = {
        totalEvents: events.length,
        totalSpaces: spacesResult.data?.length || 0,
        totalMembers: membersResult.count || 0,
        userParticipation: Math.floor((personalStats.eventsAttended / Math.max(events.length, 1)) * 100),
        weeklyGrowth: Math.floor(Math.random() * 20) + 5, // Simulated for now
        popularCategories,
        upcomingEvents: events.slice(0, 3),
        nearbySpaces: spacesResult.data?.slice(0, 3) || [],
        recentMembers: recentMembersResult.data || [],
        personalStats
      };

      setStats(communityStats);
    } catch (error) {
      logger.error('Error loading community stats:', error);
      setError('Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  const impactLevel = useMemo(() => {
    if (!stats) return 'Getting Started';
    const score = stats.personalStats.impactScore;
    if (score >= 80) return 'Community Champion';
    if (score >= 60) return 'Active Contributor';
    if (score >= 40) return 'Growing Member';
    return 'Getting Started';
  }, [stats]);

  if (loading) {
    return variant === 'full' ? (
      <PageLoader message="Loading community insights..." />
    ) : (
      <DashboardStatsSkeleton />
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadCommunityStats}
          className="mt-4 px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className={`space-y-6 ${variant === 'compact' ? 'max-w-4xl' : 'max-w-7xl'} mx-auto`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-forest-800 flex items-center gap-2">
            <Activity className="h-7 w-7 text-forest-600" />
            Community Dashboard
          </h2>
          <p className="text-forest-600 mt-1">Your impact in our holistic community</p>
        </div>
        
        {variant === 'full' && (
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'year')}
              className="px-3 py-2 border border-forest-200 rounded-lg bg-white text-forest-700"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Events */}
        <div className="card-interactive p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Active Events</p>
              <p className="text-2xl font-bold text-blue-800">{stats.totalEvents}</p>
              <p className="text-xs text-blue-600">+{stats.weeklyGrowth}% this week</p>
            </div>
            <div className="h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Spaces */}
        <div className="card-interactive p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Shared Spaces</p>
              <p className="text-2xl font-bold text-green-800">{stats.totalSpaces}</p>
              <p className="text-xs text-green-600">Available in your area</p>
            </div>
            <div className="h-12 w-12 bg-green-200 rounded-full flex items-center justify-center">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Members */}
        <div className="card-interactive p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Community Members</p>
              <p className="text-2xl font-bold text-purple-800">{stats.totalMembers}</p>
              <p className="text-xs text-purple-600">Growing every day</p>
            </div>
            <div className="h-12 w-12 bg-purple-200 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Personal Impact */}
        <div className="card-interactive p-6 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Your Impact</p>
              <p className="text-2xl font-bold text-orange-800">{stats.personalStats.impactScore}</p>
              <p className="text-xs text-orange-600">{impactLevel}</p>
            </div>
            <div className="h-12 w-12 bg-orange-200 rounded-full flex items-center justify-center">
              <Award className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Personal Stats Section */}
      {showPersonalStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Activity */}
          <div className="card-interactive p-6">
            <h3 className="text-lg font-semibold text-forest-800 mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-forest-600" />
              Your Community Journey
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-forest-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-forest-600" />
                  <span className="font-medium text-forest-700">Events Attended</span>
                </div>
                <span className="text-2xl font-bold text-forest-800">{stats.personalStats.eventsAttended}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-forest-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-forest-600" />
                  <span className="font-medium text-forest-700">Spaces Shared</span>
                </div>
                <span className="text-2xl font-bold text-forest-800">{stats.personalStats.spacesShared}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-forest-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-forest-600" />
                  <span className="font-medium text-forest-700">Hours Contributed</span>
                </div>
                <span className="text-2xl font-bold text-forest-800">{stats.personalStats.hoursContributed}</span>
              </div>
            </div>
          </div>

          {/* Popular Categories */}
          <div className="card-interactive p-6">
            <h3 className="text-lg font-semibold text-forest-800 mb-4 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-forest-600" />
              Popular Activities
            </h3>
            <div className="space-y-3">
              {stats.popularCategories.map((category) => (
                <div key={category.name} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium text-forest-700">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-forest-600">{category.count} events</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          backgroundColor: category.color,
                          width: `${(category.count / Math.max(...stats.popularCategories.map(c => c.count))) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {variant === 'full' && (
        <div className="card-interactive p-6">
          <h3 className="text-lg font-semibold text-forest-800 mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-forest-600" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center gap-3 p-4 bg-gradient-to-r from-forest-50 to-forest-100 rounded-lg hover:from-forest-100 hover:to-forest-200 transition-all duration-200 group">
              <div className="h-10 w-10 bg-forest-200 rounded-full flex items-center justify-center group-hover:bg-forest-300">
                <Calendar className="h-5 w-5 text-forest-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-forest-800">Create Event</p>
                <p className="text-sm text-forest-600">Share your knowledge</p>
              </div>
            </button>
            
            <button className="flex items-center gap-3 p-4 bg-gradient-to-r from-earth-50 to-earth-100 rounded-lg hover:from-earth-100 hover:to-earth-200 transition-all duration-200 group">
              <div className="h-10 w-10 bg-earth-200 rounded-full flex items-center justify-center group-hover:bg-earth-300">
                <MapPin className="h-5 w-5 text-earth-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-earth-800">Share Space</p>
                <p className="text-sm text-earth-600">Open your doors</p>
              </div>
            </button>
            
            <button className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200 group">
              <div className="h-10 w-10 bg-blue-200 rounded-full flex items-center justify-center group-hover:bg-blue-300">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-blue-800">Find Community</p>
                <p className="text-sm text-blue-600">Connect with others</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityDashboard;