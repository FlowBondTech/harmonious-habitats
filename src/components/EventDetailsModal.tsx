import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Star, 
  Badge, 
  Heart, 
  Share2, 
  MessageCircle, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  User,
  Globe,
  Zap
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase, Event } from '../lib/supabase';

interface EventDetailsModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onJoin?: (eventId: string) => void;
  onLeave?: (eventId: string) => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  isOpen,
  onClose,
  onJoin,
  onLeave
}) => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    if (event && user) {
      checkParticipationStatus();
      loadParticipants();
    }
  }, [event, user]);

  const checkParticipationStatus = async () => {
    if (!event || !user) return;

    try {
      const { data: participation } = await supabase
        .from('event_participants')
        .select('status')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .single();

      setHasJoined(!!participation);

      const { data: favorite } = await supabase
        .from('event_favorites')
        .select('*')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .single();

      setIsFavorited(!!favorite);
    } catch (error) {
      console.error('Error checking participation status:', error);
    }
  };

  const loadParticipants = async () => {
    if (!event) return;

    try {
      const { data } = await supabase
        .from('event_participants')
        .select(`
          *,
          user:profiles!event_participants_user_id_fkey(id, full_name, avatar_url, verified)
        `)
        .eq('event_id', event.id)
        .eq('status', 'confirmed');

      setParticipants(data || []);
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const handleJoinEvent = async () => {
    if (!event || !user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: joinError } = await supabase
        .from('event_participants')
        .insert([{
          event_id: event.id,
          user_id: user.id,
          status: 'confirmed'
        }]);

      if (joinError) {
        if (joinError.code === '23505') {
          setError('You have already joined this event');
        } else {
          throw joinError;
        }
      } else {
        setHasJoined(true);
        setSuccess('Successfully joined the event!');
        onJoin?.(event.id);
        await loadParticipants();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to join event');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveEvent = async () => {
    if (!event || !user) return;

    setLoading(true);
    setError(null);

    try {
      const { error: leaveError } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', event.id)
        .eq('user_id', user.id);

      if (leaveError) {
        throw leaveError;
      } else {
        setHasJoined(false);
        setSuccess('You have left the event');
        onLeave?.(event.id);
        await loadParticipants();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to leave event');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!event || !user) return;

    try {
      if (isFavorited) {
        await supabase
          .from('event_favorites')
          .delete()
          .eq('event_id', event.id)
          .eq('user_id', user.id);
        setIsFavorited(false);
      } else {
        await supabase
          .from('event_favorites')
          .insert([{
            event_id: event.id,
            user_id: user.id
          }]);
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const formatEventTime = (date: string, startTime: string, endTime: string) => {
    const eventDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateString = '';
    if (eventDate.toDateString() === today.toDateString()) {
      dateString = 'Today';
    } else if (eventDate.toDateString() === tomorrow.toDateString()) {
      dateString = 'Tomorrow';
    } else {
      dateString = eventDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      });
    }

    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    return `${dateString}, ${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'virtual':
        return <Globe className="h-4 w-4" />;
      case 'global_physical':
        return <Zap className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'virtual':
        return 'Virtual Event';
      case 'global_physical':
        return 'Global Physical';
      default:
        return 'Local Event';
    }
  };

  if (!isOpen || !event) return null;

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
          {/* Header Image */}
          <div className="relative h-64 sm:h-80">
            <img 
              src={event.image_url || 'https://images.pexels.com/photos/3822647/pexels-photo-3822647.jpeg?auto=compress&cs=tinysrgb&w=800'} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Event Type Badge */}
            <div className="absolute top-4 left-4">
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
                {getEventTypeIcon(event.event_type)}
                <span className="text-sm font-medium">{getEventTypeLabel(event.event_type)}</span>
              </div>
            </div>

            {/* Title Overlay */}
            <div className="absolute bottom-6 left-6 right-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{event.title}</h1>
              <div className="flex items-center space-x-4 text-white/90">
                <div className="flex items-center space-x-2">
                  <img
                    src={event.organizer?.avatar_url || "https://images.pexels.com/photos/3772622/pexels-photo-3772622.jpeg?auto=compress&cs=tinysrgb&w=100"}
                    alt={event.organizer?.full_name || 'Organizer'}
                    className="w-8 h-8 rounded-full object-cover border-2 border-white/50"
                  />
                  <span className="font-medium">{event.organizer?.full_name || 'Community Organizer'}</span>
                  {event.organizer?.verified && (
                    <Badge className="h-4 w-4 text-white" />
                  )}
                </div>
                {event.verified && (
                  <div className="flex items-center space-x-1 bg-green-500/20 backdrop-blur-sm rounded-full px-2 py-1">
                    <CheckCircle className="h-4 w-4 text-green-300" />
                    <span className="text-xs font-medium">Verified</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8">
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Event Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-4 bg-forest-50 rounded-xl">
                    <Calendar className="h-5 w-5 text-forest-600" />
                    <div>
                      <p className="text-sm text-forest-600">Date & Time</p>
                      <p className="font-semibold text-forest-800">
                        {formatEventTime(event.date, event.start_time, event.end_time)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-forest-50 rounded-xl">
                    <MapPin className="h-5 w-5 text-forest-600" />
                    <div>
                      <p className="text-sm text-forest-600">Location</p>
                      <p className="font-semibold text-forest-800">{event.location_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-forest-50 rounded-xl">
                    <Users className="h-5 w-5 text-forest-600" />
                    <div>
                      <p className="text-sm text-forest-600">Participants</p>
                      <p className="font-semibold text-forest-800">
                        {participants.length}/{event.capacity}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-forest-50 rounded-xl">
                    <Star className="h-5 w-5 text-forest-600" />
                    <div>
                      <p className="text-sm text-forest-600">Skill Level</p>
                      <p className="font-semibold text-forest-800 capitalize">{event.skill_level}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {event.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-forest-800 mb-3">About This Event</h3>
                    <p className="text-forest-600 leading-relaxed">{event.description}</p>
                  </div>
                )}

                {/* Materials Needed */}
                {event.materials_needed && event.materials_needed.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-forest-800 mb-3">What to Bring</h3>
                    <div className="flex flex-wrap gap-2">
                      {event.materials_needed.map((material, index) => (
                        <span
                          key={index}
                          className="bg-earth-100 text-earth-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {material}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Participants List */}
                {participants.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-forest-800 mb-3">
                      Participants ({participants.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {participants.slice(0, 6).map((participant) => (
                        <div key={participant.user_id} className="flex items-center space-x-3 p-3 bg-forest-50 rounded-lg">
                          <img
                            src={participant.user?.avatar_url || "https://images.pexels.com/photos/3772622/pexels-photo-3772622.jpeg?auto=compress&cs=tinysrgb&w=100"}
                            alt={participant.user?.full_name || 'Participant'}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-forest-800 truncate">
                              {participant.user?.full_name || 'Community Member'}
                            </p>
                            <p className="text-sm text-forest-600">Confirmed</p>
                          </div>
                          {participant.user?.verified && (
                            <Badge className="h-4 w-4 text-forest-600" />
                          )}
                        </div>
                      ))}
                      {participants.length > 6 && (
                        <div className="flex items-center justify-center p-3 bg-forest-50 rounded-lg border-2 border-dashed border-forest-200">
                          <p className="text-sm text-forest-600">
                            +{participants.length - 6} more participants
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Action Buttons */}
                <div className="space-y-3">
                  {user ? (
                    <>
                      {!hasJoined ? (
                        <button
                          onClick={handleJoinEvent}
                          disabled={loading || participants.length >= event.capacity}
                          className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-sm hover:shadow-md ${
                            participants.length >= event.capacity
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-forest-600 to-forest-700 hover:from-forest-700 hover:to-forest-800 text-white'
                          }`}
                        >
                          {loading ? (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Joining...</span>
                            </div>
                          ) : participants.length >= event.capacity ? (
                            'Event Full'
                          ) : (
                            'Join Event'
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={handleLeaveEvent}
                          disabled={loading}
                          className="w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 bg-red-600 hover:bg-red-700 text-white"
                        >
                          {loading ? 'Leaving...' : 'Leave Event'}
                        </button>
                      )}
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={toggleFavorite}
                          className={`flex-1 py-2 px-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2 ${
                            isFavorited
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-forest-100 text-forest-700 hover:bg-forest-200'
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
                          <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
                        </button>
                        
                        <button className="flex-1 py-2 px-4 rounded-xl font-medium bg-forest-100 text-forest-700 hover:bg-forest-200 transition-colors flex items-center justify-center space-x-2">
                          <Share2 className="h-4 w-4" />
                          <span>Share</span>
                        </button>
                      </div>
                      
                      <button className="w-full py-2 px-4 rounded-xl font-medium bg-earth-100 text-earth-700 hover:bg-earth-200 transition-colors flex items-center justify-center space-x-2">
                        <MessageCircle className="h-4 w-4" />
                        <span>Message Organizer</span>
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4 bg-forest-50 rounded-xl">
                      <p className="text-forest-600 mb-3">Sign in to join this event</p>
                      <button className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        Sign In
                      </button>
                    </div>
                  )}
                </div>

                {/* Event Info */}
                <div className="bg-forest-50 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-forest-800">Event Information</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-forest-600">Category:</span>
                      <span className="font-medium text-forest-800">{event.category}</span>
                    </div>
                    
                    {event.donation_suggested && (
                      <div className="flex justify-between">
                        <span className="text-forest-600">Suggested Donation:</span>
                        <span className="font-medium text-earth-600">{event.donation_suggested}</span>
                      </div>
                    )}
                    
                    {event.is_recurring && (
                      <div className="flex justify-between">
                        <span className="text-forest-600">Recurring:</span>
                        <span className="font-medium text-forest-800 capitalize">
                          {event.recurrence_pattern || 'Yes'}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-forest-600">Status:</span>
                      <span className="font-medium text-green-600 capitalize">{event.status}</span>
                    </div>
                  </div>
                </div>

                {/* Safety Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800 mb-1">Community Safety</h4>
                      <p className="text-sm text-blue-600">
                        All events are community-organized. Please use your best judgment and follow local safety guidelines.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;