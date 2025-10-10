import React from 'react';
import { Check } from 'lucide-react';

export interface FormCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  label,
  checked,
  onChange,
  description,
  disabled = false,
  className = ''
}) => {
  return (
    <label className={`flex items-start space-x-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div className={`
          w-5 h-5 rounded border-2 flex items-center justify-center transition-all
          ${checked
            ? 'bg-forest-600 border-forest-600'
            : 'bg-white border-forest-300 hover:border-forest-400'
          }
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}>
          {checked && <Check className="h-3 w-3 text-white" />}
        </div>
      </div>
      <div className="flex-1">
        <span className="text-sm font-medium text-forest-800">{label}</span>
        {description && (
          <p className="text-xs text-forest-600 mt-1">{description}</p>
        )}
      </div>
    </label>
  );
};

export default FormCheckbox;
