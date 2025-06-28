import React from 'react';
import { MapPin, Clock, Users, Heart, Star, Badge } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  facilitator: string;
  time: string;
  location: string;
  distance: string;
  category: string;
  participants: number;
  maxParticipants: number;
  donation: string;
  image: string;
  verified: boolean;
}

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const categoryColors: { [key: string]: string } = {
    'Gardening': 'bg-green-100 text-green-800',
    'Yoga': 'bg-purple-100 text-purple-800',
    'Cooking': 'bg-orange-100 text-orange-800',
    'Art': 'bg-pink-100 text-pink-800',
    'Healing': 'bg-blue-100 text-blue-800',
    'Music': 'bg-indigo-100 text-indigo-800',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] overflow-hidden group border border-forest-50">
      <div className="relative">
        <img 
          src={event.image} 
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
          <span className="font-medium">{event.facilitator}</span>
        </p>
        
        <div className="space-y-2.5 mb-5">
          <div className="flex items-center text-forest-600">
            <Clock className="h-4 w-4 mr-2.5 text-forest-500" />
            <span className="text-sm font-medium">{event.time}</span>
          </div>
          <div className="flex items-center text-forest-600">
            <MapPin className="h-4 w-4 mr-2.5 text-forest-500" />
            <span className="text-sm font-medium truncate">{event.location}</span>
          </div>
          <div className="flex items-center text-forest-600">
            <Users className="h-4 w-4 mr-2.5 text-forest-500" />
            <span className="text-sm font-medium">{event.participants}/{event.maxParticipants} participants</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-5 text-sm">
          <div>
            <span className="text-forest-500">Distance: </span>
            <span className="font-semibold text-forest-800">{event.distance}</span>
          </div>
          <div>
            <span className="text-forest-500">Donation: </span>
            <span className="font-semibold text-earth-600">{event.donation}</span>
          </div>
        </div>
        
        <button className="w-full bg-gradient-to-r from-forest-600 to-forest-700 hover:from-forest-700 hover:to-forest-800 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-sm hover:shadow-md">
          Join Event
        </button>
      </div>
    </div>
  );
};

export default EventCard;