import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, DollarSign, Sprout, Bot as Lotus, ChefHat, Palette, Stethoscope, Music, Plus, X, Camera, Star } from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';

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
    capacity: '',
    skillLevel: 'beginner',
    donationAmount: '',
    materials: [],
    recurring: false,
    recurrencePattern: 'weekly',
    eventType: 'local' as 'local' | 'virtual' | 'global_physical'
  });

  const [newMaterial, setNewMaterial] = useState('');

  const categories = [
    { id: 'gardening', name: 'Gardening & Sustainability', icon: Sprout, color: 'text-green-600 bg-green-50' },
    { id: 'yoga', name: 'Yoga & Meditation', icon: Lotus, color: 'text-purple-600 bg-purple-50' },
    { id: 'cooking', name: 'Cooking & Nutrition', icon: ChefHat, color: 'text-orange-600 bg-orange-50' },
    { id: 'art', name: 'Art & Creativity', icon: Palette, color: 'text-pink-600 bg-pink-50' },
    { id: 'healing', name: 'Healing & Wellness', icon: Stethoscope, color: 'text-blue-600 bg-blue-50' },
    { id: 'music', name: 'Music & Movement', icon: Music, color: 'text-indigo-600 bg-indigo-50' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    if (!formData.capacity || parseInt(formData.capacity) < 1) {
      setError('Capacity must be at least 1');
      return false;
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
      const eventData = {
        organizer_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        event_type: formData.eventType,
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        location_name: formData.location.trim(),
        address: formData.address.trim() || null,
        capacity: parseInt(formData.capacity),
        skill_level: formData.skillLevel,
        donation_suggested: formData.donationAmount.trim() || null,
        materials_needed: formData.materials,
        is_recurring: formData.recurring,
        recurrence_pattern: formData.recurring ? formData.recurrencePattern : null,
        status: 'active' as const,
        verified: false
      };

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

      setSuccess('Event created successfully!');
      
      // Redirect to the event or activities page after a short delay
      setTimeout(() => {
        navigate('/activities');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to create event');
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
                <label className="block text-sm font-medium text-forest-700 mb-3">Holistic Category</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleInputChange('category', category.id)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                          formData.category === category.id
                            ? 'border-forest-300 bg-forest-50 transform scale-105'
                            : 'border-forest-100 hover:border-forest-200 hover:bg-forest-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${category.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className="font-medium text-forest-800 text-sm">{category.name}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
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
                    <h4 className="font-semibold text-forest-800 mb-1">Global Physical</h4>
                    <p className="text-sm text-forest-600">Multiple locations worldwide</p>
                  </button>
                </div>
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
              
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">
                  {formData.eventType === 'virtual' ? 'Platform/Link' : 'Venue Name'}
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder={
                    formData.eventType === 'virtual' 
                      ? "e.g., Zoom, Google Meet, or platform details"
                      : "e.g., My backyard garden, Community center, Local park pavilion"
                  }
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  required
                />
                
                {formData.eventType !== 'virtual' && (
                  <div className="mt-4">
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
                )}
              </div>
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
                    placeholder="e.g., 10"
                    min="1"
                    required
                    className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
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
                  Suggested Donation
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={formData.donationAmount}
                    onChange={(e) => handleInputChange('donationAmount', e.target.value)}
                    placeholder="e.g., $5-10, Free, Pay what you can"
                    className="flex-1 px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-forest-600 mt-1">
                  All donations support community growth and sustainability
                </p>
              </div>
            </div>

            {/* Materials & Requirements */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-forest-800 border-b border-forest-100 pb-3">
                What to Bring
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">Materials for Participants to Bring</label>
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