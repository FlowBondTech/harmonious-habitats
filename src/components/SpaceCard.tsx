import React, { useState } from 'react';
import { MapPin, Users, Star, Badge, Home, Globe, Accessibility, DollarSign, Calendar, Cat, Dog, Share2, Heart, BookmarkPlus, Eye } from 'lucide-react';
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
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const formatSpaceType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const spaceTypeColors: { [key: string]: string } = {
    'home': 'bg-gradient-to-r from-earth-100 to-earth-200 text-earth-800',
    'garden': 'bg-gradient-to-r from-green-100 to-green-200 text-green-800',
    'studio': 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800',
    'outdoor': 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800',
    'community_center': 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800',
    'rooftop': 'bg-gradient-to-r from-sky-100 to-sky-200 text-sky-800',
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
          title: space.name,
          text: `Check out this beautiful space: "${space.name}" in our community!`,
          url: window.location.origin
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  const getAmenityIcon = (amenity: string) => {
    const icons: { [key: string]: React.ElementType } = {
      'wifi': Globe,
      'parking': Home,
      'kitchen': Home,
      'bathroom': Home,
      'garden': Home,
      'yoga_mats': Home,
      'sound_system': Home,
      'projector': Home,
      'accessibility': Accessibility
    };
    return icons[amenity.toLowerCase()] || Home;
  };

  return (
    <>
      <div 
        className="card-interactive group overflow-hidden gpu-accelerated"
        onClick={() => setShowDetailsModal(true)}
      >
        {/* Space Image */}
        <div className="relative overflow-hidden">
          <img 
            src={space.image_urls?.[0] || 'https://images.pexels.com/photos/8633077/pexels-photo-8633077.jpeg?auto=compress&cs=tinysrgb&w=600'} 
            alt={space.name}
            className="w-full h-48 sm:h-52 lg:h-56 object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Top Labels */}
          <div className="absolute top-3 left-3 flex items-center space-x-2">
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/20 shadow-lg ${spaceTypeColors[space.type] || 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'}`}>
              {formatSpaceType(space.type)}
            </span>
            {space.verified && (
              <div className="bg-gradient-to-r from-forest-600 to-forest-700 text-white p-2 rounded-full backdrop-blur-sm shadow-lg">
                <Badge className="h-3 w-3" />
              </div>
            )}
            {space.list_publicly && (
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-2 rounded-full backdrop-blur-sm shadow-lg">
                <Globe className="h-3 w-3" />
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
          {/* Space Title & Owner */}
          <div className="mb-4">
            <h3 className="heading-md text-forest-800 mb-2 line-clamp-2 group-hover:text-forest-900 transition-colors">
              {space.name}
            </h3>
            <div className="flex items-center text-forest-600">
              <Star className="h-4 w-4 mr-1.5 text-earth-400 fill-current" />
              <span className="body-sm font-medium">{space.owner?.full_name || 'Community Member'}</span>
            </div>
          </div>
          
          {/* Space Details */}
          <div className="space-y-3 mb-5">
            <div className="flex items-center text-forest-600 group/detail hover:text-forest-700 transition-colors">
              <MapPin className="h-4 w-4 mr-2.5 text-forest-500 group-hover/detail:text-forest-600 transition-colors" />
              <span className="body-sm font-medium truncate">{space.address}</span>
            </div>
            
            <div className="flex items-center text-forest-600 group/detail hover:text-forest-700 transition-colors">
              <Users className="h-4 w-4 mr-2.5 text-forest-500 group-hover/detail:text-forest-600 transition-colors" />
              <span className="body-sm font-medium">Up to {space.capacity} people</span>
            </div>
            
            {space.animals_allowed && (
              <div className="flex items-center text-forest-600 group/detail hover:text-forest-700 transition-colors">
                <Cat className="h-4 w-4 mr-2.5 text-forest-500 group-hover/detail:text-forest-600 transition-colors" />
                <span className="body-sm font-medium">Pet friendly</span>
              </div>
            )}
            
            {space.amenities && space.amenities.length > 0 && (
              <div className="flex items-center text-forest-600 group/detail hover:text-forest-700 transition-colors">
                <Home className="h-4 w-4 mr-2.5 text-forest-500 group-hover/detail:text-forest-600 transition-colors" />
                <span className="body-sm font-medium truncate">
                  {space.amenities.slice(0, 2).map(a => a.amenity).join(', ')}
                  {space.amenities.length > 2 && ` +${space.amenities.length - 2} more`}
                </span>
              </div>
            )}
          </div>

          {/* Space Description */}
          {space.description && (
            <p className="body-sm text-forest-600 mb-4 line-clamp-2">
              {space.description}
            </p>
          )}
          
          {/* Space Meta */}
          <div className="flex items-center justify-between mb-5 text-sm">
            <div className="flex items-center space-x-4">
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
          </div>
          
          {/* Amenities Preview */}
          {space.amenities && space.amenities.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center space-x-2 mb-2">
                <span className="body-sm font-medium text-forest-700">Amenities:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {space.amenities.slice(0, 4).map((amenity, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-gradient-to-r from-forest-50 to-earth-50 text-forest-700 rounded-lg text-xs font-medium border border-forest-100"
                  >
                    {amenity.amenity}
                  </span>
                ))}
                {space.amenities.length > 4 && (
                  <span className="px-2 py-1 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 rounded-lg text-xs font-medium border border-gray-200 flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    +{space.amenities.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Status Messages */}
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 animate-fade-in-up">
              {error}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleBookSpace();
              }}
              disabled={isBooking || !user}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-sm hover:shadow-md ${
                !user
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'btn-secondary'
              }`}
            >
              {isBooking ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="loading-spinner" />
                  <span>Booking...</span>
                </div>
              ) : !user ? (
                'Sign in to Book'
              ) : (
                'Book Space'
              )}
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowDetailsModal(true);
              }}
              className="w-full btn-outline py-3 text-sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
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