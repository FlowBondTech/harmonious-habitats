import React, { useState, useRef, useEffect } from 'react';
import { X, User, MapPin, Calendar, Heart, Camera, ArrowRight, ArrowLeft, Check, Clock } from 'lucide-react';
import { useAuthContext } from './AuthProvider';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface ProfileData {
  full_name: string;
  bio: string;
  neighborhood: string;
  interests: string[];
  date_of_birth: string;
  avatar_url: string;
  phone: string;
}

const INTEREST_OPTIONS = [
  'Community Gardens', 'Book Clubs', 'Fitness Groups', 'Art Classes', 
  'Music Events', 'Food & Cooking', 'Technology', 'Volunteering',
  'Sports & Recreation', 'Environment', 'Education', 'Senior Services',
  'Youth Programs', 'Cultural Events', 'Business Networking', 'Health & Wellness'
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, onComplete }) => {
  const { user, profile, updateProfile } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    neighborhood: profile?.neighborhood || '',
    interests: profile?.interests || [],
    date_of_birth: profile?.date_of_birth || '',
    avatar_url: profile?.avatar_url || '',
    phone: profile?.phone || ''
  });

  const modalRef = useRef<HTMLDivElement>(null);
  const totalSteps = 4;

  // Focus trap and modal handling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleInputChange = (field: keyof ProfileData, value: string | string[]) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleInterestToggle = (interest: string) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { error } = await updateProfile(profileData);
      if (error) {
        console.error('Error updating profile:', error);
        // Could add error handling here
      } else {
        onComplete();
      }
    } catch (error) {
      console.error('Unexpected error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Mark that user was reminded about onboarding
    localStorage.setItem('harmony_spaces_onboarding_skipped', Date.now().toString());
    onClose();
  };

  if (!isOpen) return null;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="h-16 w-16 text-forest-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Tell us about yourself</h3>
              <p className="text-gray-600">Help your neighbors get to know you better</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  placeholder="Tell your neighbors a bit about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <MapPin className="h-16 w-16 text-forest-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Where are you located?</h3>
              <p className="text-gray-600">Help us connect you with nearby events and neighbors</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Neighborhood
                </label>
                <input
                  type="text"
                  value={profileData.neighborhood}
                  onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  placeholder="e.g., Downtown, Riverside, Oak Hill..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={profileData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Used for age-appropriate event recommendations</p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Heart className="h-16 w-16 text-forest-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">What interests you?</h3>
              <p className="text-gray-600">Select topics that interest you to get personalized recommendations</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`p-3 text-sm rounded-lg border transition-colors text-left ${
                    profileData.interests.includes(interest)
                      ? 'bg-forest-50 border-forest-300 text-forest-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{interest}</span>
                    {profileData.interests.includes(interest) && (
                      <Check className="h-4 w-4 text-forest-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <p className="text-sm text-gray-500 text-center">
              Selected: {profileData.interests.length} interests
            </p>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h3>
              <p className="text-gray-600">Your profile looks great. Let's get you connected to your community!</p>
            </div>
            
            <div className="bg-forest-50 p-6 rounded-lg">
              <h4 className="font-semibold text-forest-800 mb-3">Profile Summary:</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Name:</span> {profileData.full_name || 'Not provided'}</div>
                <div><span className="font-medium">Neighborhood:</span> {profileData.neighborhood || 'Not provided'}</div>
                <div><span className="font-medium">Interests:</span> {profileData.interests.length > 0 ? profileData.interests.slice(0, 3).join(', ') + (profileData.interests.length > 3 ? '...' : '') : 'None selected'}</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-end sm:items-center justify-center sm:p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
        
        {/* Modal */}
        <div 
          ref={modalRef}
          className="relative w-full sm:max-w-2xl transform overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl transition-all animate-slide-up sm:animate-fade-in"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-forest-600 to-earth-500 px-6 py-6 text-white">
            <button
              onClick={handleSkip}
              className="absolute right-4 top-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Skip onboarding"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Welcome to Harmony Spaces!</h2>
                <p className="text-forest-100 mt-1">Let's set up your profile</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-forest-100">Step {currentStep} of {totalSteps}</div>
                <div className="w-32 bg-white/20 rounded-full h-2 mt-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-8 max-h-[70vh] overflow-y-auto">
            {renderStep()}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                {currentStep === 1 ? (
                  <button
                    onClick={handleSkip}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <Clock className="h-4 w-4" />
                    Skip (remind me later)
                  </button>
                ) : (
                  <button
                    onClick={prevStep}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                {currentStep < totalSteps ? (
                  <button
                    onClick={nextStep}
                    className="flex items-center gap-2 px-6 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-lg transition-colors"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleComplete}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Complete Profile
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;