import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, DollarSign, Plus, X, Star, Globe, Video, Book, Save } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase } from '../lib/supabase';
import HolisticCategorySelector from './HolisticCategorySelector';
import { DatePicker, TimePicker } from './DateTimePicker';

interface EventEditModalProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  onEventUpdated?: () => void;
}

const EventEditModal: React.FC<EventEditModalProps> = ({ event, isOpen, onClose, onEventUpdated }) => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    address: '',
    capacity: '0',
    skillLevel: 'all',
    donationAmount: '',
    materials: [] as string[],
    recurring: false,
    recurrencePattern: 'weekly',
    eventType: 'local' as 'local' | 'virtual' | 'global_physical',
    virtualMeetingUrl: '',
    virtualPlatform: '',
    registrationRequired: true,
    registrationDeadline: '',
    waitlistEnabled: true,
    prerequisites: '',
    whatToBring: '',
    isFree: true,
    exchangeType: 'free' as 'donation' | 'fixed' | 'sliding_scale' | 'barter' | 'free',
    minimumDonation: '',
    maximumDonation: '',
    tags: [] as string[],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    space_id: '',
    time_offering_id: ''
  });

  const [newMaterial, setNewMaterial] = useState('');
  const [newTag, setNewTag] = useState('');

  // Pre-populate form when event changes
  useEffect(() => {
    if (event && isOpen) {
      setFormData({
        title: event.title || '',
        category: event.category || '',
        description: event.description || '',
        date: event.date || '',
        startTime: event.start_time || '09:00',
        endTime: event.end_time || '10:00',
        location: event.location_name || '',
        address: event.address || '',
        capacity: event.capacity?.toString() || '0',
        skillLevel: event.skill_level || 'all',
        donationAmount: event.donation_amount || '',
        materials: [], // TODO: Load from event_materials if needed
        recurring: event.recurring || false,
        recurrencePattern: event.recurrence_pattern || 'weekly',
        eventType: event.event_type || 'local',
        virtualMeetingUrl: event.virtual_meeting_url || '',
        virtualPlatform: event.virtual_platform || '',
        registrationRequired: event.registration_required || false,
        registrationDeadline: event.registration_deadline || '',
        waitlistEnabled: event.waitlist_enabled || false,
        prerequisites: event.prerequisites || '',
        whatToBring: event.what_to_bring || '',
        isFree: event.is_free || true,
        exchangeType: event.exchange_type || 'free',
        minimumDonation: event.minimum_donation?.toString() || '',
        maximumDonation: event.maximum_donation?.toString() || '',
        tags: event.tags || [],
        timezone: event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        space_id: event.space_id || '',
        time_offering_id: event.time_offering_id || ''
      });
    }
  }, [event, isOpen]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'exchangeType') {
      setFormData(prev => ({
        ...prev,
        isFree: value === 'free',
        donationAmount: value === 'free' ? '' : prev.donationAmount
      }));
    }

    if (field === 'capacity' && value === '0') {
      setFormData(prev => ({
        ...prev,
        waitlistEnabled: false
      }));
    }
  };

  const addMaterial = () => {
    if (newMaterial.trim()) {
      setFormData(prev => ({
        ...prev,
        materials: [...prev.materials, newMaterial.trim()]
      }));
      setNewMaterial('');
    }
  };

  const removeMaterial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Event title is required');
      return false;
    }
    if (!formData.category) {
      setError('Please select a category');
      return false;
    }
    if (!formData.date) {
      setError('Event date is required');
      return false;
    }
    if (!formData.startTime || !formData.endTime) {
      setError('Start and end times are required');
      return false;
    }
    if (!formData.location.trim()) {
      setError('Event location is required');
      return false;
    }
    if (formData.eventType === 'virtual' && !formData.virtualMeetingUrl.trim()) {
      setError('Virtual meeting URL is required for virtual events');
      return false;
    }
    if (formData.registrationRequired && formData.registrationDeadline) {
      const deadline = new Date(formData.registrationDeadline);
      const eventDate = new Date(formData.date + 'T' + formData.startTime);
      if (deadline > eventDate) {
        setError('Registration deadline must be before the event starts');
        return false;
      }
    }
    if (!formData.isFree && formData.exchangeType === 'sliding_scale') {
      if (!formData.minimumDonation || !formData.maximumDonation) {
        setError('Please specify minimum and maximum amounts for sliding scale');
        return false;
      }
      if (parseFloat(formData.minimumDonation) > parseFloat(formData.maximumDonation)) {
        setError('Minimum donation cannot be greater than maximum');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be signed in to edit events');
      return;
    }

    // Verify user is the organizer
    if (event.organizer_id !== user.id) {
      setError('Only the event organizer can edit this event');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare update data
      const updateData: any = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        event_type: formData.eventType || 'local',
        location_name: formData.location.trim() || null,
        address: formData.address?.trim() || null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        skill_level: formData.skillLevel || null,
        is_free: formData.isFree,
        exchange_type: formData.exchangeType || null,
        prerequisites: formData.prerequisites?.trim() || null,
        registration_required: formData.registrationRequired || false,
        waitlist_enabled: formData.waitlistEnabled || false,
        what_to_bring: formData.whatToBring?.trim() || null,
        tags: formData.tags
      };

      // Add registration deadline if required
      if (formData.registrationRequired && formData.registrationDeadline) {
        updateData.registration_deadline = formData.registrationDeadline;
      }

      // Add virtual event fields if needed
      if (formData.eventType === 'virtual') {
        updateData.virtual_meeting_url = formData.virtualMeetingUrl?.trim() || null;
        updateData.virtual_platform = formData.virtualPlatform || null;
      }

      // Add space/time offering if selected
      if (formData.space_id) {
        updateData.space_id = formData.space_id;
      }
      if (formData.time_offering_id) {
        updateData.time_offering_id = formData.time_offering_id;
      }

      // Update the event
      const { error: updateError } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', event.id);

      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw updateError;
      }

      setSuccess('Event updated successfully!');

      // Call callback if provided
      if (onEventUpdated) {
        onEventUpdated();
      }

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err: unknown) {
      console.error('Error updating event:', err);

      let errorMessage = 'Failed to update event';

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-forest-600 to-earth-500 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Save className="h-6 w-6" />
                <h2 className="text-xl font-semibold">Edit Event</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-white/80 text-sm">
              Update event details - changes will be visible to all participants
            </p>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-forest-800 border-b border-forest-100 pb-2">
                  Basic Information
                </h3>

                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">Event Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Morning Yoga Flow"
                    className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                    required
                  />
                </div>

                <div>
                  <HolisticCategorySelector
                    selectedCategory={formData.category}
                    onCategorySelect={(categoryId) => handleInputChange('category', categoryId)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">Description</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your event..."
                    className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                  />
                </div>

                {/* Event Type */}
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-3">Event Type</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => handleInputChange('eventType', 'local')}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        formData.eventType === 'local'
                          ? 'border-forest-300 bg-forest-50'
                          : 'border-forest-100 hover:border-forest-200'
                      }`}
                    >
                      <MapPin className="h-5 w-5 text-forest-600 mb-2" />
                      <h4 className="font-semibold text-forest-800 mb-1">Local Event</h4>
                      <p className="text-sm text-forest-600">In-person in your neighborhood</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('eventType', 'virtual')}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        formData.eventType === 'virtual'
                          ? 'border-forest-300 bg-forest-50'
                          : 'border-forest-100 hover:border-forest-200'
                      }`}
                    >
                      <Video className="h-5 w-5 text-forest-600 mb-2" />
                      <h4 className="font-semibold text-forest-800 mb-1">Virtual Event</h4>
                      <p className="text-sm text-forest-600">Online accessible globally</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('eventType', 'global_physical')}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        formData.eventType === 'global_physical'
                          ? 'border-forest-300 bg-forest-50'
                          : 'border-forest-100 hover:border-forest-200'
                      }`}
                    >
                      <Globe className="h-5 w-5 text-forest-600 mb-2" />
                      <h4 className="font-semibold text-forest-800 mb-1">Global Physical</h4>
                      <p className="text-sm text-forest-600">Multiple locations worldwide</p>
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">Tags</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="e.g., meditation, outdoor"
                      className="flex-1 px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="bg-forest-600 hover:bg-forest-700 text-white px-4 py-3 rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {formData.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-forest-100 text-forest-700 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                        >
                          <span>#{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="text-forest-500 hover:text-forest-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-forest-800 border-b border-forest-100 pb-2">
                  <Calendar className="h-5 w-5 inline mr-2" />
                  Schedule
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DatePicker
                    value={formData.date}
                    onChange={(date) => handleInputChange('date', date)}
                    minDate={new Date().toISOString().split('T')[0]}
                    label="Date"
                    required
                  />
                  <TimePicker
                    value={formData.startTime}
                    onChange={(time) => handleInputChange('startTime', time)}
                    label="Start Time"
                    required
                  />
                  <TimePicker
                    value={formData.endTime}
                    onChange={(time) => handleInputChange('endTime', time)}
                    label="End Time"
                    required
                  />
                </div>

                {/* Registration Settings */}
                <div className="bg-forest-50 rounded-lg p-4 space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.registrationRequired}
                      onChange={(e) => handleInputChange('registrationRequired', e.target.checked)}
                      className="w-4 h-4 text-forest-600 bg-forest-100 border-forest-300 rounded focus:ring-forest-500"
                    />
                    <span className="text-sm font-medium text-forest-700">Require registration</span>
                  </label>

                  {formData.registrationRequired && (
                    <div className="ml-7 space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.waitlistEnabled}
                          onChange={(e) => handleInputChange('waitlistEnabled', e.target.checked)}
                          disabled={formData.capacity === '0'}
                          className="w-4 h-4 text-forest-600 bg-forest-100 border-forest-300 rounded focus:ring-forest-500 disabled:opacity-50"
                        />
                        <span className="text-sm font-medium text-forest-700">Enable waitlist when full</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-forest-800 border-b border-forest-100 pb-2">
                  <MapPin className="h-5 w-5 inline mr-2" />
                  Location
                </h3>

                {formData.eventType === 'virtual' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        <Video className="h-4 w-4 inline mr-1" />
                        Virtual Platform
                      </label>
                      <select
                        value={formData.virtualPlatform}
                        onChange={(e) => handleInputChange('virtualPlatform', e.target.value)}
                        className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                      >
                        <option value="">Select platform</option>
                        <option value="zoom">Zoom</option>
                        <option value="meet">Google Meet</option>
                        <option value="teams">Microsoft Teams</option>
                        <option value="discord">Discord</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">Meeting URL</label>
                      <input
                        type="url"
                        value={formData.virtualMeetingUrl}
                        onChange={(e) => handleInputChange('virtualMeetingUrl', e.target.value)}
                        placeholder="https://zoom.us/j/..."
                        className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">Platform Details</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="e.g., Zoom Meeting Room"
                        className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">Venue Name</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="e.g., My backyard garden"
                        className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">Address (Optional)</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Street address - shared with confirmed participants"
                        className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Community Details */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-forest-800 border-b border-forest-100 pb-2">
                  Community Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      <Users className="h-4 w-4 inline mr-1" />
                      Maximum Participants
                    </label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => handleInputChange('capacity', e.target.value)}
                      placeholder="0 for unlimited"
                      min="0"
                      className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      <Star className="h-4 w-4 inline mr-1" />
                      Skill Level
                    </label>
                    <select
                      value={formData.skillLevel}
                      onChange={(e) => handleInputChange('skillLevel', e.target.value)}
                      className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                    >
                      <option value="beginner">Beginner Friendly</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="all">All Levels</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    Exchange Type
                  </label>
                  <select
                    value={formData.exchangeType}
                    onChange={(e) => handleInputChange('exchangeType', e.target.value)}
                    className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 mb-4"
                  >
                    <option value="free">Free</option>
                    <option value="donation">Suggested Donation</option>
                    <option value="fixed">Fixed Price</option>
                    <option value="sliding_scale">Sliding Scale</option>
                    <option value="barter">Barter/Exchange</option>
                  </select>

                  {(formData.exchangeType === 'donation' || formData.exchangeType === 'fixed' || formData.exchangeType === 'barter') && (
                    <input
                      type="text"
                      value={formData.donationAmount}
                      onChange={(e) => handleInputChange('donationAmount', e.target.value)}
                      placeholder={formData.exchangeType === 'donation' ? 'e.g., $5-10' : formData.exchangeType === 'fixed' ? 'e.g., $20' : 'e.g., Bring a dish'}
                      className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                    />
                  )}

                  {formData.exchangeType === 'sliding_scale' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-forest-700 mb-1">Minimum</label>
                        <input
                          type="number"
                          value={formData.minimumDonation}
                          onChange={(e) => handleInputChange('minimumDonation', e.target.value)}
                          placeholder="0"
                          min="0"
                          className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-forest-700 mb-1">Maximum</label>
                        <input
                          type="number"
                          value={formData.maximumDonation}
                          onChange={(e) => handleInputChange('maximumDonation', e.target.value)}
                          placeholder="50"
                          min="0"
                          className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    <Book className="h-4 w-4 inline mr-1" />
                    Prerequisites
                  </label>
                  <textarea
                    rows={2}
                    value={formData.prerequisites}
                    onChange={(e) => handleInputChange('prerequisites', e.target.value)}
                    placeholder="Any requirements or prior experience needed..."
                    className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">What to Bring</label>
                  <textarea
                    rows={2}
                    value={formData.whatToBring}
                    onChange={(e) => handleInputChange('whatToBring', e.target.value)}
                    placeholder="What participants should bring..."
                    className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="border-t border-forest-100 pt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-3 border border-forest-300 text-forest-700 rounded-lg hover:bg-forest-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-forest-600 hover:bg-forest-700 disabled:bg-forest-300 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventEditModal;
