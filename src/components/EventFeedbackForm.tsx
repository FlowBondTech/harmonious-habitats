import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Star, 
  ThumbsUp, 
  Users, 
  Lightbulb, 
  MessageSquare,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface EventDetails {
  id: string;
  title: string;
  organizer_id: string;
  date: string;
  start_time: string;
  end_time: string;
  category: string;
}

interface FeedbackFormData {
  overall_rating: number;
  would_recommend: boolean | null;
  content_rating: number | null;
  facilitator_rating: number | null;
  venue_rating: number | null;
  value_rating: number | null;
  what_went_well: string;
  what_could_improve: string;
  additional_comments: string;
  learned_something_new: boolean | null;
  felt_welcomed: boolean | null;
  clear_instructions: boolean | null;
  appropriate_skill_level: boolean | null;
}

const EventFeedbackForm: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState<FeedbackFormData>({
    overall_rating: 0,
    would_recommend: null,
    content_rating: null,
    facilitator_rating: null,
    venue_rating: null,
    value_rating: null,
    what_went_well: '',
    what_could_improve: '',
    additional_comments: '',
    learned_something_new: null,
    felt_welcomed: null,
    clear_instructions: null,
    appropriate_skill_level: null
  });

  useEffect(() => {
    loadEventAndCheckEligibility();
  }, [eventId, user]);

  const loadEventAndCheckEligibility = async () => {
    if (!eventId || !user) {
      navigate('/');
      return;
    }

    setLoading(true);
    try {
      // Load event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError || !eventData) {
        console.error('Error loading event:', eventError);
        navigate('/');
        return;
      }

      setEvent(eventData);

      // Check if user attended the event
      const { data: participantData, error: participantError } = await supabase
        .from('event_participants')
        .select('status')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      if (participantError || !participantData || participantData.status !== 'attended') {
        console.error('User did not attend this event');
        navigate('/');
        return;
      }

      // Check if feedback already submitted
      const { data: existingFeedback } = await supabase
        .from('event_feedback')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      if (existingFeedback) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (field: keyof FeedbackFormData, rating: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: rating
    }));
  };

  const handleBooleanToggle = (field: keyof FeedbackFormData, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field] === value ? null : value
    }));
  };

  const handleTextChange = (field: keyof FeedbackFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !eventId || formData.overall_rating === 0) {
      return;
    }

    setSubmitting(true);
    try {
      const feedbackData = {
        event_id: eventId,
        user_id: user.id,
        overall_rating: formData.overall_rating,
        would_recommend: formData.would_recommend,
        content_rating: formData.content_rating,
        facilitator_rating: formData.facilitator_rating,
        venue_rating: formData.venue_rating,
        value_rating: formData.value_rating,
        what_went_well: formData.what_went_well.trim() || null,
        what_could_improve: formData.what_could_improve.trim() || null,
        additional_comments: formData.additional_comments.trim() || null,
        learned_something_new: formData.learned_something_new,
        felt_welcomed: formData.felt_welcomed,
        clear_instructions: formData.clear_instructions,
        appropriate_skill_level: formData.appropriate_skill_level,
        is_public: false // Initially private for moderation
      };

      const { error } = await supabase
        .from('event_feedback')
        .insert(feedbackData);

      if (error) {
        console.error('Error submitting feedback:', error);
        return;
      }

      // Mark feedback notification as read if it exists
      const { data: notifications } = await supabase
        .from('notifications')
        .select('id')
        .eq('type', 'feedback_request')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .is('read_at', null);

      if (notifications && notifications.length > 0) {
        await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .in('id', notifications.map(n => n.id));
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const RatingStars = ({ 
    value, 
    onChange, 
    size = 'large' 
  }: { 
    value: number | null; 
    onChange: (rating: number) => void; 
    size?: 'small' | 'large';
  }) => {
    const starSize = size === 'small' ? 'h-5 w-5' : 'h-8 w-8';
    
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`${starSize} ${
                value && star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600"></div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-forest-800 mb-3">
            Thank You for Your Feedback!
          </h2>
          <p className="text-forest-600 mb-6">
            Your feedback helps us improve future events and create better experiences for our community.
          </p>
          <button
            onClick={() => navigate('/events')}
            className="w-full bg-forest-600 text-white px-6 py-3 rounded-xl hover:bg-forest-700 transition-colors font-medium"
          >
            Explore More Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-forest-600 to-forest-700 p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold">Event Feedback</h1>
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-forest-100">Help us improve by sharing your experience</p>
            <div className="mt-4">
              <h2 className="text-lg font-semibold">{event.title}</h2>
              <p className="text-sm text-forest-100">
                {new Date(event.date).toLocaleDateString()} • {event.start_time} - {event.end_time}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Overall Rating - Required */}
            <div className="bg-forest-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-forest-800 mb-4">
                Overall Experience *
              </h3>
              <div className="flex flex-col items-center space-y-3">
                <RatingStars
                  value={formData.overall_rating}
                  onChange={(rating) => handleRatingClick('overall_rating', rating)}
                />
                <p className="text-sm text-forest-600">
                  {formData.overall_rating === 0 && 'Please rate your experience'}
                  {formData.overall_rating === 1 && 'Poor'}
                  {formData.overall_rating === 2 && 'Fair'}
                  {formData.overall_rating === 3 && 'Good'}
                  {formData.overall_rating === 4 && 'Very Good'}
                  {formData.overall_rating === 5 && 'Excellent'}
                </p>
              </div>
            </div>

            {/* Would Recommend */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-forest-800">
                Would you recommend this event to others?
              </h3>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => handleBooleanToggle('would_recommend', true)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                    formData.would_recommend === true
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <ThumbsUp className="h-5 w-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">Yes</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBooleanToggle('would_recommend', false)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                    formData.would_recommend === false
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <ThumbsUp className="h-5 w-5 mx-auto mb-1 rotate-180" />
                  <span className="text-sm font-medium">No</span>
                </button>
              </div>
            </div>

            {/* Quick Feedback */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-forest-800">
                What went well?
              </h3>
              <textarea
                value={formData.what_went_well}
                onChange={(e) => handleTextChange('what_went_well', e.target.value)}
                placeholder="Share what you enjoyed about the event..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            {/* Additional Details Toggle */}
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between px-4 py-3 bg-forest-50 rounded-lg hover:bg-forest-100 transition-colors"
            >
              <span className="font-medium text-forest-700">
                {showDetails ? 'Hide' : 'Add'} More Details (Optional)
              </span>
              {showDetails ? (
                <ChevronUp className="h-5 w-5 text-forest-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-forest-600" />
              )}
            </button>

            {/* Detailed Feedback - Optional */}
            {showDetails && (
              <div className="space-y-6 pt-2">
                {/* Detailed Ratings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-forest-800">Rate specific aspects:</h4>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-forest-600">Content Quality</span>
                    <RatingStars
                      value={formData.content_rating}
                      onChange={(rating) => handleRatingClick('content_rating', rating)}
                      size="small"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-forest-600">Facilitator</span>
                    <RatingStars
                      value={formData.facilitator_rating}
                      onChange={(rating) => handleRatingClick('facilitator_rating', rating)}
                      size="small"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-forest-600">Venue/Setup</span>
                    <RatingStars
                      value={formData.venue_rating}
                      onChange={(rating) => handleRatingClick('venue_rating', rating)}
                      size="small"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-forest-600">Value for Time</span>
                    <RatingStars
                      value={formData.value_rating}
                      onChange={(rating) => handleRatingClick('value_rating', rating)}
                      size="small"
                    />
                  </div>
                </div>

                {/* Quick Questions */}
                <div className="space-y-3">
                  <h4 className="font-medium text-forest-800">Quick Questions:</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleBooleanToggle('learned_something_new', true)}
                      className={`p-3 rounded-lg border-2 text-sm transition-colors ${
                        formData.learned_something_new === true
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Lightbulb className="h-4 w-4 mx-auto mb-1" />
                      Learned Something New
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBooleanToggle('felt_welcomed', true)}
                      className={`p-3 rounded-lg border-2 text-sm transition-colors ${
                        formData.felt_welcomed === true
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Users className="h-4 w-4 mx-auto mb-1" />
                      Felt Welcomed
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBooleanToggle('clear_instructions', true)}
                      className={`p-3 rounded-lg border-2 text-sm transition-colors ${
                        formData.clear_instructions === true
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4 mx-auto mb-1" />
                      Clear Instructions
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBooleanToggle('appropriate_skill_level', true)}
                      className={`p-3 rounded-lg border-2 text-sm transition-colors ${
                        formData.appropriate_skill_level === true
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4 mx-auto mb-1" />
                      Right Skill Level
                    </button>
                  </div>
                </div>

                {/* Improvement Suggestions */}
                <div className="space-y-3">
                  <h4 className="font-medium text-forest-800">
                    What could be improved?
                  </h4>
                  <textarea
                    value={formData.what_could_improve}
                    onChange={(e) => handleTextChange('what_could_improve', e.target.value)}
                    placeholder="Share your suggestions..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>

                {/* Additional Comments */}
                <div className="space-y-3">
                  <h4 className="font-medium text-forest-800">
                    Any other comments?
                  </h4>
                  <textarea
                    value={formData.additional_comments}
                    onChange={(e) => handleTextChange('additional_comments', e.target.value)}
                    placeholder="Anything else you'd like to share..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || formData.overall_rating === 0}
              className="w-full bg-forest-600 text-white px-6 py-3 rounded-xl hover:bg-forest-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Your feedback will be reviewed by moderators before being made public.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventFeedbackForm;