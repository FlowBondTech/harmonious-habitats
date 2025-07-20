import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Check, 
  X, 
  MessageCircle, 
  Eye,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { SpaceBooking, getBookingsForOwner, updateSpaceBooking } from '../lib/supabase';

interface BookingManagementProps {
  spaceId?: string;
}

const BookingManagement: React.FC<BookingManagementProps> = ({ spaceId }) => {
  const { user } = useAuthContext();
  const [bookings, setBookings] = useState<SpaceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user, selectedStatus]);

  const loadBookings = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: bookingError } = await getBookingsForOwner(
        user.id, 
        selectedStatus === 'all' ? undefined : selectedStatus
      );
      
      if (bookingError) throw bookingError;
      
      // Filter by spaceId if provided
      const filteredBookings = spaceId 
        ? data?.filter(booking => booking.space_id === spaceId) || []
        : data || [];
        
      setBookings(filteredBookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'confirm' | 'reject') => {
    try {
      const status = action === 'confirm' ? 'confirmed' : 'rejected';
      const { error } = await updateSpaceBooking(bookingId, { status });
      
      if (error) throw error;
      
      // Refresh bookings
      loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!user) {
    return (
      <div className="text-center p-6">
        <p className="text-forest-600">Please sign in to manage bookings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-forest-800">Booking Management</h2>
          <p className="text-forest-600 mt-1">Manage booking requests for your spaces</p>
        </div>
        
        {/* Status Filter */}
        <div className="mt-4 sm:mt-0">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-earth-500"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
            <option value="all">All Bookings</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-8">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-forest-600">Loading bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-forest-300 mx-auto mb-4" />
          <p className="text-forest-600">
            {selectedStatus === 'all' ? 'No bookings found' : `No ${selectedStatus} bookings`}
          </p>
        </div>
      ) : (
        /* Bookings List */
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl border border-forest-100 overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  {/* Booking Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-forest-800">
                          {booking.space?.name}
                        </h3>
                        <p className="text-forest-600 text-sm">
                          Requested by {booking.user?.full_name || booking.user?.email}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-forest-500" />
                        <span className="text-forest-700">{formatDate(booking.start_time)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-forest-500" />
                        <span className="text-forest-700">
                          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-forest-500" />
                        <span className="text-forest-700">{booking.notes.attendees || 1} people</span>
                      </div>
                    </div>

                    {/* Event Details */}
                    {booking.notes.eventTitle && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-forest-800">{booking.notes.eventTitle}</h4>
                        {booking.notes.eventDescription && (
                          <p className="text-sm text-forest-600">{booking.notes.eventDescription}</p>
                        )}
                      </div>
                    )}

                    {/* Special Requests */}
                    {booking.notes.specialRequests && (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <h5 className="text-sm font-medium text-blue-800 mb-1">Special Requests:</h5>
                        <p className="text-sm text-blue-700">{booking.notes.specialRequests}</p>
                      </div>
                    )}

                    {/* Donation Amount */}
                    {booking.notes.donationAmount && parseFloat(booking.notes.donationAmount) > 0 && (
                      <div className="flex items-center space-x-2 text-sm">
                        <DollarSign className="h-4 w-4 text-earth-500" />
                        <span className="text-earth-700">
                          Contribution: ${booking.notes.donationAmount}
                        </span>
                      </div>
                    )}

                    {/* Contact Info */}
                    {booking.notes.contactInfo && (
                      <div className="text-sm text-forest-600">
                        <strong>Contact:</strong> {booking.notes.contactInfo.email}
                        {booking.notes.contactInfo.phone && ` • ${booking.notes.contactInfo.phone}`}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {booking.status === 'pending' && (
                    <div className="mt-4 lg:mt-0 lg:ml-6 flex space-x-3">
                      <button
                        onClick={() => handleBookingAction(booking.id, 'reject')}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                        <span>Decline</span>
                      </button>
                      <button
                        onClick={() => handleBookingAction(booking.id, 'confirm')}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                      >
                        <Check className="h-4 w-4" />
                        <span>Approve</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingManagement;