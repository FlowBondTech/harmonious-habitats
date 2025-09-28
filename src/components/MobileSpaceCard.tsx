import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Users,
  Star,
  Home,
  ChevronRight,
  Heart,
  Share2,
  DollarSign,
  Wifi,
  Car,
  Baby,
  Coffee,
  Music
} from 'lucide-react';
import { Space } from '../lib/supabase';
import Avatar from './Avatar';

interface MobileSpaceCardProps {
  space: Space;
  onBook?: () => void;
  onShare?: () => void;
  distance?: number;
}

const MobileSpaceCard: React.FC<MobileSpaceCardProps> = ({
  space,
  onBook,
  onShare,
  distance
}) => {
  const [isLiked, setIsLiked] = useState(false);

  // Amenity icons mapping
  const amenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    wifi: Wifi,
    parking: Car,
    'child-friendly': Baby,
    refreshments: Coffee,
    'sound-system': Music
  };

  const getAmenityIcon = (amenity: string) => {
    const key = amenity.toLowerCase().replace(/\s+/g, '-');
    return amenityIcons[key] || Home;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all active:scale-[0.98] touch-manipulation">
      {/* Image Section */}
      <div className="relative h-48 bg-gradient-to-br from-sage-100 to-earth-50">
        {space.image_urls?.[0] && (
          <img
            src={space.image_urls[0]}
            alt={space.name}
            className="w-full h-full object-cover"
          />
        )}

        {/* Like Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsLiked(!isLiked);
          }}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg active:scale-95 transition-transform"
        >
          <Heart
            className={`h-5 w-5 transition-colors ${
              isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'
            }`}
          />
        </button>

        {/* Status Badge */}
        <div className="absolute bottom-3 left-3">
          <span className={`px-3 py-1 backdrop-blur-sm text-xs font-medium rounded-full ${
            space.status === 'available'
              ? 'bg-green-500/90 text-white'
              : 'bg-gray-500/90 text-white'
          }`}>
            {space.status === 'available' ? 'Available' : 'Unavailable'}
          </span>
        </div>

        {/* Distance Badge */}
        {distance && (
          <div className="absolute bottom-3 right-3">
            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium rounded-full">
              {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`} away
            </span>
          </div>
        )}
      </div>

      <Link to={`/spaces/${space.id}`} className="block p-4">
        {/* Title and Type */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">
            {space.name}
          </h3>
          <p className="text-gray-600 text-sm">
            {space.type} • {space.capacity} people max
          </p>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="truncate">{space.address || 'Location not specified'}</span>
        </div>

        {/* Rating and Reviews */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-sm">{space.rating || '4.8'}</span>
            <span className="text-gray-500 text-sm">({space.total_reviews || 0} reviews)</span>
          </div>
        </div>

        {/* Amenities */}
        {space.amenities && space.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {space.amenities.slice(0, 4).map((amenity, index) => {
              const Icon = getAmenityIcon(typeof amenity === 'string' ? amenity : amenity.amenity);
              return (
                <div
                  key={index}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg"
                >
                  <Icon className="h-3.5 w-3.5 text-gray-600" />
                  <span className="text-xs text-gray-600">
                    {typeof amenity === 'string' ? amenity : amenity.amenity}
                  </span>
                </div>
              );
            })}
            {space.amenities.length > 4 && (
              <div className="px-2 py-1 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-600">+{space.amenities.length - 4}</span>
              </div>
            )}
          </div>
        )}

        {/* Price and Host */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Avatar
              name={space.owner?.full_name || 'Host'}
              imageUrl={space.owner?.avatar_url}
              size="xs"
            />
            <span className="text-sm text-gray-600">
              {space.owner?.full_name || 'Space Host'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-forest-600 font-semibold">
            <DollarSign className="h-4 w-4" />
            <span>{space.hourly_rate || '25'}/hr</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onBook && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onBook();
              }}
              className="flex-1 py-2.5 px-4 bg-forest-600 text-white rounded-xl font-medium transition-colors active:bg-forest-700 active:scale-95"
            >
              Book Space
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
          to={`/spaces/${space.id}`}
          className="flex items-center justify-center gap-1 text-sm text-forest-600 font-medium"
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default MobileSpaceCard;