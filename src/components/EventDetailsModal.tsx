import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
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
  Zap,
  Video,
  Tag,
  Book,
  Package,
  Settings
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase, Event, EventParticipant, EventReview } from '../lib/supabase';
import EventRegistrationModal from './EventRegistrationModal';
import SpaceOwnerSignoffModal from './SpaceOwnerSignoffModal';
import EventManagementModal from './EventManagementModal';
import Avatar from './Avatar';
import { getPractitionerRoleLabel, getRoleIcon } from '../utils/practitionerRoles';

interface EventDetailsModalProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  onJoin?: (eventId: string) => void;
  onLeave?: (eventId: string) => void;
  onUpdate?: () => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  isOpen,
  onClose,
  onJoin,
  onLeave,
  onUpdate
}) => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [showSignoffModal, setShowSignoffModal] = useState(false);
  const [isSpaceOwner, setIsSpaceOwner] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);

  useEffect(() => {
    if (event?.id && user?.id) {
      checkParticipationStatus();
      loadParticipants();
    }
  }, [event?.id, user?.id]);

  const checkParticipationStatus = async () => {
    if (!event?.id || !user?.id) return;

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
      // Expected error when user hasn't joined or favorited
    }
  };

  const loadParticipants = async () => {
    if (!event?.id) return;

    try {
      const { data } = await supabase
        .from('event_participants')
        .select(`
          *,
          user:profiles!event_participants_user_id_fkey(id, full_name, avatar_url, verified)
        `)
        .eq('event_id', event.id)
        .eq('status', 'registered');

      setParticipants(data || []);
    } catch (error) {
      // Error loading participants
    }
  };

  const loadPractitioners = async () => {
    if (!event?.id) return;

    try {
      const { data } = await supabase
        .from('event_practitioners')
        .select(`
          *,
          practitioner:profiles!event_practitioners_practitioner_id_fkey(
            id,
            full_name,
            avatar_url,
            is_facilitator
          )
        `)
        .eq('event_id', event.id)
        .order('role');

      const formattedData = data?.map(item => ({
        ...item,
        full_name: item.practitioner?.full_name,
        avatar_url: item.practitioner?.avatar_url,
        is_facilitator: item.practitioner?.is_facilitator,
        // facilitator_verified removed
      })) || [];

      setPractitioners(formattedData);
    } catch (error) {
      // Error loading practitioners
    }
  };

  const checkSpaceOwnership = async () => {
    if (!event?.space_id || !user?.id) return;

    try {
      const { data } = await supabase
        .from('spaces')
        .select('owner_id')
        .eq('id', event.space_id)
        .single();

      setIsSpaceOwner(data?.owner_id === user.id);
    } catch (error) {
      setIsSpaceOwner(false);
    }
  };

  useEffect(() => {
    if (event?.id) {
      loadPractitioners();
      checkSpaceOwnership();
    }
  }, [event?.id, user?.id]);

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
          status: 'registered'
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

      // Notify parent component to refresh favorites list
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      // Error toggling favorite
    }
  };

  const handleMessageOrganizer = async () => {
    if (!event || !user || !event.organizer_id) return;

    // Don't allow messaging yourself
    if (event.organizer_id === user.id) {
      setError('You cannot message yourself');
      return;
    }

    try {
      setLoading(true);

      // Create or get conversation with the organizer
      const { data: conversationId, error: convError } = await supabase
        .rpc('create_or_get_direct_conversation', {
          p_user_a: user.id,
          p_user_b: event.organizer_id
        });

      if (convError) throw convError;

      // Close this modal and navigate to messages
      onClose();
      navigate(`/messages?conversation=${conversationId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to open conversation');
    } finally {
      setLoading(false);
    }
  };

  const formatEventTime = (date: string, startTime: string, endTime: string) => {
    if (!date) return 'Date TBA';  // Handle null/undefined date
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
      if (!time) return 'TBA';  // Handle null/undefined time
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

  return ReactDOM.createPortal(
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
            
            {/* Manage Event Button (for organizers) */}
            {user?.id === event.organizer_id && (
              <button
                onClick={() => setShowManagementModal(true)}
                className="absolute top-4 right-16 p-2 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-lg transition-colors"
                title="Manage Event"
              >
                <Settings className="h-5 w-5" />
              </button>
            )}

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

                {/* Event Practitioners */}
                {practitioners.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-forest-800 mb-3 flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Event Team ({practitioners.length})</span>
                    </h3>
                    <div className="space-y-3">
                      {practitioners.map((practitioner) => (
                        <div key={practitioner.practitioner_id} className="flex items-center justify-between p-4 bg-gradient-to-r from-forest-50 to-earth-50 rounded-lg border border-forest-200">
                          <div className="flex items-center space-x-3">
                            <Avatar
                              name={practitioner.full_name}
                              imageUrl={practitioner.avatar_url}
                              size="md"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-forest-900">
                                  {practitioner.full_name}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  practitioner.role === 'activity_lead'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : practitioner.role === 'coordinator'
                                    ? 'bg-purple-100 text-purple-800'
                                    : practitioner.role === 'preparer' || practitioner.role === 'materials_manager'
                                    ? 'bg-blue-100 text-blue-800'
                                    : practitioner.role === 'greeter' || practitioner.role === 'food_service'
                                    ? 'bg-green-100 text-green-800'
                                    : practitioner.role === 'tech_support'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : practitioner.role === 'cleaner' || practitioner.role === 'post_event_cleanup'
                                    ? 'bg-teal-100 text-teal-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {getRoleIcon(practitioner.role)} {getPractitionerRoleLabel(practitioner.role)}
                                </span>
                                {practitioner.is_confirmed && (
                                  <span className="text-xs text-green-600 flex items-center">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Confirmed
                                  </span>
                                )}
                              </div>
                              {practitioner.responsibilities && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {practitioner.responsibilities}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        Each practitioner has a specific role to ensure the event runs smoothly. Large events can have 10+ team members with different responsibilities.
                      </p>
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
                          className={`w-full btn-primary btn-lg focus-ring ${
                            participants.length >= event.capacity
                              ? '!bg-gray-300 !text-gray-500 !cursor-not-allowed'
                              : ''
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
                          className="w-full btn-primary btn-lg focus-ring !bg-red-600 hover:!bg-red-700"
                        >
                          {loading ? 'Leaving...' : 'Leave Event'}
                        </button>
                      )}

                      {/* Check-In Attendees Button (for organizers) */}
                      {user?.id === event.organizer_id && (
                        <button
                          onClick={() => navigate(`/events/${event.id}/checkin`)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                        >
                          <Users className="h-5 w-5" />
                          <span>Check-In Attendees</span>
                        </button>
                      )}

                      <div className="flex space-x-2">
                        <button
                          onClick={toggleFavorite}
                          className={`flex-1 btn-outline btn-sm focus-ring flex items-center justify-center space-x-2 ${
                            isFavorited
                              ? '!bg-red-100 !text-red-700 hover:!bg-red-200'
                              : '!bg-forest-100 !text-forest-700 hover:!bg-forest-200'
                          }`}
                        >
                          <Heart className={`icon-sm ${isFavorited ? 'fill-current' : ''}`} />
                          <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
                        </button>

                        <button className="flex-1 btn-outline btn-sm focus-ring !bg-forest-100 !text-forest-700 hover:!bg-forest-200 flex items-center justify-center space-x-2">
                          <Share2 className="icon-sm" />
                          <span>Share</span>
                        </button>
                      </div>

                      {/* Space Owner Sign-off Button */}
                      {isSpaceOwner && !event.space_owner_signoff && (
                        <button
                          onClick={() => setShowSignoffModal(true)}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-6 rounded-lg font-medium transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                        >
                          <CheckCircle className="h-5 w-5" />
                          <span>Sign Off Event Completion</span>
                        </button>
                      )}

                      {/* Event Completed Badge */}
                      {event.space_owner_signoff && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                            <div>
                              <p className="font-semibold text-green-900">Event Completed</p>
                              <p className="text-sm text-green-700 mt-1">
                                Space owner has signed off on this event
                              </p>
                              {event.space_owner_notes && (
                                <p className="text-sm text-green-600 mt-2 italic">
                                  "{event.space_owner_notes}"
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleMessageOrganizer}
                        disabled={loading || event.organizer_id === user?.id}
                        className="w-full btn-outline btn-sm focus-ring !bg-earth-100 !text-earth-700 hover:!bg-earth-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MessageCircle className="icon-sm" />
                        <span>{event.organizer_id === user?.id ? 'You are the organizer' : 'Message Organizer'}</span>
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4 bg-forest-50 rounded-xl">
                      <p className="text-forest-600 mb-3">Sign in to join this event</p>
                      <button className="btn-primary btn-md focus-ring">
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

      {/* Event Management Modal */}
      {showManagementModal && (
        <EventManagementModal
          event={event}
          isOpen={showManagementModal}
          onClose={() => setShowManagementModal(false)}
          onUpdate={() => {
            // Reload event data after updates
            loadParticipants();
            loadPractitioners();
          }}
        />
      )}
    </div>,
    document.body
  );
};

export default EventDetailsModal;