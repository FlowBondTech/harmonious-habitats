import React, { useState, useEffect } from 'react';
import { X, Clock, Plus, Calendar, MapPin, Users, DollarSign, Edit2, Trash2, Eye, Pause, Play, Archive } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from './AuthProvider';
import { TimeOffering } from '../lib/supabase';

interface TimeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TimeManagementModal: React.FC<TimeManagementModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuthContext();
  const [offerings, setOfferings] = useState<TimeOffering[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOffering, setEditingOffering] = useState<TimeOffering | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    duration_minutes: 60,
    min_participants: 1,
    max_participants: 1,
    availability_type: 'on_demand' as const,
    availability_data: {},
    location_type: 'flexible' as const,
    location_radius: 5,
    suggested_donation: '',
    exchange_type: 'donation' as const,
    requirements: {} as any,
    status: 'draft' as const
  });

  useEffect(() => {
    if (isOpen && user) {
      loadOfferings();
    }
  }, [isOpen, user]);

  const loadOfferings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('time_offerings')
        .select('*')
        .eq('holder_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOfferings(data || []);
    } catch (err) {
      console.error('Error loading offerings:', err);
      setError('Failed to load offerings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      duration_minutes: 60,
      min_participants: 1,
      max_participants: 1,
      availability_type: 'on_demand',
      availability_data: {},
      location_type: 'flexible',
      location_radius: 5,
      suggested_donation: '',
      exchange_type: 'donation',
      requirements: {},
      status: 'draft'
    });
    setEditingOffering(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const submissionData = {
        ...formData,
        holder_id: user.id,
        submission_metadata: {
          submitted_at: new Date().toISOString(),
          platform: 'web',
          user_agent: navigator.userAgent
        }
      };

      if (editingOffering) {
        // Update existing
        const { error } = await supabase
          .from('time_offerings')
          .update(submissionData)
          .eq('id', editingOffering.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('time_offerings')
          .insert(submissionData);

        if (error) throw error;
      }

      await loadOfferings();
      resetForm();
    } catch (err) {
      console.error('Error saving offering:', err);
      setError(err instanceof Error ? err.message : 'Failed to save offering');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (offeringId: string, newStatus: 'active' | 'paused' | 'archived') => {
    try {
      const { error } = await supabase
        .from('time_offerings')
        .update({ status: newStatus })
        .eq('id', offeringId);

      if (error) throw error;
      await loadOfferings();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    }
  };

  const handleDelete = async (offeringId: string) => {
    if (!confirm('Are you sure you want to delete this offering?')) return;

    try {
      const { error } = await supabase
        .from('time_offerings')
        .delete()
        .eq('id', offeringId);

      if (error) throw error;
      await loadOfferings();
    } catch (err) {
      console.error('Error deleting offering:', err);
      setError('Failed to delete offering');
    }
  };

  const startEdit = (offering: TimeOffering) => {
    setEditingOffering(offering);
    setFormData({
      title: offering.title,
      description: offering.description || '',
      category: offering.category,
      duration_minutes: offering.duration_minutes,
      min_participants: offering.min_participants || 1,
      max_participants: offering.max_participants || 1,
      availability_type: offering.availability_type || 'on_demand',
      availability_data: offering.availability_data || {},
      location_type: offering.location_type || 'flexible',
      location_radius: offering.location_radius || 5,
      suggested_donation: offering.suggested_donation || '',
      exchange_type: offering.exchange_type || 'donation',
      requirements: offering.requirements || {},
      status: offering.status
    });
    setShowCreateForm(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-forest-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-forest-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-forest-800">Manage Your Time Offerings</h2>
                <p className="text-sm text-forest-600">Share your skills and knowledge with the community</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Create/Edit Form */}
          {showCreateForm ? (
            <form onSubmit={handleSubmit} className="space-y-6 mb-8">
              <div className="bg-forest-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-forest-800 mb-4">
                  {editingOffering ? 'Edit Offering' : 'Create New Offering'}
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                        placeholder="e.g., Beginner's Yoga Class"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                      >
                        <option value="">Select a category</option>
                        <option value="workshop">Workshop</option>
                        <option value="healing">Healing Session</option>
                        <option value="class">Class</option>
                        <option value="consultation">Consultation</option>
                        <option value="ceremony">Ceremony</option>
                        <option value="mentoring">Mentoring</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Duration (minutes) *
                      </label>
                      <input
                        type="number"
                        name="duration_minutes"
                        value={formData.duration_minutes}
                        onChange={handleInputChange}
                        required
                        min="15"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-forest-700 mb-2">
                          Min Participants
                        </label>
                        <input
                          type="number"
                          name="min_participants"
                          value={formData.min_participants}
                          onChange={handleInputChange}
                          min="1"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-forest-700 mb-2">
                          Max Participants
                        </label>
                        <input
                          type="number"
                          name="max_participants"
                          value={formData.max_participants}
                          onChange={handleInputChange}
                          min="1"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Location Type *
                      </label>
                      <select
                        name="location_type"
                        value={formData.location_type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                      >
                        <option value="holder_space">My Space</option>
                        <option value="participant_space">Participant's Space</option>
                        <option value="virtual">Virtual/Online</option>
                        <option value="flexible">Flexible</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Exchange Type *
                      </label>
                      <select
                        name="exchange_type"
                        value={formData.exchange_type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                      >
                        <option value="donation">Donation Based</option>
                        <option value="fixed">Fixed Price</option>
                        <option value="sliding_scale">Sliding Scale</option>
                        <option value="barter">Barter/Trade</option>
                        <option value="free">Free</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Suggested Donation/Price
                      </label>
                      <input
                        type="text"
                        name="suggested_donation"
                        value={formData.suggested_donation}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                        placeholder="e.g., $20-40, Energy exchange"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                    placeholder="Describe your offering, what participants will experience..."
                  />
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 text-forest-600 hover:text-forest-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Saving...' : editingOffering ? 'Update Offering' : 'Create Offering'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full py-3 px-4 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Create New Offering</span>
              </button>
            </div>
          )}

          {/* Offerings List */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600 mx-auto"></div>
              <p className="mt-4 text-forest-600">Loading offerings...</p>
            </div>
          ) : offerings.length === 0 && !showCreateForm ? (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No offerings yet</h3>
              <p className="text-gray-600">Start sharing your time and skills with the community!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {offerings.map(offering => (
                <div key={offering.id} className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start space-x-3">
                        <div className="h-10 w-10 bg-forest-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Clock className="h-5 w-5 text-forest-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-forest-800">{offering.title}</h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-forest-600">
                            <span className="capitalize">{offering.category}</span>
                            <span>•</span>
                            <span>{offering.duration_minutes} minutes</span>
                            <span>•</span>
                            <span>
                              {offering.min_participants === offering.max_participants
                                ? `${offering.max_participants} participant${offering.max_participants > 1 ? 's' : ''}`
                                : `${offering.min_participants}-${offering.max_participants} participants`}
                            </span>
                          </div>
                          {offering.description && (
                            <p className="mt-2 text-sm text-gray-600">{offering.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              offering.status === 'active' ? 'bg-green-100 text-green-800' :
                              offering.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                              offering.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {offering.status}
                            </span>
                            {offering.exchange_type && (
                              <span className="text-sm text-forest-600">
                                {offering.exchange_type === 'donation' ? 'Donation based' :
                                 offering.exchange_type === 'fixed' ? 'Fixed price' :
                                 offering.exchange_type === 'sliding_scale' ? 'Sliding scale' :
                                 offering.exchange_type === 'barter' ? 'Barter/Trade' :
                                 'Free'}
                                {offering.suggested_donation && `: ${offering.suggested_donation}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {offering.status === 'active' ? (
                        <button
                          onClick={() => handleStatusChange(offering.id, 'paused')}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Pause offering"
                        >
                          <Pause className="h-4 w-4" />
                        </button>
                      ) : offering.status === 'paused' ? (
                        <button
                          onClick={() => handleStatusChange(offering.id, 'active')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Activate offering"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      ) : null}
                      
                      <button
                        onClick={() => startEdit(offering)}
                        className="p-2 text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"
                        title="Edit offering"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      
                      {offering.status !== 'archived' && (
                        <button
                          onClick={() => handleStatusChange(offering.id, 'archived')}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Archive offering"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(offering.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete offering"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};