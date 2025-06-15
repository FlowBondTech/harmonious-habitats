import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { User, Mail, Lock, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

interface SignUpFormProps {
  inviteCode: string;
  onBack: () => void;
  onSuccess: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ inviteCode, onBack, onSuccess }) => {
  const { signUp } = useAuth();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    const result = await signUp(
      formData.email,
      formData.password,
      inviteCode,
      formData.fullName
    );

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Failed to create account');
    }
    
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  return (
    <div className={`
      min-h-screen flex items-center justify-center p-4
      ${theme === 'dark' ? 'bg-neutral-900' : 'bg-sage-50/50'}
    `}>
      <div className={`
        w-full max-w-md p-8 rounded-2xl shadow-xl
        ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
      `}>
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className={`
              p-2 rounded-lg transition-colors
              ${theme === 'dark' ? 'hover:bg-neutral-700' : 'hover:bg-neutral-100'}
            `}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold ml-3">Create Your Account</h1>
        </div>

        <div className={`
          flex items-center gap-3 p-3 rounded-lg mb-6
          ${theme === 'dark' ? 'bg-sage-900/30' : 'bg-sage-50'}
        `}>
          <CheckCircle className="w-5 h-5 text-sage-500" />
          <div>
            <p className="text-sm font-medium">Invite Code Verified</p>
            <p className={`text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {inviteCode}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className={`
                  w-full pl-10 pr-4 py-3 rounded-lg border
                  ${theme === 'dark' 
                    ? 'bg-neutral-700 border-neutral-600 text-neutral-100 placeholder-neutral-400' 
                    : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-500'
                  }
                  focus:ring-2 focus:ring-sage-500 focus:border-transparent
                  transition-all duration-200
                `}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className={`
                  w-full pl-10 pr-4 py-3 rounded-lg border
                  ${theme === 'dark' 
                    ? 'bg-neutral-700 border-neutral-600 text-neutral-100 placeholder-neutral-400' 
                    : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-500'
                  }
                  focus:ring-2 focus:ring-sage-500 focus:border-transparent
                  transition-all duration-200
                `}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
                className={`
                  w-full pl-10 pr-4 py-3 rounded-lg border
                  ${theme === 'dark' 
                    ? 'bg-neutral-700 border-neutral-600 text-neutral-100 placeholder-neutral-400' 
                    : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-500'
                  }
                  focus:ring-2 focus:ring-sage-500 focus:border-transparent
                  transition-all duration-200
                `}
                required
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                className={`
                  w-full pl-10 pr-4 py-3 rounded-lg border
                  ${theme === 'dark' 
                    ? 'bg-neutral-700 border-neutral-600 text-neutral-100 placeholder-neutral-400' 
                    : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-500'
                  }
                  focus:ring-2 focus:ring-sage-500 focus:border-transparent
                  transition-all duration-200
                `}
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`
              w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium
              transition-all duration-200 transform
              ${loading
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                : 'bg-sage-500 text-white hover:bg-sage-600 hover:scale-[1.02] active:scale-[0.98]'
              }
            `}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className={`
          mt-6 pt-4 border-t text-center text-xs
          ${theme === 'dark' ? 'border-neutral-700 text-neutral-400' : 'border-neutral-200 text-neutral-600'}
        `}>
          By creating an account, you agree to our terms of service and privacy policy.
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;