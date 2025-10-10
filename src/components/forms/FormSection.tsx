import React from 'react';

export interface FormSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  icon,
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="border-b border-forest-100 pb-3">
        <h2 className="text-xl font-semibold text-forest-800 flex items-center">
          {icon && <span className="mr-2">{icon}</span>}
          {title}
        </h2>
        {description && (
          <p className="text-sm text-forest-600 mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};

export default FormSection;
