import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, DollarSign, Plus, X, Star, Globe, Video, Clock, Book, AlertCircle } from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import HolisticCategorySelector from '../components/HolisticCategorySelector';

const CreateEvent = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    address: '',
    capacity: '0',
    skillLevel: 'all',
    donationAmount: '',
    materials: [] as string[],
    recurring: false,
    recurrencePattern: 'weekly',
    eventType: 'local' as 'local' | 'virtual' | 'global_physical',
    // New fields from comprehensive schema
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
  const [userSpaces, setUserSpaces] = useState<any[]>([]);
  const [userTimeOfferings, setUserTimeOfferings] = useState<any[]>([]);

  // Load user's spaces and time offerings
  useEffect(() => {
    if (user) {
      loadUserResources();
    }
  }, [user]);

  const loadUserResources = async () => {
    if (!user) return;

    // Load user's spaces
    const { data: spaces } = await supabase
      .from('spaces')
      .select('id, name')
      .eq('owner_id', user.id)
      .eq('status', 'active');

    if (spaces) {
      setUserSpaces(spaces);
    }

    // Load user's time offerings
    const { data: offerings } = await supabase
      .from('time_offerings')
      .select('id, service_type, title')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (offerings) {
      setUserTimeOfferings(offerings);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Update related fields
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
      setError('You must be signed in to create an event');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare event data matching the new schema
      const eventData: any = {
        organizer_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        event_type: formData.eventType,
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        timezone: formData.timezone,
        location_name: formData.location.trim(),
        address: formData.address.trim() || null,
        capacity: parseInt(formData.capacity),
        registration_required: formData.registrationRequired,
        registration_deadline: formData.registrationDeadline || null,
        waitlist_enabled: formData.waitlistEnabled,
        skill_level: formData.skillLevel,
        prerequisites: formData.prerequisites.trim() || null,
        what_to_bring: formData.whatToBring.trim() || null,
        is_free: formData.isFree,
        suggested_donation: formData.donationAmount.trim() || null,
        minimum_donation: formData.minimumDonation ? parseFloat(formData.minimumDonation) : null,
        maximum_donation: formData.maximumDonation ? parseFloat(formData.maximumDonation) : null,
        exchange_type: formData.exchangeType,
        is_recurring: formData.recurring,
        recurrence_rule: formData.recurring ? formData.recurrencePattern : null,
        tags: formData.tags,
        status: 'published',
        visibility: 'public'
      };

      // Add virtual event fields if applicable
      if (formData.eventType === 'virtual') {
        eventData.virtual_meeting_url = formData.virtualMeetingUrl.trim();
        eventData.virtual_platform = formData.virtualPlatform || null;
      }

      // Add space/time offering connections if applicable
      if (formData.space_id) {
        eventData.space_id = formData.space_id;
      }
      if (formData.time_offering_id) {
        eventData.time_offering_id = formData.time_offering_id;
      }

      const { data, error: insertError } = await supabase
        .from('events')
        .insert([eventData])
        .select(`
          *,
          organizer:profiles(id, full_name, avatar_url, verified)
        `)
        .single();

      if (insertError) {
        throw insertError;
      }
      
      console.log("Event created successfully:", data);

      // Add materials if any
      if (formData.materials.length > 0) {
        const materials = formData.materials.map(material => ({
          event_id: data.id,
          item: material,
          is_required: true,
          provider: 'participant'
        }));

        await supabase
          .from('event_materials')
          .insert(materials);
      }

      // Add the organizer as a participant automatically
      try {
        await supabase
          .from('event_participants')
          .insert([{
            event_id: data.id,
            user_id: user.id,
            status: 'registered',
            registered_at: new Date().toISOString()
          }]);
          
        console.log("Added organizer as participant");
      } catch (err) {
        console.error("Error adding organizer as participant:", err);
      }
      
      setSuccess('Event created successfully!');
      
      // Redirect to the event or activities page after a short delay
      setTimeout(() => {
        navigate('/activities');
      }, 2000);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-forest-800 mb-2">Create Holistic Event</h1>
          <p className="text-forest-600">Share your practice with the neighborhood community</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
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
              <h2 className="text-xl font-semibold text-forest-800 border-b border-forest-100 pb-3">
                Basic Information
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">Event Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Morning Yoga Flow, Community Garden Workday"
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
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
                  placeholder="Describe your event, what participants can expect, and any special focuses..."
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
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
                        : 'border-forest-100 hover:border-forest-200 hover:bg-forest-50'
                    }`}
                  >
                    <MapPin className="h-5 w-5 text-forest-600 mb-2" />
                    <h4 className="font-semibold text-forest-800 mb-1">Local Event</h4>
                    <p className="text-sm text-forest-600">In-person event in your neighborhood</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('eventType', 'virtual')}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      formData.eventType === 'virtual'
                        ? 'border-forest-300 bg-forest-50'
                        : 'border-forest-100 hover:border-forest-200 hover:bg-forest-50'
                    }`}
                  >
                    <Video className="h-5 w-5 text-forest-600 mb-2" />
                    <h4 className="font-semibold text-forest-800 mb-1">Virtual Event</h4>
                    <p className="text-sm text-forest-600">Online event accessible globally</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('eventType', 'global_physical')}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      formData.eventType === 'global_physical'
                        ? 'border-forest-300 bg-forest-50'
                        : 'border-forest-100 hover:border-forest-200 hover:bg-forest-50'
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
                    placeholder="e.g., meditation, outdoor, beginners"
                    className="flex-1 px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
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
              <h2 className="text-xl font-semibold text-forest-800 border-b border-forest-100 pb-3">
                <Calendar className="h-5 w-5 inline mr-2" />
                Schedule
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Registration Settings */}
              <div className="bg-forest-50 rounded-lg p-4 space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.registrationRequired}
                    onChange={(e) => handleInputChange('registrationRequired', e.target.checked)}
                    className="w-4 h-4 text-forest-600 bg-forest-100 border-forest-300 rounded focus:ring-forest-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-forest-700">Require registration</span>
                </label>
                
                {formData.registrationRequired && (
                  <div className="ml-7 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-1">Registration deadline</label>
                      <input
                        type="datetime-local"
                        value={formData.registrationDeadline}
                        onChange={(e) => handleInputChange('registrationDeadline', e.target.value)}
                        className="px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                      />
                    </div>
                    
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.waitlistEnabled}
                        onChange={(e) => handleInputChange('waitlistEnabled', e.target.checked)}
                        disabled={formData.capacity === '0'}
                        className="w-4 h-4 text-forest-600 bg-forest-100 border-forest-300 rounded focus:ring-forest-500 focus:ring-2 disabled:opacity-50"
                      />
                      <span className="text-sm font-medium text-forest-700">Enable waitlist when full</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="bg-forest-50 rounded-lg p-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.recurring}
                    onChange={(e) => handleInputChange('recurring', e.target.checked)}
                    className="w-4 h-4 text-forest-600 bg-forest-100 border-forest-300 rounded focus:ring-forest-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-forest-700">Make this a recurring event</span>
                </label>
                {formData.recurring && (
                  <div className="mt-3">
                    <select
                      value={formData.recurrencePattern}
                      onChange={(e) => handleInputChange('recurrencePattern', e.target.value)}
                      className="px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-forest-800 border-b border-forest-100 pb-3">
                <MapPin className="h-5 w-5 inline mr-2" />
                Location
              </h2>
              
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
                      className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
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
                      className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-forest-600 mt-1">
                      Link will only be shared with registered participants
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">Platform Details</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="e.g., Zoom Meeting Room, Discord Server Name"
                      className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
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
                      placeholder="e.g., My backyard garden, Community center, Local park pavilion"
                      className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">Address (Optional)</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Street address - will only be shared with confirmed participants"
                      className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    />
                    <p className="text-xs text-forest-600 mt-1">
                      Exact address will only be shared with confirmed participants
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Participants & Donation */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-forest-800 border-b border-forest-100 pb-3">
                Community Details
              </h2>
              
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
                    placeholder="e.g., 10 (0 for unlimited)"
                    min="0"
                    className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  />
                  <p className="text-xs text-forest-600 mt-1">
                    Set to 0 for unlimited capacity
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    <Star className="h-4 w-4 inline mr-1" />
                    Skill Level
                  </label>
                  <select
                    value={formData.skillLevel}
                    onChange={(e) => handleInputChange('skillLevel', e.target.value)}
                    className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent mb-4"
                >
                  <option value="free">Free</option>
                  <option value="donation">Suggested Donation</option>
                  <option value="fixed">Fixed Price</option>
                  <option value="sliding_scale">Sliding Scale</option>
                  <option value="barter">Barter/Exchange</option>
                </select>

                {formData.exchangeType === 'donation' && (
                  <div>
                    <input
                      type="text"
                      value={formData.donationAmount}
                      onChange={(e) => handleInputChange('donationAmount', e.target.value)}
                      placeholder="e.g., $5-10, Pay what you can"
                      className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    />
                    <p className="text-xs text-forest-600 mt-1">
                      Suggested amount to support community growth
                    </p>
                  </div>
                )}

                {formData.exchangeType === 'fixed' && (
                  <div>
                    <input
                      type="text"
                      value={formData.donationAmount}
                      onChange={(e) => handleInputChange('donationAmount', e.target.value)}
                      placeholder="e.g., $20"
                      className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    />
                  </div>
                )}

                {formData.exchangeType === 'sliding_scale' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-forest-700 mb-1">Minimum</label>
                        <input
                          type="number"
                          value={formData.minimumDonation}
                          onChange={(e) => handleInputChange('minimumDonation', e.target.value)}
                          placeholder="0"
                          min="0"
                          className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
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
                          className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-forest-600">
                      Participants can choose amount based on their means
                    </p>
                  </div>
                )}

                {formData.exchangeType === 'barter' && (
                  <div>
                    <input
                      type="text"
                      value={formData.donationAmount}
                      onChange={(e) => handleInputChange('donationAmount', e.target.value)}
                      placeholder="e.g., Bring a dish to share, Energy exchange"
                      className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    />
                    <p className="text-xs text-forest-600 mt-1">
                      Describe what participants can offer in exchange
                    </p>
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
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Materials & Requirements */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-forest-800 border-b border-forest-100 pb-3">
                What to Bring & Requirements
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">What to Bring</label>
                <textarea
                  rows={2}
                  value={formData.whatToBring}
                  onChange={(e) => handleInputChange('whatToBring', e.target.value)}
                  placeholder="General instructions about what participants should bring..."
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent mb-4"
                />
                
                <label className="block text-sm font-medium text-forest-700 mb-2">Specific Materials</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMaterial}
                    onChange={(e) => setNewMaterial(e.target.value)}
                    placeholder="e.g., Yoga mat, Water bottle, Notebook"
                    className="flex-1 px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                  />
                  <button
                    type="button"
                    onClick={addMaterial}
                    className="bg-forest-600 hover:bg-forest-700 text-white px-4 py-3 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                {formData.materials.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.materials.map((material, index) => (
                      <span
                        key={index}
                        className="bg-forest-100 text-forest-700 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                      >
                        <span>{material}</span>
                        <button
                          type="button"
                          onClick={() => removeMaterial(index)}
                          className="text-forest-500 hover:text-forest-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Space/Time Offering Connection */}
              {(userSpaces.length > 0 || userTimeOfferings.length > 0) && (
                <div className="bg-forest-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-forest-700 mb-3">Connect to Your Offerings</h3>
                  
                  {userSpaces.length > 0 && (
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-forest-600 mb-1">Host at Your Space</label>
                      <select
                        onChange={(e) => handleInputChange('space_id', e.target.value)}
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
                      >
                        <option value="">Not using my space</option>
                        {userSpaces.map(space => (
                          <option key={space.id} value={space.id}>{space.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {userTimeOfferings.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-forest-600 mb-1">Part of Time Offering</label>
                      <select
                        onChange={(e) => handleInputChange('time_offering_id', e.target.value)}
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
                      >
                        <option value="">Not part of time offering</option>
                        {userTimeOfferings.map(offering => (
                          <option key={offering.id} value={offering.id}>
                            {offering.title || offering.service_type}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="border-t border-forest-100 pt-6">
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  disabled={loading}
                  className="px-6 py-3 border border-forest-300 text-forest-700 rounded-lg hover:bg-forest-50 transition-colors"
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-forest-600 hover:bg-forest-700 disabled:bg-forest-300 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Event</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;