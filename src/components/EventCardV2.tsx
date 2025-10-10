import React from 'react';
import { Calendar, MapPin, Users, Clock, DollarSign, Star, Video, Globe, Tag } from 'lucide-react';
import { Event, EventParticipant } from '../lib/supabase';

interface EventCardV2Props {
  event: Event & {
    organizer?: {
      id: string;
      full_name: string;
      avatar_url?: string;
    };
    participants?: EventParticipant[];
    participant_count?: number;
  };
  onRegister?: (eventId: string) => void;
  onViewDetails?: (eventId: string) => void;
  isRegistered?: boolean;
  className?: string;
}

const EventCardV2: React.FC<EventCardV2Props> = ({
  event,
  onRegister,
  onViewDetails,
  isRegistered = false,
  className = ''
}) => {
  const eventDate = new Date(event.date + 'T' + event.start_time);
  const endTime = new Date(event.date + 'T' + event.end_time);
  const isUpcoming = eventDate > new Date();
  const isFull = event.capacity > 0 && (event.participant_count || 0) >= event.capacity;
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const getEventTypeIcon = () => {
    switch (event.event_type || 'local') {
      case 'virtual':
        return <Video className="h-4 w-4" />;
      case 'global_physical':
        return <Globe className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getExchangeText = () => {
    switch (event.exchange_type) {
      case 'free':
        return 'Free';
      case 'donation':
        return event.suggested_donation || 'Donation';
      case 'fixed':
        return event.suggested_donation || 'Fixed Price';
      case 'sliding_scale':
        return `$${event.minimum_donation || 0} - $${event.maximum_donation || '∞'}`;
      case 'barter':
        return event.suggested_donation || 'Exchange';
      default:
        return 'Free';
    }
  };

  const getSkillLevelColor = () => {
    switch (event.skill_level) {
      case 'beginner':
        return 'text-green-600 bg-green-50';
      case 'intermediate':
        return 'text-orange-600 bg-orange-50';
      case 'advanced':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-forest-600 bg-forest-50';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${className}`}>
      {/* Event Image or Category Color */}
      <div className={`h-48 bg-gradient-to-br ${
        event.image_url 
          ? '' 
          : 'from-forest-400 to-forest-600'
      } relative`}>
        {event.image_url ? (
          <img 
            src={event.image_url} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Calendar className="h-16 w-16 text-white/30" />
          </div>
        )}
        
        {/* Event Type Badge */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
          {getEventTypeIcon()}
          <span className="text-xs font-medium capitalize">
            {(event.event_type || 'local').replace('_', ' ')}
          </span>
        </div>

        {/* Status Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {event.featured && (
            <div className="bg-yellow-400/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
              <Star className="h-3 w-3" />
              <span className="text-xs font-medium">Featured</span>
            </div>
          )}
          {isFull && (
            <div className="bg-red-500/90 backdrop-blur-sm text-white rounded-full px-3 py-1 text-xs font-medium">
              Full
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Title and Category */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold text-forest-800 line-clamp-2">
              {event.title}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSkillLevelColor()}`}>
              {event.skill_level === 'all' ? 'All Levels' : event.skill_level}
            </span>
          </div>
          <p className="text-sm text-forest-600 capitalize">{event.category}</p>
        </div>

        {/* Date and Time */}
        <div className="flex items-center text-sm text-forest-600">
          <Calendar className="h-4 w-4 mr-2" />
          <span className="font-medium">
            {eventDate.toLocaleDateString('en-US', { 
              weekday: 'short',
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
          <Clock className="h-4 w-4 ml-4 mr-2" />
          <span>{formatTime(eventDate)} - {formatTime(endTime)}</span>
        </div>

        {/* Location */}
        <div className="flex items-start text-sm text-forest-600">
          {getEventTypeIcon()}
          <span className="ml-2 line-clamp-1">
            {event.location_name}
          </span>
        </div>

        {/* Organizer */}
        {event.organizer && (
          <div className="flex items-center space-x-2 text-sm">
            {event.organizer.avatar_url ? (
              <img 
                src={event.organizer.avatar_url} 
                alt={event.organizer.full_name}
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-forest-200 flex items-center justify-center">
                <span className="text-xs font-medium text-forest-700">
                  {event.organizer.full_name?.charAt(0) || '?'}
                </span>
              </div>
            )}
            <span className="text-forest-700">by {event.organizer.full_name}</span>
          </div>
        )}

        {/* Capacity and Price */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-forest-600">
            <Users className="h-4 w-4 mr-2" />
            <span>
              {event.participant_count || 0}
              {event.capacity > 0 && ` / ${event.capacity}`}
              {event.capacity === 0 && ' attending'}
            </span>
          </div>
          <div className="flex items-center text-forest-600">
            <DollarSign className="h-4 w-4 mr-1" />
            <span className="font-medium">{getExchangeText()}</span>
          </div>
        </div>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-forest-50 text-forest-700"
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </span>
            ))}
            {event.tags.length > 3 && (
              <span className="text-xs text-forest-600 ml-1">
                +{event.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(event.id)}
              className="flex-1 px-4 py-2 border border-forest-300 text-forest-700 rounded-lg hover:bg-forest-50 transition-colors text-sm font-medium"
            >
              View Details
            </button>
          )}
          {onRegister && isUpcoming && !isRegistered && (
            <button
              onClick={() => onRegister(event.id)}
              disabled={isFull && !event.waitlist_enabled}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                isFull && !event.waitlist_enabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-forest-600 hover:bg-forest-700 text-white'
              }`}
            >
              {isFull && event.waitlist_enabled ? 'Join Waitlist' : 'Register'}
            </button>
          )}
          {isRegistered && (
            <div className="flex-1 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium text-center">
              ✓ Registered
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCardV2;