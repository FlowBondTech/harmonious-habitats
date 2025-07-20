import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  MapPin, 
  Calendar,
  Clock,
  Users,
  Star,
  Heart,
  Share2,
  Wifi,
  Car,
  Trees,
  Coffee,
  Dumbbell,
  Palette,
  Music,
  Book,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  MessageCircle,
  Phone,
  Mail,
  Globe,
  Shield,
  Home
} from 'lucide-react';
import { getSpaces, Space, supabase, sendMessage } from '../lib/supabase';
import { useAuthContext } from '../components/AuthProvider';
import { LoadingSpinner } from '../components/LoadingStates';
import Avatar from '../components/Avatar';

const SpaceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState('');

  // Amenity icons mapping
  const amenityIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
    wifi: Wifi,
    parking: Car,
    outdoor: Trees,
    kitchen: Coffee,
    audio: Music,
    projector: Book,
    gym: Dumbbell,
    art: Palette
  };

  useEffect(() => {
    if (id) {
      loadSpace();
      checkFavorite();
    }
  }, [id]);

  const loadSpace = async () => {
    try {
      setLoading(true);
      const { data, error } = await getSpaces({ status: 'available' });
      if (error) throw error;
      
      const foundSpace = data?.find(s => s.id === id);
      if (foundSpace) {
        setSpace(foundSpace);
        loadOwnerProfile(foundSpace.owner_id);
      }
    } catch (error) {
      console.error('Error loading space:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOwnerProfile = async (ownerId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', ownerId)
        .single();
      
      if (data && !error) {
        setOwnerProfile(data);
      }
    } catch (error) {
      console.error('Error loading owner profile:', error);
    }
  };

  const checkFavorite = async () => {
    if (!user || !id) return;
    
    try {
      const { data } = await supabase
        .from('space_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('space_id', id)
        .single();
      
      setIsFavorite(!!data);
    } catch (error) {
      // Not favorited
      setIsFavorite(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !space) return;
    
    try {
      if (isFavorite) {
        await supabase
          .from('space_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('space_id', space.id);
      } else {
        await supabase
          .from('space_favorites')
          .insert({
            user_id: user.id,
            space_id: space.id
          });
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: space?.name,
        text: space?.description,
        url: window.location.href
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading space details..." />
      </div>
    );
  }

  if (!space) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
        <div className="container-responsive py-8">
          <div className="text-center py-12">
            <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">Space Not Found</h2>
            <p className="text-gray-500 mb-6">This space may no longer be available.</p>
            <Link
              to="/spaces"
              className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block"
            >
              Browse All Spaces
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = space.images && space.images.length > 0 ? space.images : [space.image_url || ''];

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="container-responsive py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-forest-600 hover:text-forest-800 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="relative h-96">
                <img
                  src={images[selectedImage]}
                  alt={space.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Image Navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage((prev) => (prev - 1 + images.length) % images.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setSelectedImage((prev) => (prev + 1) % images.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    
                    {/* Image Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === selectedImage ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button
                    onClick={toggleFavorite}
                    className="p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors"
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors"
                  >
                    <Share2 className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2 overflow-x-auto">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                          index === selectedImage ? 'border-forest-500' : 'border-transparent'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${space.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Space Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h1 className="text-2xl font-bold text-forest-800 mb-2">{space.name}</h1>
              
              <div className="flex items-center space-x-4 text-forest-600 mb-4">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{space.location_name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>Up to {space.capacity} people</span>
                </div>
                {space.rating && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span>{space.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              <div className="prose prose-forest max-w-none">
                <p className="text-gray-600">{space.description}</p>
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-forest-800 mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {space.amenities?.map((amenity) => {
                  const Icon = amenityIcons[amenity] || Check;
                  return (
                    <div key={amenity} className="flex items-center space-x-3">
                      <div className="p-2 bg-forest-50 rounded-lg">
                        <Icon className="h-5 w-5 text-forest-600" />
                      </div>
                      <span className="text-forest-700 capitalize">{amenity.replace('_', ' ')}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* House Rules */}
            {space.rules && space.rules.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-forest-800 mb-4">House Rules</h2>
                <ul className="space-y-2">
                  {space.rules.map((rule, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-500 mt-0.5" />
                      <span className="text-gray-600">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Location */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-forest-800 mb-4">Location</h2>
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <MapPin className="h-12 w-12 text-gray-400" />
                <span className="ml-2 text-gray-500">Map integration coming soon</span>
              </div>
              <p className="mt-4 text-gray-600">{space.address || space.location_name}</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-forest-800">
                  ${space.hourly_rate || 0}
                  <span className="text-lg font-normal text-gray-600">/hour</span>
                </div>
                {space.daily_rate && (
                  <p className="text-gray-600">
                    or ${space.daily_rate}/day
                  </p>
                )}
              </div>

              <button
                onClick={() => setShowContactModal(true)}
                className="w-full bg-forest-600 hover:bg-forest-700 text-white py-3 rounded-lg font-medium transition-colors mb-3"
              >
                Contact Host
              </button>

              <button
                onClick={() => navigate(`/spaces/${space.id}/book`)}
                className="w-full bg-earth-500 hover:bg-earth-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Check Availability
              </button>

              <div className="mt-4 flex items-center justify-center space-x-1 text-sm text-gray-500">
                <Shield className="h-4 w-4" />
                <span>Verified space</span>
              </div>
            </div>

            {/* Host Info */}
            {ownerProfile && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-forest-800 mb-4">Meet Your Host</h3>
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar
                    name={ownerProfile.full_name || 'Host'}
                    imageUrl={ownerProfile.avatar_url}
                    size="lg"
                  />
                  <div>
                    <h4 className="font-medium text-forest-800">{ownerProfile.full_name || 'Host'}</h4>
                    <p className="text-sm text-gray-600">Member since {new Date(ownerProfile.created_at).getFullYear()}</p>
                  </div>
                </div>
                {ownerProfile.bio && (
                  <p className="text-gray-600 text-sm">{ownerProfile.bio}</p>
                )}
              </div>
            )}

            {/* Quick Facts */}
            <div className="bg-forest-50 rounded-xl p-6">
              <h3 className="font-semibold text-forest-800 mb-4">Quick Facts</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Space Type</span>
                  <span className="font-medium text-forest-800 capitalize">{space.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Capacity</span>
                  <span className="font-medium text-forest-800">{space.capacity} people</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Minimum Booking</span>
                  <span className="font-medium text-forest-800">2 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Response Time</span>
                  <span className="font-medium text-forest-800">Within 24 hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-forest-800">Contact Host</h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-forest-50 rounded-lg">
                <p className="text-sm text-forest-700 mb-2">
                  Interested in booking <strong>{space.name}</strong>?
                </p>
                <p className="text-sm text-forest-600">
                  Send a message to the host with your questions or booking request.
                </p>
              </div>

              <textarea
                placeholder="Hi, I'm interested in booking your space for..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 h-32"
              />

              {messageError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{messageError}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!user) {
                      setMessageError('Please sign in to send a message');
                      return;
                    }
                    
                    if (!messageContent.trim()) {
                      setMessageError('Please enter a message');
                      return;
                    }
                    
                    if (!space?.owner_id) {
                      setMessageError('Unable to contact the space owner');
                      return;
                    }
                    
                    setSendingMessage(true);
                    setMessageError('');
                    
                    const { error } = await sendMessage(
                      user.id,
                      space.owner_id,
                      messageContent,
                      'space',
                      space.id
                    );
                    
                    if (error) {
                      setMessageError('Failed to send message. Please try again.');
                      setSendingMessage(false);
                    } else {
                      // Success - show confirmation and close modal
                      alert('Message sent successfully! The space owner will be notified.');
                      setMessageContent('');
                      setShowContactModal(false);
                      setSendingMessage(false);
                    }
                  }}
                  disabled={sendingMessage}
                  className="flex-1 bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpaceDetail;