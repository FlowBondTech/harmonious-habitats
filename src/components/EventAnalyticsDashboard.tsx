import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Star, 
  Calendar,
  Clock,
  MapPin,
  Activity,
  PieChart,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  MessageSquare,
  ThumbsUp,
  UserCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface AnalyticsData {
  totalEvents: number;
  totalAttendees: number;
  averageRating: number;
  completionRate: number;
  popularCategories: { category: string; count: number; percentage: number }[];
  attendanceTrends: { date: string; attendees: number }[];
  peakHours: { hour: string; count: number }[];
  feedbackSummary: {
    totalFeedback: number;
    wouldRecommendRate: number;
    averageRatings: {
      overall: number;
      content: number;
      facilitator: number;
      venue: number;
      value: number;
    };
  };
  upcomingEvents: {
    id: string;
    title: string;
    date: string;
    registrations: number;
    capacity: number;
  }[];
  topPerformingEvents: {
    id: string;
    title: string;
    rating: number;
    attendees: number;
    feedback_count: number;
  }[];
}

interface EventAnalyticsDashboardProps {
  organizerId?: string;
  isAdmin?: boolean;
}

const EventAnalyticsDashboard: React.FC<EventAnalyticsDashboardProps> = ({ 
  organizerId, 
  isAdmin = false 
}) => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'trends']));

  useEffect(() => {
    if (user && (isAdmin || organizerId)) {
      loadAnalytics();
    }
  }, [user, dateRange, organizerId, isAdmin]);

  const getDateRange = () => {
    const end = new Date();
    let start: Date;

    switch (dateRange) {
      case 'week':
        start = subDays(end, 7);
        break;
      case 'month':
        start = subDays(end, 30);
        break;
      case 'quarter':
        start = subDays(end, 90);
        break;
      case 'year':
        start = subDays(end, 365);
        break;
      default:
        start = subDays(end, 30);
    }

    return { start, end };
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const targetOrganizerId = organizerId || user?.id;

      // Build base query
      let eventsQuery = supabase
        .from('events')
        .select(`
          *,
          event_participants!inner(
            user_id,
            status
          ),
          event_feedback(
            overall_rating,
            would_recommend,
            content_rating,
            facilitator_rating,
            venue_rating,
            value_rating
          )
        `)
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0]);

      if (!isAdmin && targetOrganizerId) {
        eventsQuery = eventsQuery.eq('organizer_id', targetOrganizerId);
      }

      const { data: events, error: eventsError } = await eventsQuery;

      if (eventsError) {
        console.error('Error loading events:', eventsError);
        return;
      }

      // Calculate analytics
      const totalEvents = events?.length || 0;
      
      // Total attendees
      const totalAttendees = events?.reduce((sum, event) => {
        const attendees = event.event_participants.filter((p: any) => 
          p.status === 'attended'
        ).length;
        return sum + attendees;
      }, 0) || 0;

      // Average rating
      const allRatings = events?.flatMap(event => 
        event.event_feedback.map((f: any) => f.overall_rating)
      ).filter(r => r) || [];
      
      const averageRating = allRatings.length > 0 
        ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length 
        : 0;

      // Completion rate
      const pastEvents = events?.filter(event => 
        new Date(event.date) < new Date()
      ) || [];
      
      const completedEvents = pastEvents.filter(event => 
        event.status === 'published'
      ).length;
      
      const completionRate = pastEvents.length > 0 
        ? (completedEvents / pastEvents.length) * 100 
        : 0;

      // Popular categories
      const categoryCount: Record<string, number> = {};
      events?.forEach(event => {
        categoryCount[event.category] = (categoryCount[event.category] || 0) + 1;
      });
      
      const totalCategoryEvents = Object.values(categoryCount).reduce((a, b) => a + b, 0);
      const popularCategories = Object.entries(categoryCount)
        .map(([category, count]) => ({
          category,
          count,
          percentage: (count / totalCategoryEvents) * 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Attendance trends
      const attendanceByDate: Record<string, number> = {};
      events?.forEach(event => {
        const attendees = event.event_participants.filter((p: any) => 
          p.status === 'attended'
        ).length;
        
        if (attendees > 0) {
          attendanceByDate[event.date] = (attendanceByDate[event.date] || 0) + attendees;
        }
      });

      const attendanceTrends = Object.entries(attendanceByDate)
        .map(([date, attendees]) => ({ date, attendees }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Peak hours
      const hourCount: Record<string, number> = {};
      events?.forEach(event => {
        const hour = event.start_time.split(':')[0];
        hourCount[hour] = (hourCount[hour] || 0) + 1;
      });

      const peakHours = Object.entries(hourCount)
        .map(([hour, count]) => ({ 
          hour: `${hour}:00`, 
          count 
        }))
        .sort((a, b) => a.hour.localeCompare(b.hour));

      // Feedback summary
      const allFeedback = events?.flatMap(event => event.event_feedback) || [];
      const feedbackWithRecommend = allFeedback.filter((f: any) => 
        f.would_recommend !== null
      );
      
      const wouldRecommendCount = feedbackWithRecommend.filter((f: any) => 
        f.would_recommend
      ).length;
      
      const wouldRecommendRate = feedbackWithRecommend.length > 0
        ? (wouldRecommendCount / feedbackWithRecommend.length) * 100
        : 0;

      const calculateAverage = (ratings: (number | null)[]) => {
        const validRatings = ratings.filter(r => r !== null) as number[];
        return validRatings.length > 0
          ? validRatings.reduce((a, b) => a + b, 0) / validRatings.length
          : 0;
      };

      const feedbackSummary = {
        totalFeedback: allFeedback.length,
        wouldRecommendRate,
        averageRatings: {
          overall: calculateAverage(allFeedback.map((f: any) => f.overall_rating)),
          content: calculateAverage(allFeedback.map((f: any) => f.content_rating)),
          facilitator: calculateAverage(allFeedback.map((f: any) => f.facilitator_rating)),
          venue: calculateAverage(allFeedback.map((f: any) => f.venue_rating)),
          value: calculateAverage(allFeedback.map((f: any) => f.value_rating))
        }
      };

      // Upcoming events
      const upcomingEvents = events
        ?.filter(event => new Date(event.date) >= new Date())
        .map(event => ({
          id: event.id,
          title: event.title,
          date: event.date,
          registrations: event.event_participants.filter((p: any) => 
            p.status === 'registered'
          ).length,
          capacity: event.capacity
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5) || [];

      // Top performing events
      const eventsWithRatings = events
        ?.filter(event => event.event_feedback.length > 0)
        .map(event => {
          const ratings = event.event_feedback.map((f: any) => f.overall_rating).filter(r => r);
          const avgRating = ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : 0;
          
          return {
            id: event.id,
            title: event.title,
            rating: avgRating,
            attendees: event.event_participants.filter((p: any) => 
              p.status === 'attended'
            ).length,
            feedback_count: event.event_feedback.length
          };
        })
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5) || [];

      setAnalyticsData({
        totalEvents,
        totalAttendees,
        averageRating,
        completionRate,
        popularCategories,
        attendanceTrends,
        peakHours,
        feedbackSummary,
        upcomingEvents,
        topPerformingEvents: eventsWithRatings
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const exportData = () => {
    if (!analyticsData) return;

    const csvContent = [
      ['Event Analytics Report'],
      ['Generated on', new Date().toLocaleString()],
      ['Date Range', dateRange],
      [],
      ['Overview'],
      ['Total Events', analyticsData.totalEvents],
      ['Total Attendees', analyticsData.totalAttendees],
      ['Average Rating', analyticsData.averageRating.toFixed(2)],
      ['Completion Rate', `${analyticsData.completionRate.toFixed(1)}%`],
      [],
      ['Popular Categories'],
      ['Category', 'Count', 'Percentage'],
      ...analyticsData.popularCategories.map(cat => 
        [cat.category, cat.count, `${cat.percentage.toFixed(1)}%`]
      ),
      [],
      ['Feedback Summary'],
      ['Total Feedback', analyticsData.feedbackSummary.totalFeedback],
      ['Would Recommend Rate', `${analyticsData.feedbackSummary.wouldRecommendRate.toFixed(1)}%`],
      ['Average Overall Rating', analyticsData.feedbackSummary.averageRatings.overall.toFixed(2)]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const MetricCard = ({ 
    icon: Icon, 
    label, 
    value, 
    change, 
    color = 'forest' 
  }: { 
    icon: any; 
    label: string; 
    value: string | number; 
    change?: number;
    color?: string;
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-${color}-100 rounded-lg`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        {change !== undefined && (
          <span className={`text-sm font-medium ${
            change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Event Analytics</h2>
          <p className="text-gray-600">Track performance and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="quarter">Last 90 days</option>
            <option value="year">Last year</option>
          </select>
          <button
            onClick={exportData}
            className="flex items-center space-x-2 px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Overview Section */}
      <div className="space-y-4">
        <button
          onClick={() => toggleSection('overview')}
          className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-forest-300 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900">Overview</h3>
          {expandedSections.has('overview') ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>

        {expandedSections.has('overview') && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={Calendar}
              label="Total Events"
              value={analyticsData.totalEvents}
              color="forest"
            />
            <MetricCard
              icon={Users}
              label="Total Attendees"
              value={analyticsData.totalAttendees}
              color="blue"
            />
            <MetricCard
              icon={Star}
              label="Average Rating"
              value={analyticsData.averageRating.toFixed(1)}
              color="yellow"
            />
            <MetricCard
              icon={Activity}
              label="Completion Rate"
              value={`${analyticsData.completionRate.toFixed(0)}%`}
              color="green"
            />
          </div>
        )}
      </div>

      {/* Popular Categories */}
      <div className="space-y-4">
        <button
          onClick={() => toggleSection('categories')}
          className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-forest-300 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900">Popular Categories</h3>
          {expandedSections.has('categories') ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>

        {expandedSections.has('categories') && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-4">
              {analyticsData.popularCategories.map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-medium text-gray-700">#{index + 1}</span>
                    <span className="font-medium text-gray-900 capitalize">{category.category}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-forest-600 h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-16 text-right">
                      {category.count} events
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attendance Trends */}
      <div className="space-y-4">
        <button
          onClick={() => toggleSection('trends')}
          className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-forest-300 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900">Attendance Trends</h3>
          {expandedSections.has('trends') ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>

        {expandedSections.has('trends') && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {analyticsData.attendanceTrends.length > 0 ? (
              <div className="space-y-2">
                {analyticsData.attendanceTrends.map(trend => (
                  <div key={trend.date} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">
                      {format(new Date(trend.date), 'MMM d, yyyy')}
                    </span>
                    <div className="flex items-center space-x-3">
                      <div className="w-48 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ 
                            width: `${(trend.attendees / Math.max(...analyticsData.attendanceTrends.map(t => t.attendees))) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {trend.attendees}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No attendance data available</p>
            )}
          </div>
        )}
      </div>

      {/* Feedback Summary */}
      <div className="space-y-4">
        <button
          onClick={() => toggleSection('feedback')}
          className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-forest-300 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900">Feedback Summary</h3>
          {expandedSections.has('feedback') ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>

        {expandedSections.has('feedback') && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.feedbackSummary.totalFeedback}
                </p>
                <p className="text-sm text-gray-600">Total Feedback</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <ThumbsUp className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.feedbackSummary.wouldRecommendRate.toFixed(0)}%
                </p>
                <p className="text-sm text-gray-600">Would Recommend</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.feedbackSummary.averageRatings.overall.toFixed(1)}
                </p>
                <p className="text-sm text-gray-600">Average Rating</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Detailed Ratings</h4>
              {Object.entries(analyticsData.feedbackSummary.averageRatings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{key}</span>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= value 
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {value.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top Performing Events */}
      <div className="space-y-4">
        <button
          onClick={() => toggleSection('topEvents')}
          className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-forest-300 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900">Top Performing Events</h3>
          {expandedSections.has('topEvents') ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>

        {expandedSections.has('topEvents') && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {analyticsData.topPerformingEvents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendees
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Feedback
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.topPerformingEvents.map(event => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {event.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {event.rating.toFixed(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {event.attendees}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {event.feedback_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No events with feedback yet</p>
            )}
          </div>
        )}
      </div>

      {/* Upcoming Events */}
      <div className="space-y-4">
        <button
          onClick={() => toggleSection('upcoming')}
          className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-forest-300 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
          {expandedSections.has('upcoming') ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>

        {expandedSections.has('upcoming') && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {analyticsData.upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {analyticsData.upcomingEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(event.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {event.registrations}/{event.capacity}
                      </p>
                      <p className="text-xs text-gray-600">registrations</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No upcoming events</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventAnalyticsDashboard;