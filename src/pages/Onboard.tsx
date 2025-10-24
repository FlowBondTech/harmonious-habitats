import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  supabase,
  verifyRegistrationToken,
  completeOnboarding,
  updateProfile,
  trackReferral
} from '../lib/supabase'
import type { Profile } from '../lib/supabase'
import { CheckCircle, Loader2, ArrowRight, ArrowLeft } from 'lucide-react'

interface OnboardingStepsProps {
  profile: Profile
  verifiedEventInfo?: {
    event_id: string
    event_title: string
  }
  onComplete: () => void
}

const OnboardingSteps: React.FC<OnboardingStepsProps> = ({
  profile,
  verifiedEventInfo,
  onComplete
}) => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    username: profile.username || '',
    bio: profile.bio || '',
    holistic_interests: profile.holistic_interests || [],
    involvement_level: profile.involvement_level || 'curious' as 'curious' | 'active' | 'dedicated'
  })

  const availableInterests = [
    'Yoga', 'Meditation', 'Breathwork', 'Sound Healing', 'Reiki',
    'Herbalism', 'Nutrition', 'Dance', 'Art Therapy', 'Nature Connection',
    'Community Building', 'Sustainable Living'
  ]

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      // Final step - complete onboarding
      await handleComplete()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleComplete = async () => {
    setLoading(true)

    try {
      // Update profile with onboarding data
      const { error: updateError } = await updateProfile(profile.id, {
        full_name: formData.full_name,
        username: formData.username,
        bio: formData.bio,
        holistic_interests: formData.holistic_interests,
        involvement_level: formData.involvement_level
      })

      if (updateError) throw updateError

      // Mark onboarding as completed (this triggers referral stats update)
      const { error: onboardingError } = await completeOnboarding(profile.id)
      if (onboardingError) throw onboardingError

      onComplete()
    } catch (error: any) {
      console.error('Error completing onboarding:', error)
      alert('Failed to complete onboarding. Please try again.')
      setLoading(false)
    }
  }

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      holistic_interests: prev.holistic_interests.includes(interest)
        ? prev.holistic_interests.filter(i => i !== interest)
        : [...prev.holistic_interests, interest]
    }))
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.full_name.trim().length > 0
      case 2:
        return formData.holistic_interests.length > 0
      case 3:
        return formData.involvement_level !== null
      default:
        return false
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Event Info Banner (if applicable) */}
      {verifiedEventInfo && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">Event Registration Confirmed!</p>
              <p className="text-sm text-green-800 mt-1">
                You've been registered for: <strong>{verifiedEventInfo.event_title}</strong>
              </p>
              <p className="text-sm text-green-700 mt-1">
                Complete your profile setup below to get started.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Step {step} of 3</span>
          <span className="text-sm text-gray-500">
            {Math.round((step / 3) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-forest h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Harmonious Habitats!</h2>
          <p className="text-gray-600 mb-6">Let's get to know you better</p>

          <div className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username (optional)
              </label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Bio (optional)
              </label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                placeholder="Tell us a bit about yourself..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Interests */}
      {step === 2 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">What interests you?</h2>
          <p className="text-gray-600 mb-6">Select all the practices that resonate with you</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableInterests.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.holistic_interests.includes(interest)
                    ? 'border-forest bg-forest/10 text-forest font-medium'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>

          {formData.holistic_interests.length > 0 && (
            <p className="text-sm text-gray-600 mt-4">
              {formData.holistic_interests.length} interest{formData.holistic_interests.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>
      )}

      {/* Step 3: Involvement Level */}
      {step === 3 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">How would you like to participate?</h2>
          <p className="text-gray-600 mb-6">Choose your level of community involvement</p>

          <div className="space-y-3">
            {[
              {
                value: 'curious' as const,
                title: 'Curious Explorer',
                description: 'I want to browse and learn about different practices'
              },
              {
                value: 'active' as const,
                title: 'Active Participant',
                description: 'I want to regularly attend events and connect with others'
              },
              {
                value: 'dedicated' as const,
                title: 'Dedicated Community Member',
                description: 'I want to host events, share spaces, and help grow the community'
              }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFormData({ ...formData, involvement_level: option.value })}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  formData.involvement_level === option.value
                    ? 'border-forest bg-forest/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-gray-900 mb-1">{option.title}</p>
                <p className="text-sm text-gray-600">{option.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        {step > 1 ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={handleNext}
          disabled={!canProceed() || loading}
          className="flex items-center gap-2 px-6 py-3 bg-forest text-white rounded-lg font-medium hover:bg-forest/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Completing...
            </>
          ) : step === 3 ? (
            <>
              Complete Setup
              <CheckCircle className="w-4 h-4" />
            </>
          ) : (
            <>
              Next
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

const Onboard: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [verifiedEventInfo, setVerifiedEventInfo] = useState<{
    event_id: string
    event_title: string
  } | undefined>()

  useEffect(() => {
    const handleOnboarding = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()

        // Check for verification token in URL
        const token = searchParams.get('token')
        const source = searchParams.get('source')
        const eventId = searchParams.get('event_id')

        if (token && !user) {
          // User needs to verify token but isn't logged in
          setError('Please sign in first to verify your registration')
          setLoading(false)
          return
        }

        if (!user) {
          // No user and no token - redirect to auth
          navigate('/auth')
          return
        }

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) throw profileError

        // If token is present, verify it
        if (token) {
          const { data: verificationData, error: verificationError } = await verifyRegistrationToken(
            token,
            user.id
          )

          if (verificationError) {
            setError('Invalid or expired verification token')
            setLoading(false)
            return
          }

          if (verificationData?.success && verificationData.event_id) {
            setVerifiedEventInfo({
              event_id: verificationData.event_id,
              event_title: verificationData.event_title || 'Unknown Event'
            })
          }
        }

        // Check if profile is already complete
        if (profileData.onboarding_completed) {
          // Already onboarded - redirect to activities
          navigate('/activities')
          return
        }

        // Show onboarding wizard
        setProfile(profileData)
      } catch (error: any) {
        console.error('Onboarding error:', error)
        setError(error.message || 'Failed to load onboarding')
      } finally {
        setLoading(false)
      }
    }

    handleOnboarding()
  }, [navigate, searchParams])

  const handleOnboardingComplete = () => {
    // Redirect to event or activities page
    if (verifiedEventInfo) {
      navigate(`/events/${verifiedEventInfo.event_id}`)
    } else {
      navigate('/activities')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-forest animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Oops!</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => navigate('/auth')}
            className="w-full px-4 py-2 bg-forest text-white rounded-lg hover:bg-forest/90 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-700">Unable to load profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand">
      <OnboardingSteps
        profile={profile}
        verifiedEventInfo={verifiedEventInfo}
        onComplete={handleOnboardingComplete}
      />
    </div>
  )
}

export default Onboard
