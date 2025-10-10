import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Filter,
  Search,
  Calendar,
  Clock,
  User,
  ThumbsUp,
  MessageCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface EventFeedback {
  id: string;
  created_at: string;
  event_id: string;
  user_id: string;
  overall_rating: number;
  would_recommend: boolean | null;
  content_rating: number | null;
  facilitator_rating: number | null;
  venue_rating: number | null;
  value_rating: number | null;
  what_went_well: string | null;
  what_could_improve: string | null;
  additional_comments: string | null;
  learned_something_new: boolean | null;
  felt_welcomed: boolean | null;
  clear_instructions: boolean | null;
  appropriate_skill_level: boolean | null;
  is_public: boolean;
  moderated_at: string | null;
  moderated_by: string | null;
  moderation_notes: string | null;
  events: {
    id: string;
    title: string;
    date: string;
    category: string;
    organizer_id: string;
  };
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface FeedbackModerationDashboardProps {
  isAdmin?: boolean;
  organizerId?: string;
}

const FeedbackModerationDashboard: React.FC<FeedbackModerationDashboardProps> = ({ 
  isAdmin = false,
  organizerId 
}) => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<EventFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<EventFeedback | null>(null);
  const [moderationNotes, setModerationNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user && (isAdmin || organizerId)) {
      loadFeedbacks();
    }
  }, [user, filter, isAdmin, organizerId]);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('event_feedback')
        .select(`
          *,
          events!inner (
            id,
            title,
            date,
            category,
            organizer_id
          ),
          profiles!inner (
            id,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by moderation status
      if (filter === 'pending') {
        query = query.eq('is_public', false).is('moderated_at', null);
      } else if (filter === 'approved') {
        query = query.eq('is_public', true);
      }

      // If not admin, only show feedback for organizer's events
      if (!isAdmin && organizerId) {
        query = query.eq('events.organizer_id', organizerId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading feedbacks:', error);
        return;
      }

      setFeedbacks(data || []);
    } catch (error) {
      console.error('Error loading feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveFeedback = async (feedbackId: string) => {
    if (!user || processing) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('event_feedback')
        .update({
          is_public: true,
          moderated_at: new Date().toISOString(),
          moderated_by: user.id,
          moderation_notes: moderationNotes.trim() || null
        })
        .eq('id', feedbackId);

      if (error) {
        console.error('Error approving feedback:', error);
        return;
      }

      // Update local state
      setFeedbacks(prev =>
        prev.map(f =>
          f.id === feedbackId
            ? {
                ...f,
                is_public: true,
                moderated_at: new Date().toISOString(),
                moderated_by: user.id,
                moderation_notes: moderationNotes.trim() || null
              }
            : f
        )
      );

      setSelectedFeedback(null);
      setModerationNotes('');
    } catch (error) {
      console.error('Error approving feedback:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectFeedback = async (feedbackId: string) => {
    if (!user || processing || !moderationNotes.trim()) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('event_feedback')
        .update({
          is_public: false,
          moderated_at: new Date().toISOString(),
          moderated_by: user.id,
          moderation_notes: moderationNotes.trim()
        })
        .eq('id', feedbackId);

      if (error) {
        console.error('Error rejecting feedback:', error);
        return;
      }

      // Update local state
      setFeedbacks(prev =>
        prev.map(f =>
          f.id === feedbackId
            ? {
                ...f,
                is_public: false,
                moderated_at: new Date().toISOString(),
                moderated_by: user.id,
                moderation_notes: moderationNotes.trim()
              }
            : f
        )
      );

      setSelectedFeedback(null);
      setModerationNotes('');
    } catch (error) {
      console.error('Error rejecting feedback:', error);
    } finally {
      setProcessing(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      feedback.events.title.toLowerCase().includes(query) ||
      feedback.profiles.full_name.toLowerCase().includes(query) ||
      (feedback.what_went_well && feedback.what_went_well.toLowerCase().includes(query)) ||
      (feedback.what_could_improve && feedback.what_could_improve.toLowerCase().includes(query))
    );
  });

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const RatingDisplay = ({ value }: { value: number | null }) => {
    if (!value) return <span className="text-gray-400">N/A</span>;
    
    return (
      <div className="flex items-center space-x-1">
        <Star className={`h-4 w-4 fill-current ${getRatingColor(value)}`} />
        <span className={`font-medium ${getRatingColor(value)}`}>{value}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-forest-800 mb-2">
            Feedback Moderation
          </h1>
          <p className="text-forest-600">
            Review and moderate event feedback before making it public
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-forest-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex space-x-2 w-full md:w-auto">
              {[
                { key: 'pending', label: 'Pending Review', icon: Clock },
                { key: 'approved', label: 'Approved', icon: CheckCircle },
                { key: 'all', label: 'All Feedback', icon: MessageSquare }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === key
                      ? 'bg-forest-600 text-white'
                      : 'bg-forest-100 text-forest-700 hover:bg-forest-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search feedback..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600"></div>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-forest-100 p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback found</h3>
            <p className="text-gray-500">
              {filter === 'pending' 
                ? 'No feedback awaiting moderation' 
                : 'No feedback matches your criteria'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredFeedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="bg-white rounded-xl shadow-sm border border-forest-100 p-6 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-forest-800 mb-1">
                      {feedback.events.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(feedback.events.date).toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{feedback.profiles.full_name}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {feedback.is_public ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Eye className="h-3 w-3 mr-1" />
                        Public
                      </span>
                    ) : feedback.moderated_at ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Ratings */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Overall</p>
                    <RatingDisplay value={feedback.overall_rating} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Content</p>
                    <RatingDisplay value={feedback.content_rating} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Facilitator</p>
                    <RatingDisplay value={feedback.facilitator_rating} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Venue</p>
                    <RatingDisplay value={feedback.venue_rating} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Value</p>
                    <RatingDisplay value={feedback.value_rating} />
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center space-x-4 mb-4 text-sm">
                  {feedback.would_recommend !== null && (
                    <span className={`flex items-center space-x-1 ${
                      feedback.would_recommend ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <ThumbsUp className={`h-4 w-4 ${!feedback.would_recommend ? 'rotate-180' : ''}`} />
                      <span>{feedback.would_recommend ? 'Would Recommend' : 'Would Not Recommend'}</span>
                    </span>
                  )}
                  {feedback.learned_something_new && (
                    <span className="text-blue-600">📚 Learned Something New</span>
                  )}
                  {feedback.felt_welcomed && (
                    <span className="text-purple-600">🤗 Felt Welcomed</span>
                  )}
                </div>

                {/* Written Feedback */}
                {(feedback.what_went_well || feedback.what_could_improve || feedback.additional_comments) && (
                  <div className="space-y-3 mb-4">
                    {feedback.what_went_well && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">What went well:</h4>
                        <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                          {feedback.what_went_well}
                        </p>
                      </div>
                    )}
                    {feedback.what_could_improve && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">What could improve:</h4>
                        <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                          {feedback.what_could_improve}
                        </p>
                      </div>
                    )}
                    {feedback.additional_comments && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Additional comments:</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          {feedback.additional_comments}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Moderation Notes */}
                {feedback.moderation_notes && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Moderation Notes:</p>
                    <p className="text-sm text-gray-600">{feedback.moderation_notes}</p>
                  </div>
                )}

                {/* Actions */}
                {!feedback.moderated_at && (
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setSelectedFeedback(feedback)}
                      className="px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors font-medium"
                    >
                      Review Feedback
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        {selectedFeedback && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSelectedFeedback(null)} />
              
              <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6">
                <h3 className="text-xl font-bold text-forest-800 mb-4">
                  Review Feedback
                </h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Event</p>
                    <p className="font-medium">{selectedFeedback.events.title}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Submitted by</p>
                    <p className="font-medium">{selectedFeedback.profiles.full_name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moderation Notes
                    </label>
                    <textarea
                      value={moderationNotes}
                      onChange={(e) => setModerationNotes(e.target.value)}
                      placeholder="Add notes about your moderation decision..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setSelectedFeedback(null);
                      setModerationNotes('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRejectFeedback(selectedFeedback.id)}
                    disabled={processing || !moderationNotes.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <XCircle className="h-4 w-4 inline mr-2" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproveFeedback(selectedFeedback.id)}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-4 w-4 inline mr-2" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackModerationDashboard;