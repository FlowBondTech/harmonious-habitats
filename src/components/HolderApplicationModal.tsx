import React, { useState } from 'react';
import { X, Home, Clock, CheckCircle, AlertCircle, Upload, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from './AuthProvider';

interface HolderApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationType: 'space' | 'time' | 'both';
  onSubmit: () => void;
}

export const HolderApplicationModal: React.FC<HolderApplicationModalProps> = ({
  isOpen,
  onClose,
  applicationType,
  onSubmit
}) => {
  const { user } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    // Common fields
    motivation: '',
    experience: '',
    commitment: '',
    community_involvement: '',
    
    // Space-specific fields
    space_type: '',
    space_description: '',
    space_capacity: '',
    space_amenities: [] as string[],
    space_availability: '',
    
    // Time-specific fields
    time_offerings: [] as string[],
    time_skills: '',
    time_experience_years: '',
    time_certifications: '',
    time_availability: '',
    
    // Agreement fields
    agree_guidelines: false,
    agree_safety: false,
    agree_communication: false
  });

  const totalSteps = applicationType === 'both' ? 5 : 4;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleArrayToggle = (field: 'space_amenities' | 'time_offerings', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: // Common info
        return formData.motivation && formData.experience && formData.commitment;
      case 2: // Space info (if applicable)
        if (applicationType === 'time') return true;
        return formData.space_type && formData.space_description && formData.space_capacity;
      case 3: // Time info (if applicable)
        if (applicationType === 'space') return formData.agree_guidelines && formData.agree_safety && formData.agree_communication;
        return formData.time_offerings.length > 0 && formData.time_skills && formData.time_experience_years;
      case 4: // Agreement
        return formData.agree_guidelines && formData.agree_safety && formData.agree_communication;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare application data based on type
      const applicationData: any = {
        motivation: formData.motivation,
        experience: formData.experience,
        commitment: formData.commitment,
        community_involvement: formData.community_involvement
      };

      if (applicationType === 'space' || applicationType === 'both') {
        applicationData.space = {
          type: formData.space_type,
          description: formData.space_description,
          capacity: formData.space_capacity,
          amenities: formData.space_amenities,
          availability: formData.space_availability
        };
      }

      if (applicationType === 'time' || applicationType === 'both') {
        applicationData.time = {
          offerings: formData.time_offerings,
          skills: formData.time_skills,
          experience_years: formData.time_experience_years,
          certifications: formData.time_certifications,
          availability: formData.time_availability
        };
      }

      // Capture submission metadata
      const submissionMetadata = {
        submitted_at: new Date().toISOString(),
        platform: 'web',
        user_agent: navigator.userAgent,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        submission_flow: 'unified_holder_modal',
        application_type: applicationType,
        steps_completed: totalSteps,
        form_version: '2.0'
      };

      // Determine holder types
      const holderTypes = applicationType === 'both' 
        ? ['space', 'time'] 
        : [applicationType];

      // Submit application
      const { error: submitError } = await supabase
        .from('holder_applications')
        .insert({
          user_id: user.id,
          holder_type: holderTypes,
          application_data: applicationData,
          submission_metadata: submissionMetadata,
          ip_address: null, // Will be set by server
          user_agent: navigator.userAgent
        });

      if (submitError) throw submitError;

      // Success!
      onSubmit();
    } catch (err) {
      console.error('Error submitting application:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-forest-800">
                {applicationType === 'both' 
                  ? 'Become a Space & Time Holder'
                  : applicationType === 'space'
                  ? 'Become a Space Holder'
                  : 'Become a Time Holder'}
              </h2>
              <p className="text-sm text-forest-600 mt-1">
                Step {currentStep} of {totalSteps}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-forest-600 transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Step 1: Common Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-forest-800 mb-4">Tell us about yourself</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Why do you want to contribute to the holistic community? *
                    </label>
                    <textarea
                      name="motivation"
                      value={formData.motivation}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                      placeholder="Share your motivation and vision..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      What experience do you bring? *
                    </label>
                    <textarea
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                      placeholder="Your relevant experience, skills, or background..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      How much time can you commit? *
                    </label>
                    <input
                      type="text"
                      name="commitment"
                      value={formData.commitment}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                      placeholder="e.g., 10 hours per week, weekends only..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Current community involvement
                    </label>
                    <textarea
                      name="community_involvement"
                      value={formData.community_involvement}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                      placeholder="Any current community activities or groups..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Space Information (if applicable) */}
          {currentStep === 2 && (applicationType === 'space' || applicationType === 'both') && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-forest-800 mb-4">About your space</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Type of space *
                    </label>
                    <select
                      name="space_type"
                      value={formData.space_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                    >
                      <option value="">Select a type</option>
                      <option value="home">Home</option>
                      <option value="garden">Garden</option>
                      <option value="studio">Studio</option>
                      <option value="land">Land</option>
                      <option value="community_center">Community Center</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Describe your space *
                    </label>
                    <textarea
                      name="space_description"
                      value={formData.space_description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                      placeholder="Location, ambiance, special features..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Maximum capacity *
                    </label>
                    <input
                      type="text"
                      name="space_capacity"
                      value={formData.space_capacity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                      placeholder="e.g., 10-15 people"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Available amenities
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Parking', 'Kitchen', 'Bathroom', 'WiFi', 'Sound System', 'Outdoor Space'].map(amenity => (
                        <label key={amenity} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.space_amenities.includes(amenity)}
                            onChange={() => handleArrayToggle('space_amenities', amenity)}
                            className="h-4 w-4 text-forest-600 rounded"
                          />
                          <span className="text-sm text-forest-700">{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Availability
                    </label>
                    <textarea
                      name="space_availability"
                      value={formData.space_availability}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                      placeholder="When is your space typically available?"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Time Information (if applicable) */}
          {((currentStep === 3 && (applicationType === 'time' || applicationType === 'both')) ||
            (currentStep === 2 && applicationType === 'time')) && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-forest-800 mb-4">About your offerings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      What would you like to offer? *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Workshops', 'Classes', 'Healing Sessions', 'Consultations', 'Ceremonies', 'Mentoring'].map(offering => (
                        <label key={offering} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.time_offerings.includes(offering)}
                            onChange={() => handleArrayToggle('time_offerings', offering)}
                            className="h-4 w-4 text-forest-600 rounded"
                          />
                          <span className="text-sm text-forest-700">{offering}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Your skills and modalities *
                    </label>
                    <textarea
                      name="time_skills"
                      value={formData.time_skills}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                      placeholder="e.g., Yoga, Reiki, Meditation, Herbalism..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Years of experience *
                    </label>
                    <input
                      type="text"
                      name="time_experience_years"
                      value={formData.time_experience_years}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                      placeholder="e.g., 5 years"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Certifications or training
                    </label>
                    <textarea
                      name="time_certifications"
                      value={formData.time_certifications}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                      placeholder="Any relevant certifications or training..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Availability
                    </label>
                    <textarea
                      name="time_availability"
                      value={formData.time_availability}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                      placeholder="When are you typically available to offer sessions?"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Final Step: Agreement */}
          {((currentStep === totalSteps) || 
            (currentStep === 3 && applicationType === 'space') ||
            (currentStep === 3 && applicationType === 'time')) && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-forest-800 mb-4">Community Agreement</h3>
                
                <div className="space-y-4">
                  <div className="bg-forest-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-forest-800 mb-3">Our Community Values</h4>
                    <ul className="space-y-2 text-sm text-forest-700">
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-forest-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span>Respect for all beings and practices</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-forest-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span>Commitment to safety and wellbeing</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-forest-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span>Open and honest communication</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-forest-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span>Sustainable and reciprocal relationships</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        name="agree_guidelines"
                        checked={formData.agree_guidelines}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-forest-600 rounded mt-1"
                      />
                      <span className="text-sm text-forest-700">
                        I agree to follow the community guidelines and treat all members with respect
                      </span>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        name="agree_safety"
                        checked={formData.agree_safety}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-forest-600 rounded mt-1"
                      />
                      <span className="text-sm text-forest-700">
                        I commit to maintaining a safe environment for all participants
                      </span>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        name="agree_communication"
                        checked={formData.agree_communication}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-forest-600 rounded mt-1"
                      />
                      <span className="text-sm text-forest-700">
                        I will communicate clearly and respond to inquiries in a timely manner
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4">
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="px-6 py-2 text-forest-600 hover:text-forest-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentStep < totalSteps ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceed()}
                className="px-6 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="px-6 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Application</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};