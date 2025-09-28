import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface MobileSelectProps {
  label?: string;
  placeholder?: string;
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

const MobileSelect: React.FC<MobileSelectProps> = ({
  label,
  placeholder = 'Select an option',
  options,
  value,
  onChange,
  error,
  required,
  disabled
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when opened on mobile
      if (window.innerWidth < 768 && inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative" ref={dropdownRef}>
        {/* Select Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-4 py-3
            text-left text-base
            bg-white
            border rounded-xl
            transition-all duration-200
            flex items-center justify-between
            ${isOpen ? 'border-forest-500 ring-2 ring-forest-500/20' : 'border-gray-300'}
            ${error ? 'border-red-500' : ''}
            ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'cursor-pointer'}
            focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20
          `}
        >
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Mobile Overlay */}
            <div className="md:hidden fixed inset-0 bg-black/20 z-40" />

            {/* Dropdown Content */}
            <div className={`
              absolute z-50
              w-full md:w-auto md:min-w-full
              mt-2
              bg-white
              border border-gray-200
              shadow-xl
              md:rounded-xl
              overflow-hidden
              md:max-h-80
              ${/* Mobile: Fixed bottom sheet */ ''}
              max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0
              max-md:rounded-t-2xl max-md:animate-slide-up
            `}>
              {/* Mobile Header */}
              <div className="md:hidden border-b border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{label || 'Select'}</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                {/* Search Input (Mobile) */}
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search options..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-forest-500"
                />
              </div>

              {/* Options List */}
              <div className="overflow-y-auto max-h-64 md:max-h-80">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = option.value === value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          onChange(option.value);
                          setIsOpen(false);
                          setSearchQuery('');
                        }}
                        className={`
                          w-full px-4 py-3
                          text-left text-base
                          flex items-center justify-between
                          transition-colors
                          ${isSelected ? 'bg-forest-50 text-forest-700' : 'hover:bg-gray-50'}
                          active:bg-gray-100
                        `}
                      >
                        <div className="flex items-center gap-3">
                          {Icon && <Icon className="h-5 w-5 text-gray-400" />}
                          <span>{option.label}</span>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-forest-600" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500">
                    No options found
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default MobileSelect;