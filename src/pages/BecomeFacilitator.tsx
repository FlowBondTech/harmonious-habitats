import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Heart, 
  Clock, 
  Calendar, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Star,
  MessageCircle,
  Award
} from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';

const BecomeFacilitator: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [facilitatorData, setFacilitatorData] = useState({
    skills: [] as string[],
    availability: [] as string[],
    experience: '',
    motivation: '',
    interests: [] as string[],
    commitment_level: ''
  });

  const totalSteps = 3;

  const SKILL_OPTIONS = [
    'Event Planning', 'Group Facilitation', 'Teaching', 'Public Speaking',
    'Art & Crafts', 'Music', 'Fitness Instruction', 'Cooking',
    'Gardening', 'Technology', 'Photography', 'Writing',
    'First Aid/Safety', 'Languages', 'Business/Finance', 'Childcare'
  ];

  const AVAILABILITY_OPTIONS = [
    'Weekday Mornings', 'Weekday Afternoons', 'Weekday Evenings',
    'Saturday Mornings', 'Saturday Afternoons', 'Saturday Evenings',
    'Sunday Mornings', 'Sunday Afternoons', 'Sunday Evenings'
  ];

  const COMMITMENT_OPTIONS = [
    { value: 'occasional', label: 'Occasional (1-2 times per month)', description: 'Help when you can' },
    { value: 'regular', label: 'Regular (1-2 times per week)', description: 'Consistent involvement' },
    { value: 'dedicated', label: 'Dedicated (3+ times per week)', description: 'High involvement' }
  ];

  const handleArrayToggle = (field: 'skills' | 'availability' | 'interests', value: string) => {
    setFacilitatorData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFacilitatorData(prev => ({ ...prev, [field]: value }));
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
      // Update profile with facilitator information
      const facilitatorProfile = {
        is_facilitator: true,
        facilitator_skills: facilitatorData.skills,
        facilitator_availability: facilitatorData.availability,
        facilitator_experience: facilitatorData.experience,
        facilitator_motivation: facilitatorData.motivation,
        facilitator_commitment: facilitatorData.commitment_level,
        interests: [...(user?.user_metadata?.interests || []), ...facilitatorData.interests]
      };

      const { error } = await updateProfile(facilitatorProfile);
      
      if (error) {
        console.error('Error updating facilitator profile:', error);
      } else {
        navigate('/activities?tab=facilitator');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Award className="h-16 w-16 text-forest-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Skills & Interests</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Select the skills you'd like to share and activities you're passionate about facilitating
              </p>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">What skills can you share?</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SKILL_OPTIONS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleArrayToggle('skills', skill)}
                      className={`p-3 text-sm rounded-lg border transition-colors text-left ${
                        facilitatorData.skills.includes(skill)
                          ? 'bg-forest-50 border-forest-300 text-forest-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{skill}</span>
                        {facilitatorData.skills.includes(skill) && (
                          <CheckCircle className="h-4 w-4 text-forest-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tell us about your experience</h3>
                <textarea
                  value={facilitatorData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  placeholder="Share any relevant experience, training, or background that would help you facilitate community events..."
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Clock className="h-16 w-16 text-forest-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Availability</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Let us know when you're generally available to help with community events
              </p>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">When are you typically available?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {AVAILABILITY_OPTIONS.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleArrayToggle('availability', time)}
                      className={`p-3 text-sm rounded-lg border transition-colors text-left ${
                        facilitatorData.availability.includes(time)
                          ? 'bg-forest-50 border-forest-300 text-forest-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{time}</span>
                        {facilitatorData.availability.includes(time) && (
                          <CheckCircle className="h-4 w-4 text-forest-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How much time can you commit?</h3>
                <div className="space-y-3">
                  {COMMITMENT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('commitment_level', option.value)}
                      className={`w-full p-4 rounded-lg border transition-colors text-left ${
                        facilitatorData.commitment_level === option.value
                          ? 'bg-forest-50 border-forest-300 text-forest-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.description}</div>
                        </div>
                        {facilitatorData.commitment_level === option.value && (
                          <CheckCircle className="h-5 w-5 text-forest-600 mt-1" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Heart className="h-16 w-16 text-forest-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Motivation</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Help us understand what drives you to support your community
              </p>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Why do you want to be a facilitator?</h3>
                <textarea
                  value={facilitatorData.motivation}
                  onChange={(e) => handleInputChange('motivation', e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  placeholder="Share what motivates you to volunteer your time and help build community connections..."
                />
              </div>

              <div className="bg-forest-50 p-6 rounded-lg">
                <h4 className="font-semibold text-forest-800 mb-3">What happens next?</h4>
                <div className="space-y-2 text-sm text-forest-700">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-4 w-4" />
                    <span>We'll review your application and get back to you within 2-3 days</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4" />
                    <span>You'll be added to our facilitator community group</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4" />
                    <span>You'll start receiving event facilitation opportunities</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="h-4 w-4" />
                    <span>Build your community reputation and earn recognition</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-earth-50/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          
          <div className="bg-gradient-to-r from-forest-600 to-earth-500 text-white p-6 rounded-2xl mb-8">
            <h1 className="text-4xl font-bold mb-2">Become a Community Facilitator</h1>
            <p className="text-forest-100 text-lg">
              Help strengthen your neighborhood by facilitating events and supporting community connections
            </p>
            
            <div className="flex items-center justify-center mt-6">
              <div className="text-sm text-forest-100">Step {currentStep} of {totalSteps}</div>
              <div className="w-32 bg-white/20 rounded-full h-2 ml-4">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <div>
              {currentStep > 1 ? (
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </button>
              ) : (
                <div></div>
              )}
            </div>

            <div className="flex gap-3">
              {currentStep < totalSteps ? (
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-8 py-3 bg-forest-600 hover:bg-forest-700 text-white rounded-lg transition-colors font-medium"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-forest-600 hover:bg-forest-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Complete Application
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeFacilitator;