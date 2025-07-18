import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';

const CreateEventSimple = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'wellness',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    capacity: '10'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be signed in to create an event');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const eventData = {
        organizer_id: user.id,
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        event_type: 'local',
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        location_name: formData.location,
        capacity: parseInt(formData.capacity),
        registration_required: true,
        waitlist_enabled: true,
        skill_level: 'all',
        is_free: true,
        exchange_type: 'free',
        is_recurring: false,
        tags: null,
        status: 'published',
        visibility: 'public'
      };

      console.log('Submitting event:', eventData);

      const { data, error: insertError } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }
      
      console.log('Event created:', data);
      setSuccess('Event created successfully!');
      
      setTimeout(() => {
        navigate('/activities');
      }, 2000);

    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-forest-800 mb-8">Create Event (Simple)</h1>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">
                Event Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">
                Capacity
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                min="1"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest-600 hover:bg-forest-700 disabled:bg-forest-300 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEventSimple;