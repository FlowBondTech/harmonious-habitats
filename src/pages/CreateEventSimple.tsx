import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Heart } from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { Form, FormField, FormSection, FormCheckbox, FormButton } from '../components/forms';
import HolisticCategorySelector from '../components/HolisticCategorySelector';

const CreateEventSimple = () => {
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
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    eventType: 'local' as 'local' | 'virtual' | 'global_physical',
    capacity: '10',
    isFree: true,
    registrationRequired: true
  });

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleCheckbox = (field: string) => (checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  const validateForm = (): boolean => {
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
    if (!formData.location.trim()) {
      setError('Location is required');
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
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        event_type: formData.eventType,
        location_name: formData.location.trim(),
        capacity: parseInt(formData.capacity) || null,
        is_free: formData.isFree,
        registration_required: formData.registrationRequired
      };

      const { error: insertError } = await supabase
        .from('events')
        .insert([eventData]);

      if (insertError) throw insertError;

      setSuccess('Event created successfully!');
      setTimeout(() => navigate('/activities'), 2000);

    } catch (err: any) {
      console.error('Error creating event:', err);
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-forest-800 mb-2">Create Event</h1>
          <p className="text-forest-600">Share your holistic practice with the community</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <Form onSubmit={handleSubmit} error={error} success={success}>

            {/* Category Selection */}
            <FormSection
              title="Category"
              description="Choose your event category"
              icon={<Heart className="h-5 w-5" />}
            >
              <HolisticCategorySelector
                selectedCategory={formData.category}
                onCategorySelect={(categoryId) => setFormData(prev => ({ ...prev, category: categoryId }))}
              />
            </FormSection>

            {/* Basic Information */}
            <FormSection
              title="Event Details"
              description="Tell us about your event"
            >
              <FormField
                label="Event Title"
                name="title"
                value={formData.title}
                onChange={handleChange('title')}
                placeholder="e.g., Morning Yoga Flow, Community Garden Workday"
                required
              />

              <FormField
                label="Description"
                name="description"
                type="textarea"
                value={formData.description}
                onChange={handleChange('description')}
                placeholder="Describe your event, what participants can expect..."
                rows={4}
              />

              <FormField
                label="Event Type"
                name="eventType"
                type="select"
                value={formData.eventType}
                onChange={handleChange('eventType')}
                options={[
                  { value: 'local', label: 'Local Event (In-person)' },
                  { value: 'virtual', label: 'Virtual Event (Online)' },
                  { value: 'global_physical', label: 'Global Physical Event' }
                ]}
                icon={<MapPin className="h-4 w-4" />}
              />
            </FormSection>

            {/* Schedule */}
            <FormSection
              title="Schedule"
              description="When will your event take place?"
              icon={<Calendar className="h-5 w-5" />}
            >
              <FormField
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange('date')}
                min={new Date().toISOString().split('T')[0]}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Start Time"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleChange('startTime')}
                  required
                />
                <FormField
                  label="End Time"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleChange('endTime')}
                  required
                />
              </div>
            </FormSection>

            {/* Location */}
            <FormSection
              title="Location"
              description="Where will it happen?"
              icon={<MapPin className="h-5 w-5" />}
            >
              <FormField
                label="Venue or Meeting Link"
                name="location"
                value={formData.location}
                onChange={handleChange('location')}
                placeholder={
                  formData.eventType === 'virtual'
                    ? 'e.g., Zoom Meeting Room, Discord Server'
                    : 'e.g., My backyard garden, Community center'
                }
                required
              />
            </FormSection>

            {/* Community Settings */}
            <FormSection
              title="Community Settings"
              icon={<Users className="h-5 w-5" />}
            >
              <FormField
                label="Maximum Participants"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleChange('capacity')}
                min={1}
                helpText="Set to 0 for unlimited capacity"
              />

              <div className="space-y-4">
                <FormCheckbox
                  label="Free Event"
                  checked={formData.isFree}
                  onChange={handleCheckbox('isFree')}
                  description="This event is free to attend"
                />

                <FormCheckbox
                  label="Registration Required"
                  checked={formData.registrationRequired}
                  onChange={handleCheckbox('registrationRequired')}
                  description="Attendees must register to join"
                />
              </div>
            </FormSection>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <FormButton
                type="button"
                variant="secondary"
                onClick={() => navigate('/activities')}
                disabled={loading}
              >
                Cancel
              </FormButton>
              <FormButton
                type="submit"
                variant="primary"
                loading={loading}
              >
                Create Event
              </FormButton>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default CreateEventSimple;
