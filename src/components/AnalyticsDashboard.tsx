import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  MapPin, 
  Star,
  Download,
  RefreshCw,
  Award,
  Target,
  Zap
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase } from '../lib/supabase';
import AnalyticsChart from './AnalyticsChart';

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'personal' | 'admin';
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  isOpen, 
  onClose, 
  type = 'personal' 
}) => {
  const { user, isAdmin } = useAuthContext();
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState({
    overview: {
      totalEvents: 0,
      totalParticipants: 0,
      totalSpaces: 0,
      avgRating: 0,
      totalViews: 0,
      totalConnections: 0
    },
    eventMetrics: [],
    spaceMetrics: [],
    engagementData: [],
    growthData: [],
    categoryData: []
  });

  useEffect(() => {
    if (isOpen) {
      loadAnalytics();
    }
  }, [isOpen, timeRange]);

  const loadAnalytics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (type === 'admin' && isAdmin) {
        await loadAdminAnalytics();
      } else {
        await loadPersonalAnalytics();
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPersonalAnalytics = async () => {
    if (!user) return;

    // Load user's events
    const { data: userEvents } = await supabase
      .from('events')
      .select(`
        *,
        participants:event_participants(user_id, status)
      `)
      .eq('organizer_id', user.id);

    // Load user's spaces
    const { data: userSpaces } = await supabase
      .from('spaces')
      .select(`
        *,
        bookings:space_bookings(id, status)
      `)
      .eq('owner_id', user.id);

    // Calculate metrics
    const totalEvents = userEvents?.length || 0;
    const totalParticipants = userEvents?.reduce((sum, event) =>
      sum + (event.participants?.filter(p => p.status === 'registered').length || 0), 0) || 0;
    const totalSpaces = userSpaces?.length || 0;

    // Mock data for demonstration
    setAnalytics({
      overview: {
        totalEvents,
        totalParticipants,
        totalSpaces,
        avgRating: 4.8,
        totalViews: 1247,
        totalConnections: 89
      },
      eventMetrics: [
        { label: 'Yoga Sessions', value: 12, change: 15 },
        { label: 'Cooking Classes', value: 8, change: -5 },
        { label: 'Art Workshops', value: 6, change: 25 },
        { label: 'Garden Work', value: 4, change: 10 }
      ],
      spaceMetrics: [
        { label: 'Bookings', value: 23, change: 12 },
        { label: 'Avg Duration', value: 3.2, change: 8 },
        { label: 'Utilization', value: 78, change: 5 }
      ],
      engagementData: [
        { label: 'Views', value: 1247, change: 18 },
        { label: 'Favorites', value: 89, change: 22 },
        { label: 'Messages', value: 156, change: 15 },
        { label: 'Shares', value: 34, change: 28 }
      ],
      growthData: [
        { label: 'Jan', value: 12 },
        { label: 'Feb', value: 19 },
        { label: 'Mar', value: 15 },
        { label: 'Apr', value: 28 },
        { label: 'May', value: 35 },
        { label: 'Jun', value: 42 }
      ],
      categoryData: [
        { label: 'Wellness', value: 35, color: 'bg-green-500' },
        { label: 'Creative', value: 28, color: 'bg-purple-500' },
        { label: 'Learning', value: 22, color: 'bg-blue-500' },
        { label: 'Social', value: 15, color: 'bg-orange-500' }
      ]
    });
  };

  const loadAdminAnalytics = async () => {
    // Load platform-wide analytics
    const [eventsResult, spacesResult] = await Promise.all([
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('spaces').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true })
    ]);

    setAnalytics({
      overview: {
        totalEvents: eventsResult.count || 0,
        totalParticipants: 0, // Would need to calculate
        totalSpaces: spacesResult.count || 0,
        avgRating: 4.6,
        totalViews: 15847,
        totalConnections: 1289
      },
      eventMetrics: [
        { label: 'Total Events', value: eventsResult.count || 0, change: 12 },
        { label: 'Active Events', value: Math.floor((eventsResult.count || 0) * 0.7), change: 8 },
        { label: 'Completed Events', value: Math.floor((eventsResult.count || 0) * 0.3), change: 15 }
      ],
      spaceMetrics: [
        { label: 'Total Spaces', value: spacesResult.count || 0, change: 18 },
        { label: 'Active Spaces', value: Math.floor((spacesResult.count || 0) * 0.8), change: 12 },
        { label: 'Verified Spaces', value: Math.floor((spacesResult.count || 0) * 0.6), change: 25 }
      ],
      engagementData: [
        { label: 'Daily Active Users', value: 234, change: 15 },
        { label: 'Weekly Retention', value: 78, change: 8 },
        { label: 'Monthly Growth', value: 12, change: 22 }
      ],
      growthData: [
        { label: 'Jan', value: 45 },
        { label: 'Feb', value: 52 },
        { label: 'Mar', value: 48 },
        { label: 'Apr', value: 61 },
        { label: 'May', value: 78 },
        { label: 'Jun', value: 89 }
      ],
      categoryData: [
        { label: 'Wellness', value: 142, color: 'bg-green-500' },
        { label: 'Creative', value: 98, color: 'bg-purple-500' },
        { label: 'Learning', value: 76, color: 'bg-blue-500' },
        { label: 'Social', value: 54, color: 'bg-orange-500' },
        { label: 'Outdoor', value: 32, color: 'bg-earth-500' }
      ]
    });
  };

  const exportData = () => {
    const csvContent = [
      ['Metric', 'Value', 'Change'],
      ...analytics.eventMetrics.map(metric => [metric.label, metric.value, `${metric.change}%`])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${timeRange}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-forest-600 to-earth-500 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {type === 'admin' ? 'Platform Analytics' : 'Your Analytics'}
                </h2>
                <p className="text-forest-100">
                  {type === 'admin' 
                    ? 'Community-wide insights and metrics' 
                    : 'Track your community impact and engagement'
                  }
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-white/20 border border-white/30 text-white rounded-lg px-3 py-2 text-sm"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 3 months</option>
                  <option value="1y">Last year</option>
                </select>
                <button
                  onClick={exportData}
                  className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
                <button
                  onClick={loadAnalytics}
                  disabled={loading}
                  className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={onClose}
                  className="bg-white/20 hover:bg-white/30 border border-white/30 text-white p-2 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-forest-600">Loading analytics...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-blue-50 rounded-2xl p-4 text-center">
                    <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-800">{analytics.overview.totalEvents}</div>
                    <div className="text-sm text-blue-600">Events</div>
                  </div>
                  
                  <div className="bg-green-50 rounded-2xl p-4 text-center">
                    <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-800">{analytics.overview.totalParticipants}</div>
                    <div className="text-sm text-green-600">Participants</div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-2xl p-4 text-center">
                    <MapPin className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-800">{analytics.overview.totalSpaces}</div>
                    <div className="text-sm text-purple-600">Spaces</div>
                  </div>
                  
                  <div className="bg-orange-50 rounded-2xl p-4 text-center">
                    <Star className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-800">{analytics.overview.avgRating}</div>
                    <div className="text-sm text-orange-600">Avg Rating</div>
                  </div>
                  
                  <div className="bg-earth-50 rounded-2xl p-4 text-center">
                    <Eye className="h-6 w-6 text-earth-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-earth-800">{analytics.overview.totalViews.toLocaleString()}</div>
                    <div className="text-sm text-earth-600">Views</div>
                  </div>
                  
                  <div className="bg-forest-50 rounded-2xl p-4 text-center">
                    <Target className="h-6 w-6 text-forest-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-forest-800">{analytics.overview.totalConnections}</div>
                    <div className="text-sm text-forest-600">Connections</div>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <AnalyticsChart
                    title="Event Performance"
                    data={analytics.eventMetrics}
                    type="bar"
                  />
                  
                  <AnalyticsChart
                    title="Growth Over Time"
                    data={analytics.growthData}
                    type="line"
                  />
                  
                  <AnalyticsChart
                    title="Category Distribution"
                    data={analytics.categoryData}
                    type="pie"
                  />
                  
                  <AnalyticsChart
                    title="Engagement Metrics"
                    data={analytics.engagementData}
                    type="bar"
                  />
                </div>

                {/* Detailed Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Event Metrics */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-forest-50">
                    <h3 className="text-lg font-semibold text-forest-800 mb-4 flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Event Insights
                    </h3>
                    <div className="space-y-3">
                      {analytics.eventMetrics.map((metric, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-forest-600">{metric.label}</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-forest-800">{metric.value}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              metric.change > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                              {metric.change > 0 ? '+' : ''}{metric.change}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Space Metrics */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-forest-50">
                    <h3 className="text-lg font-semibold text-forest-800 mb-4 flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Space Insights
                    </h3>
                    <div className="space-y-3">
                      {analytics.spaceMetrics.map((metric, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-forest-600">{metric.label}</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-forest-800">{metric.value}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              metric.change > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                              {metric.change > 0 ? '+' : ''}{metric.change}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Engagement Metrics */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-forest-50">
                    <h3 className="text-lg font-semibold text-forest-800 mb-4 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Engagement
                    </h3>
                    <div className="space-y-3">
                      {analytics.engagementData.map((metric, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-forest-600">{metric.label}</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-forest-800">{metric.value}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              metric.change > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                              {metric.change > 0 ? '+' : ''}{metric.change}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-gradient-to-r from-forest-50 to-earth-50 rounded-2xl p-6 border border-forest-100">
                  <h3 className="text-lg font-semibold text-forest-800 mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Recommendations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-4">
                      <h4 className="font-medium text-forest-800 mb-2">Boost Engagement</h4>
                      <p className="text-sm text-forest-600 mb-3">
                        Your events have great attendance! Consider adding more interactive elements to increase participant engagement.
                      </p>
                      <div className="flex items-center text-xs text-forest-500">
                        <Zap className="h-3 w-3 mr-1" />
                        <span>Potential +15% engagement</span>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4">
                      <h4 className="font-medium text-forest-800 mb-2">Expand Categories</h4>
                      <p className="text-sm text-forest-600 mb-3">
                        Try hosting events in underrepresented categories like music or healing to reach new audiences.
                      </p>
                      <div className="flex items-center text-xs text-forest-500">
                        <Target className="h-3 w-3 mr-1" />
                        <span>Potential +25% reach</span>
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

export default AnalyticsDashboard;