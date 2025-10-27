import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  supabase,
  verifyRegistrationToken,
  completeOnboarding,
  updateProfile
} from '../lib/supabase'
import type { Profile } from '../lib/supabase'
import {
  CheckCircle,
  Loader2,
  ArrowRight,
  Mail,
  Send,
  Heart,
  Users,
  MapPin,
  Calendar,
  Sparkles,
  Shield,
  Zap
} from 'lucide-react'

// Feature card component
interface FeatureCardProps {
  icon: React.ElementType
  title: string
  description: string
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => (
  <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-forest-100">
    <div className="w-12 h-12 bg-gradient-to-br from-forest-500 to-earth-500 rounded-xl flex items-center justify-center mb-4">
      <Icon className="h-6 w-6 text-white" />
    </div>
    <h3 className="font-semibold text-forest-800 mb-2">{title}</h3>
    <p className="text-sm text-forest-600">{description}</p>
  </div>
)

// Email Collection Component
const EmailCollectionForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cleanup timer on unmount to prevent memory leaks
  useEffect(() => {
    let resetTimer: NodeJS.Timeout | null = null

    if (sent) {
      // Auto-reset after 5 seconds for public/shared devices
      resetTimer = setTimeout(() => {
        setSent(false)
        setEmail('')
        setError(null)
      }, 5000)
    }

    return () => {
      if (resetTimer) {
        clearTimeout(resetTimer)
      }
    }
  }, [sent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)

    try {
      // Send magic link to user's email
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/onboard`
        }
      })

      if (error) throw error

      setSent(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      console.error('Error sending magic link:', err)
      setError(errorMessage || 'Failed to send login link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div
        className="bg-white rounded-2xl p-8 shadow-xl border border-forest-200 max-w-md mx-auto"
        role="status"
        aria-live="polite"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-forest-800 mb-2">Check Your Email!</h3>
          <p className="text-forest-600 mb-4">
            We've sent you a secure login link.
          </p>
          <p className="text-sm text-forest-500">
            Click the link in your email to continue setting up your profile on your device.
          </p>
          <p className="text-xs text-forest-400 mt-4" aria-live="polite">
            This form will reset in a few seconds...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-xl border border-forest-200 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-forest-500 to-earth-500 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-forest-800 mb-2">Get Started</h3>
        <p className="text-forest-600">
          Enter your email to receive a secure login link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" aria-label="Email login form">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-forest-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? 'email-error' : undefined}
            className="w-full px-4 py-3 border border-forest-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
          />
        </div>

        {error && (
          <div
            id="email-error"
            role="alert"
            aria-live="assertive"
            className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim()}
          aria-busy={loading}
          aria-label={loading ? 'Sending login link' : 'Send login link to your email'}
          className="w-full bg-gradient-to-r from-forest-600 to-earth-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-forest-700 hover:to-earth-700 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" aria-hidden="true" />
              <span>Send Login Link</span>
            </>
          )}
        </button>
      </form>

      <p className="text-xs text-forest-500 text-center mt-4">
        We'll send you a secure link to complete your profile on your own device.
      </p>
    </div>
  )
}

// Onboarding Steps Component (the 3-step wizard)
interface OnboardingStepsProps {
  profile: Profile
  verifiedEventInfo?: {
    event_id: string
    event_title: string
  }
  onComplete: () => void
}

const OnboardingSteps: React.FC<OnboardingStepsProps> = ({ profile, verifiedEventInfo, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    neighborhood: profile.neighborhood || '',
    interests: profile.interests || []
  })
  const [saving, setSaving] = useState(false)

  const interestOptions = [
    'Yoga & Meditation',
    'Community Gardening',
    'Cooking & Food',
    'Arts & Crafts',
    'Music & Dance',
    'Fitness & Wellness',
    'Education & Learning',
    'Social Impact',
    'Technology',
    'Nature & Outdoors'
  ]

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setSaving(true)
    try {
      await updateProfile(profile.id, {
        full_name: formData.full_name,
        neighborhood: formData.neighborhood,
        interests: formData.interests
      })

      await completeOnboarding(profile.id)
      onComplete()
    } catch (error) {
      console.error('Error completing onboarding:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-xl border border-forest-200 max-w-2xl mx-auto">
      {/* Event Verification Badge */}
      {verifiedEventInfo && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center space-x-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">
              Checked in at: {verifiedEventInfo.event_title}
            </span>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3].map(step => (
            <React.Fragment key={step}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                step <= currentStep
                  ? 'bg-forest-600 text-white'
                  : 'bg-forest-100 text-forest-400'
              }`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`flex-1 h-1 mx-2 ${
                  step < currentStep ? 'bg-forest-600' : 'bg-forest-100'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between text-xs text-forest-600">
          <span>Your Name</span>
          <span>Location</span>
          <span>Interests</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-forest-800 mb-2">What's your name?</h3>
            <p className="text-forest-600 mb-6">Help your neighbors recognize you</p>
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-forest-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-forest-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-forest-800 mb-2">Where are you located?</h3>
            <p className="text-forest-600 mb-6">We'll show you events and spaces nearby</p>
            <div>
              <label htmlFor="neighborhood" className="block text-sm font-medium text-forest-700 mb-2">
                Neighborhood or City
              </label>
              <input
                type="text"
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                placeholder="e.g., Downtown Portland, Brooklyn, etc."
                className="w-full px-4 py-3 border border-forest-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-forest-800 mb-2">What interests you?</h3>
            <p className="text-forest-600 mb-6">Select activities you'd like to explore</p>
            <div className="grid grid-cols-2 gap-3">
              {interestOptions.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    formData.interests.includes(interest)
                      ? 'bg-forest-600 text-white border-2 border-forest-600'
                      : 'bg-white text-forest-700 border-2 border-forest-200 hover:border-forest-400'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        {currentStep > 1 ? (
          <button
            onClick={handleBack}
            className="px-6 py-3 text-forest-700 font-semibold hover:bg-forest-50 rounded-xl transition-colors"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        {currentStep < 3 ? (
          <button
            onClick={handleNext}
            disabled={
              (currentStep === 1 && !formData.full_name.trim()) ||
              (currentStep === 2 && !formData.neighborhood.trim())
            }
            className="bg-gradient-to-r from-forest-600 to-earth-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-forest-700 hover:to-earth-700 transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <span>Next</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleComplete}
            disabled={saving || formData.interests.length === 0}
            className="bg-gradient-to-r from-forest-600 to-earth-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-forest-700 hover:to-earth-700 transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Complete Setup</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// Main Onboard Component
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

        // Check for verification token in URL (from event check-in)
        const token = searchParams.get('token')

        // If no user logged in, show email collection form
        if (!user) {
          setLoading(false)
          return
        }

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) throw profileError

        // If token is present (from event check-in), verify it
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
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-earth-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-forest-600 animate-spin mx-auto mb-4" />
          <p className="text-forest-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-earth-50/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-200 p-8">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Oops!</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-3 bg-forest-600 text-white rounded-xl hover:bg-forest-700 transition-colors font-semibold"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-earth-50/30">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-forest-600 via-forest-500 to-earth-500 text-white overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/5 rounded-full animate-float"></div>
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-earth-300/10 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-3/4 w-16 h-16 bg-forest-300/10 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="animate-fade-in-up">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                  Welcome to
                  <span className="block text-earth-200 mt-2">Harmonik Space</span>
                </h1>
                <p className="text-lg md:text-xl text-forest-100 max-w-3xl mx-auto leading-relaxed">
                  {profile
                    ? "Let's complete your profile to connect you with your local community"
                    : "Join your neighbors in building a more connected, mindful community"
                  }
                </p>
              </div>

              {/* Quick Stats */}
              {!profile && (
                <div className="grid grid-cols-3 gap-4 mt-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-3xl font-bold">2.8K+</div>
                    <div className="text-sm text-forest-100 mt-1">Members</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-3xl font-bold">150+</div>
                    <div className="text-sm text-forest-100 mt-1">Events</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-3xl font-bold">25+</div>
                    <div className="text-sm text-forest-100 mt-1">Communities</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Column - Features/Benefits */}
            {!profile && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-forest-800 mb-4">
                    Why Join Harmonik Space?
                  </h2>
                  <p className="text-forest-600 text-lg mb-8">
                    Connect with like-minded neighbors and discover holistic activities within walking distance.
                  </p>
                </div>

                <div className="grid gap-6">
                  <FeatureCard
                    icon={MapPin}
                    title="Discover Local Events"
                    description="Find yoga classes, meditation circles, community gardens, and wellness activities in your neighborhood"
                  />
                  <FeatureCard
                    icon={Users}
                    title="Build Connections"
                    description="Meet neighbors who share your interests and values, creating lasting friendships"
                  />
                  <FeatureCard
                    icon={Calendar}
                    title="Share Your Gifts"
                    description="Facilitate events, share spaces, and contribute your unique skills to the community"
                  />
                  <FeatureCard
                    icon={Heart}
                    title="Foster Wellbeing"
                    description="Participate in activities that nurture physical, mental, and spiritual health"
                  />
                </div>

                <div className="bg-gradient-to-br from-forest-50 to-earth-50 rounded-2xl p-6 border border-forest-200">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-forest-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-forest-800 mb-1">Privacy First</h3>
                      <p className="text-sm text-forest-600">
                        Your data is secure. We never sell your information and you control what you share.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Right Column - Onboarding Form */}
            <div className={!profile ? '' : 'lg:col-span-2'}>
              {!profile ? (
                <EmailCollectionForm />
              ) : (
                <OnboardingSteps
                  profile={profile}
                  verifiedEventInfo={verifiedEventInfo}
                  onComplete={handleOnboardingComplete}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA for non-logged-in users */}
      {!profile && (
        <section className="bg-gradient-to-r from-forest-600 to-earth-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-forest-100 mb-8 max-w-2xl mx-auto">
              Join thousands of neighbors building stronger, more connected communities through shared experiences.
            </p>
            <div className="flex items-center justify-center space-x-2 text-forest-100">
              <Zap className="w-5 h-5" />
              <span className="text-sm">Free to join • No credit card required • Cancel anytime</span>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default Onboard
