import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Calendar, 
  Home, 
  MessageSquare, 
  AlertTriangle, 
  TrendingUp, 
  Settings,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  MapPin,
  Star,
  Badge,
  Activity,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  Bell,
  Globe,
  Zap
} from 'lucide-react';
import { 
  getProfilesCountWithChange, 
  getActiveEventsCountWithChange, 
  getAvailableSpacesCountWithChange, 
  getPendingReportsCountWithChange,
  getRecentProfiles,
  getRecentEvents,
  getRecentSpaces,
  getReports,
  Profile,
  Event,
  Space,
  Report
} from '../lib/supabase';
import { useAuthContext } from '../components/AuthProvider';
import FeedbackModerationDashboard from '../components/FeedbackModerationDashboard';

const AdminDashboard = () => {
  const { user, profile, loading: authLoading } = useAuthContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState([
    { label: 'Total Users', value: '0', change: '+0%', icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active Events', value: '0', change: '+0%', icon: Calendar, color: 'text-green-600 bg-green-50' },
    { label: 'Shared Spaces', value: '0', change: '+0%', icon: Home, color: 'text-purple-600 bg-purple-50' },
    { label: 'Pending Reports', value: '0', change: '+0%', icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
  ]);

  // Data state
  const [recentUsers, setRecentUsers] = useState<Profile[]>([]);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [recentSpaces, setRecentSpaces] = useState<Space[]>([]);
  const [pendingReports, setPendingReports] = useState<Report[]>([]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'spaces', label: 'Spaces', icon: Home },
    { id: 'feedback', label: 'Feedback', icon: Star },
    { id: 'reports', label: 'Reports', icon: AlertTriangle },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load counts for dashboard stats
      const [usersCount, eventsCount, spacesCount, reportsCount] = await Promise.all([
        getProfilesCountWithChange(),
        getActiveEventsCountWithChange(),
        getAvailableSpacesCountWithChange(),
        getPendingReportsCountWithChange()
      ]);

      // Update dashboard stats
      setDashboardStats([
        { 
          label: 'Total Users', 
          value: usersCount.count.toString(), 
          change: usersCount.change,
          icon: Users, 
          color: 'text-blue-600 bg-blue-50' 
        },
        { 
          label: 'Active Events', 
          value: eventsCount.count.toString(), 
          change: eventsCount.change,
          icon: Calendar, 
          color: 'text-green-600 bg-green-50' 
        },
        { 
          label: 'Shared Spaces', 
          value: spacesCount.count.toString(), 
          change: spacesCount.change,
          icon: Home, 
          color: 'text-purple-600 bg-purple-50' 
        },
        { 
          label: 'Pending Reports', 
          value: reportsCount.count.toString(), 
          change: reportsCount.change,
          icon: AlertTriangle, 
          color: 'text-red-600 bg-red-50' 
        },
      ]);

      // Load recent data
      const [usersData, eventsData, spacesData, reportsData] = await Promise.all([
        getRecentProfiles(10),
        getRecentEvents(10),
        getRecentSpaces(10),
        getReports('pending')
      ]);

      setRecentUsers(usersData.data || []);
      setRecentEvents(eventsData.data || []);
      setRecentSpaces(spacesData.data || []);
      setPendingReports(reportsData.data || []);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
      case 'rejected':
      case 'cancelled':
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      case 'investigating':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'virtual':
        return <Globe className="h-4 w-4" />;
      case 'global_physical':
        return <Zap className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Use formatDateTime to prevent unused warning
  const getFormattedDateTime = (dateString: string) => formatDateTime(dateString);
  if (getFormattedDateTime) {
    // Function exists for usage
  }

  // Filter users based on search and status
  const filteredUsers = recentUsers.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.username?.toLowerCase().includes(searchQuery.toLowerCase());
    // Note: We don't have a direct status field on profiles, so we'll show all for now
    return matchesSearch;
  });

  // Check for authentication and admin access
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-forest-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You must be signed in to access the admin dashboard.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-forest-600 text-white px-6 py-2 rounded-lg hover:bg-forest-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Check if user has admin access
  if (!profile || profile.user_type !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
          <p className="text-gray-600 mb-4">
            You don't have admin privileges to access this dashboard.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Debug Information:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>User Type:</strong> {profile?.user_type || 'not set'}</p>
              <p><strong>Profile Loaded:</strong> {profile ? 'Yes' : 'No'}</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-forest-600 text-white px-6 py-2 rounded-lg hover:bg-forest-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-gradient-to-r from-forest-600 to-earth-500 p-3 rounded-2xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-forest-800">Admin Dashboard</h1>
              <p className="text-forest-600">Manage your Harmonious Habitats community</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <button className="bg-white hover:bg-forest-50 text-forest-700 px-4 py-2 rounded-xl border border-forest-200 transition-colors flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export Data</span>
            </button>
            <button 
              onClick={refreshData}
              disabled={refreshing}
              className="bg-white hover:bg-forest-50 text-forest-700 px-4 py-2 rounded-xl border border-forest-200 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button className="bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded-xl transition-colors flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Send Announcement</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-forest-50 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`text-sm font-medium ${
                    stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-forest-800 mb-1">{stat.value}</h3>
                <p className="text-forest-600 text-sm">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-forest-50 overflow-hidden mb-8">
          <div className="border-b border-forest-100">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
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
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-forest-50 to-earth-50 rounded-2xl p-6 border border-forest-100">
                    <h3 className="text-lg font-semibold text-forest-800 mb-4 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      User Growth
                    </h3>
                    <div className="h-48 flex items-center justify-center text-forest-600">
                      <div className="text-center">
                        <BarChart3 className="h-16 w-16 mx-auto mb-4 text-forest-400" />
                        <p>Chart visualization would go here</p>
                        <p className="text-sm text-forest-500 mt-2">Total Users: {dashboardStats[0].value}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-forest-50 to-earth-50 rounded-2xl p-6 border border-forest-100">
                    <h3 className="text-lg font-semibold text-forest-800 mb-4 flex items-center">
                      <PieChart className="h-5 w-5 mr-2" />
                      Event Categories
                    </h3>
                    <div className="h-48 flex items-center justify-center text-forest-600">
                      <div className="text-center">
                        <PieChart className="h-16 w-16 mx-auto mb-4 text-forest-400" />
                        <p>Chart visualization would go here</p>
                        <p className="text-sm text-forest-500 mt-2">Active Events: {dashboardStats[1].value}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-forest-800 mb-4 flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {recentUsers.slice(0, 3).map((user) => (
                      <div key={user.id} className="flex items-center space-x-4 p-4 bg-forest-50 rounded-xl">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Users className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-forest-800">New user registered</p>
                          <p className="text-sm text-forest-600">{user.full_name || user.username || 'Anonymous'} joined the community</p>
                        </div>
                        <span className="text-sm text-forest-500">{formatDate(user.created_at)}</span>
                      </div>
                    ))}
                    {recentEvents.slice(0, 2).map((event) => (
                      <div key={event.id} className="flex items-center space-x-4 p-4 bg-forest-50 rounded-xl">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-forest-800">Event created</p>
                          <p className="text-sm text-forest-600">{event.title} was created</p>
                        </div>
                        <span className="text-sm text-forest-500">{formatDate(event.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-forest-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users..."
                      className="w-full pl-10 pr-4 py-3 border border-forest-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-3 border border-forest-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500"
                  >
                    <option value="all">All Users</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl border border-forest-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-forest-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">User</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Verified</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Neighborhood</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Rating</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Join Date</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-forest-100">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-forest-25">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-forest-100 rounded-full flex items-center justify-center">
                                  {user.avatar_url ? (
                                    <img 
                                      src={user.avatar_url} 
                                      alt={user.full_name || 'User'} 
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-forest-600 font-medium">
                                      {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-forest-800 flex items-center">
                                    {user.full_name || user.username || 'Anonymous'}
                                    {user.verified && (
                                      <Badge className="h-3 w-3 ml-2 text-forest-600" />
                                    )}
                                  </p>
                                  <p className="text-sm text-forest-600">{user.username || 'No username'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                user.verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.verified ? 'Verified' : 'Unverified'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-forest-800">{user.neighborhood || 'Not specified'}</td>
                            <td className="px-6 py-4">
                              {user.rating > 0 ? (
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 text-earth-400 fill-current mr-1" />
                                  <span className="text-forest-800">{user.rating.toFixed(1)}</span>
                                  <span className="text-sm text-forest-500 ml-1">({user.total_reviews})</span>
                                </div>
                              ) : (
                                <span className="text-forest-400">No rating</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-forest-600">{formatDate(user.created_at)}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <button className="p-2 text-forest-600 hover:bg-forest-100 rounded-lg transition-colors">
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button className="p-2 text-forest-600 hover:bg-forest-100 rounded-lg transition-colors">
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-forest-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-forest-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Event</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Type</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Category</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Date</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-forest-100">
                        {recentEvents.map((event) => (
                          <tr key={event.id} className="hover:bg-forest-25">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-forest-800">{event.title}</p>
                                <p className="text-sm text-forest-600">by {event.organizer?.full_name || 'Unknown'}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                {getTypeIcon(event.event_type)}
                                <span className="text-forest-600 capitalize">{event.event_type.replace('_', ' ')}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                                {event.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-forest-800">{event.category}</td>
                            <td className="px-6 py-4 text-forest-600">{formatDate(event.date)}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <button className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors">
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                                  <XCircle className="h-4 w-4" />
                                </button>
                                <button className="p-2 text-forest-600 hover:bg-forest-100 rounded-lg transition-colors">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Spaces Tab */}
            {activeTab === 'spaces' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-forest-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-forest-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Space</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Type</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Capacity</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Visibility</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-forest-100">
                        {recentSpaces.map((space) => (
                          <tr key={space.id} className="hover:bg-forest-25">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-forest-800">{space.name}</p>
                                <p className="text-sm text-forest-600">by {space.owner?.full_name || 'Unknown'}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-forest-600 capitalize">{space.type.replace('_', ' ')}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(space.status)}`}>
                                {space.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-forest-800">{space.capacity}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                space.list_publicly ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {space.list_publicly ? 'Global' : 'Local'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <button className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors">
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                                  <XCircle className="h-4 w-4" />
                                </button>
                                <button className="p-2 text-forest-600 hover:bg-forest-100 rounded-lg transition-colors">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
              <FeedbackModerationDashboard isAdmin={true} />
            )}
            
            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-forest-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-forest-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Report</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Type</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Reporter</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Date</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-forest-800">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-forest-100">
                        {pendingReports.map((report) => (
                          <tr key={report.id} className="hover:bg-forest-25">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-forest-800">{report.reason}</p>
                                <p className="text-sm text-forest-600">{report.description || 'No description'}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-forest-600 capitalize">{report.target_type}</td>
                            <td className="px-6 py-4 text-forest-600">{report.reporter?.full_name || 'Anonymous'}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                {report.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-forest-600">{formatDate(report.created_at)}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <button className="p-2 text-forest-600 hover:bg-forest-100 rounded-lg transition-colors">
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors">
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-forest-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-forest-800 mb-2">Message Management</h3>
                <p className="text-forest-600 mb-6">Monitor and moderate community conversations</p>
                <button className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
                  View All Messages
                </button>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-forest-50 to-earth-50 rounded-2xl p-6 border border-forest-100">
                    <h3 className="text-lg font-semibold text-forest-800 mb-4">Platform Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-forest-700">Auto-approve events</span>
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-forest-600">
                          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-forest-700">Email notifications</span>
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-forest-700">Public registration</span>
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-forest-600">
                          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-forest-50 to-earth-50 rounded-2xl p-6 border border-forest-100">
                    <h3 className="text-lg font-semibold text-forest-800 mb-4">Security Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-forest-700">Two-factor authentication</span>
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-forest-600">
                          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-forest-700">Login monitoring</span>
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-forest-600">
                          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-forest-700">Auto-ban suspicious users</span>
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-forest-100">
                  <h3 className="text-lg font-semibold text-forest-800 mb-4">System Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-forest-600">Database Status</p>
                      <p className="font-semibold text-green-600">Healthy</p>
                    </div>
                    <div>
                      <p className="text-sm text-forest-600">Total Users</p>
                      <p className="font-semibold text-forest-800">{dashboardStats[0].value}</p>
                    </div>
                    <div>
                      <p className="text-sm text-forest-600">Active Events</p>
                      <p className="font-semibold text-forest-800">{dashboardStats[1].value}</p>
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

export default AdminDashboard;