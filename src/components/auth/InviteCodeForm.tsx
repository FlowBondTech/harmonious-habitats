import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Key, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface InviteCodeFormProps {
  onValidCode: (code: string) => void;
  onSwitchToSignIn: () => void;
}

const InviteCodeForm: React.FC<InviteCodeFormProps> = ({ onValidCode, onSwitchToSignIn }) => {
  const { validateInviteCode } = useAuth();
  const { theme } = useTheme();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError('');

    try {
      const result = await validateInviteCode(code.trim());
      
      if (result.valid) {
        onValidCode(code.trim().toUpperCase());
      } else {
        setError(result.error || 'Invalid invite code');
      }
    } catch (error) {
      console.error('Validation error:', error);
      setError('Unable to validate invite code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 12) { // Allow for longer word-based codes
      setCode(value);
      setError('');
    }
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
            <Key className="w-8 h-8 text-sage-500" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Welcome to Holistic Spaces</h1>
          <p className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Enter your invite code to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Invite Code
            </label>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="Enter your invite code"
              className={`
                w-full px-4 py-3 rounded-lg border text-center text-lg font-mono tracking-wider
                ${error 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'focus:ring-sage-500 focus:border-transparent'
                }
                ${theme === 'dark' 
                  ? 'bg-neutral-700 border-neutral-600 text-neutral-100 placeholder-neutral-400' 
                  : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-500'
                }
                focus:ring-2 transition-all duration-200
              `}
              autoComplete="off"
              autoFocus
            />
            {error && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!code.trim() || loading}
            className={`
              w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium
              transition-all duration-200 transform
              ${!code.trim() || loading
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                : 'bg-sage-500 text-white hover:bg-sage-600 hover:scale-[1.02] active:scale-[0.98]'
              }
            `}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Already have an account section */}
        <div className={`
          mt-6 pt-6 border-t text-center
          ${theme === 'dark' ? 'border-neutral-700' : 'border-neutral-200'}
        `}>
          <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Already have an account?
          </p>
          <button
            onClick={onSwitchToSignIn}
            className={`
              w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
              ${theme === 'dark' 
                ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600' 
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }
              transform hover:scale-[1.02] active:scale-[0.98]
            `}
          >
            Sign In
          </button>
        </div>

        <div className={`
          mt-6 pt-4 border-t text-center text-sm
          ${theme === 'dark' ? 'border-neutral-700 text-neutral-400' : 'border-neutral-200 text-neutral-600'}
        `}>
          Need an invite code? Contact an admin to get started.
        </div>
      </div>
    </div>
  );
};

export default InviteCodeForm;