import React from 'react';
import { useState } from 'react';
import { MapPin, Clock, Users, Heart, Star, Badge } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase, Event } from '../lib/supabase';

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const { user } = useAuthContext();
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleJoinEvent = async () => {
    if (!user) {
      setError('Please sign in to join events');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const { error: joinError } = await supabase
        .from('event_participants')
        .insert([{
          event_id: event.id,
          user_id: user.id,
          status: 'confirmed'
        }]);

      if (joinError) {
        if (joinError.code === '23505') { // Unique constraint violation
          setError('You have already joined this event');
        } else {
          throw joinError;
        }
      } else {
        setHasJoined(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to join event');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] overflow-hidden group border border-forest-50">
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
          <Heart className="h-4 w-4 text-forest-600" />
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
        
        <button 
          onClick={handleJoinEvent}
          disabled={isJoining || hasJoined || !user}
          className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-sm hover:shadow-md ${
            hasJoined 
              ? 'bg-green-600 text-white cursor-default'
              : !user
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-forest-600 to-forest-700 hover:from-forest-700 hover:to-forest-800 text-white'
          }`}
        >
          {isJoining ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Joining...</span>
            </div>
          ) : hasJoined ? (
            'Joined!'
          ) : !user ? (
            'Sign in to Join'
          ) : (
            'Join Event'
          )}
        </button>
      </div>
    </div>
  );
};

export default EventCard;