import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Filter,
  Search,
  ChevronDown,
  Star,
  Shield,
  Award,
  MessageSquare,
  Eye,
  CalendarDays,
  MapPin,
  MoreVertical,
  UserCheck,
  UserX,
  Mail,
  X
} from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import { 
  getSpaceApplicationsForOwner, 
  updateSpaceApplication,
  getSpaces,
  getBookingRequests,
  updateBookingRequest,
  SpaceApplication,
  Space,
  getFacilitatorAvailability,
  createBookingRequest,
  FacilitatorAvailability
} from '../lib/supabase';
import { LoadingSpinner } from '../components/LoadingStates';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { DateTimePicker } from '../components/ui/date-time-picker';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

const SpaceHolderDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<SpaceApplication[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [facilitators, setFacilitators] = useState<FacilitatorAvailability[]>([]);
  const [facilitatorSearch, setFacilitatorSearch] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load spaces
      const { data: spacesData, error: spacesError } = await getSpaces({ 
        owner_id: user.id,
        status: 'available'
      });
      
      if (spacesError) throw spacesError;
      setSpaces(spacesData || []);

      // Load applications
      const { data: appsData, error: appsError } = await getSpaceApplicationsForOwner(user.id);
      if (appsError) throw appsError;
      setApplications(appsData || []);
      
      // Load booking requests
      const { data: bookingData, error: bookingError } = await getBookingRequests(user.id, 'space_holder');
      if (bookingError) throw bookingError;
      setBookingRequests(bookingData || []);
      
      // Load facilitators
      const { data: facilitatorData, error: facilitatorError } = await getFacilitatorAvailability({
        is_active: true,
        limit: 50
      });
      if (facilitatorError) throw facilitatorError;
      setFacilitators(facilitatorData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationAction = async (
    applicationId: string, 
    status: 'approved' | 'rejected',
    message?: string
  ) => {
    try {
      const { error } = await updateSpaceApplication(applicationId, {
        status,
        owner_response: {
          message: message || (status === 'approved' ? 'Your application has been approved!' : 'Thank you for your application.'),
          ...(status === 'approved' && selectedDate && {
            approved_dates: [format(selectedDate, 'yyyy-MM-dd')],
            approved_time: selectedTime
          })
        }
      });

      if (error) throw error;
      
      // Refresh applications
      await loadData();
      setSelectedApplications([]);
    } catch (error) {
      console.error('Error updating application:', error);
    }
  };

  const handleBookingAction = async (
    bookingId: string,
    status: 'accepted' | 'declined',
    response?: string
  ) => {
    try {
      const { error } = await updateBookingRequest(bookingId, {
        status,
        response_message: response
      });
      
      if (error) throw error;
      
      // Reload booking requests
      const { data: bookingData, error: bookingError } = await getBookingRequests(user!.id, 'space_holder');
      if (!bookingError) {
        setBookingRequests(bookingData || []);
      }
    } catch (error) {
      console.error('Error updating booking request:', error);
      alert('Failed to update booking request');
    }
  };

  const handleBulkAction = async (status: 'approved' | 'rejected') => {
    setBulkActionLoading(true);
    try {
      await Promise.all(
        selectedApplications.map(id => 
          handleApplicationAction(id, status)
        )
      );
    } finally {
      setBulkActionLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (selectedSpace !== 'all' && app.space_id !== selectedSpace) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        app.facilitator?.full_name?.toLowerCase().includes(query) ||
        app.application_data?.event_type?.toLowerCase().includes(query) ||
        app.space?.name?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const pendingApplications = filteredApplications.filter(app => app.status === 'pending');
  const approvedApplications = filteredApplications.filter(app => app.status === 'approved');
  const rejectedApplications = filteredApplications.filter(app => app.status === 'rejected');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-forest-800 mb-2">Space Holder Dashboard</h1>
          <p className="text-forest-600">Manage your spaces and facilitator applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Spaces</CardTitle>
              <Home className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{spaces.length}</div>
              <p className="text-xs text-gray-500">
                {spaces.filter(s => s.list_publicly).length} publicly listed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApplications.length}</div>
              <p className="text-xs text-gray-500">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Facilitators</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedApplications.length}</div>
              <p className="text-xs text-gray-500">Active facilitators</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications.length}</div>
              <p className="text-xs text-gray-500">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search facilitators, events, or spaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
              />
            </div>

            {/* Space Filter */}
            <select
              value={selectedSpace}
              onChange={(e) => setSelectedSpace(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
            >
              <option value="all">All Spaces</option>
              {spaces.map(space => (
                <option key={space.id} value={space.id}>{space.name}</option>
              ))}
            </select>

            {/* Bulk Actions */}
            {selectedApplications.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handleBulkAction('approved')}
                  disabled={bulkActionLoading}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Approve ({selectedApplications.length})
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleBulkAction('rejected')}
                  disabled={bulkActionLoading}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Reject ({selectedApplications.length})
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Applications Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pending">
              Pending ({pendingApplications.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedApplications.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedApplications.length})
            </TabsTrigger>
            <TabsTrigger value="bookings">
              Bookings ({bookingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="find-facilitators">
              Find Facilitators
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingApplications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No pending applications</h3>
                  <p className="text-gray-500">New applications will appear here</p>
                </CardContent>
              </Card>
            ) : (
              pendingApplications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  onApprove={(id) => handleApplicationAction(id, 'approved')}
                  onReject={(id) => handleApplicationAction(id, 'rejected')}
                  isSelected={selectedApplications.includes(application.id)}
                  onToggleSelect={(id) => {
                    setSelectedApplications(prev =>
                      prev.includes(id)
                        ? prev.filter(appId => appId !== id)
                        : [...prev, id]
                    );
                  }}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  selectedTime={selectedTime}
                  setSelectedTime={setSelectedTime}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedApplications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No approved applications</h3>
                  <p className="text-gray-500">Approved facilitators will appear here</p>
                </CardContent>
              </Card>
            ) : (
              approvedApplications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  isApproved
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedApplications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <XCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No rejected applications</h3>
                  <p className="text-gray-500">Rejected applications will appear here</p>
                </CardContent>
              </Card>
            ) : (
              rejectedApplications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  isRejected
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="bookings" className="space-y-4">
            {bookingRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No booking requests</h3>
                  <p className="text-gray-500">Facilitator booking requests will appear here</p>
                </CardContent>
              </Card>
            ) : (
              bookingRequests.map((booking) => (
                <BookingRequestCard
                  key={booking.id}
                  booking={booking}
                  onAccept={(id) => handleBookingAction(id, 'accepted')}
                  onDecline={(id) => handleBookingAction(id, 'declined')}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="find-facilitators" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Find Facilitators</CardTitle>
                <CardDescription>
                  Browse available facilitators and send booking requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search facilitators by name, specialty, or location..."
                      value={facilitatorSearch}
                      onChange={(e) => setFacilitatorSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                    />
                  </div>
                </div>

                {/* Facilitators Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {facilitators
                    .filter(facilitator => {
                      if (!facilitatorSearch) return true;
                      const query = facilitatorSearch.toLowerCase();
                      return (
                        facilitator.facilitator?.full_name?.toLowerCase().includes(query) ||
                        facilitator.specialties?.some(s => s.toLowerCase().includes(query)) ||
                        facilitator.location_type?.toLowerCase().includes(query)
                      );
                    })
                    .map((facilitator) => (
                      <FacilitatorCard
                        key={facilitator.id}
                        facilitator={facilitator}
                        onBookingRequest={async (facilitatorId, eventData) => {
                          try {
                            const { error } = await createBookingRequest({
                              facilitator_id: facilitatorId,
                              space_holder_id: user!.id,
                              ...eventData
                            });
                            
                            if (error) {
                              alert('Failed to send booking request');
                            } else {
                              alert('Booking request sent successfully!');
                              // Reload booking requests
                              const { data: bookingData } = await getBookingRequests(user!.id, 'space_holder');
                              setBookingRequests(bookingData || []);
                            }
                          } catch (error) {
                            console.error('Error sending booking request:', error);
                            alert('Failed to send booking request');
                          }
                        }}
                        userSpaces={spaces}
                      />
                    ))}
                </div>

                {facilitators.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No facilitators found</h3>
                    <p className="text-gray-500">Check back later for available facilitators</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

interface ApplicationCardProps {
  application: SpaceApplication;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  isApproved?: boolean;
  isRejected?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  selectedDate?: Date;
  setSelectedDate?: (date: Date | undefined) => void;
  selectedTime?: string;
  setSelectedTime?: (time: string) => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onApprove,
  onReject,
  isApproved,
  isRejected,
  isSelected,
  onToggleSelect,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className={cn(
      "transition-all",
      isSelected && "ring-2 ring-forest-500"
    )}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {onToggleSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(application.id)}
                className="mt-1 h-4 w-4 text-forest-600 focus:ring-forest-500 border-gray-300 rounded"
              />
            )}
            <div>
              <CardTitle className="text-lg">
                {application.facilitator?.full_name || 'Unknown Facilitator'}
              </CardTitle>
              <CardDescription>
                {application.application_data?.event_type} at {application.space?.name}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {application.facilitator?.experience_years && (
              <div className="flex items-center text-sm text-gray-600">
                <Award className="h-4 w-4 mr-1" />
                {application.facilitator.experience_years}+ years
              </div>
            )}
            {application.facilitator?.has_insurance && (
              <Shield className="h-4 w-4 text-green-600" title="Has insurance" />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              Applied {format(new Date(application.created_at), 'MMM dd, yyyy')}
            </div>
            <div className="flex items-center text-gray-600">
              <Users className="h-4 w-4 mr-2" />
              Expected: {application.application_data?.expected_attendance || 'Not specified'}
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              Duration: {application.application_data?.duration || 'Not specified'}
            </div>
          </div>

          {/* Details */}
          {showDetails && (
            <div className="border-t pt-4 space-y-3">
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">Event Description</h4>
                <p className="text-sm text-gray-600">
                  {application.application_data?.event_description || 'No description provided'}
                </p>
              </div>
              
              {application.application_data?.special_requirements && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Special Requirements</h4>
                  <p className="text-sm text-gray-600">
                    {application.application_data.special_requirements}
                  </p>
                </div>
              )}

              {application.facilitator?.portfolio_url && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Portfolio</h4>
                  <a
                    href={application.facilitator.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-forest-600 hover:text-forest-700"
                  >
                    View Portfolio →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {!isApproved && !isRejected && onApprove && onReject && (
            <div className="border-t pt-4">
              {/* Date/Time Selection for Approval */}
              {setSelectedDate && setSelectedTime && (
                <div className="mb-4 space-y-3">
                  <h4 className="font-medium text-sm text-gray-700">Select approved date and time</h4>
                  <DateTimePicker
                    date={selectedDate}
                    setDate={setSelectedDate}
                    time={selectedTime}
                    setTime={setSelectedTime}
                    placeholder="Select date and time for this facilitator"
                  />
                </div>
              )}
              
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => onApprove(application.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onReject(application.id)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button variant="ghost">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </div>
            </div>
          )}

          {/* Status Badge */}
          {(isApproved || isRejected) && (
            <div className="border-t pt-4">
              <div className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
                isApproved ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              )}>
                {isApproved ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approved
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-1" />
                    Rejected
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface BookingRequestCardProps {
  booking: any;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

const BookingRequestCard: React.FC<BookingRequestCardProps> = ({
  booking,
  onAccept,
  onDecline
}) => {
  const [showResponse, setShowResponse] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  const handleAccept = () => {
    onAccept(booking.id);
    setShowResponse(false);
  };

  const handleDecline = () => {
    if (responseMessage.trim()) {
      onDecline(booking.id);
      setShowResponse(false);
      setResponseMessage('');
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gradient-to-br from-forest-400 to-earth-500 rounded-full flex items-center justify-center text-white font-semibold">
              {booking.facilitator?.full_name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {booking.facilitator?.full_name || 'Unknown Facilitator'}
              </h3>
              {booking.facilitator?.facilitator_rating && (
                <div className="flex items-center text-sm text-gray-600">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  {booking.facilitator.facilitator_rating.toFixed(1)}
                </div>
              )}
            </div>
          </div>
          <span className={cn(
            "px-3 py-1 rounded-full text-sm font-medium",
            booking.status === 'pending' && "bg-yellow-100 text-yellow-800",
            booking.status === 'accepted' && "bg-green-100 text-green-800",
            booking.status === 'declined' && "bg-red-100 text-red-800"
          )}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          {/* Event Details */}
          <div>
            <p className="text-sm font-medium text-gray-700">Event Type:</p>
            <p className="text-sm text-gray-600">{booking.event_type}</p>
          </div>

          {/* Date and Time */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600">
              <CalendarDays className="h-4 w-4 mr-1" />
              {format(new Date(booking.requested_date), 'MMMM d, yyyy')}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-1" />
              {booking.requested_start_time} - {booking.requested_end_time}
            </div>
          </div>

          {/* Space */}
          <div className="flex items-center text-sm text-gray-600">
            <Home className="h-4 w-4 mr-1" />
            {booking.space?.name || 'Unknown Space'}
          </div>

          {/* Expected Attendance */}
          {booking.expected_attendance && (
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-1" />
              {booking.expected_attendance} expected participants
            </div>
          )}

          {/* Event Description */}
          {booking.event_description && (
            <div>
              <p className="text-sm font-medium text-gray-700">Description:</p>
              <p className="text-sm text-gray-600">{booking.event_description}</p>
            </div>
          )}

          {/* Message from Space Holder */}
          {booking.initial_message && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Message:</p>
              <p className="text-sm text-gray-600">{booking.initial_message}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {booking.status === 'pending' && (
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowResponse(!showResponse)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {showResponse ? 'Cancel' : 'Decline with Message'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleAccept}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept Request
            </Button>
          </div>
        )}

        {/* Response Message Input */}
        {showResponse && (
          <div className="mt-4 space-y-3">
            <textarea
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              placeholder="Explain why you're declining this request..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                variant="destructive"
                onClick={handleDecline}
                disabled={!responseMessage.trim()}
              >
                Send Decline Response
              </Button>
            </div>
          </div>
        )}

        {/* Response for non-pending requests */}
        {booking.status !== 'pending' && booking.response_message && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700">Response:</p>
            <p className="text-sm text-gray-600">{booking.response_message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface FacilitatorCardProps {
  facilitator: FacilitatorAvailability;
  onBookingRequest: (facilitatorId: string, eventData: any) => void;
  userSpaces: Space[];
}

const FacilitatorCard: React.FC<FacilitatorCardProps> = ({
  facilitator,
  onBookingRequest,
  userSpaces
}) => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    event_type: '',
    event_description: '',
    requested_date: '',
    requested_start_time: '',
    requested_end_time: '',
    expected_attendance: '',
    space_id: '',
    initial_message: ''
  });

  const handleSendBookingRequest = () => {
    if (!bookingData.event_type || !bookingData.requested_date || !bookingData.space_id) {
      alert('Please fill in all required fields');
      return;
    }

    onBookingRequest(facilitator.facilitator_id, bookingData);
    setShowBookingModal(false);
    setBookingData({
      event_type: '',
      event_description: '',
      requested_date: '',
      requested_start_time: '',
      requested_end_time: '',
      expected_attendance: '',
      space_id: '',
      initial_message: ''
    });
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gradient-to-br from-forest-400 to-earth-500 rounded-full flex items-center justify-center text-white font-semibold">
                {facilitator.facilitator?.full_name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {facilitator.facilitator?.full_name || 'Unknown Facilitator'}
                </h3>
                {facilitator.facilitator?.facilitator_rating && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    {facilitator.facilitator.facilitator_rating.toFixed(1)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Specialties */}
          {facilitator.specialties && facilitator.specialties.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Specialties:</p>
              <div className="flex flex-wrap gap-2">
                {facilitator.specialties.slice(0, 3).map((specialty, index) => (
                  <span key={index} className="px-2 py-1 bg-forest-100 text-forest-700 text-xs rounded-full">
                    {specialty}
                  </span>
                ))}
                {facilitator.specialties.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{facilitator.specialties.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Location Type */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <strong>Location:</strong> {facilitator.location_type || 'Not specified'}
            </p>
          </div>

          {/* Action Button */}
          <Button
            onClick={() => setShowBookingModal(true)}
            className="w-full"
            variant="secondary"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Send Booking Request
          </Button>
        </CardContent>
      </Card>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">
                Send Booking Request to {facilitator.facilitator?.full_name}
              </h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type *
                </label>
                <input
                  type="text"
                  value={bookingData.event_type}
                  onChange={(e) => setBookingData(prev => ({ ...prev, event_type: e.target.value }))}
                  placeholder="e.g., Yoga Workshop, Meditation Circle"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                />
              </div>

              {/* Space Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Space *
                </label>
                <select
                  value={bookingData.space_id}
                  onChange={(e) => setBookingData(prev => ({ ...prev, space_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                >
                  <option value="">Select a space</option>
                  {userSpaces.map(space => (
                    <option key={space.id} value={space.id}>{space.name}</option>
                  ))}
                </select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={bookingData.requested_date}
                    onChange={(e) => setBookingData(prev => ({ ...prev, requested_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Attendance
                  </label>
                  <input
                    type="number"
                    value={bookingData.expected_attendance}
                    onChange={(e) => setBookingData(prev => ({ ...prev, expected_attendance: e.target.value }))}
                    placeholder="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={bookingData.requested_start_time}
                    onChange={(e) => setBookingData(prev => ({ ...prev, requested_start_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={bookingData.requested_end_time}
                    onChange={(e) => setBookingData(prev => ({ ...prev, requested_end_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                  />
                </div>
              </div>

              {/* Event Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Description
                </label>
                <textarea
                  value={bookingData.event_description}
                  onChange={(e) => setBookingData(prev => ({ ...prev, event_description: e.target.value }))}
                  placeholder="Describe the event, goals, and any special requirements..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Facilitator
                </label>
                <textarea
                  value={bookingData.initial_message}
                  onChange={(e) => setBookingData(prev => ({ ...prev, initial_message: e.target.value }))}
                  placeholder="Personal message or additional details..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowBookingModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendBookingRequest}
                className="bg-forest-600 hover:bg-forest-700"
              >
                Send Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SpaceHolderDashboard;