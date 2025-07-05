import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  X,
  CreditCard,
  DollarSign,
  MessageCircle,
  Star,
  Badge
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase, Space } from '../lib/supabase';

interface BookingSystemProps {
  space: Space;
  isOpen: boolean;
  onClose: () => void;
  onBookingComplete?: (bookingId: string) => void;
}

const BookingSystem: React.FC<BookingSystemProps> = ({
  space,
  isOpen,
  onClose,
  onBookingComplete
}) => {
  const { user } = useAuthContext();
  const [step, setStep] = useState(1); // 1: Details, 2: Payment, 3: Confirmation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingData, setBookingData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    attendees: 1,
    eventTitle: '',
    eventDescription: '',
    specialRequests: '',
    contactInfo: {
      phone: '',
      email: user?.email || ''
    },
    paymentMethod: 'card',
    donationAmount: ''
  });

  const [availability, setAvailability] = useState<any[]>([]);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && space) {
      loadAvailability();
      loadExistingBookings();
    }
  }, [isOpen, space]);

  const loadAvailability = async () => {
    try {
      const { data } = await supabase
        .from('space_availability')
        .select('*')
        .eq('space_id', space.id);
      
      setAvailability(data || []);
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const loadExistingBookings = async () => {
    try {
      const { data } = await supabase
        .from('space_bookings')
        .select('*')
        .eq('space_id', space.id)
        .in('status', ['confirmed', 'pending'])
        .gte('start_time', new Date().toISOString());
      
      setExistingBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setBookingData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setBookingData(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateStep1 = () => {
    if (!bookingData.date || !bookingData.startTime || !bookingData.endTime) {
      setError('Please fill in all required fields');
      return false;
    }
    
    if (bookingData.attendees > space.capacity) {
      setError(`Maximum capacity is ${space.capacity} people`);
      return false;
    }
    
    // Check for conflicts with existing bookings
    const bookingStart = new Date(`${bookingData.date}T${bookingData.startTime}`);
    const bookingEnd = new Date(`${bookingData.date}T${bookingData.endTime}`);
    
    const hasConflict = existingBookings.some(booking => {
      const existingStart = new Date(booking.start_time);
      const existingEnd = new Date(booking.end_time);
      
      return (bookingStart < existingEnd && bookingEnd > existingStart);
    });
    
    if (hasConflict) {
      setError('This time slot conflicts with an existing booking');
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    setError(null);
    
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      handleSubmitBooking();
    }
  };

  const formatAvailabilityTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getAvailableTimesForDate = (date: string) => {
    if (!date) return [];
    
    // Get day of week
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
    
    // Find availability for this day
    const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek);
    
    if (!dayAvailability || !dayAvailability.is_available || !dayAvailability.available_times) {
      return [];
    }
    
    try {
      // Parse available times
      const times = JSON.parse(dayAvailability.available_times);
      return times.map((timeSlot: any) => ({
        start: timeSlot.start,
        end: timeSlot.end,
        label: `${formatAvailabilityTime(timeSlot.start)} - ${formatAvailabilityTime(timeSlot.end)}`
      }));
    } catch (e) {
      console.error('Error parsing available times:', e);
      return [];
    }
  };

  const handleSubmitBooking = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const startDateTime = new Date(`${bookingData.date}T${bookingData.startTime}`);
      const endDateTime = new Date(`${bookingData.date}T${bookingData.endTime}`);
      
      const { data, error: bookingError } = await supabase
        .from('space_bookings')
        .insert([{
          space_id: space.id,
          user_id: user.id,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: 'pending',
          notes: JSON.stringify({
            eventTitle: bookingData.eventTitle,
            eventDescription: bookingData.eventDescription,
            attendees: bookingData.attendees,
            specialRequests: bookingData.specialRequests,
            contactInfo: bookingData.contactInfo,
            donationAmount: bookingData.donationAmount
          })
        }])
        .select()
        .single();
      
      if (bookingError) throw bookingError;
      
      // Create notification for space owner
      await supabase
        .from('notifications')
        .insert([{
          user_id: space.owner_id,
          type: 'booking',
          title: 'New Booking Request',
          content: `${user.email} has requested to book ${space.name} for ${bookingData.date}`,
          data: {
            booking_id: data.id,
            space_id: space.id,
            requester_id: user.id
          }
        }]);
      
      setStep(3);
      setBookingSuccess(true);
      onBookingComplete?.(data.id);
    } catch (err: any) {
      setError(err.message || 'Failed to submit booking');
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = () => {
    if (!bookingData.startTime || !bookingData.endTime) return 0;
    
    const start = new Date(`2000-01-01T${bookingData.startTime}`);
    const end = new Date(`2000-01-01T${bookingData.endTime}`);
    
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
  };

  const getEstimatedCost = () => {
    const duration = calculateDuration();
    if (space.donation_suggested && space.donation_suggested.includes('$')) {
      const baseAmount = parseFloat(space.donation_suggested.replace(/[^0-9.]/g, ''));
      return baseAmount * duration;
    }
    return 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-earth-500 to-earth-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Book Space</h2>
                <h3 className="text-earth-100">{space.name}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center space-x-4 mt-6">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNum ? 'bg-white text-earth-600' : 'bg-earth-400 text-earth-100'
                  }`}>
                    {step > stepNum ? <CheckCircle className="h-5 w-5" /> : stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div className={`w-12 h-1 mx-2 ${
                      step > stepNum ? 'bg-white' : 'bg-earth-400'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Step 1: Booking Details */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-forest-800">Booking Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={bookingData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-earth-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Number of Attendees *
                    </label>
                    <input
                      type="number"
                      value={bookingData.attendees}
                      onChange={(e) => handleInputChange('attendees', parseInt(e.target.value))}
                      min="1"
                      max={space.capacity}
                      className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-earth-500"
                      required
                    />
                    <p className="text-xs text-forest-600 mt-1">Maximum: {space.capacity} people</p>
                  </div>
                  
                  {/* Available Time Slots */}
                  {bookingData.date && (
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Available Time Slots
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {getAvailableTimesForDate(bookingData.date).length > 0 ? (
                          getAvailableTimesForDate(bookingData.date).map((slot: any, index: number) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                handleInputChange('startTime', slot.start);
                                handleInputChange('endTime', slot.end);
                              }}
                              className={`p-2 text-center rounded-lg text-sm transition-colors ${
                                bookingData.startTime === slot.start && bookingData.endTime === slot.end
                                  ? 'bg-earth-500 text-white'
                                  : 'bg-forest-50 text-forest-700 hover:bg-forest-100'
                              }`}
                            >
                              {slot.label}
                            </button>
                          ))
                        ) : (
                          <div className="col-span-full p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
                            No available time slots for this date. Please select another date.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={bookingData.startTime}
                      onChange={(e) => handleInputChange('startTime', e.target.value)}
                      className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-earth-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={bookingData.endTime}
                      onChange={(e) => handleInputChange('endTime', e.target.value)}
                      className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-earth-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={bookingData.eventTitle}
                    onChange={(e) => handleInputChange('eventTitle', e.target.value)}
                    placeholder="e.g., Yoga Workshop, Art Circle, Community Meeting"
                    className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-earth-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Event Description
                  </label>
                  <textarea
                    value={bookingData.eventDescription}
                    onChange={(e) => handleInputChange('eventDescription', e.target.value)}
                    placeholder="Briefly describe your event or gathering..."
                    rows={3}
                    className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-earth-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Special Requests
                  </label>
                  <textarea
                    value={bookingData.specialRequests}
                    onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                    placeholder="Any special setup requirements or requests..."
                    rows={2}
                    className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-earth-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={bookingData.contactInfo.phone}
                      onChange={(e) => handleInputChange('contactInfo.phone', e.target.value)}
                      placeholder="Your phone number"
                      className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-earth-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={bookingData.contactInfo.email}
                      onChange={(e) => handleInputChange('contactInfo.email', e.target.value)}
                      className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-earth-500"
                      required
                    />
                  </div>
                </div>

                {/* Booking Summary */}
                <div className="bg-earth-50 rounded-xl p-4">
                  <h4 className="font-semibold text-forest-800 mb-3">Booking Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-forest-600">Duration:</span>
                      <span className="font-medium text-forest-800">
                        {calculateDuration()} hours
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-forest-600">Attendees:</span>
                      <span className="font-medium text-forest-800">{bookingData.attendees} people</span>
                    </div>
                    {space.donation_suggested && (
                      <div className="flex justify-between">
                        <span className="text-forest-600">Suggested Contribution:</span>
                        <span className="font-medium text-earth-600">{space.donation_suggested}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-forest-800">Payment & Contribution</h3>
                
                {space.donation_suggested ? (
                  <div className="space-y-4">
                    <div className="bg-earth-50 rounded-xl p-4">
                      <h4 className="font-semibold text-forest-800 mb-2">Suggested Contribution</h4>
                      <p className="text-forest-600 mb-3">{space.donation_suggested}</p>
                      <p className="text-sm text-forest-600">
                        Contributions help maintain the space and support the community.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Your Contribution Amount
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-forest-400" />
                        <input
                          type="number"
                          value={bookingData.donationAmount}
                          onChange={(e) => handleInputChange('donationAmount', e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="w-full pl-10 pr-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-earth-500"
                        />
                      </div>
                      <p className="text-xs text-forest-600 mt-1">
                        Enter 0 if you cannot contribute at this time
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Payment Method
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3 p-3 border border-forest-200 rounded-lg cursor-pointer hover:bg-forest-50">
                          <input
                            type="radio"
                            value="card"
                            checked={bookingData.paymentMethod === 'card'}
                            onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                            className="w-4 h-4 text-earth-600"
                          />
                          <CreditCard className="h-5 w-5 text-forest-600" />
                          <span className="text-forest-700">Credit/Debit Card</span>
                        </label>
                        <label className="flex items-center space-x-3 p-3 border border-forest-200 rounded-lg cursor-pointer hover:bg-forest-50">
                          <input
                            type="radio"
                            value="cash"
                            checked={bookingData.paymentMethod === 'cash'}
                            onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                            className="w-4 h-4 text-earth-600"
                          />
                          <DollarSign className="h-5 w-5 text-forest-600" />
                          <span className="text-forest-700">Pay in person (cash)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <h4 className="font-semibold text-green-800 mb-2">Free Space</h4>
                    <p className="text-green-600">
                      This space is offered free of charge by the community member.
                    </p>
                  </div>
                )}

                {/* Terms */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Booking Terms</h4>
                  <ul className="text-sm text-blue-600 space-y-1">
                    <li>• Bookings are subject to space owner approval</li>
                    <li>• Please respect the space and follow all guidelines</li>
                    <li>• Cancellations must be made at least 24 hours in advance</li>
                    <li>• You will be notified once your booking is confirmed</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="text-center space-y-6">
                <div className={`rounded-full w-20 h-20 flex items-center justify-center mx-auto ${bookingSuccess ? 'bg-green-50' : 'bg-yellow-50'}`}>
                  <CheckCircle className={`h-12 w-12 ${bookingSuccess ? 'text-green-500' : 'text-yellow-500'}`} />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-forest-800 mb-2">
                    {bookingSuccess ? 'Booking Request Sent!' : 'Booking Pending'}
                  </h3>
                  <p className="text-forest-600 max-w-md mx-auto">
                    {bookingSuccess 
                      ? 'Your booking request has been sent to the space owner. You\'ll receive a notification once it\'s reviewed.'
                      : 'Your booking is being processed. Please wait a moment...'}
                  </p>
                </div>

                <div className="bg-forest-50 rounded-xl p-6 text-left">
                  <h4 className="font-semibold text-forest-800 mb-3">Booking Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-forest-600">Space:</span>
                      <span className="font-medium text-forest-800">{space.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-forest-600">Date:</span>
                      <span className="font-medium text-forest-800">{bookingData.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-forest-600">Time:</span>
                      <span className="font-medium text-forest-800">
                        {bookingData.startTime} - {bookingData.endTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-forest-600">Attendees:</span>
                      <span className="font-medium text-forest-800">{bookingData.attendees} people</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="flex-1 bg-forest-600 hover:bg-forest-700 text-white py-3 px-6 rounded-xl font-medium transition-colors"
                    disabled={!bookingSuccess}
                  >
                    Done
                  </button>
                  <button 
                    className="flex-1 bg-earth-100 text-earth-700 hover:bg-earth-200 py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                    disabled={!bookingSuccess}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Message Owner</span>
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {step < 3 && (
              <div className="flex justify-between pt-6 border-t border-forest-100">
                <button
                  onClick={step === 1 ? onClose : () => setStep(step - 1)}
                  className="px-6 py-2 text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"
                >
                  {step === 1 ? 'Cancel' : 'Back'}
                </button>
                
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="bg-earth-600 hover:bg-earth-700 disabled:bg-earth-300 text-white px-8 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>{step === 1 ? 'Continue' : 'Submit Request'}</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSystem;