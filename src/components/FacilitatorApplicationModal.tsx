import React, { useState } from 'react';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Calendar, 
  Users, 
  FileText, 
  Shield,
  Star,
  Award,
  Clock
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { Space, createSpaceApplication } from '../lib/supabase';
import { logger } from '../lib/logger';
import { LoadingButton } from './LoadingStates';

interface FacilitatorApplicationModalProps {
  space: Space;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

interface ApplicationFormData {
  event_type: string;
  practice_description: string;
  frequency: 'one_time' | 'weekly' | 'monthly' | 'custom';
  frequency_details: string;
  expected_attendance: number;
  equipment_needed: string[];
  message_to_owner: string;
  proposed_dates: string[];
  insurance_confirmed: boolean;
  portfolio_links: string[];
  experience_years: number;
  certifications: string[];
  references: string[];
  preferred_times: string[];
  special_requirements: string;
}

const FacilitatorApplicationModal: React.FC<FacilitatorApplicationModalProps> = ({
  space,
  isOpen,
  onClose,
  onSubmitted
}) => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState<ApplicationFormData>({
    event_type: '',
    practice_description: '',
    frequency: 'one_time',
    frequency_details: '',
    expected_attendance: 1,
    equipment_needed: [],
    message_to_owner: '',
    proposed_dates: [],
    insurance_confirmed: false,
    portfolio_links: [],
    experience_years: 0,
    certifications: [],
    references: [],
    preferred_times: [],
    special_requirements: ''
  });

  const practiceTypes = [
    'Yoga Class',
    'Meditation Circle', 
    'Healing Session',
    'Breathwork Workshop',
    'Sound Healing',
    'Reiki Session',
    'Wellness Workshop',
    'Art Therapy',
    'Movement Therapy',
    'Other'
  ];

  const timeSlots = [
    'Early Morning (6AM-9AM)',
    'Morning (9AM-12PM)', 
    'Afternoon (12PM-3PM)',
    'Late Afternoon (3PM-6PM)',
    'Evening (6PM-9PM)',
    'Night (9PM+)'
  ];

  const handleSubmit = async () => {
    if (!user) {
      setError('Please sign in to submit an application');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const applicationData = {
        space_id: space.id,
        facilitator_id: user.id,
        status: 'pending' as const,
        application_data: formData,
        owner_response: {}
      };

      const { error: submitError } = await createSpaceApplication(applicationData);

      if (submitError) {
        throw new Error(submitError.message);
      }

      setSuccess(true);
      setTimeout(() => {
        onSubmitted?.();
        onClose();
        setSuccess(false);
        setStep(1);
        setFormData({
          event_type: '',
          practice_description: '',
          frequency: 'one_time',
          frequency_details: '',
          expected_attendance: 1,
          equipment_needed: [],
          message_to_owner: '',
          proposed_dates: [],
          insurance_confirmed: false,
          portfolio_links: [],
          experience_years: 0,
          certifications: [],
          references: [],
          preferred_times: [],
          special_requirements: ''
        });
      }, 2000);

    } catch (err) {
      logger.error('Error submitting application:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof ApplicationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addArrayItem = (field: keyof ApplicationFormData, value: string) => {
    if (!value.trim()) return;
    const currentArray = formData[field] as string[];
    if (!currentArray.includes(value)) {
      updateFormData(field, [...currentArray, value]);
    }
  };

  const removeArrayItem = (field: keyof ApplicationFormData, index: number) => {
    const currentArray = formData[field] as string[];
    updateFormData(field, currentArray.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-forest-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-forest-800">Apply to Use Space</h2>
            <p className="text-forest-600 text-sm mt-1">{space.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-forest-50 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-forest-500" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {success ? (
            <div className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-forest-800 mb-2">
                Application Submitted!
              </h3>
              <p className="text-forest-600">
                The space owner will review your application and get back to you soon.
              </p>
            </div>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="px-6 py-4 bg-forest-50">
                <div className="flex items-center justify-between text-sm text-forest-600 mb-2">
                  <span>Step {step} of 3</span>
                  <span>{Math.round((step / 3) * 100)}% complete</span>
                </div>
                <div className="w-full bg-forest-200 rounded-full h-2">
                  <div 
                    className="bg-forest-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(step / 3) * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-6">
                {/* Step 1: Practice Details */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <User className="h-12 w-12 text-forest-500 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-forest-800">Tell us about your practice</h3>
                      <p className="text-forest-600">Help the space owner understand what you'd like to offer</p>
                    </div>

                    {/* Practice Type */}
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Type of Practice/Event *
                      </label>
                      <select
                        value={formData.event_type}
                        onChange={(e) => updateFormData('event_type', e.target.value)}
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                        required
                      >
                        <option value="">Select practice type</option>
                        {practiceTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Practice Description */}
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Describe Your Practice *
                      </label>
                      <textarea
                        value={formData.practice_description}
                        onChange={(e) => updateFormData('practice_description', e.target.value)}
                        placeholder="Describe the style, approach, or unique aspects of your practice..."
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                        rows={3}
                        required
                      />
                    </div>

                    {/* Frequency */}
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        How often would you like to use this space? *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'one_time', label: 'One-time event' },
                          { value: 'weekly', label: 'Weekly recurring' },
                          { value: 'monthly', label: 'Monthly recurring' },
                          { value: 'custom', label: 'Custom schedule' }
                        ].map(option => (
                          <label key={option.value} className="flex items-center space-x-2 p-3 border border-forest-200 rounded-lg cursor-pointer hover:bg-forest-50">
                            <input
                              type="radio"
                              name="frequency"
                              value={option.value}
                              checked={formData.frequency === option.value}
                              onChange={(e) => updateFormData('frequency', e.target.value)}
                              className="text-forest-600"
                            />
                            <span className="text-sm text-forest-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                      {formData.frequency === 'custom' && (
                        <textarea
                          value={formData.frequency_details}
                          onChange={(e) => updateFormData('frequency_details', e.target.value)}
                          placeholder="Describe your custom schedule..."
                          className="w-full mt-3 px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                          rows={2}
                        />
                      )}
                    </div>

                    {/* Expected Attendance */}
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Expected Number of Participants *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={space.capacity}
                        value={formData.expected_attendance}
                        onChange={(e) => updateFormData('expected_attendance', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                        required
                      />
                      <p className="text-xs text-forest-500 mt-1">
                        Space capacity: {space.capacity} people
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 2: Logistics */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <Calendar className="h-12 w-12 text-forest-500 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-forest-800">Logistics & Requirements</h3>
                      <p className="text-forest-600">Help us understand your needs and timing</p>
                    </div>

                    {/* Preferred Times */}
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Preferred Time Slots
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {timeSlots.map(slot => (
                          <label key={slot} className="flex items-center space-x-2 p-2 border border-forest-200 rounded-lg cursor-pointer hover:bg-forest-50">
                            <input
                              type="checkbox"
                              checked={formData.preferred_times.includes(slot)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  addArrayItem('preferred_times', slot);
                                } else {
                                  const index = formData.preferred_times.indexOf(slot);
                                  if (index > -1) removeArrayItem('preferred_times', index);
                                }
                              }}
                              className="text-forest-600"
                            />
                            <span className="text-xs text-forest-700">{slot}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Equipment Needed */}
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Equipment/Materials Needed
                      </label>
                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Add equipment item..."
                            className="flex-1 px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addArrayItem('equipment_needed', e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                              addArrayItem('equipment_needed', input.value);
                              input.value = '';
                            }}
                            className="px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.equipment_needed.map((item, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center space-x-1 bg-forest-100 text-forest-700 px-3 py-1 rounded-full text-sm"
                            >
                              <span>{item}</span>
                              <button
                                onClick={() => removeArrayItem('equipment_needed', index)}
                                className="text-forest-500 hover:text-forest-700"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Experience Years */}
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.experience_years}
                        onChange={(e) => updateFormData('experience_years', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                      />
                    </div>

                    {/* Insurance Confirmation */}
                    <div className="bg-earth-50 rounded-lg p-4">
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.insurance_confirmed}
                          onChange={(e) => updateFormData('insurance_confirmed', e.target.checked)}
                          className="mt-1 text-forest-600"
                        />
                        <div>
                          <span className="text-sm font-medium text-forest-700">
                            I confirm that I have appropriate liability insurance
                          </span>
                          <p className="text-xs text-forest-600 mt-1">
                            Required for facilitating practices in shared spaces
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 3: Message & Final Details */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <FileText className="h-12 w-12 text-forest-500 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-forest-800">Final Details</h3>
                      <p className="text-forest-600">Tell the space owner why you're a great fit</p>
                    </div>

                    {/* Message to Owner */}
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Message to Space Owner *
                      </label>
                      <textarea
                        value={formData.message_to_owner}
                        onChange={(e) => updateFormData('message_to_owner', e.target.value)}
                        placeholder="Tell the space owner about yourself, your practice, and why this space would be perfect..."
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                        rows={4}
                        required
                      />
                    </div>

                    {/* Special Requirements */}
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Special Requirements or Accommodations
                      </label>
                      <textarea
                        value={formData.special_requirements}
                        onChange={(e) => updateFormData('special_requirements', e.target.value)}
                        placeholder="Any special needs, accessibility requirements, or other considerations..."
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                        rows={3}
                      />
                    </div>

                    {/* Application Summary */}
                    <div className="bg-forest-50 rounded-lg p-4">
                      <h4 className="font-medium text-forest-800 mb-3">Application Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-forest-600">Practice:</span>
                          <span className="text-forest-800">{formData.event_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-forest-600">Frequency:</span>
                          <span className="text-forest-800 capitalize">{formData.frequency.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-forest-600">Participants:</span>
                          <span className="text-forest-800">{formData.expected_attendance}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-forest-600">Experience:</span>
                          <span className="text-forest-800">{formData.experience_years} years</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-forest-600">Insurance:</span>
                          <span className={formData.insurance_confirmed ? "text-green-600" : "text-red-600"}>
                            {formData.insurance_confirmed ? "Confirmed" : "Not confirmed"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-red-600">{error}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="p-6 border-t border-forest-100 flex justify-between">
            <div className="flex space-x-3">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"
                >
                  Back
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && (!formData.event_type || !formData.practice_description || formData.expected_attendance < 1)) ||
                    (step === 2 && !formData.insurance_confirmed)
                  }
                  className="px-6 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              ) : (
                <LoadingButton
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={!formData.message_to_owner.trim()}
                  className="px-6 py-2"
                >
                  Submit Application
                </LoadingButton>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilitatorApplicationModal;