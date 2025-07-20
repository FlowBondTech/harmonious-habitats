import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search,
  Filter,
  MapPin,
  Laptop,
  Calendar,
  Star,
  Clock,
  Users,
  ChevronRight,
  Award,
  MessageSquare,
  X
} from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import { 
  searchAvailableFacilitators,
  getSpaces,
  Profile,
  Space,
  FacilitatorAvailability,
  FacilitatorSpecialty
} from '../lib/supabase';
import { LoadingSpinner } from '../components/LoadingStates';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../lib/utils';

interface FacilitatorWithDetails extends Profile {
  facilitator_availability: FacilitatorAvailability;
  facilitator_specialties: FacilitatorSpecialty[];
}

const FacilitatorDirectory = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [facilitators, setFacilitators] = useState<FacilitatorWithDetails[]>([]);
  const [userSpaces, setUserSpaces] = useState<Space[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnline, setShowOnline] = useState(true);
  const [showInPerson, setShowInPerson] = useState(true);
  const [selectedFacilitator, setSelectedFacilitator] = useState<FacilitatorWithDetails | null>(null);

  const categories = [
    'all',
    'Wellness',
    'Arts & Creativity',
    'Cooking & Nutrition',
    'Gardening & Nature',
    'Learning & Skills',
    'Community & Support'
  ];

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load facilitators
      const { data: facilitatorsData, error: facilitatorsError } = await searchAvailableFacilitators({
        online: showOnline && !showInPerson,
        inPerson: showInPerson && !showOnline
      });
      
      if (facilitatorsError) throw facilitatorsError;
      setFacilitators(facilitatorsData as FacilitatorWithDetails[] || []);

      // Load user's spaces if they're logged in
      if (user) {
        const { data: spacesData, error: spacesError } = await getSpaces({ 
          owner_id: user.id,
          status: 'available'
        });
        
        if (spacesError) throw spacesError;
        setUserSpaces(spacesData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFacilitators = facilitators.filter(facilitator => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = facilitator.full_name?.toLowerCase().includes(query);
      const matchesBio = facilitator.facilitator_bio?.toLowerCase().includes(query);
      const matchesSpecialty = facilitator.facilitator_specialties?.some(
        s => s.specialty.toLowerCase().includes(query)
      );
      
      if (!matchesName && !matchesBio && !matchesSpecialty) return false;
    }

    // Category filter
    if (selectedCategory !== 'all') {
      const hasCategory = facilitator.facilitator_specialties?.some(
        s => s.category === selectedCategory
      );
      if (!hasCategory) return false;
    }

    // Location filter
    const availability = facilitator.facilitator_availability;
    if (!showOnline && !availability.available_for_in_person) return false;
    if (!showInPerson && !availability.available_for_online) return false;

    return true;
  });

  const getAvailableDays = (schedule: FacilitatorAvailability['weekly_schedule']) => {
    return Object.entries(schedule)
      .filter(([_, slots]) => slots.length > 0)
      .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1, 3))
      .join(', ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading facilitators..." />
      </div>
    );
  }

  const isSpaceHolder = userSpaces.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-forest-800 mb-2">Find a Facilitator</h1>
          <p className="text-forest-600">
            Browse available facilitators for your events and workshops
          </p>
        </div>

        {/* Space Holder Check */}
        {user && !isSpaceHolder && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-amber-900 mb-1">
                    Become a Space Holder
                  </h3>
                  <p className="text-sm text-amber-700">
                    Share your space to host events and connect with facilitators
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/share-space')}
                  variant="outline"
                  className="border-amber-600 text-amber-700 hover:bg-amber-100"
                >
                  Share Your Space
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, specialty, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                />
              </div>

              {/* Category and Location Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Category Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Type
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={showOnline}
                        onChange={(e) => setShowOnline(e.target.checked)}
                        className="h-4 w-4 text-forest-600 focus:ring-forest-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 flex items-center">
                        <Laptop className="h-4 w-4 mr-1" />
                        Online
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={showInPerson}
                        onChange={(e) => setShowInPerson(e.target.checked)}
                        className="h-4 w-4 text-forest-600 focus:ring-forest-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        In-Person
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFacilitators.map((facilitator) => (
            <FacilitatorCard
              key={facilitator.id}
              facilitator={facilitator}
              onSelect={() => setSelectedFacilitator(facilitator)}
              isSpaceHolder={isSpaceHolder}
            />
          ))}
        </div>

        {filteredFacilitators.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No facilitators found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search criteria or check back later
              </p>
            </CardContent>
          </Card>
        )}

        {/* Request Modal */}
        {selectedFacilitator && isSpaceHolder && (
          <BookingRequestModal
            facilitator={selectedFacilitator}
            spaces={userSpaces}
            onClose={() => setSelectedFacilitator(null)}
          />
        )}
      </div>
    </div>
  );
};

