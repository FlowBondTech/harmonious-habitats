import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Heart,
  Star,
  Share,
  MessageCircle,
  Search,
  TrendingUp,
  Target,
  Activity,
  BarChart3,
  CheckCircle,
  Eye,
  MoreHorizontal,
  Home as HomeIcon,
  Bookmark,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../components/AuthProvider';
import { supabase, Event, Space } from '../lib/supabase';
import EventCardV2 from '../components/EventCardV2';
import SpaceCard from '../components/SpaceCard';
import ApplicationManagement from '../components/ApplicationManagement';
import EventDetailsModal from '../components/EventDetailsModal';
import { getSpaces } from '../lib/supabase';

interface ActivityStats {
  eventsAttended: number;
  eventsHosted: number;
  hoursContributed: number;
  neighborsConnected: number;
  spacesShared: number;
  communityRating: number;
  thisMonth: {
    events: number;
    hours: number;
    newConnections: number;
  };
}

interface ActivityFilter {
  timeRange: 'week' | 'month' | 'quarter' | 'year' | 'all';
  status: 'all' | 'upcoming' | 'past' | 'ongoing';
  type: 'all' | 'events' | 'spaces' | 'connections';
  category: string;
}

const MyActivities = () => {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [attendingEvents, setAttendingEvents] = useState<Event[]>([]);
  const [hostingEvents, setHostingEvents] = useState<Event[]>([]);
  const [favoriteEvents, setFavoriteEvents] = useState<Event[]>([]);
  const [mySpaces, setMySpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Scrollable tabs state
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  // const [_filter, _setFilter] = useState<ActivityFilter>({
  //   timeRange: 'month',
  //   status: 'all',
  //   type: 'all',
  //   category: 'all'
  // });

  // Mock stats - in real app, this would come from database
  const [stats] = useState<ActivityStats>({
    eventsAttended: 47,
    eventsHosted: 12,
    hoursContributed: 124,
    neighborsConnected: 38,
    spacesShared: 3,
    communityRating: 4.9,
    thisMonth: {
      events: 8,
      hours: 24,
      newConnections: 5
    }
  });

  // Check if tabs need scroll arrows
  const checkScrollArrows = useCallback(() => {
    if (!tabsRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  // Scroll tabs left/right
  const scrollTabs = (direction: 'left' | 'right') => {
    if (!tabsRef.current) return;

    const scrollAmount = 200;
    const newScrollLeft = direction === 'left'
      ? tabsRef.current.scrollLeft - scrollAmount
      : tabsRef.current.scrollLeft + scrollAmount;

    tabsRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  // Set up scroll listeners
  useEffect(() => {
    const tabsElement = tabsRef.current;
    if (!tabsElement) return;

    checkScrollArrows();
    tabsElement.addEventListener('scroll', checkScrollArrows);
    window.addEventListener('resize', checkScrollArrows);

    return () => {
      tabsElement.removeEventListener('scroll', checkScrollArrows);
      window.removeEventListener('resize', checkScrollArrows);
    };
  }, [checkScrollArrows]);

  const loadActivities = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load events the user is attending
      const { data: attendingData } = await supabase
        .from('event_participants')
        .select(`
          event_id,
          status,
          event:events!inner(*,
            organizer:profiles!organizer_id(id, full_name, avatar_url, verified),
            participant_count:event_participants(count)
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['registered', 'waitlisted'])
        .gte('event.date', new Date().toISOString().split('T')[0]);

      if (attendingData) {
        const events = attendingData.map(item => ({
          ...item.event,
          participant_count: item.event.participant_count?.[0]?.count || 0,
          userStatus: item.status
        }));
        setAttendingEvents(events);
      }
      
      // Load events user is hosting
      const { data: hostingData, error: hostingError } = await supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!organizer_id(id, full_name, avatar_url, verified),
          participant_count:event_participants(count)
        `)
        .eq('organizer_id', user.id)
        .in('status', ['published', 'draft'])
        .order('date', { ascending: true });

      console.log('Hosting events query:', {
        userId: user.id,
        data: hostingData,
        error: hostingError,
        count: hostingData?.length || 0
      });

      if (hostingData) {
        const events = hostingData.map(event => ({
          ...event,
          participant_count: event.participant_count?.[0]?.count || 0
        }));
        setHostingEvents(events);
      }

      // Load user's favorite events
      const { data: favoritesData } = await supabase
        .from('event_favorites')
        .select(`
          event_id,
          event:events!inner(
            *,
            organizer:profiles!organizer_id(id, full_name, avatar_url, verified),
            participant_count:event_participants(count)
          )
        `)
        .eq('user_id', user.id);

      console.log('Favorites query:', {
        userId: user.id,
        data: favoritesData,
        count: favoritesData?.length || 0
      });

      if (favoritesData) {
        const favorites = favoritesData.map((fav: any) => ({
          ...fav.event,
          participant_count: fav.event.participant_count?.[0]?.count || 0
        }));
        setFavoriteEvents(favorites);
      }

      // Load user's spaces
      const { data: spacesData } = await getSpaces({
        status: 'available'
      });
      const userSpaces = spacesData?.filter(space => space.owner_id === user.id) || [];
      setMySpaces(userSpaces);
      
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadActivities();
    }
  }, [user, loadActivities]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (startTime: string, endTime: string) => {
    const formatHour = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };
    
    return `${formatHour(startTime)} - ${formatHour(endTime)}`;
  };

  // Use the functions to prevent unused warnings
  const getFormattedDate = (dateString: string) => formatDate(dateString);
  const getFormattedTime = (startTime: string, endTime: string) => formatTime(startTime, endTime);

  // Prevent unused variable warnings
  if (getFormattedDate && getFormattedTime && stats) {
    // Functions and variables exist for usage
  }

  const getActivityInsights = () => {
    const totalActivities = attendingEvents.length + hostingEvents.length + mySpaces.length;
    const recentActivities = attendingEvents.filter(event => {
      const eventDate = new Date(event.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return eventDate >= thirtyDaysAgo;
    }).length;

    return {
      totalActivities,
      recentActivities,
      growthRate: recentActivities > 0 ? Math.round((recentActivities / totalActivities) * 100) : 0,
      mostActiveCategory: 'Gardening & Sustainability', // Mock data
      streakDays: 12 // Mock data
    };
  };

  const insights = getActivityInsights();

  const recentActivity: any[] = []; // Activity will be derived from joined/hosted events

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'attending', label: 'Attending', count: attendingEvents.length, icon: Calendar },
    { id: 'hosting', label: 'Hosting', count: hostingEvents.length, icon: Users },
    { id: 'spaces', label: 'My Spaces', count: mySpaces.length, icon: HomeIcon },
    { id: 'favorites', label: 'Favorites', count: favoriteEvents.length, icon: Heart },
    { id: 'history', label: 'History', icon: Clock },
  ];

  const ActivityInsightCard = ({ title, value, change, icon: Icon, color }: {
    title: string;
    value: string | number;
    change: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <span className={`text-sm font-medium ${
          change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
        }`}>
          {change > 0 ? '+' : ''}{change}%
        </span>
      </div>
      <h3 className="text-2xl font-bold text-forest-800 mb-1">{value}</h3>
      <p className="text-forest-600 text-sm">{title}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="container-responsive py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-forest-800 mb-2">My Activities</h1>
            <p className="text-forest-600">Track your holistic community journey and connections</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Link 
              to="/create-event"
              className="bg-earth-500 hover:bg-earth-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Event</span>
            </Link>
            <Link
              to="/share-space"
              className="bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Share Space</span>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
          <div className="border-b border-gray-200 relative">
            {/* Left Scroll Arrow */}
            {showLeftArrow && (
              <button
                onClick={() => scrollTabs('left')}
                className="absolute left-0 top-0 bottom-0 z-10 bg-gradient-to-r from-white via-white to-transparent px-2 flex items-center hover:bg-gray-50 transition-colors"
                aria-label="Scroll left"
              >
                <div className="bg-white rounded-full p-1 shadow-md border border-gray-200">
                  <ChevronLeft className="h-4 w-4 text-forest-600" />
                </div>
              </button>
            )}

            {/* Right Scroll Arrow */}
            {showRightArrow && (
              <button
                onClick={() => scrollTabs('right')}
                className="absolute right-0 top-0 bottom-0 z-10 bg-gradient-to-l from-white via-white to-transparent px-2 flex items-center hover:bg-gray-50 transition-colors"
                aria-label="Scroll right"
              >
                <div className="bg-white rounded-full p-1 shadow-md border border-gray-200">
                  <ChevronRight className="h-4 w-4 text-forest-600" />
                </div>
              </button>
            )}

            <nav ref={tabsRef} className="flex space-x-8 px-6 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-forest-500 text-forest-600'
                        : 'border-transparent text-forest-400 hover:text-forest-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className="bg-forest-100 text-forest-600 px-2 py-1 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ActivityInsightCard
                title="Events This Month"
                value={stats.thisMonth.events}
                change={15}
                icon={Calendar}
                color="bg-gradient-to-r from-forest-600 to-forest-700"
              />
              <ActivityInsightCard
                title="Hours Contributed"
                value={stats.thisMonth.hours}
                change={8}
                icon={Clock}
                color="bg-gradient-to-r from-earth-500 to-earth-600"
              />
              <ActivityInsightCard
                title="New Connections"
                value={stats.thisMonth.newConnections}
                change={25}
                icon={Users}
                color="bg-gradient-to-r from-blue-500 to-blue-600"
              />
              <ActivityInsightCard
                title="Community Rating"
                value={stats.communityRating}
                change={2}
                icon={Star}
                color="bg-gradient-to-r from-purple-500 to-purple-600"
              />
            </div>

            {/* Activity Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Activity Summary */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-forest-800">Activity Summary</h3>
                    <button className="text-forest-600 hover:text-forest-800">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-forest-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-forest-600 p-2 rounded-lg">
                          <Target className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-forest-800">Total Activities</h4>
                          <p className="text-sm text-forest-600">{insights.totalActivities} events and spaces</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-forest-800">{insights.totalActivities}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-earth-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-earth-500 p-2 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-forest-800">Recent Activity</h4>
                          <p className="text-sm text-forest-600">Last 30 days</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-forest-800">{insights.recentActivities}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-500 p-2 rounded-lg">
                          <Activity className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-forest-800">Activity Streak</h4>
                          <p className="text-sm text-forest-600">Consecutive days active</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-forest-800">{insights.streakDays}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity Feed */}
              <div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-xl font-semibold text-forest-800 mb-6">Recent Activity</h3>
                  
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.type === 'attended' ? 'bg-green-100 text-green-600' :
                          activity.type === 'hosted' ? 'bg-blue-100 text-blue-600' :
                          activity.type === 'connected' ? 'bg-purple-100 text-purple-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          {activity.type === 'attended' && <CheckCircle className="h-5 w-5" />}
                          {activity.type === 'hosted' && <Users className="h-5 w-5" />}
                          {activity.type === 'connected' && <Heart className="h-5 w-5" />}
                          {activity.type === 'shared' && <Share className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-forest-800 truncate">{activity.title}</p>
                          <p className="text-sm text-forest-600">{activity.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button className="w-full mt-4 text-forest-600 hover:text-forest-800 text-sm font-medium">
                    View All Activity
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attending Events Tab */}
        {activeTab === 'attending' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-forest-800 mb-4 sm:mb-0">Events I'm Attending</h3>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
                    />
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 h-48 rounded-t-xl"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : attendingEvents.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {attendingEvents
                    .filter(event =>
                      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      event.description?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((event) => (
                      <EventCardV2
                        key={event.id}
                        event={event}
                        onViewDetails={() => setSelectedEvent(event)}
                        isRegistered={true}
                      />
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-600 mb-2">No events yet</h4>
                  <p className="text-gray-500 mb-6">Join some community events to get started!</p>
                  <Link
                    to="/map"
                    className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                  >
                    <Search className="h-4 w-4" />
                    <span>Discover Events</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hosting Events Tab */}
        {activeTab === 'hosting' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-forest-800 mb-4 sm:mb-0">Events I'm Hosting</h3>
                <Link
                  to="/create-event"
                  className="bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create New Event</span>
                </Link>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
                      <div className="flex space-x-4">
                        <div className="bg-gray-200 h-16 w-16 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : hostingEvents.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hostingEvents.map((event) => (
                    <EventCardV2
                      key={event.id}
                      event={event}
                      onViewDetails={() => setSelectedEvent(event)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-600 mb-2">No events hosted yet</h4>
                  <p className="text-gray-500 mb-6">Share your knowledge by hosting community events!</p>
                  <Link
                    to="/create-event"
                    className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Your First Event</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Spaces Tab */}
        {activeTab === 'spaces' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-forest-800 mb-4 sm:mb-0">My Shared Spaces</h3>
                <Link
                  to="/share-space"
                  className="bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Share New Space</span>
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 h-48 rounded-t-xl"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : mySpaces.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mySpaces.map((space) => (
                                         <SpaceCard key={space.id} space={space} onUpdate={loadActivities} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <HomeIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-600 mb-2">No spaces shared yet</h4>
                  <p className="text-gray-500 mb-6">Share your space to help build community connections!</p>
                  <Link
                    to="/share-space"
                    className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Share Your First Space</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Application Management Section - Only show if user has spaces */}
            {mySpaces.length > 0 && (
              <ApplicationManagement ownerId={user?.id} />
            )}
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
                    <div className="space-y-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : favoriteEvents.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoriteEvents.map((event) => (
                  <EventCardV2 key={event.id} event={event} onViewDetails={() => setSelectedEvent(event)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-600 mb-2">No favorite events yet</h4>
                <p className="text-gray-500 mb-6">Favorite events to easily find them here!</p>
                <Link
                  to="/"
                  className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                >
                  <Heart className="h-4 w-4" />
                  <span>Discover Events</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-forest-800">Activity History</h3>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Last Week
                  </button>
                  <button className="px-3 py-1 text-sm bg-forest-100 text-forest-700 border border-forest-300 rounded-lg">
                    Last Month
                  </button>
                  <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    All Time
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      activity.type === 'attended' ? 'bg-green-100 text-green-600' :
                      activity.type === 'hosted' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'connected' ? 'bg-purple-100 text-purple-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {activity.type === 'attended' && <CheckCircle className="h-6 w-6" />}
                      {activity.type === 'hosted' && <Users className="h-6 w-6" />}
                      {activity.type === 'connected' && <Heart className="h-6 w-6" />}
                      {activity.type === 'shared' && <Share className="h-6 w-6" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-forest-800">{activity.title}</h4>
                      <p className="text-sm text-forest-600">{activity.date}</p>
                      {activity.participants && (
                        <p className="text-xs text-gray-500">{activity.participants} participants</p>
                      )}
                    </div>
                    {activity.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-earth-400 fill-current" />
                        <span className="text-sm font-medium text-forest-700">{activity.rating}</span>
                      </div>
                    )}
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => {
            setSelectedEvent(null);
            loadActivities();
          }}
          onUpdate={loadActivities}
        />
      )}
    </div>
  );
};

export default MyActivities;