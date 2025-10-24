import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Users,
  Heart,
  Calendar,
  MapPin,
  DollarSign,
  FileText,
  Star,
  Loader2
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { LocationInput, LocationData } from './LocationInput';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface FacilitatorData {
  // Profile
  bio: string;
  experience_years: number;
  certifications: string[];
  photo_url?: string;

  // Specialties
  specialties: Array<{ specialty: string; category: string; experience_years: number }>;

  // Availability
  is_active: boolean;
  weekly_schedule: Record<string, Array<{ start: string; end: string }>>;
  min_advance_notice_hours: number;
  max_advance_booking_days: number;
  buffer_time_minutes: number;
  preferred_session_lengths: number[];
  max_sessions_per_day: number;

  // Location
  available_for_online: boolean;
  available_for_in_person: boolean;
  travel_radius_miles: number;
  location?: LocationData;

  // Pricing
  suggested_donation: string;

  // Notes
  availability_notes: string;
}

const STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Join our community of facilitators',
    icon: Heart
  },
  {
    id: 'profile',
    title: 'Your Profile',
    description: 'Tell us about your experience',
    icon: Users
  },
  {
    id: 'specialties',
    title: 'Specialties',
    description: 'Select your areas of expertise',
    icon: Star
  },
  {
    id: 'availability',
    title: 'Availability',
    description: 'Set your schedule',
    icon: Calendar
  },
  {
    id: 'location',
    title: 'Location',
    description: 'Where do you facilitate?',
    icon: MapPin
  },
  {
    id: 'pricing',
    title: 'Pricing',
    description: 'Set your suggested rates',
    icon: DollarSign
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Confirm your details',
    icon: FileText
  }
];

const SPECIALTY_CATEGORIES = {
  'Wellness': ['Yoga', 'Meditation', 'Breathwork', 'Sound Healing', 'Reiki', 'Massage'],
  'Arts & Creativity': ['Painting', 'Drawing', 'Pottery', 'Music', 'Dance', 'Theater', 'Photography'],
  'Cooking & Nutrition': ['Cooking Classes', 'Nutrition Workshops', 'Meal Prep', 'Baking', 'Fermentation'],
  'Gardening & Nature': ['Gardening', 'Permaculture', 'Herbalism', 'Nature Walks', 'Foraging'],
  'Learning & Skills': ['Languages', 'Technology', 'Business', 'Personal Finance', 'DIY', 'Crafts'],
  'Community & Support': ['Support Groups', 'Book Clubs', 'Discussion Circles', 'Mentoring']
};

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' }
];

