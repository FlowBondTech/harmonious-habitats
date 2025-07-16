import React from 'react';
import { useState, useEffect } from 'react';
import { MapPin, Clock, Users, Heart, Star, Badge, BookmarkPlus, Share2 } from 'lucide-react';
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
  const [isBookmarked, setIsBookmarked] = useState(false);
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
    'Gardening': 'bg-gradient-to-r from-green-100 to-green-200 text-green-800',
    'Yoga': 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800',
    'Cooking': 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800',
    'Art': 'bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800',
    'Healing': 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800',
    'Music': 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800',
  };

  const formatEventTime = (date: string, startTime: string, endTime: string) => {
    const eventDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let dateStr = '';
    if (eventDate.toDateString() === today.toDateString()) {
      dateStr = 'Today';
    } else if (eventDate.toDateString() === tomorrow.toDateString()) {
      dateStr = 'Tomorrow';
    } else {
      dateStr = eventDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    return `${dateStr}, ${startTime}${endTime ? ` - ${endTime}` : ''}`;
  };

  const handleJoinEvent = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user || isJoining) return;

    setIsJoining(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('event_participants')
        .insert([
          {
            event_id: event.id,
            user_id: user.id,
            status: 'confirmed'
          }
        ]);

      if (error) throw error;

      setHasJoined(true);
      setSuccess('Successfully joined the event!');
      onUpdate?.();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to join event');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveEvent = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user || isJoining) return;

    setIsJoining(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', event.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setHasJoined(false);
      setSuccess('You have left the event');
      onUpdate?.();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to leave event');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsJoining(false);
    }
  };

  const handleCardClick = () => {
    setShowDetailsModal(true);
  };

  const handleModalUpdate = () => {
    checkParticipationStatus();
    onUpdate?.();
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    // Add bookmark functionality here
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Join me at "${event.title}" in our community!`,
          url: window.location.origin
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  return (
    <>
      <div 
        className="card-interactive group overflow-hidden gpu-accelerated"
        onClick={handleCardClick}
      >
        {/* Event Image */}
        <div className="relative overflow-hidden">
          <img 
            src={event.image_url || 'https://images.pexels.com/photos/3822647/pexels-photo-3822647.jpeg?auto=compress&cs=tinysrgb&w=600'} 
            alt={event.title}
            className="w-full h-48 sm:h-52 lg:h-56 object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Top Labels */}
          <div className="absolute top-3 left-3 flex items-center space-x-2">
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/20 shadow-lg ${categoryColors[event.category] || 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'}`}>
              {event.category}
            </span>
            {event.verified && (
              <div className="bg-gradient-to-r from-forest-600 to-forest-700 text-white p-2 rounded-full backdrop-blur-sm shadow-lg">
                <Badge className="h-3 w-3" />
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
            <button 
              onClick={handleBookmark}
              className={`glass p-2.5 rounded-full hover:scale-110 transition-all duration-200 shadow-lg ${isBookmarked ? 'bg-earth-500 text-white' : 'text-forest-600'}`}
            >
              <BookmarkPlus className="h-4 w-4" />
            </button>
            <button 
              onClick={handleShare}
              className="glass p-2.5 rounded-full hover:scale-110 transition-all duration-200 shadow-lg text-forest-600"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button 
              onClick={handleBookmark}
              className={`glass p-2.5 rounded-full hover:scale-110 transition-all duration-200 shadow-lg ${isBookmarked ? 'bg-red-500 text-white' : 'text-forest-600'}`}
            >
              <Heart className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Card Content */}
        <div className="p-5 sm:p-6">
          {/* Event Title & Organizer */}
          <div className="mb-4">
            <h3 className="heading-md text-forest-800 mb-2 line-clamp-2 group-hover:text-forest-900 transition-colors">
              {event.title}
            </h3>
            <div className="flex items-center text-forest-600">
              <Star className="h-4 w-4 mr-1.5 text-earth-400 fill-current" />
              <span className="body-sm font-medium">{event.organizer?.full_name || 'Community Organizer'}</span>
            </div>
          </div>
          
          {/* Event Details */}
          <div className="space-y-3 mb-5">
            <div className="flex items-center text-forest-600 group/detail hover:text-forest-700 transition-colors">
              <Clock className="h-4 w-4 mr-2.5 text-forest-500 group-hover/detail:text-forest-600 transition-colors" />
              <span className="body-sm font-medium">
                {formatEventTime(event.date, event.start_time, event.end_time)}
              </span>
            </div>
            <div className="flex items-center text-forest-600 group/detail hover:text-forest-700 transition-colors">
              <MapPin className="h-4 w-4 mr-2.5 text-forest-500 group-hover/detail:text-forest-600 transition-colors" />
              <span className="body-sm font-medium truncate">{event.location_name}</span>
            </div>
            <div className="flex items-center text-forest-600 group/detail hover:text-forest-700 transition-colors">
              <Users className="h-4 w-4 mr-2.5 text-forest-500 group-hover/detail:text-forest-600 transition-colors" />
              <span className="body-sm font-medium">
                {event.participants?.length || 0}/{event.capacity} participants
              </span>
            </div>
          </div>
          
          {/* Event Meta */}
          <div className="flex items-center justify-between mb-5 text-sm">
            <div className="flex items-center space-x-4">
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
          </div>
          
          {/* Status Messages */}
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 animate-fade-in-up">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600 animate-fade-in-up">
              {success}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="space-y-3">
            {!hasJoined ? (
              <button 
                onClick={handleJoinEvent}
                disabled={isJoining || !user}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-sm hover:shadow-md ${
                  !user
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'btn-primary'
                }`}
              >
                {isJoining ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="loading-spinner" />
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
                disabled={isJoining}
                className="w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white transform hover:scale-[1.02] shadow-sm hover:shadow-md"
              >
                {isJoining ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="loading-spinner" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Joined! (Click to Leave)'
                )}
              </button>
            )}
            
            {showManagement && user?.id === event.organizer_id && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowManagementModal(true);
                }}
                className="w-full btn-secondary py-3"
              >
                Manage Event
              </button>
            )}
          </div>
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