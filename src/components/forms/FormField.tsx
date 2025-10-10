import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'time' | 'textarea' | 'select';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string;
  helpText?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  rows?: number;
  min?: string | number;
  max?: string | number;
  options?: Array<{ value: string | number; label: string }>;
  icon?: React.ReactNode;
}

export const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, FormFieldProps>(
  ({
    label,
    name,
    type = 'text',
    value,
    onChange,
    error,
    helpText,
    placeholder,
    required = false,
    disabled = false,
    className = '',
    rows = 4,
    min,
    max,
    options = [],
    icon
  }, ref) => {
    const baseInputClasses = `
      w-full px-4 py-3
      border rounded-lg
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent
      disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
      ${error
        ? 'border-red-300 focus:ring-red-500'
        : 'border-forest-200 hover:border-forest-300'
      }
      ${className}
    `;

    const renderInput = () => {
      if (type === 'textarea') {
        return (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            className={baseInputClasses}
          />
        );
      }

      if (type === 'select') {
        return (
          <select
            ref={ref as React.Ref<HTMLSelectElement>}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={baseInputClasses}
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      }

      return (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          className={baseInputClasses}
        />
      );
    };

    return (
      <div className="space-y-2">
        <label htmlFor={name} className="flex items-center text-sm font-medium text-forest-700">
          {icon && <span className="mr-2">{icon}</span>}
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {renderInput()}

        {error && (
          <div className="flex items-start space-x-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {helpText && !error && (
          <p className="text-xs text-forest-600">{helpText}</p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export default FormField;
