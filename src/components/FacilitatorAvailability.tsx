import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Laptop, 
  DollarSign,
  Save,
  AlertCircle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { 
  getFacilitatorAvailability,
  updateFacilitatorAvailability,
  getFacilitatorSpecialties,
  updateFacilitatorSpecialties,
  FacilitatorAvailability as FacilitatorAvailabilityType,
  FacilitatorSpecialty
} from '../lib/supabase';
import { LoadingSpinner } from './LoadingStates';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { cn } from '../lib/utils';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const SPECIALTY_CATEGORIES = {
  'Wellness': ['Yoga', 'Meditation', 'Breathwork', 'Sound Healing', 'Reiki', 'Massage'],
  'Arts & Creativity': ['Painting', 'Drawing', 'Pottery', 'Music', 'Dance', 'Theater', 'Photography'],
  'Cooking & Nutrition': ['Cooking Classes', 'Nutrition Workshops', 'Meal Prep', 'Baking', 'Fermentation'],
  'Gardening & Nature': ['Gardening', 'Permaculture', 'Herbalism', 'Nature Walks', 'Foraging'],
  'Learning & Skills': ['Languages', 'Technology', 'Business', 'Personal Finance', 'DIY', 'Crafts'],
  'Community & Support': ['Support Groups', 'Book Clubs', 'Discussion Circles', 'Mentoring']
};

interface TimeSlot {
  start: string;
  end: string;
}

