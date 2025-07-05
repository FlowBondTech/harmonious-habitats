import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Users,
  Star, 
  Badge, 
  Home, 
  Globe, 
  Calendar, 
  Clock, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Share2, 
  Cat,
  Dog,
  Bird,
  Fish,
  Rabbit,
  Info,
  Dog,
  Bird,
  Fish,
  Rabbit,
  Heart,
  Accessibility,
  Wifi,
  Car,
  Utensils,
  Music
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase, Space } from '../lib/supabase';

interface SpaceDetailsModalProps {
  space: Space | null;
  isOpen: boolean;
  onClose: () => void;
  onBook?: (spaceId: string) => void;
}

const SpaceDetailsModal: React.FC<SpaceDetailsModalProps> = ({
  space,
  isOpen,
  onClose,
  onBook
}) => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');

  const formatSpaceType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi') || amenityLower.includes('internet')) return <Wifi className="h-4 w-4" />;
    if (amenityLower.includes('parking')) return <Car className="h-4 w-4" />;
    if (amenityLower.includes('kitchen') || amenityLower.includes('cooking')) return <Utensils className="h-4 w-4" />;
    if (amenityLower.includes('music') || amenityLower.includes('sound')) return <Music className="h-4 w-4" />;
    if (amenityLower.includes('accessible') || amenityLower.includes('wheelchair')) return <Accessibility className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const handleBookSpace = async () => {
    if (!space || !user || !selectedDate || !selectedTime) {
      setError('Please fill in all booking details');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // For now, just show success message - actual booking system would be more complex
      setSuccess('Booking request sent! The space owner will be notified.');
      onBook?.(space.id);
      
      // Reset form
      setSelectedDate('');
      setSelectedTime('');
      setBookingNotes('');
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to book space');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !space) return null;

  return (
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
              src={space.image_urls?.[0] || 'https://images.pexels.com/photos/8633077/pexels-photo-8633077.jpeg?auto=compress&cs=tinysrgb&w=800'} 
              alt={space.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Space Type Badge */}
            <div className="absolute top-4 left-4">
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
                <Home className="h-4 w-4" />
                <span className="text-sm font-medium">{formatSpaceType(space.type)}</span>
              </div>
            </div>

            {/* Visibility Badge */}
            {space.list_publicly && (
              <div className="absolute top-4 left-4 mt-12">
                <div className="flex items-center space-x-2 bg-blue-500/20 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm font-medium">Global</span>
                </div>
              </div>
            )}

            {/* Title Overlay */}
            <div className="absolute bottom-6 left-6 right-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{space.name}</h1>
              <div className="flex items-center space-x-4 text-white/90">
                <div className="flex items-center space-x-2">
                  <img
                    src={space.owner?.avatar_url || "https://images.pexels.com/photos/3772622/pexels-photo-3772622.jpeg?auto=compress&cs=tinysrgb&w=100"}
                    alt={space.owner?.full_name || 'Owner'}
                    className="w-8 h-8 rounded-full object-cover border-2 border-white/50"
                  />
                  <span className="font-medium">{space.owner?.full_name || 'Community Member'}</span>
                  {space.owner?.verified && (
                    <Badge className="h-4 w-4 text-white" />
                  )}
                </div>
                {space.verified && (
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
                {/* Space Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-4 bg-earth-50 rounded-xl">
                    <MapPin className="h-5 w-5 text-earth-600" />
                    <div>
                      <p className="text-sm text-earth-600">Location</p>
                      <p className="font-semibold text-earth-800">{space.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-earth-50 rounded-xl">
                    <Users className="h-5 w-5 text-earth-600" />
                    <div>
                      <p className="text-sm text-earth-600">Capacity</p>
                      <p className="font-semibold text-earth-800">Up to {space.capacity} people</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-earth-50 rounded-xl">
                    <Globe className="h-5 w-5 text-earth-600" />
                    <div>
                      <p className="text-sm text-earth-600">Visibility</p>
                      <p className="font-semibold text-earth-800">
                        {space.list_publicly ? 'Global' : 'Local'} listing
                      </p>
                    </div>
                  </div>
                  
                  {space.donation_suggested && (
                    <div className="flex items-center space-x-3 p-4 bg-earth-50 rounded-xl">
                      <DollarSign className="h-5 w-5 text-earth-600" />
                      <div>
                        <p className="text-sm text-earth-600">Suggested Contribution</p>
                        <p className="font-semibold text-earth-800">{space.donation_suggested}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {space.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-forest-800 mb-3">About This Space</h3>
                    <p className="text-forest-600 leading-relaxed">{space.description}</p>
                  </div>
                )}

                {/* Guidelines */}
                {space.guidelines && (
                  <div>
                    <h3 className="text-lg font-semibold text-forest-800 mb-3">Space Guidelines</h3>
                    <p className="text-forest-600 leading-relaxed">{space.guidelines}</p>
                  </div>
                )}

                {/* Amenities */}
                {space.amenities && space.amenities.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-forest-800 mb-3">Available Amenities</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {space.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center space-x-2 p-3 bg-forest-50 rounded-lg">
                          {getAmenityIcon(amenity.amenity)}
                          <span className="text-sm text-forest-700">{amenity.amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Accessibility Features */}
                {space.accessibility_features && space.accessibility_features.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-forest-800 mb-3">Accessibility Features</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {space.accessibility_features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                          <Accessibility className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-700">{feature.feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pet Friendly */}
                {space.animals_allowed && (
                  <div>
                    <h3 className="text-lg font-semibold text-forest-800 mb-3">Pet Friendly Space</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {space.animal_types ? (
                        space.animal_types.map((animal: any, index: number) => {
                          let AnimalIcon = Dog;
                          if (animal.animal_type === 'cats') AnimalIcon = Cat;
                          if (animal.animal_type === 'birds') AnimalIcon = Bird;
                          if (animal.animal_type === 'fish') AnimalIcon = Fish;
                          if (animal.animal_type === 'small_pets') AnimalIcon = Rabbit;
                          
                          return (
                            <div key={index} className="flex items-center space-x-2 p-3 bg-earth-50 rounded-lg">
                              <AnimalIcon className="h-4 w-4 text-earth-600" />
                              <span className="text-sm text-earth-700 capitalize">{animal.animal_type.replace('_', ' ')}</span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-full p-3 bg-earth-50 rounded-lg">
                          <p className="text-sm text-earth-700">This space is pet-friendly, but specific animal types aren't specified.</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-start space-x-3">
                        <Info className="h-4 w-4 text-blue-600 mt-1" />
                        <p className="text-sm text-blue-700">
                          <strong>Note:</strong> Service animals are always welcome regardless of pet policy.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Holistic Categories */}
                {space.holistic_categories && space.holistic_categories.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-forest-800 mb-3">Ideal For</h3>
                    <div className="flex flex-wrap gap-2">
                      {space.holistic_categories.map((category, index) => (
                        <span
                          key={index}
                          className="bg-earth-100 text-earth-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {category.category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar - Booking Form */}
              <div className="space-y-6">
                {user ? (
                  <div className="bg-earth-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-forest-800 mb-4">Book This Space</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-forest-700 mb-2">
                          Preferred Date
                        </label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-earth-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-forest-700 mb-2">
                          Time Needed
                        </label>
                        <select
                          value={selectedTime}
                          onChange={(e) => setSelectedTime(e.target.value)}
                          className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-earth-500"
                        >
                          <option value="">Select duration</option>
                          <option value="1-hour">1 hour</option>
                          <option value="2-hours">2 hours</option>
                          <option value="3-hours">3 hours</option>
                          <option value="half-day">Half day (4 hours)</option>
                          <option value="full-day">Full day (8 hours)</option>
                          <option value="custom">Custom (discuss with owner)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-forest-700 mb-2">
                          Event Details (Optional)
                        </label>
                        <textarea
                          value={bookingNotes}
                          onChange={(e) => setBookingNotes(e.target.value)}
                          placeholder="Briefly describe your event or gathering..."
                          rows={3}
                          className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-earth-500"
                        />
                      </div>
                      
                      <button
                        onClick={handleBookSpace}
                        disabled={loading || !selectedDate || !selectedTime}
                        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                          loading || !selectedDate || !selectedTime
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-earth-500 to-earth-600 hover:from-earth-600 hover:to-earth-700 text-white transform hover:scale-[1.02] shadow-sm hover:shadow-md'
                        }`}
                      >
                        {loading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Sending Request...</span>
                          </div>
                        ) : (
                          'Request Booking'
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 bg-earth-50 rounded-xl">
                    <p className="text-forest-600 mb-4">Sign in to book this space</p>
                    <button className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                      Sign In
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button className="flex-1 py-2 px-4 rounded-xl font-medium bg-forest-100 text-forest-700 hover:bg-forest-200 transition-colors flex items-center justify-center space-x-2">
                    <Heart className="h-4 w-4" />
                    <span>Save</span>
                  </button>
                  
                  <button className="flex-1 py-2 px-4 rounded-xl font-medium bg-forest-100 text-forest-700 hover:bg-forest-200 transition-colors flex items-center justify-center space-x-2">
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </button>
                </div>
                
                <button className="w-full py-2 px-4 rounded-xl font-medium bg-earth-100 text-earth-700 hover:bg-earth-200 transition-colors flex items-center justify-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Message Owner</span>
                </button>

                {/* Space Info */}
                <div className="bg-forest-50 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-forest-800">Space Information</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-forest-600">Type:</span>
                      <span className="font-medium text-forest-800">{formatSpaceType(space.type)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-forest-600">Status:</span>
                      <span className="font-medium text-green-600 capitalize">{space.status}</span>
                    </div>
                    
                    {!space.list_publicly && space.max_radius && (
                      <div className="flex justify-between">
                        <span className="text-forest-600">Max Radius:</span>
                        <span className="font-medium text-forest-800">{space.max_radius} miles</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Safety Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800 mb-1">Booking Guidelines</h4>
                      <p className="text-sm text-blue-600">
                        All bookings are subject to owner approval. Please be respectful of the space and follow all guidelines.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceDetailsModal;