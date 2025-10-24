import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  Flag, 
  Users, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Star,
  Clock,
  MapPin,
  Heart,
  Award,
  TrendingUp,
  Calendar,
  Globe
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase } from '../lib/supabase';

interface CommunityFeaturesProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Report {
  id: string;
  target_type: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  reporter: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  type: string;
}

const CommunityFeatures: React.FC<CommunityFeaturesProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuthContext();
  const [activeTab, setActiveTab] = useState('guidelines');
  const [reports, setReports] = useState<Report[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [communityStats, setCommunityStats] = useState({
    totalMembers: 0,
    activeEvents: 0,
    sharedSpaces: 0,
    connectionsThisWeek: 0
  });
  const [newReport, setNewReport] = useState({
    targetType: 'user',
    targetId: '',
    reason: '',
    description: ''
  });
  const [showReportForm, setShowReportForm] = useState(false);

  const loadCommunityData = useCallback(async () => {
    try {
      // Load community stats
      const [profilesCount, eventsCount, spacesCount] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('spaces').select('*', { count: 'exact', head: true }).eq('status', 'available')
      ]);

      // Calculate connections this week (unique interactions)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weekAgoISO = oneWeekAgo.toISOString();

      // Count unique connections from different sources
      const connectionPromises = [
        // Messages sent this week (if messages table exists)
        supabase
          .from('messages')
          .select('sender_id, recipient_id', { count: 'exact' })
          .gte('created_at', weekAgoISO)
          .then(res => res.data?.length || 0)
          .catch(() => 0),
        
        // Event participations this week
        supabase
          .from('event_participants')
          .select('participant_id, event_id', { count: 'exact' })
          .gte('created_at', weekAgoISO)
          .eq('status', 'registered')
          .then(res => res.data?.length || 0)
          .catch(() => 0),
        
        // Space bookings this week
        supabase
          .from('space_bookings')
          .select('guest_id, space:spaces(owner_id)', { count: 'exact' })
          .gte('created_at', weekAgoISO)
          .in('status', ['confirmed', 'completed'])
          .then(res => res.data?.length || 0)
          .catch(() => 0)
      ];

      const connectionCounts = await Promise.all(connectionPromises);
      const totalConnections = connectionCounts.reduce((sum, count) => sum + count, 0);

      setCommunityStats({
        totalMembers: profilesCount.count || 0,
        activeEvents: eventsCount.count || 0,
        sharedSpaces: spacesCount.count || 0,
        connectionsThisWeek: totalConnections
      });

      // Load recent reports if admin
      if (isAdmin) {
        const { data: reportsData } = await supabase
          .from('reports')
          .select(`
            *,
            reporter:profiles!reports_reporter_id_fkey(id, full_name, avatar_url)
          `)
          .order('created_at', { ascending: false })
          .limit(10);
        
        setReports(reportsData || []);
      }

      // Load announcements
      const { data: announcementsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'announcement')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setAnnouncements(announcementsData || []);
    } catch (error) {
      console.error('Error loading community data:', error);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isOpen) {
      loadCommunityData();
    }
  }, [isOpen, loadCommunityData]);


  const submitReport = async () => {
    if (!user || !newReport.reason) return;

    try {
      const { error } = await supabase
        .from('reports')
        .insert([{
          reporter_id: user.id,
          target_type: newReport.targetType,
          target_id: newReport.targetId || 'unknown',
          reason: newReport.reason,
          description: newReport.description,
          status: 'pending'
        }]);

      if (error) throw error;

      setNewReport({ targetType: 'user', targetId: '', reason: '', description: '' });
      setShowReportForm(false);
      
      // Show success message
      alert('Report submitted successfully. Our team will review it shortly.');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    }
  };

  const tabs = [
    { id: 'guidelines', label: 'Community Guidelines', icon: Shield },
    { id: 'stats', label: 'Community Stats', icon: TrendingUp },
    { id: 'announcements', label: 'Announcements', icon: MessageSquare },
    { id: 'report', label: 'Report Issue', icon: Flag },
    ...(isAdmin ? [{ id: 'moderation', label: 'Moderation', icon: AlertTriangle }] : [])
  ];

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
        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-forest-600 to-earth-500 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Community Hub</h2>
                <p className="text-forest-100">Building stronger neighborhood connections</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
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
          <div className="p-6 max-h-96 overflow-y-auto">
            {/* Community Guidelines */}
            {activeTab === 'guidelines' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-forest-800 mb-4">Community Guidelines</h3>
                  <p className="text-forest-600 mb-6">
                    Our community thrives on mutual respect, inclusivity, and shared commitment to holistic wellness.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold text-green-800">Be Respectful</h4>
                      </div>
                      <p className="text-sm text-green-700">
                        Treat all community members with kindness and respect, regardless of background or beliefs.
                      </p>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-800">Keep It Safe</h4>
                      </div>
                      <p className="text-sm text-blue-700">
                        Follow safety guidelines for events and spaces. Report any concerns immediately.
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Heart className="h-5 w-5 text-purple-600" />
                        <h4 className="font-semibold text-purple-800">Share Mindfully</h4>
                      </div>
                      <p className="text-sm text-purple-700">
                        Share resources, spaces, and knowledge generously while respecting boundaries.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-orange-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="h-5 w-5 text-orange-600" />
                        <h4 className="font-semibold text-orange-800">Build Community</h4>
                      </div>
                      <p className="text-sm text-orange-700">
                        Actively participate in events and help newcomers feel welcome.
                      </p>
                    </div>

                    <div className="bg-earth-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Globe className="h-5 w-5 text-earth-600" />
                        <h4 className="font-semibold text-earth-800">Think Globally</h4>
                      </div>
                      <p className="text-sm text-earth-700">
                        Consider the environmental and social impact of your actions and events.
                      </p>
                    </div>

                    <div className="bg-red-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <h4 className="font-semibold text-red-800">Report Issues</h4>
                      </div>
                      <p className="text-sm text-red-700">
                        Report any violations, safety concerns, or inappropriate behavior promptly.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-forest-50 rounded-xl p-6">
                  <h4 className="font-semibold text-forest-800 mb-3">Consequences</h4>
                  <div className="space-y-2 text-sm text-forest-700">
                    <p>• First violation: Warning and guidance</p>
                    <p>• Repeated violations: Temporary suspension</p>
                    <p>• Serious violations: Permanent removal from community</p>
                    <p>• All decisions are reviewed by community moderators</p>
                  </div>
                </div>
              </div>
            )}

            {/* Community Stats */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-forest-800">Community Impact</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-800">{communityStats.totalMembers}</div>
                    <div className="text-sm text-blue-600">Community Members</div>
                  </div>
                  
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-800">{communityStats.activeEvents}</div>
                    <div className="text-sm text-green-600">Active Events</div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <MapPin className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-800">{communityStats.sharedSpaces}</div>
                    <div className="text-sm text-purple-600">Shared Spaces</div>
                  </div>
                  
                  <div className="bg-orange-50 rounded-xl p-4 text-center">
                    <Heart className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-800">{communityStats.connectionsThisWeek}</div>
                    <div className="text-sm text-orange-600">New Connections</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-forest-50 rounded-xl p-6">
                    <h4 className="font-semibold text-forest-800 mb-4">Top Contributors</h4>
                    <div className="space-y-3">
                      {[
                        { name: 'Sarah Chen', events: 12, rating: 4.9 },
                        { name: 'Michael Rodriguez', events: 8, rating: 4.8 },
                        { name: 'Emma Thompson', events: 6, rating: 4.9 }
                      ].map((contributor, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-forest-200 rounded-full flex items-center justify-center">
                              <Award className="h-4 w-4 text-forest-600" />
                            </div>
                            <div>
                              <p className="font-medium text-forest-800">{contributor.name}</p>
                              <p className="text-sm text-forest-600">{contributor.events} events hosted</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-earth-400 fill-current" />
                            <span className="text-sm font-medium text-forest-800">{contributor.rating}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-earth-50 rounded-xl p-6">
                    <h4 className="font-semibold text-forest-800 mb-4">Recent Milestones</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-sm text-forest-700">Reached 100 community members!</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <p className="text-sm text-forest-700">50th event successfully completed</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <p className="text-sm text-forest-700">First global virtual event hosted</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <p className="text-sm text-forest-700">25 spaces shared with community</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Announcements */}
            {activeTab === 'announcements' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-forest-800">Community Announcements</h3>
                  {isAdmin && (
                    <button className="btn-primary btn-sm focus-ring">
                      New Announcement
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {announcements.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-forest-300 mx-auto mb-3" />
                      <h4 className="text-lg font-semibold text-forest-800 mb-2">No announcements yet</h4>
                      <p className="text-forest-600">Check back later for community updates!</p>
                    </div>
                  ) : (
                    announcements.map((announcement, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-start space-x-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-blue-800 mb-1">{announcement.title}</h4>
                            <p className="text-blue-700 mb-2">{announcement.content}</p>
                            <p className="text-xs text-blue-600">
                              {new Date(announcement.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}

            {/* Report Issue */}
            {activeTab === 'report' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-forest-800">Report an Issue</h3>
                
                {!showReportForm ? (
                  <div className="text-center py-8">
                    <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Flag className="h-8 w-8 text-red-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-forest-800 mb-2">Help Keep Our Community Safe</h4>
                    <p className="text-forest-600 mb-6 max-w-md mx-auto">
                      If you've encountered inappropriate behavior, safety concerns, or violations of our community guidelines, please let us know.
                    </p>
                    <button
                      onClick={() => setShowReportForm(true)}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                    >
                      Submit a Report
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        What are you reporting?
                      </label>
                      <select
                        value={newReport.targetType}
                        onChange={(e) => setNewReport(prev => ({ ...prev, targetType: e.target.value }))}
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="user">A user/community member</option>
                        <option value="event">An event</option>
                        <option value="space">A shared space</option>
                        <option value="message">A message or conversation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Reason for report
                      </label>
                      <select
                        value={newReport.reason}
                        onChange={(e) => setNewReport(prev => ({ ...prev, reason: e.target.value }))}
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      >
                        <option value="">Select a reason</option>
                        <option value="harassment">Harassment or bullying</option>
                        <option value="inappropriate_content">Inappropriate content</option>
                        <option value="safety_concern">Safety concern</option>
                        <option value="spam">Spam or misleading information</option>
                        <option value="guideline_violation">Community guideline violation</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Additional details
                      </label>
                      <textarea
                        value={newReport.description}
                        onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Please provide specific details about the issue..."
                        rows={4}
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-800 mb-1">Important</h4>
                          <p className="text-sm text-yellow-700">
                            All reports are reviewed by our moderation team. False reports may result in account restrictions.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowReportForm(false)}
                        className="flex-1 px-4 py-2 border border-forest-300 text-forest-700 rounded-lg hover:bg-forest-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={submitReport}
                        disabled={!newReport.reason}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Submit Report
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Moderation (Admin Only) */}
            {activeTab === 'moderation' && isAdmin && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-forest-800">Moderation Dashboard</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-50 rounded-xl p-4 text-center">
                    <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-800">{reports.length}</div>
                    <div className="text-sm text-red-600">Pending Reports</div>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-xl p-4 text-center">
                    <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-800">3</div>
                    <div className="text-sm text-yellow-600">Under Review</div>
                  </div>
                  
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-800">12</div>
                    <div className="text-sm text-green-600">Resolved This Week</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-forest-800 mb-4">Recent Reports</h4>
                  <div className="space-y-3">
                    {reports.slice(0, 5).map((report) => (
                      <div key={report.id} className="bg-white border border-forest-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                report.status === 'pending' ? 'bg-red-100 text-red-800' :
                                report.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {report.status}
                              </span>
                              <span className="text-sm text-forest-600 capitalize">{report.target_type}</span>
                            </div>
                            <h5 className="font-medium text-forest-800 mb-1">{report.reason}</h5>
                            <p className="text-sm text-forest-600 mb-2">{report.description}</p>
                            <p className="text-xs text-forest-500">
                              Reported by {report.reporter?.full_name} • {new Date(report.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                              <MessageSquare className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
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

export default CommunityFeatures;