interface FacilitatorCardProps {
  facilitator: FacilitatorWithDetails;
  onSelect: () => void;
  isSpaceHolder: boolean;
}

const FacilitatorCard: React.FC<FacilitatorCardProps> = ({ 
  facilitator, 
  onSelect,
  isSpaceHolder 
}) => {
  const availability = facilitator.facilitator_availability;
  const specialties = facilitator.facilitator_specialties || [];
  const availableDays = getAvailableDays(availability.weekly_schedule);

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onSelect}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gradient-to-br from-forest-400 to-earth-500 rounded-full flex items-center justify-center text-white font-semibold">
              {facilitator.full_name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <CardTitle className="text-lg">{facilitator.full_name || 'Facilitator'}</CardTitle>
              {facilitator.facilitator_rating && facilitator.facilitator_rating > 0 && (
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  {facilitator.facilitator_rating.toFixed(1)}
                  <span className="ml-1">({facilitator.facilitator_total_sessions} sessions)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Bio */}
        {facilitator.facilitator_bio && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {facilitator.facilitator_bio}
          </p>
        )}

        {/* Specialties */}
        {specialties.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {specialties.slice(0, 3).map((specialty, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-forest-100 text-forest-800"
                >
                  {specialty.specialty}
                </span>
              ))}
              {specialties.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{specialties.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Availability Info */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{availableDays || 'Schedule not set'}</span>
          </div>
          
          <div className="flex items-center gap-4">
            {availability.available_for_online && (
              <span className="flex items-center">
                <Laptop className="h-4 w-4 mr-1" />
                Online
              </span>
            )}
            {availability.available_for_in_person && (
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                In-Person ({availability.travel_radius_miles}mi)
              </span>
            )}
          </div>

          {availability.suggested_donation && (
            <div className="flex items-center">
              <span className="font-medium">Suggested: {availability.suggested_donation}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-4">
          {isSpaceHolder ? (
            <Button className="w-full" variant="secondary">
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Booking Request
            </Button>
          ) : (
            <Button className="w-full" variant="outline" disabled>
              View Profile
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

function getAvailableDays(schedule: FacilitatorAvailability['weekly_schedule']) {
  return Object.entries(schedule)
    .filter(([_, slots]) => slots.length > 0)
    .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1, 3))
    .join(', ');
}

interface BookingRequestModalProps {
  facilitator: FacilitatorWithDetails;
  spaces: Space[];
  onClose: () => void;
}

const BookingRequestModal: React.FC<BookingRequestModalProps> = ({
  facilitator,
  spaces,
  onClose
}) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [selectedSpace, setSelectedSpace] = useState(spaces[0]?.id || '');
  const [requestDate, setRequestDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [expectedAttendance, setExpectedAttendance] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedSpace) return;

    setSending(true);
    try {
      const { createBookingRequest } = await import('../lib/supabase');
      const { data, error } = await createBookingRequest({
        facilitator_id: facilitator.id,
        space_holder_id: user.id,
        space_id: selectedSpace,
        requested_date: requestDate,
        requested_start_time: startTime,
        requested_end_time: endTime,
        event_type: eventType,
        event_description: eventDescription,
        expected_attendance: parseInt(expectedAttendance) || undefined,
        initial_message: message
      });

      if (error) throw error;

      alert('Booking request sent successfully!');
      onClose();
      navigate('/space-holder-dashboard');
    } catch (error) {
      console.error('Error sending booking request:', error);
      alert('Failed to send booking request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Send Booking Request
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-2">
            {facilitator.full_name}
          </h3>
          <div className="flex flex-wrap gap-2">
            {facilitator.facilitator_specialties?.map((specialty, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-forest-100 text-forest-800"
              >
                {specialty.specialty}
              </span>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Space
            </label>
            <select
              value={selectedSpace}
              onChange={(e) => setSelectedSpace(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
            >
              {spaces.map(space => (
                <option key={space.id} value={space.id}>
                  {space.name} - {space.address}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Type
            </label>
            <input
              type="text"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              placeholder="e.g., Yoga Workshop, Cooking Class, etc."
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Description
            </label>
            <textarea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              rows={3}
              placeholder="Describe the event you'd like to host..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Attendance
            </label>
            <input
              type="number"
              value={expectedAttendance}
              onChange={(e) => setExpectedAttendance(e.target.value)}
              min="1"
              placeholder="Number of participants"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message to Facilitator
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Add a personal message or any specific requirements..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sending}
              className="flex-1"
            >
              {sending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Sending...
                </>
              ) : (
                'Send Request'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FacilitatorDirectory;