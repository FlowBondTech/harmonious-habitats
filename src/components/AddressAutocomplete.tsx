import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { MapPin, Loader2, Navigation, X } from 'lucide-react';
import { GeoCodingService, AddressSuggestion, GeocodingResult } from '../utils/geocoding';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, coordinates?: { latitude: number; longitude: number }) => void;
  placeholder?: string;
  required?: boolean;
  allowCurrentLocation?: boolean;
  error?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Enter address...",
  required = false,
  allowCurrentLocation = true,
  error
}) => {
  const { theme } = useTheme();
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await GeoCodingService.searchAddresses(query);
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Address search failed:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search
    debounceRef.current = setTimeout(() => {
      searchAddresses(newValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    onChange(suggestion.displayName, {
      latitude: suggestion.latitude,
      longitude: suggestion.longitude
    });
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const location = await GeoCodingService.getCurrentLocation();
      if (location) {
        onChange(location.formattedAddress, {
          latitude: location.latitude,
          longitude: location.longitude
        });
      } else {
        alert('Unable to get your current location. Please check your browser permissions.');
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      alert('Failed to get current location.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const clearAddress = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <MapPin className="w-5 h-5 text-neutral-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => value.length >= 3 && setShowSuggestions(true)}
          placeholder={placeholder}
          required={required}
          className={`
            w-full pl-10 pr-20 py-3 rounded-lg border
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
        />

        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {value && (
            <button
              type="button"
              onClick={clearAddress}
              className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
              title="Clear address"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          )}
          
          {allowCurrentLocation && (
            <button
              type="button"
              onClick={handleCurrentLocation}
              disabled={isGettingLocation}
              className={`
                p-1 rounded transition-colors
                ${isGettingLocation 
                  ? 'cursor-not-allowed' 
                  : 'hover:bg-neutral-200 dark:hover:bg-neutral-600'
                }
              `}
              title="Use current location"
            >
              {isGettingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin text-sage-500" />
              ) : (
                <Navigation className="w-4 h-4 text-neutral-400 hover:text-sage-500" />
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || isLoading) && (
        <div className={`
          absolute z-50 w-full mt-1 rounded-lg shadow-lg border max-h-60 overflow-y-auto
          ${theme === 'dark' 
            ? 'bg-neutral-800 border-neutral-700' 
            : 'bg-white border-neutral-200'
          }
        `}>
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-5 h-5 animate-spin text-sage-500 mr-2" />
              <span className={`text-sm ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-600'}`}>
                Searching addresses...
              </span>
            </div>
          ) : (
            suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={`
                  w-full text-left p-3 flex items-start gap-3 transition-colors
                  ${theme === 'dark' 
                    ? 'hover:bg-neutral-700 text-neutral-200' 
                    : 'hover:bg-neutral-50 text-neutral-800'
                  }
                  border-b border-neutral-200 dark:border-neutral-700 last:border-b-0
                `}
              >
                <MapPin className="w-4 h-4 text-sage-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {suggestion.displayName}
                  </div>
                  {suggestion.city && suggestion.state && (
                    <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      {suggestion.city}, {suggestion.state}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;