export const FacilitatorOnboardingWizard: React.FC<{
  onComplete: (data: FacilitatorData) => void;
  onCancel: () => void;
}> = ({ onComplete, onCancel }) => {
  const { profile } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FacilitatorData>({
    bio: '',
    experience_years: 0,
    certifications: [],
    specialties: [],
    is_active: true,
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

  const [selectedSpecialties, setSelectedSpecialties] = useState<Set<string>>(new Set());

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - submit
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onCancel();
    }
  };

  const updateFormData = (updates: Partial<FacilitatorData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const toggleSpecialty = (specialty: string, category: string) => {
    const key = `${category}:${specialty}`;
    const newSelected = new Set(selectedSpecialties);

    if (newSelected.has(key)) {
      newSelected.delete(key);
      updateFormData({
        specialties: formData.specialties.filter(s => s.specialty !== specialty)
      });
    } else {
      newSelected.add(key);
      updateFormData({
        specialties: [...formData.specialties, { specialty, category, experience_years: 0 }]
      });
    }

    setSelectedSpecialties(newSelected);
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6 py-8">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-forest-400 to-earth-500 rounded-full flex items-center justify-center">
              <Heart className="h-12 w-12 text-white" />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-forest-800 mb-3">
                Welcome to Harmonik Space Facilitators
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Join our community of passionate facilitators and share your gifts with the world
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {[
                { icon: Users, title: 'Share Your Expertise', text: 'Connect with people eager to learn' },
                { icon: Calendar, title: 'Flexible Schedule', text: 'Set your own availability' },
                { icon: Heart, title: 'Make an Impact', text: 'Build meaningful community connections' }
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="p-6 bg-white rounded-xl shadow-sm border border-forest-100">
                    <Icon className="h-8 w-8 text-forest-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-forest-800 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facilitator Bio <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => updateFormData({ bio: e.target.value })}
                rows={5}
                placeholder="Tell the community about yourself, your background, and what you're passionate about sharing..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience
              </label>
              <input
                type="number"
                min="0"
                value={formData.experience_years}
                onChange={(e) => updateFormData({ experience_years: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certifications (Optional)
              </label>
              <textarea
                value={formData.certifications.join('\n')}
                onChange={(e) => updateFormData({ certifications: e.target.value.split('\n').filter(c => c.trim()) })}
                rows={3}
                placeholder="List your certifications, one per line..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
              />
              <p className="text-sm text-gray-500 mt-1">One certification per line</p>
            </div>
          </div>
        );

      case 'specialties':
        return (
          <div className="space-y-6">
            <p className="text-gray-600">Select the areas where you can facilitate workshops, classes, or events</p>

            {Object.entries(SPECIALTY_CATEGORIES).map(([category, specialties]) => (
              <div key={category} className="space-y-3">
                <h3 className="font-semibold text-forest-800">{category}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {specialties.map((specialty) => {
                    const key = `${category}:${specialty}`;
                    const isSelected = selectedSpecialties.has(key);

                    return (
                      <button
                        key={specialty}
                        type="button"
                        onClick={() => toggleSpecialty(specialty, category)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-forest-500 bg-forest-50 text-forest-700'
                            : 'border-gray-200 hover:border-forest-300'
                        }`}
                      >
                        <span className="text-sm font-medium">{specialty}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );

      case 'availability':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-forest-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-forest-800">Active Status</h3>
                <p className="text-sm text-gray-600">Accept bookings and appear in search</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => updateFormData({ is_active: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-forest-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Advance Notice
                </label>
                <select
                  value={formData.min_advance_notice_hours}
                  onChange={(e) => updateFormData({ min_advance_notice_hours: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500"
                >
                  <option value={2}>2 hours</option>
                  <option value={4}>4 hours</option>
                  <option value={12}>12 hours</option>
                  <option value={24}>24 hours (1 day)</option>
                  <option value={48}>48 hours (2 days)</option>
                  <option value={72}>72 hours (3 days)</option>
                  <option value={168}>1 week</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Sessions Per Day
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.max_sessions_per_day}
                  onChange={(e) => updateFormData({ max_sessions_per_day: parseInt(e.target.value) || 3 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500"
                />
              </div>
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.available_for_online}
                  onChange={(e) => updateFormData({ available_for_online: e.target.checked })}
                  className="w-5 h-5 text-forest-600 rounded focus:ring-forest-500"
                />
                <span className="text-gray-700">Available for online sessions</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.available_for_in_person}
                  onChange={(e) => updateFormData({ available_for_in_person: e.target.checked })}
                  className="w-5 h-5 text-forest-600 rounded focus:ring-forest-500"
                />
                <span className="text-gray-700">Available for in-person sessions</span>
              </label>
            </div>

            {formData.available_for_in_person && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Location
                  </label>
                  <LocationInput
                    value={formData.location?.formatted_address}
                    onChange={(location) => updateFormData({ location })}
                    placeholder="Enter your city or address..."
                    showMap={true}
                    allowCurrentLocation={true}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Travel Radius (miles)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.travel_radius_miles}
                    onChange={(e) => updateFormData({ travel_radius_miles: parseInt(e.target.value) || 10 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">How far are you willing to travel for in-person sessions?</p>
                </div>
              </>
            )}
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suggested Donation/Rate (Optional)
              </label>
              <input
                type="text"
                value={formData.suggested_donation}
                onChange={(e) => updateFormData({ suggested_donation: e.target.value })}
                placeholder="e.g., $20-50 sliding scale, $30 suggested donation"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave blank if you prefer to discuss pricing case-by-case
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.availability_notes}
                onChange={(e) => updateFormData({ availability_notes: e.target.value })}
                rows={4}
                placeholder="Any additional information about your availability, pricing, or preferences..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="bg-forest-50 rounded-xl p-6 space-y-4">
              <h3 className="text-xl font-semibold text-forest-800">Review Your Profile</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Experience</p>
                  <p className="font-medium">{formData.experience_years} years</p>
                </div>

                <div>
                  <p className="text-gray-600">Specialties</p>
                  <p className="font-medium">{formData.specialties.length} selected</p>
                </div>

                <div>
                  <p className="text-gray-600">Availability</p>
                  <p className="font-medium">{formData.is_active ? 'Active' : 'Inactive'}</p>
                </div>

                <div>
                  <p className="text-gray-600">Location Type</p>
                  <p className="font-medium">
                    {formData.available_for_online && formData.available_for_in_person
                      ? 'Online & In-Person'
                      : formData.available_for_online
                      ? 'Online Only'
                      : 'In-Person Only'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Next Steps:</strong> After submitting, your profile will be reviewed by our team.
                You'll receive a notification once approved!
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-forest-600 text-white'
                          : isActive
                          ? 'bg-forest-500 text-white ring-4 ring-forest-200'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                    </div>
                    <p className={`text-xs mt-2 ${isActive ? 'font-semibold text-forest-800' : 'text-gray-500'}`}>
                      {step.title}
                    </p>
                  </div>

                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${isCompleted ? 'bg-forest-600' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="overflow-hidden">
            <div
              className="transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentStep * 100}%)` }}
            >
              <div className="flex" style={{ width: `${STEPS.length * 100}%` }}>
                {STEPS.map((step, index) => (
                  <div key={step.id} className="w-full flex-shrink-0 px-4" style={{ width: `${100 / STEPS.length}%` }}>
                    {index === currentStep && (
                      <div className="max-w-2xl mx-auto">
                        <h2 className="text-2xl font-bold text-forest-800 mb-2">{step.title}</h2>
                        <p className="text-gray-600 mb-6">{step.description}</p>
                        {renderStepContent()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>{currentStep === 0 ? 'Cancel' : 'Back'}</span>
            </button>

            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {STEPS.length}
            </div>

            <button
              onClick={handleNext}
              className="flex items-center space-x-2 px-6 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-lg transition-colors"
            >
              <span>{currentStep === STEPS.length - 1 ? 'Complete' : 'Next'}</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilitatorOnboardingWizard;
