import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ComponentType<{ className?: string }>;
  clearable?: boolean;
  onClear?: () => void;
}

const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(({
  label,
  error,
  icon: Icon,
  clearable = false,
  onClear,
  type = 'text',
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = props.value && String(props.value).length > 0;

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className={`relative ${error ? 'mb-1' : ''}`}>
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}

        <input
          ref={ref}
          type={inputType}
          className={`
            w-full px-4 py-3
            ${Icon ? 'pl-11' : ''}
            ${type === 'password' || (clearable && hasValue) ? 'pr-11' : ''}
            text-base
            bg-white
            border rounded-xl
            transition-all duration-200
            placeholder-gray-400
            ${isFocused ? 'border-forest-500 ring-2 ring-forest-500/20' : 'border-gray-300'}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            focus:outline-none
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${className}
          `}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {/* Password toggle or Clear button */}
        {(type === 'password' || (clearable && hasValue)) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {clearable && hasValue && (
              <button
                type="button"
                onClick={() => {
                  if (onClear) onClear();
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {type === 'password' && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

MobileInput.displayName = 'MobileInput';

export default MobileInput;