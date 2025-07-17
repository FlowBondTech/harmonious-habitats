import React, { useState } from 'react';
import { X, Home, Users, Shield, Clock, Star, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface SpaceSharerApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

interface ApplicationData {
  motivation: string;
  space_description: string;
  hosting_experience: string;
  community_involvement: string;
  safety_measures: string;
  availability: string;
  references: string;
  additional_info: string;
}

export const SpaceSharerApplicationModal: React.FC<SpaceSharerApplicationModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<ApplicationData>({
    motivation: '',
    space_description: '',
    hosting_experience: '',
    community_involvement: '',
    safety_measures: '',
    availability: '',
    references: '',
    additional_info: ''
  });

  const handleInputChange = (field: keyof ApplicationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const required = ['motivation', 'space_description', 'hosting_experience', 'safety_measures', 'availability'];
    
    for (const field of required) {
      if (!formData[field as keyof ApplicationData]?.trim()) {
        setError(`Please fill in the ${field.replace('_', ' ')} field`);
        return false;
      }
    }
    
    if (formData.motivation.length < 50) {
      setError('Please provide a more detailed motivation (at least 50 characters)');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be signed in to apply');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Submit application
      const { error: submitError } = await supabase
        .from('space_sharer_applications')
        .insert([{
          user_id: user.id,
          application_data: formData,
          status: 'pending'
        }]);

      if (submitError) {
        throw submitError;
      }

      // Update profile status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ space_sharer_status: 'pending' })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      setSuccess('Application submitted successfully! We\'ll review it and get back to you within 3-5 business days.');
      
      // Call onSubmit to refresh parent component
      setTimeout(() => {
        onSubmit();
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('Application submission error:', err);
      setError(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-forest-100 rounded-lg">
              <Home className="h-6 w-6 text-forest-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Apply to Become a Space Sharer</h2>
              <p className="text-sm text-gray-600">Share your space with the holistic community</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
              <div className="h-5 w-5 bg-green-600 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                <div className="h-2 w-2 bg-white rounded-full"></div>
              </div>
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Motivation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Star className="h-4 w-4 inline mr-2" />
              Why do you want to share your space? *
            </label>
            <textarea
              value={formData.motivation}
              onChange={(e) => handleInputChange('motivation', e.target.value)}
              placeholder="Tell us about your motivation to become part of the holistic community as a space sharer..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.motivation.length}/50 characters minimum
            </p>
          </div>

          {/* Space Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Home className="h-4 w-4 inline mr-2" />
              Describe your space *
            </label>
            <textarea
              value={formData.space_description}
              onChange={(e) => handleInputChange('space_description', e.target.value)}
              placeholder="Describe the space you'd like to share (size, features, capacity, etc.)..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Hosting Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="h-4 w-4 inline mr-2" />
              Hosting Experience *
            </label>
            <textarea
              value={formData.hosting_experience}
              onChange={(e) => handleInputChange('hosting_experience', e.target.value)}
              placeholder="Share your experience hosting events, workshops, or gatherings..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Community Involvement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="h-4 w-4 inline mr-2" />
              Community Involvement
            </label>
            <textarea
              value={formData.community_involvement}
              onChange={(e) => handleInputChange('community_involvement', e.target.value)}
              placeholder="Tell us about your involvement in holistic or community activities..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Safety Measures */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Shield className="h-4 w-4 inline mr-2" />
              Safety Measures *
            </label>
            <textarea
              value={formData.safety_measures}
              onChange={(e) => handleInputChange('safety_measures', e.target.value)}
              placeholder="Describe the safety measures you have in place for events..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4 inline mr-2" />
              Availability *
            </label>
            <textarea
              value={formData.availability}
              onChange={(e) => handleInputChange('availability', e.target.value)}
              placeholder="When would your space be available for events? (days/times/frequency)..."
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent resize-none"
            />
          </div>

          {/* References */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              References
            </label>
            <textarea
              value={formData.references}
              onChange={(e) => handleInputChange('references', e.target.value)}
              placeholder="Optional: Provide references from previous hosting or community experience..."
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Additional Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Information
            </label>
            <textarea
              value={formData.additional_info}
              onChange={(e) => handleInputChange('additional_info', e.target.value)}
              placeholder="Anything else you'd like us to know?"
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Home className="h-4 w-4" />
              )}
              <span>{loading ? 'Submitting...' : 'Submit Application'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};