export const FacilitatorAvailability: React.FC = () => {
  const { user, profile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<Partial<FacilitatorAvailabilityType>>({
    is_active: false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    weekly_schedule: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    },
    min_advance_notice_hours: 24,
    max_advance_booking_days: 30,
    buffer_time_minutes: 15,
    preferred_session_lengths: [60, 90],
    max_sessions_per_day: 3,
    available_for_online: true,
    available_for_in_person: true,
    travel_radius_miles: 10,
    suggested_donation: '',
    availability_notes: ''
  });
  
  const [specialties, setSpecialties] = useState<Array<{
    specialty: string;
    category: string;
    experience_years: number;
  }>>([]);
  
  const [expandedDays, setExpandedDays] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadAvailability();
      loadSpecialties();
    }
  }, [user]);

  const loadAvailability = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await getFacilitatorAvailability(user.id);
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      
      if (data) {
        setAvailability(data);
      }
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSpecialties = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await getFacilitatorSpecialties(user.id);
      if (error) throw error;
      
      if (data) {
        setSpecialties(data.map(s => ({
          specialty: s.specialty,
          category: s.category,
          experience_years: s.experience_years
        })));
      }
    } catch (error) {
      console.error('Error loading specialties:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Save availability
      const { error: availError } = await updateFacilitatorAvailability(user.id, availability);
      if (availError) throw availError;
      
      // Save specialties
      const { error: specError } = await updateFacilitatorSpecialties(user.id, specialties);
      if (specError) throw specError;
      
      alert('Availability saved successfully!');
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Failed to save availability. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setExpandedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const addTimeSlot = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      weekly_schedule: {
        ...prev.weekly_schedule!,
        [day]: [...(prev.weekly_schedule![day] || []), { start: '09:00', end: '17:00' }]
      }
    }));
  };

  const updateTimeSlot = (day: string, index: number, field: 'start' | 'end', value: string) => {
    setAvailability(prev => ({
      ...prev,
      weekly_schedule: {
        ...prev.weekly_schedule!,
        [day]: prev.weekly_schedule![day].map((slot, i) =>
          i === index ? { ...slot, [field]: value } : slot
        )
      }
    }));
  };

  const removeTimeSlot = (day: string, index: number) => {
    setAvailability(prev => ({
      ...prev,
      weekly_schedule: {
        ...prev.weekly_schedule!,
        [day]: prev.weekly_schedule![day].filter((_, i) => i !== index)
      }
    }));
  };

  const addSpecialty = () => {
    setSpecialties(prev => [
      ...prev,
      { specialty: '', category: Object.keys(SPECIALTY_CATEGORIES)[0], experience_years: 1 }
    ]);
  };

  const updateSpecialty = (index: number, field: keyof typeof specialties[0], value: any) => {
    setSpecialties(prev =>
      prev.map((s, i) => i === index ? { ...s, [field]: value } : s)
    );
  };

  const removeSpecialty = (index: number) => {
    setSpecialties(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" text="Loading availability..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Status */}
      <Card>
        <CardHeader>
          <CardTitle>Facilitator Status</CardTitle>
          <CardDescription>
            Enable this to appear in the facilitator directory and receive booking requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_active"
              checked={availability.is_active}
              onChange={(e) => setAvailability(prev => ({ ...prev, is_active: e.target.checked }))}
              className="h-4 w-4 text-forest-600 focus:ring-forest-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              I am available as a facilitator
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Specialties */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Areas of Expertise</CardTitle>
              <CardDescription>
                What types of events or workshops do you facilitate?
              </CardDescription>
            </div>
            <Button onClick={addSpecialty} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Specialty
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {specialties.map((specialty, index) => (
              <div key={index} className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={specialty.category}
                    onChange={(e) => updateSpecialty(index, 'category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-forest-500 focus:border-forest-500"
                  >
                    {Object.keys(SPECIALTY_CATEGORIES).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specialty
                  </label>
                  <select
                    value={specialty.specialty}
                    onChange={(e) => updateSpecialty(index, 'specialty', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-forest-500 focus:border-forest-500"
                  >
                    <option value="">Select...</option>
                    {SPECIALTY_CATEGORIES[specialty.category as keyof typeof SPECIALTY_CATEGORIES]?.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
                
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={specialty.experience_years}
                    onChange={(e) => updateSpecialty(index, 'experience_years', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-forest-500 focus:border-forest-500"
                  />
                </div>
                
                <Button
                  onClick={() => removeSpecialty(index)}
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {specialties.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No specialties added yet. Click "Add Specialty" to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Availability</CardTitle>
          <CardDescription>
            Set your regular weekly schedule. You can add multiple time slots per day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {DAYS_OF_WEEK.map(day => {
              const daySchedule = availability.weekly_schedule?.[day] || [];
              const isExpanded = expandedDays.includes(day);
              
              return (
                <div key={day} className="border rounded-lg">
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleDay(day)}
                  >
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium capitalize">{day}</h4>
                      {daySchedule.length > 0 && (
                        <span className="text-sm text-gray-500">
                          {daySchedule.length} slot{daySchedule.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  
                  {isExpanded && (
                    <div className="p-3 border-t bg-gray-50">
                      <div className="space-y-2">
                        {daySchedule.map((slot, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateTimeSlot(day, index, 'start', e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded-md focus:ring-forest-500 focus:border-forest-500"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateTimeSlot(day, index, 'end', e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded-md focus:ring-forest-500 focus:border-forest-500"
                            />
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeTimeSlot(day, index);
                              }}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            addTimeSlot(day);
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Time Slot
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Booking Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Preferences</CardTitle>
          <CardDescription>
            Set your preferences for how facilitator bookings work
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum advance notice (hours)
              </label>
              <input
                type="number"
                min="0"
                value={availability.min_advance_notice_hours}
                onChange={(e) => setAvailability(prev => ({
                  ...prev,
                  min_advance_notice_hours: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-forest-500 focus:border-forest-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum advance booking (days)
              </label>
              <input
                type="number"
                min="1"
                value={availability.max_advance_booking_days}
                onChange={(e) => setAvailability(prev => ({
                  ...prev,
                  max_advance_booking_days: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-forest-500 focus:border-forest-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buffer time between sessions (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={availability.buffer_time_minutes}
                onChange={(e) => setAvailability(prev => ({
                  ...prev,
                  buffer_time_minutes: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-forest-500 focus:border-forest-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum sessions per day
              </label>
              <input
                type="number"
                min="1"
                value={availability.max_sessions_per_day}
                onChange={(e) => setAvailability(prev => ({
                  ...prev,
                  max_sessions_per_day: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-forest-500 focus:border-forest-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred session lengths (check all that apply)
            </label>
            <div className="space-y-2">
              {[30, 45, 60, 90, 120, 180].map(minutes => (
                <label key={minutes} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={availability.preferred_session_lengths?.includes(minutes)}
                    onChange={(e) => {
                      setAvailability(prev => ({
                        ...prev,
                        preferred_session_lengths: e.target.checked
                          ? [...(prev.preferred_session_lengths || []), minutes]
                          : prev.preferred_session_lengths?.filter(m => m !== minutes) || []
                      }));
                    }}
                    className="h-4 w-4 text-forest-600 focus:ring-forest-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {minutes < 60 ? `${minutes} minutes` : `${minutes / 60} hour${minutes > 60 ? 's' : ''}`}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Location Preferences</CardTitle>
          <CardDescription>
            Where can you facilitate events?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={availability.available_for_online}
                  onChange={(e) => setAvailability(prev => ({
                    ...prev,
                    available_for_online: e.target.checked
                  }))}
                  className="h-4 w-4 text-forest-600 focus:ring-forest-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700 flex items-center">
                  <Laptop className="h-4 w-4 mr-1" />
                  Online/Virtual
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={availability.available_for_in_person}
                  onChange={(e) => setAvailability(prev => ({
                    ...prev,
                    available_for_in_person: e.target.checked
                  }))}
                  className="h-4 w-4 text-forest-600 focus:ring-forest-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  In-Person
                </span>
              </label>
            </div>
            
            {availability.available_for_in_person && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Travel radius (miles)
                </label>
                <input
                  type="number"
                  min="0"
                  value={availability.travel_radius_miles}
                  onChange={(e) => setAvailability(prev => ({
                    ...prev,
                    travel_radius_miles: parseInt(e.target.value)
                  }))}
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:ring-forest-500 focus:border-forest-500"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>
            Optional details to help space holders understand your services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suggested donation/fee (optional)
              </label>
              <input
                type="text"
                value={availability.suggested_donation || ''}
                onChange={(e) => setAvailability(prev => ({
                  ...prev,
                  suggested_donation: e.target.value
                }))}
                placeholder="e.g., $20-50 sliding scale, donation based, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-forest-500 focus:border-forest-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Availability notes
              </label>
              <textarea
                value={availability.availability_notes || ''}
                onChange={(e) => setAvailability(prev => ({
                  ...prev,
                  availability_notes: e.target.value
                }))}
                rows={3}
                placeholder="Any additional information about your availability, special requirements, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-forest-500 focus:border-forest-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
        >
          {saving ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Availability
            </>
          )}
        </Button>
      </div>
    </div>
  );
};