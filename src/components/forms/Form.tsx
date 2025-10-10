import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export interface FormProps {
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  error?: string | null;
  success?: string | null;
  className?: string;
}

export const Form: React.FC<FormProps> = ({
  onSubmit,
  children,
  error,
  success,
  className = ''
}) => {
  return (
    <form onSubmit={onSubmit} className={`space-y-8 ${className}`}>
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-fadeIn">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-fadeIn">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {children}
    </form>
  );
};

export default Form;
