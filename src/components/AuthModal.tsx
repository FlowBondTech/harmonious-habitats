import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mail, Sprout, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuthContext } from './AuthProvider';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    full_name: '',
    username: '',
    neighborhood: ''
  });

  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const lastActiveElement = useRef<Element | null>(null);

  // Trap focus within modal
  useEffect(() => {
    if (isOpen) {
      lastActiveElement.current = document.activeElement;
      initialFocusRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (lastActiveElement.current && 'focus' in lastActiveElement.current) {
        (lastActiveElement.current as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Tab') {
        // Get all focusable elements in modal
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) || [];

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        // If shift+tab and on first element, move to last element
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
        // If tab and on last element, cycle back to first element
        else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const { signUp, signInWithOTP, verifyOTP, startOnboarding, needsOnboarding } = useAuthContext();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateEmail = () => {
    setError(null);

    if (!formData.email) {
      setError('Email is required');
      return false;
    }

    return true;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading || !validateEmail()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'signin') {
        // Send magic link for sign in
        const { error } = await signInWithOTP(formData.email);
        if (error) {
          setError(error.message);
        } else {
          setSuccess('Check your email for the verification code!');
          setStep('verify');
        }
      } else {
        // Send magic link for sign up (just email, profile setup comes after verification)
        const { error } = await signInWithOTP(formData.email);

        if (error) {
          setError(error.message);
        } else {
          setSuccess('Check your email for the verification code!');
          setStep('verify');
        }
      }
    } catch (error) {
      console.error('Send code error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanOtp = formData.otp.trim();

    if (loading || !cleanOtp) {
      setError('Please enter the verification code');
      return;
    }

    if (cleanOtp.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    console.log('Starting verification with:', { email: formData.email, otp: cleanOtp });
    setLoading(true);
    setError(null);

    try {
      console.log('Calling verifyOTP...');
      const result = await verifyOTP(formData.email, cleanOtp);
      console.log('verifyOTP result:', result);

      if (result.error) {
        console.error('Verification error:', result.error);
        setError(result.error.message || 'Invalid code. Please try again.');
        setLoading(false);
      } else {
        console.log('Verification successful!');
        setSuccess('Verified successfully!');
        setLoading(false);

        setTimeout(() => {
          onClose();
          // Check if user needs onboarding, otherwise redirect to activities
          if (needsOnboarding) {
            console.log('Starting onboarding...');
            startOnboarding();
          } else {
            console.log('Navigating to activities...');
            navigate('/activities');
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Verify code error:', error);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setStep('email');
    setError(null);
    setSuccess(null);
    setFormData({
      email: '',
      otp: '',
      full_name: '',
      username: '',
      neighborhood: ''
    });
  };

  const goBackToEmail = () => {
    setStep('email');
    setError(null);
    setSuccess(null);
    setFormData(prev => ({ ...prev, otp: '' }));
  };

  const changeEmail = () => {
    setStep('email');
    setError(null);
    setSuccess(null);
    setFormData({
      email: '',
      otp: '',
      full_name: '',
      username: '',
      neighborhood: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="flex min-h-screen items-end sm:items-center justify-center sm:p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          ref={modalRef}
          className="relative w-full sm:max-w-md transform overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl transition-all animate-slide-up sm:animate-fade-in safe-area-bottom"
        >
          {/* Mobile drag handle */}
          <div className="flex sm:hidden justify-center pt-2 pb-1">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="bg-gradient-to-r from-forest-600 to-earth-500 px-6 py-6 sm:py-8 text-white">
            <button
              ref={initialFocusRef}
              onClick={onClose}
              className="absolute right-4 top-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus-ring"
              aria-label="Close"
            >
              <X className="icon-sm" />
            </button>

            {step === 'verify' && (
              <button
                onClick={goBackToEmail}
                className="absolute left-4 top-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus-ring"
                aria-label="Go back"
              >
                <ArrowLeft className="icon-sm" />
              </button>
            )}

            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white/20 p-2 rounded-xl">
                <Sprout className="icon-md" />
              </div>
              <h2 id="auth-title" className="text-2xl font-bold">Welcome to Harmony</h2>
            </div>

            <p className="text-forest-100">
              {step === 'email'
                ? 'Join our mindful community space'
                : 'Almost there! Check your email'
              }
            </p>
          </div>

          {/* Form */}
          <div className="px-6 py-6 sm:py-8 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            {step === 'email' ? (
              <form onSubmit={handleSendCode} className="space-y-4">
                {/* Informative Welcome Section */}
                <div className="bg-gradient-to-br from-forest-50 to-earth-50 rounded-xl p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-forest-100 rounded-full p-2 mt-0.5">
                      <Sprout className="h-4 w-4 text-forest-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-forest-800 mb-1">
                        One Simple Step to Harmonize
                      </h3>
                      <p className="text-xs text-forest-600 leading-relaxed">
                        No passwords needed! Whether you're new or returning, just enter your email and we'll send you a magic link to get started.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-sm text-forest-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 min-h-[44px] border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent text-base"
                      placeholder="your@email.com"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="mt-2 text-xs text-forest-500">
                    {mode === 'signin'
                      ? "Welcome back! We'll send you a secure code to access your account."
                      : "New here? We'll create your account and send you a secure code to get started."
                    }
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary btn-lg focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending magic link...</span>
                    </div>
                  ) : (
                    'Continue with Email'
                  )}
                </button>

                {/* Additional Info */}
                <div className="text-center pt-2">
                  <p className="text-xs text-forest-500">
                    No password required • Secure authentication • Quick access
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                {/* Email Sent Notification */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 rounded-full p-2 mt-0.5">
                      <Mail className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-green-800 mb-1">
                        Check Your Email!
                      </h3>
                      <p className="text-xs text-green-600 leading-relaxed">
                        We've sent a 6-digit code to <strong className="font-semibold">{formData.email}</strong>.
                        Enter it below to complete your harmonization.
                      </p>
                      <button
                        type="button"
                        onClick={changeEmail}
                        className="mt-2 text-xs text-green-700 hover:text-green-800 font-medium hover:underline focus:underline"
                      >
                        Wrong email? Click to change
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Enter Your Code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-sm text-forest-400" />
                    <input
                      type="text"
                      value={formData.otp}
                      onChange={(e) => handleInputChange('otp', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 min-h-[44px] border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent text-base tracking-widest text-center text-lg font-mono"
                      placeholder="000000"
                      maxLength={6}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="mt-2 text-xs text-forest-500">
                    The code expires in 10 minutes for security
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || formData.otp.length !== 6}
                  className="w-full btn-primary btn-lg focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    'Complete Harmonization'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading}
                  className="w-full text-sm text-forest-600 hover:text-forest-700 focus:underline py-2 transition-colors"
                >
                  Didn't receive the code? <span className="font-semibold">Resend</span>
                </button>
              </form>
            )}

            {/* Terms */}
            {step === 'email' && (
              <div className="mt-6 text-xs text-forest-500 text-center">
                By continuing, you agree to our community guidelines and privacy policy.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
