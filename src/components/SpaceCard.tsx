import React, { useState } from 'react';
import { MapPin, Users, Star, Badge, Home, Globe, Accessibility, DollarSign, Calendar, Cat, Dog } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase, Space } from '../lib/supabase';
import SpaceDetailsModal from './SpaceDetailsModal';
import BookingSystem from './BookingSystem';

interface SpaceCardProps {
  space: Space;
  onUpdate?: () => void;
}

const SpaceCard: React.FC<SpaceCardProps> = ({ space, onUpdate }) => {
  const { user } = useAuthContext();
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const formatSpaceType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleBookSpace = async () => {
    if (!user) {
      setError('Please sign in to book spaces');
      return;
    }

    setIsBooking(true);
    setError(null);

    try {
      // For now, just show interest - booking system can be expanded later
      alert('Booking interest recorded! The space owner will be notified.');
    } catch (err: any) {
      setError(err.message || 'Failed to book space');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <>
      <div 
        className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] overflow-hidden group border border-forest-50 cursor-pointer"
        onClick={() => setShowDetailsModal(true)}
      >
      <div className="relative">
        <img 
          src={space.image_urls?.[0] || 'https://images.pexels.com/photos/8633077/pexels-photo-8633077.jpeg?auto=compress&cs=tinysrgb&w=400'} 
          alt={space.name}
          className="w-full h-48 sm:h-52 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute top-3 left-3 flex items-center space-x-2">
          <span className="bg-earth-100 text-earth-800 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm">
            {formatSpaceType(space.type)}
          </span>
          {space.verified && (
            <div className="bg-forest-600 text-white p-1.5 rounded-full backdrop-blur-sm">
              <Badge className="h-3 w-3" />
            </div>
          )}
          {space.list_publicly && (
            <div className="bg-blue-600 text-white p-1.5 rounded-full backdrop-blur-sm">
              <Globe className="h-3 w-3" />
            </div>
          )}
        </div>
      </div>
      
      <div className="p-5 sm:p-6">
        <h3 className="font-bold text-lg text-forest-800 mb-2 line-clamp-2 group-hover:text-forest-900 transition-colors">
          {space.name}
        </h3>
        <p className="text-forest-600 mb-4 flex items-center">
          <Star className="h-4 w-4 mr-1.5 text-earth-400 fill-current" />
          <span className="font-medium">{space.owner?.full_name || 'Community Member'}</span>
        </p>
        
        <div className="space-y-2.5 mb-5">
          <div className="flex items-center text-forest-600">
            <MapPin className="h-4 w-4 mr-2.5 text-forest-500" />
            <span className="text-sm font-medium truncate">{space.address}</span>
          </div>
          {space.animals_allowed && (
            <div className="flex items-center text-forest-600">
              <Cat className="h-4 w-4 mr-2.5 text-forest-500" />
              <span className="text-sm font-medium">Pet friendly</span>
            </div>
          )}
          <div className="flex items-center text-forest-600">
            <Users className="h-4 w-4 mr-2.5 text-forest-500" />
            <span className="text-sm font-medium">Up to {space.capacity} people</span>
          </div>
          {space.amenities && space.amenities.length > 0 && (
            <div className="flex items-center text-forest-600">
              <Home className="h-4 w-4 mr-2.5 text-forest-500" />
              <span className="text-sm font-medium truncate">
                {space.amenities.slice(0, 2).map(a => a.amenity).join(', ')}
                {space.amenities.length > 2 && ` +${space.amenities.length - 2} more`}
              </span>
            </div>
          )}
        </div>

        {space.description && (
          <p className="text-sm text-forest-600 mb-4 line-clamp-2">
            {space.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mb-5 text-sm">
          <div>
            <span className="text-forest-500">Visibility: </span>
            <span className="font-semibold text-forest-800">
              {space.list_publicly ? 'Global' : 'Local'}
            </span>
          </div>
          <div>
            <span className="text-forest-500">Contribution: </span>
            <span className="font-semibold text-earth-600">
              {space.donation_suggested || 'Free'}
            </span>
          </div>
        </div>
        
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
            {error}
          </div>
        )}
        
        <button 
          onClick={handleBookSpace}
          disabled={isBooking || !user}
          className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-sm hover:shadow-md ${
            !user
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-earth-500 to-earth-600 hover:from-earth-600 hover:to-earth-700 text-white'
          }`}
        >
          {isBooking ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Booking...</span>
            </div>
          ) : !user ? (
            'Sign in to Book'
          ) : (
            'Book Space'
          )}
        </button>
      </div>
      </div>

      <SpaceDetailsModal
        space={space}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onBook={() => {
          onUpdate?.();
          setShowDetailsModal(false);
          setShowBookingModal(true);
        }}
      />

      <BookingSystem
        space={space}
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onBookingComplete={() => {
          onUpdate?.();
          setShowBookingModal(false);
        }}
      />
    </>
  );
};

export default SpaceCard;