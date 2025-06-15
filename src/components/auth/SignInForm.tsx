import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Mail, Lock, Loader2, LogIn } from 'lucide-react';

interface SignInFormProps {
  onSwitchToInvite: () => void;
}

const SignInForm: React.FC<SignInFormProps> = ({ onSwitchToInvite }) => {
  const { signIn } = useAuth();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn(formData.email, formData.password);

    if (!result.success) {
      setError(result.error || 'Failed to sign in');
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
        <div className="text-center mb-8">
          <div className={`
            inline-flex items-center justify-center w-16 h-16 rounded-full mb-4
            ${theme === 'dark' ? 'bg-sage-900/30' : 'bg-sage-100'}
          `}>
            <LogIn className="w-8 h-8 text-sage-500" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Welcome Back</h1>
          <p className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Enter your password"
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
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Need an invite code section */}
        <div className={`
          mt-6 pt-6 border-t text-center
          ${theme === 'dark' ? 'border-neutral-700' : 'border-neutral-200'}
        `}>
          <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Don't have an account?
          </p>
          <button
            onClick={onSwitchToInvite}
            className={`
              w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
              ${theme === 'dark' 
                ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600' 
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }
              transform hover:scale-[1.02] active:scale-[0.98]
            `}
          >
            Get an Invite Code
          </button>
        </div>

        <div className={`
          mt-6 pt-4 border-t text-center text-sm
          ${theme === 'dark' ? 'border-neutral-700 text-neutral-400' : 'border-neutral-200 text-neutral-600'}
        `}>
          You'll need an invite code to create a new account.
        </div>
      </div>
    </div>
  );
};

export default SignInForm;