import React from 'react';
import { useState, useEffect } from 'react';
import { MapPin, Clock, Users, Heart, Star, Badge } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase, Event } from '../lib/supabase';
import EventDetailsModal from './EventDetailsModal';
import EventManagementModal from './EventManagementModal';

interface EventCardProps {
  event: Event;
  showManagement?: boolean;
  onUpdate?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, showManagement = false, onUpdate }) => {
  const { user } = useAuthContext();
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);

  useEffect(() => {
    if (user) {
      checkParticipationStatus();
    }
  }, [user, event.id]);

  const checkParticipationStatus = async () => {
    if (!user) return;

    console.log("Checking participation status for event", event.id);
    try {
      const { data } = await supabase
        .from('event_participants')
        .select('status')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .single();

      console.log("Participation data:", data);
      if (data) {
        setHasJoined(true);
      }
    } catch (error: any) {
      // User hasn't joined - this is expected
    }
  };

  const categoryColors: { [key: string]: string } = {
    'Gardening': 'bg-green-100 text-green-800',
    'Yoga': 'bg-purple-100 text-purple-800',
    'Cooking': 'bg-orange-100 text-orange-800',
    'Art': 'bg-pink-100 text-pink-800',
    'Healing': 'bg-blue-100 text-blue-800',
    'Music': 'bg-indigo-100 text-indigo-800',
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
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }

    // Format times from 24h to 12h format
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    return `${dateString}, ${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const handleJoinEvent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setError('Please sign in to join events');
      return;
    }

    setIsJoining(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: joinError } = await supabase
        .from('event_participants')
        .insert([{
          event_id: event.id,
          user_id: user.id,
          status: 'confirmed',
          joined_at: new Date().toISOString()
        }]);

      if (joinError) {        
        if (joinError.code === '23505') { // Unique constraint violation
          setError('You have already joined this event');
        } else {
          throw joinError;
        }
      } else {
        setHasJoined(true);
        setSuccess('Successfully joined event!');
        
        // Create notification for event organizer
        await supabase
          .from('notifications')
          .insert([{
            user_id: event.organizer_id,
            type: 'event',
            title: 'New Participant',
            content: `${profile?.full_name || user.email} has joined your event "${event.title}"`,
            data: { event_id: event.id }
          }]);
          
        onUpdate?.();
      }
    } catch (err: any) {      
      setError(err.message || 'Failed to join event');
    } finally {
      setIsJoining(false);
    }
  };

  // Add method to leave event
  const handleLeaveEvent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !hasJoined) return;
    
    setIsJoining(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: leaveError } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', event.id)
        .eq('user_id', user.id);
        
      if (leaveError) throw leaveError;
      
      setHasJoined(false);
      setSuccess('Left the event successfully');
      onUpdate?.();
    } catch (err: any) {
      setError(err.message || 'Failed to leave event');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCardClick = () => {
    if (showManagement && user?.id === event.organizer_id) {
      setShowManagementModal(true);
    } else {
      setShowDetailsModal(true);
    }
  };

  const handleModalUpdate = () => {
    onUpdate?.();
    checkParticipationStatus();
  };

  return (
    <>
      <div 
        className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] overflow-hidden group border border-forest-50 cursor-pointer"
        tabIndex={0}
        role="article"
        aria-labelledby={`event-title-${event.id}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
        onClick={handleCardClick}
      >
      <div className="relative">
        <img 
          src={event.image_url || 'https://images.pexels.com/photos/3822647/pexels-photo-3822647.jpeg?auto=compress&cs=tinysrgb&w=400'} 
          alt={event.title}
          className="w-full h-48 sm:h-52 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute top-3 left-3 flex items-center space-x-2">
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${categoryColors[event.category] || 'bg-gray-100 text-gray-800'}`}>
            {event.category}
          </span>
          {event.verified && (
            <div className="bg-forest-600 text-white p-1.5 rounded-full backdrop-blur-sm">
              <Badge className="h-3 w-3" />
            </div>
          )}
        </div>
        
        <button className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2.5 rounded-full hover:bg-white hover:scale-110 transition-all duration-200 shadow-sm">
          </div>
          
          <h3 id={`event-title-${event.id}`} className="sr-only">{event.title}</h3>
        </button>
      </div>
      
      <div className="p-5 sm:p-6">
        <h3 className="font-bold text-lg text-forest-800 mb-2 line-clamp-2 group-hover:text-forest-900 transition-colors">
          {event.title}
        </h3>
        <p className="text-forest-600 mb-4 flex items-center">
          <Star className="h-4 w-4 mr-1.5 text-earth-400 fill-current" />
          <span className="font-medium">{event.organizer?.full_name || 'Community Organizer'}</span>
        </p>
        
        <div className="space-y-2.5 mb-5">
          <div className="flex items-center text-forest-600">
            <Clock className="h-4 w-4 mr-2.5 text-forest-500" />
            <span className="text-sm font-medium">
              {formatEventTime(event.date, event.start_time, event.end_time)}
            </span>
          </div>
          <div className="flex items-center text-forest-600">
            <MapPin className="h-4 w-4 mr-2.5 text-forest-500" />
            <span className="text-sm font-medium truncate">{event.location_name}</span>
          </div>
          <div className="flex items-center text-forest-600">
            <Users className="h-4 w-4 mr-2.5 text-forest-500" />
            <span className="text-sm font-medium">
              {event.participants?.length || 0}/{event.capacity} participants
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-5 text-sm">
          <div>
            <span className="text-forest-500">Type: </span>
            <span className="font-semibold text-forest-800 capitalize">
              {event.event_type.replace('_', ' ')}
            </span>
          </div>
          <div>
            <span className="text-forest-500">Donation: </span>
            <span className="font-semibold text-earth-600">
              {event.donation_suggested || 'Free'}
            </span>
          </div>
        </div>
        
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-600">
            {success}
          </div>
        )}
        
        {!hasJoined ? (
          <button 
            onClick={handleJoinEvent}
            onKeyDown={(e) => e.stopPropagation()}
            disabled={isJoining || !user}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-sm hover:shadow-md ${
                !user
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-forest-600 to-forest-700 hover:from-forest-700 hover:to-forest-800 text-white'
            }`}
          >
            {isJoining ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Joining...</span>
              </div>
            ) : !user ? (
              'Sign in to Join'
            ) : (
              'Join Event'
            )}
          </button>
        ) : (
          <button 
            onClick={handleLeaveEvent}
            onKeyDown={(e) => e.stopPropagation()}
            disabled={isJoining}
            className="w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 bg-green-600 hover:bg-green-700 text-white"
          >
            {isJoining ? 'Processing...' : 'Joined! (Click to Leave)'}
          </button>
        )}
        
        {showManagement && user?.id === event.organizer_id && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowManagementModal(true);
            }}
            onKeyDown={(e) => e.stopPropagation()}
            className="w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-sm hover:shadow-md bg-gradient-to-r from-earth-500 to-earth-600 hover:from-earth-600 hover:to-earth-700 text-white mt-2"
        >
            Manage Event
        </button>
        )}
      </div>
      </div>

      {/* Modals */}
      <EventDetailsModal
        event={event}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onJoin={handleModalUpdate}
        onLeave={handleModalUpdate}
      />

      <EventManagementModal
        event={event}
        isOpen={showManagementModal}
        onClose={() => setShowManagementModal(false)}
        onUpdate={handleModalUpdate}
      />
    </>
  );
};

export default EventCard;