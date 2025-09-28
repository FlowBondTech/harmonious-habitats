import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ChevronRight,
  Heart,
  Share2,
  Bookmark
} from 'lucide-react';
import { Event } from '../lib/supabase';
import { format } from 'date-fns';
import Avatar from './Avatar';

interface MobileEventCardProps {
  event: Event;
  onJoin?: () => void;
  onShare?: () => void;
  isJoined?: boolean;
}

const MobileEventCard: React.FC<MobileEventCardProps> = ({
  event,
  onJoin,
  onShare,
  isJoined = false
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch {
      return date;
    }
  };

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  const handleTouchStart = () => {
    setShowActions(true);
    setTimeout(() => setShowActions(false), 3000);
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all active:scale-[0.98] touch-manipulation"
      onTouchStart={handleTouchStart}
    >
      {/* Image Section */}
      {event.image_url && (
        <div className="relative h-48 bg-gradient-to-br from-forest-100 to-sage-100">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          {/* Floating Actions */}
          <div className={`absolute top-3 right-3 flex gap-2 transition-opacity ${
            showActions ? 'opacity-100' : 'opacity-0'
          }`}>
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsLiked(!isLiked);
              }}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg active:scale-95 transition-transform"
            >
              <Heart
                className={`h-5 w-5 transition-colors ${
                  isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'
                }`}
              />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsSaved(!isSaved);
              }}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg active:scale-95 transition-transform"
            >
              <Bookmark
                className={`h-5 w-5 transition-colors ${
                  isSaved ? 'fill-forest-600 text-forest-600' : 'text-gray-600'
                }`}
              />
            </button>
          </div>
          {/* Category Badge */}
          <div className="absolute bottom-3 left-3">
            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-forest-700 text-xs font-medium rounded-full">
              {event.category}
            </span>
          </div>
        </div>
      )}

      <Link to={`/events/${event.id}`} className="block p-4">
        {/* Title and Description */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">
            {event.title}
          </h3>
          {event.description && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {event.description}
            </p>
          )}
        </div>

        {/* Event Details */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
          </div>
          {event.location_name && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="truncate">{event.location_name}</span>
            </div>
          )}
        </div>

        {/* Organizer and Participants */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Avatar
              name={event.organizer?.full_name || 'Organizer'}
              imageUrl={event.organizer?.avatar_url}
              size="xs"
            />
            <span className="text-sm text-gray-600">
              {event.organizer?.full_name || 'Community Member'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{event.participant_count || 0}/{event.capacity}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onJoin && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onJoin();
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-colors active:scale-95 ${
                isJoined
                  ? 'bg-gray-100 text-gray-600'
                  : 'bg-forest-600 text-white active:bg-forest-700'
              }`}
            >
              {isJoined ? 'Joined' : 'Join Event'}
            </button>
          )}
          {onShare && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onShare();
              }}
              className="p-2.5 bg-gray-100 text-gray-600 rounded-xl active:scale-95 transition-transform"
            >
              <Share2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </Link>

      {/* View Details Indicator */}
      <div className="px-4 pb-3 -mt-1">
        <Link
          to={`/events/${event.id}`}
          className="flex items-center justify-center gap-1 text-sm text-forest-600 font-medium"
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default MobileEventCard;