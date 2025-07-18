import React, { useState } from 'react';
import { X, Calendar, MapPin, Clock, Users, DollarSign, AlertCircle, Check } from 'lucide-react';
import { Event } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useAuthContext } from './AuthProvider';

interface EventRegistrationModalProps {
  event: Event & {
    organizer?: {
      id: string;
      full_name: string;
    };
    participant_count?: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EventRegistrationModal: React.FC<EventRegistrationModalProps> = ({
  event,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    guestCount: 0,
    specialRequirements: '',
    emergencyContact: '',
    donationAmount: '',
    agreeToTerms: false
  });

  if (!isOpen) return null;

  const eventDate = new Date(event.date + 'T' + event.start_time);
  const endTime = new Date(event.date + 'T' + event.end_time);
  const isFull = event.capacity > 0 && (event.participant_count || 0) >= event.capacity;
  const canRegister = !isFull || event.waitlist_enabled;

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const getExchangeDetails = () => {
    switch (event.exchange_type) {
      case 'free':
        return { text: 'This is a free event', showDonation: false };
      case 'donation':
        return { 
          text: `Suggested donation: ${event.suggested_donation || 'Pay what you can'}`, 
          showDonation: true 
        };
      case 'fixed':
        return { 
          text: `Price: ${event.suggested_donation}`, 
          showDonation: true,
          required: true 
        };
      case 'sliding_scale':
        return { 
          text: `Sliding scale: $${event.minimum_donation || 0} - $${event.maximum_donation || '∞'}`, 
          showDonation: true 
        };
      case 'barter':
        return { 
          text: `Exchange: ${event.suggested_donation || 'See details'}`, 
          showDonation: false 
        };
      default:
        return { text: 'Free event', showDonation: false };
    }
  };

  const exchangeDetails = getExchangeDetails();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be signed in to register for events');
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the terms to continue');
      return;
    }

    if (exchangeDetails.required && !formData.donationAmount) {
      setError('Please enter the required amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if user can register
      const { data: canRegisterData, error: checkError } = await supabase
        .rpc('can_register_for_event', {
          p_event_id: event.id,
          p_user_id: user.id
        });

      if (checkError) throw checkError;
      
      if (!canRegisterData) {
        setError('Registration is not available for this event');
        return;
      }

      // Create registration
      const registrationData: any = {
        event_id: event.id,
        user_id: user.id,
        status: isFull && event.waitlist_enabled ? 'waitlisted' : 'registered',
        guest_count: formData.guestCount,
        special_requirements: formData.specialRequirements.trim() || null,
        emergency_contact: formData.emergencyContact.trim() || null
      };

      // Add donation info if applicable
      if (exchangeDetails.showDonation && formData.donationAmount) {
        registrationData.donation_amount = parseFloat(formData.donationAmount);
        registrationData.payment_status = 'pending';
      }

      const { error: insertError } = await supabase
        .from('event_participants')
        .insert([registrationData]);

      if (insertError) throw insertError;

      // Success!
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register for event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-forest-50 px-6 py-4 border-b border-forest-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-forest-800">
              {isFull && event.waitlist_enabled ? 'Join Waitlist' : 'Register for Event'}
            </h2>
            <button
              onClick={onClose}
              className="text-forest-600 hover:text-forest-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Event Details */}
          <div className="mb-6 space-y-3">
            <h3 className="text-lg font-semibold text-forest-800">{event.title}</h3>
            
            <div className="space-y-2 text-sm text-forest-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{formatDateTime(eventDate)}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>{formatTime(eventDate)} - {formatTime(endTime)}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{event.location_name}</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                <span>
                  {event.participant_count || 0}
                  {event.capacity > 0 ? ` / ${event.capacity} registered` : ' registered'}
                  {isFull && event.waitlist_enabled && ' (Waitlist available)'}
                </span>
              </div>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                <span>{exchangeDetails.text}</span>
              </div>
            </div>

            {isFull && event.waitlist_enabled && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">This event is full</p>
                    <p className="mt-1">You'll be added to the waitlist and notified if a spot becomes available.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Guest Count */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">
                Additional Guests
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={formData.guestCount}
                onChange={(e) => setFormData(prev => ({ ...prev, guestCount: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
              <p className="text-xs text-forest-600 mt-1">
                Number of additional people you're bringing (not including yourself)
              </p>
            </div>

            {/* Donation Amount */}
            {exchangeDetails.showDonation && (
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">
                  {event.exchange_type === 'fixed' ? 'Amount' : 'Donation Amount'}
                  {exchangeDetails.required && ' *'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-600">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min={event.minimum_donation || 0}
                    max={event.maximum_donation || undefined}
                    value={formData.donationAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, donationAmount: e.target.value }))}
                    className="w-full pl-8 pr-4 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                    placeholder={event.exchange_type === 'sliding_scale' ? `${event.minimum_donation || 0} - ${event.maximum_donation || '∞'}` : '0.00'}
                    required={exchangeDetails.required}
                  />
                </div>
              </div>
            )}

            {/* Special Requirements */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">
                Special Requirements or Dietary Restrictions
              </label>
              <textarea
                rows={2}
                value={formData.specialRequirements}
                onChange={(e) => setFormData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                placeholder="Let us know about any accommodations you need..."
                className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">
                Emergency Contact (Optional)
              </label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                placeholder="Name and phone number"
                className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>

            {/* Terms Agreement */}
            <div className="bg-forest-50 rounded-lg p-4">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 text-forest-600 bg-white border-forest-300 rounded focus:ring-forest-500"
                />
                <span className="text-sm text-forest-700">
                  I understand that my registration is a commitment to attend. If I cannot make it, 
                  I will cancel my registration at least 24 hours in advance to allow others to participate.
                </span>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-forest-300 text-forest-700 rounded-lg hover:bg-forest-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !canRegister || !formData.agreeToTerms}
              className="px-6 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>{isFull && event.waitlist_enabled ? 'Join Waitlist' : 'Complete Registration'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventRegistrationModal;