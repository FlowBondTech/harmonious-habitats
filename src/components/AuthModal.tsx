import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mail, Lock, User, MapPin, Eye, EyeOff, Sprout } from 'lucide-react';
import { useAuthContext } from './AuthProvider';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
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

  const { signIn, signUp, startOnboarding } = useAuthContext();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    
    // Real-time validation for password confirmation
    if (field === 'confirmPassword' && mode === 'signup') {
      if (value && formData.password && value !== formData.password) {
        setError('Passwords do not match');
      }
    }
  };

  const validateForm = () => {
    // Clear any existing errors first
    setError(null);
    
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return false;
    }

    if (mode === 'signup') {
      if (!formData.full_name.trim()) {
        setError('Full name is required');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (!formData.confirmPassword) {
        setError('Please confirm your password');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission and validate form
    if (loading || !validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          setError(error.message);
        } else {
          onClose();
          navigate('/activities');
        }
      } else {
        const { error } = await signUp(formData.email, formData.password, {
          full_name: formData.full_name,
          username: formData.username || undefined,
          neighborhood: formData.neighborhood || undefined
        });
        
        if (error) {
          setError(error.message);
        } else {
          setSuccess('Account created successfully! Welcome to Harmony Spaces!');
          // Close modal and start onboarding after a short delay
          setTimeout(() => {
            onClose();
            startOnboarding();
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
    setSuccess(null);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
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
            
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white/20 p-2 rounded-xl">
                <Sprout className="icon-md" />
              </div>
              <h2 id="auth-title" className="text-2xl font-bold">Harmony Spaces</h2>
            </div>
            
            <p className="text-forest-100">
              {mode === 'signin' 
                ? 'Welcome back to your community' 
                : 'Join your neighborhood community'
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-sm text-forest-400" />
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 min-h-[44px] border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent text-base"
                        placeholder="Your full name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Username (optional)
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-sm text-forest-400" />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 min-h-[44px] border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent text-base"
                        placeholder="Choose a username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Neighborhood (optional)
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-sm text-forest-400" />
                      <input
                        type="text"
                        value={formData.neighborhood}
                        onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 min-h-[44px] border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent text-base"
                        placeholder="e.g., Downtown, Riverside, etc."
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-sm text-forest-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-sm text-forest-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full pl-10 pr-12 py-3 min-h-[44px] border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent text-base"
                    placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-forest-400 hover:text-forest-600 focus-ring rounded"
                  >
                    {showPassword ? <EyeOff className="icon-sm" /> : <Eye className="icon-sm" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-sm text-forest-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 text-base ${
                        formData.confirmPassword && formData.password
                          ? formData.password === formData.confirmPassword
                            ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                            : 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-forest-200 focus:ring-forest-500 focus:border-transparent'
                      }`}
                      placeholder="Confirm your password"
                      required
                    />
                    {formData.confirmPassword && formData.password && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {formData.password === formData.confirmPassword ? (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        ) : (
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                    )}
                  </div>
                  {formData.confirmPassword && formData.password && formData.password !== formData.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (mode === 'signup' && formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword)}
                className="w-full btn-primary btn-lg focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{mode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                  </div>
                ) : (
                  mode === 'signin' ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            {/* Switch Mode */}
            <div className="mt-6 text-center">
              <p className="text-forest-600">
                {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
                <button
                  onClick={switchMode}
                  className="ml-2 text-forest-700 font-semibold hover:text-forest-800 transition-colors focus:underline focus-ring rounded"
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>

            {mode === 'signup' && (
              <div className="mt-4 text-xs text-forest-500 text-center">
                By creating an account, you agree to our community guidelines and privacy policy.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;