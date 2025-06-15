import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { 
  Building2, 
  GraduationCap, 
  Users, 
  Save, 
  Loader2, 
  MapPin, 
  Shield,
  Globe
} from 'lucide-react';
import AddressAutocomplete from './AddressAutocomplete';

interface HoldSpaceFormProps {
  onSubmit: () => void;
}

const HoldSpaceForm: React.FC<HoldSpaceFormProps> = ({ onSubmit }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    capacity: 10,
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    locationRestricted: false,
    locationRadius: 5,
    pricingType: 'free' as 'free' | 'fixed' | 'donation',
    amount: '',
    suggestedDonation: '',
    imageUrl: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate location requirements
    if (formData.locationRestricted && (!formData.latitude || !formData.longitude)) {
      setError('Please select a valid address for location-restricted spaces.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const spaceData = {
        title: formData.title,
        description: formData.description,
        holder_id: user.id,
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        location_restricted: formData.locationRestricted,
        location_radius: formData.locationRestricted ? formData.locationRadius : null,
        capacity: formData.capacity,
        status: 'open',
        pricing_type: formData.pricingType,
        price_amount: formData.pricingType === 'fixed' ? Number(formData.amount) : null,
        suggested_donation: formData.pricingType === 'donation' ? Number(formData.suggestedDonation) : null,
        image_url: formData.imageUrl || null
      };

      const { error: insertError } = await supabase
        .from('spaces')
        .insert(spaceData);

      if (insertError) throw insertError;

      onSubmit();
    } catch (err) {
      console.error('Error creating space:', err);
      setError(err instanceof Error ? err.message : 'Failed to create space');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    }));
    setError('');
  };

  const handleLocationChange = (address: string, coordinates?: { latitude: number; longitude: number }) => {
    setFormData(prev => ({
      ...prev,
      location: address,
      latitude: coordinates?.latitude || null,
      longitude: coordinates?.longitude || null
    }));
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Space Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`
                w-full px-4 py-3 rounded-lg border
                ${theme === 'dark' 
                  ? 'bg-neutral-700 border-neutral-600 text-neutral-100' 
                  : 'bg-white border-neutral-300 text-neutral-900'
                }
                focus:ring-2 focus:ring-sage-500 focus:border-transparent
              `}
              placeholder="e.g., Mindful Movement Practice"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Capacity</label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              min={1}
              max={100}
              className={`
                w-full px-4 py-3 rounded-lg border
                ${theme === 'dark' 
                  ? 'bg-neutral-700 border-neutral-600 text-neutral-100' 
                  : 'bg-white border-neutral-300 text-neutral-900'
                }
                focus:ring-2 focus:ring-sage-500 focus:border-transparent
              `}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className={`
              w-full px-4 py-3 rounded-lg border resize-none
              ${theme === 'dark' 
                ? 'bg-neutral-700 border-neutral-600 text-neutral-100' 
                : 'bg-white border-neutral-300 text-neutral-900'
              }
              focus:ring-2 focus:ring-sage-500 focus:border-transparent
            `}
            placeholder="Describe what participants can expect from this space..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Location</label>
          <AddressAutocomplete
            value={formData.location}
            onChange={handleLocationChange}
            placeholder="Enter space address..."
            required
            allowCurrentLocation
          />
          <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
            Search for an address or use current location
          </p>
        </div>

        {/* Location Restrictions */}
        <div className={`
          p-4 rounded-lg border
          ${theme === 'dark' ? 'bg-neutral-700/50 border-neutral-600' : 'bg-sage-50 border-sage-200'}
        `}>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="locationRestricted"
              name="locationRestricted"
              checked={formData.locationRestricted}
              onChange={handleInputChange}
              className="mt-1 rounded border-neutral-300 text-sage-600 focus:ring-sage-500"
            />
            <div className="flex-1">
              <label htmlFor="locationRestricted" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <Shield className="w-4 h-4 text-sage-500" />
                Restrict to local participants
              </label>
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Only allow users within a certain radius to see and join this space
              </p>
            </div>
          </div>

          {formData.locationRestricted && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">
                Maximum Distance (miles)
              </label>
              <select
                name="locationRadius"
                value={formData.locationRadius}
                onChange={handleInputChange}
                className={`
                  w-full px-4 py-3 rounded-lg border
                  ${theme === 'dark' 
                    ? 'bg-neutral-700 border-neutral-600 text-neutral-100' 
                    : 'bg-white border-neutral-300 text-neutral-900'
                  }
                  focus:ring-2 focus:ring-sage-500 focus:border-transparent
                `}
              >
                <option value={1}>1 mile</option>
                <option value={2}>2 miles</option>
                <option value={5}>5 miles</option>
                <option value={10}>10 miles</option>
                <option value={25}>25 miles</option>
                <option value={50}>50 miles</option>
              </select>
              <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Users must be within this distance to see and join the space
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              className={`
                w-full px-4 py-3 rounded-lg border
                ${theme === 'dark' 
                  ? 'bg-neutral-700 border-neutral-600 text-neutral-100' 
                  : 'bg-white border-neutral-300 text-neutral-900'
                }
                focus:ring-2 focus:ring-sage-500 focus:border-transparent
              `}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Start Time</label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              className={`
                w-full px-4 py-3 rounded-lg border
                ${theme === 'dark' 
                  ? 'bg-neutral-700 border-neutral-600 text-neutral-100' 
                  : 'bg-white border-neutral-300 text-neutral-900'
                }
                focus:ring-2 focus:ring-sage-500 focus:border-transparent
              `}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">End Time</label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              className={`
                w-full px-4 py-3 rounded-lg border
                ${theme === 'dark' 
                  ? 'bg-neutral-700 border-neutral-600 text-neutral-100' 
                  : 'bg-white border-neutral-300 text-neutral-900'
                }
                focus:ring-2 focus:ring-sage-500 focus:border-transparent
              `}
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium">Pricing</label>
          <div className="grid grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, pricingType: 'free' }))}
              className={`
                p-4 rounded-lg border-2 transition-all
                ${formData.pricingType === 'free'
                  ? 'border-sage-500 bg-sage-50 dark:bg-sage-900/30'
                  : theme === 'dark' 
                    ? 'border-neutral-600 hover:border-neutral-500' 
                    : 'border-neutral-200 hover:border-neutral-300'
                }
              `}
            >
              <div className="text-sm font-medium">Free</div>
            </button>
            
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, pricingType: 'fixed' }))}
              className={`
                p-4 rounded-lg border-2 transition-all
                ${formData.pricingType === 'fixed'
                  ? 'border-sage-500 bg-sage-50 dark:bg-sage-900/30'
                  : theme === 'dark' 
                    ? 'border-neutral-600 hover:border-neutral-500' 
                    : 'border-neutral-200 hover:border-neutral-300'
                }
              `}
            >
              <div className="text-sm font-medium">Fixed Price</div>
            </button>
            
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, pricingType: 'donation' }))}
              className={`
                p-4 rounded-lg border-2 transition-all
                ${formData.pricingType === 'donation'
                  ? 'border-sage-500 bg-sage-50 dark:bg-sage-900/30'
                  : theme === 'dark' 
                    ? 'border-neutral-600 hover:border-neutral-500' 
                    : 'border-neutral-200 hover:border-neutral-300'
                }
              `}
            >
              <div className="text-sm font-medium">Donation</div>
            </button>
          </div>

          {formData.pricingType === 'fixed' && (
            <div>
              <label className="block text-sm font-medium mb-2">Price Amount ($)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                min={0}
                step={0.01}
                className={`
                  w-full px-4 py-3 rounded-lg border
                  ${theme === 'dark' 
                    ? 'bg-neutral-700 border-neutral-600 text-neutral-100' 
                    : 'bg-white border-neutral-300 text-neutral-900'
                  }
                  focus:ring-2 focus:ring-sage-500 focus:border-transparent
                `}
                required
              />
            </div>
          )}

          {formData.pricingType === 'donation' && (
            <div>
              <label className="block text-sm font-medium mb-2">Suggested Donation ($)</label>
              <input
                type="number"
                name="suggestedDonation"
                value={formData.suggestedDonation}
                onChange={handleInputChange}
                min={0}
                step={0.01}
                className={`
                  w-full px-4 py-3 rounded-lg border
                  ${theme === 'dark' 
                    ? 'bg-neutral-700 border-neutral-600 text-neutral-100' 
                    : 'bg-white border-neutral-300 text-neutral-900'
                  }
                  focus:ring-2 focus:ring-sage-500 focus:border-transparent
                `}
                required
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Image URL (Optional)</label>
          <input
            type="url"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleInputChange}
            className={`
              w-full px-4 py-3 rounded-lg border
              ${theme === 'dark' 
                ? 'bg-neutral-700 border-neutral-600 text-neutral-100' 
                : 'bg-white border-neutral-300 text-neutral-900'
              }
              focus:ring-2 focus:ring-sage-500 focus:border-transparent
            `}
            placeholder="https://example.com/image.jpg"
          />
          <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
            Leave empty to use a default holistic image
          </p>
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
            Creating Space...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Create Space
          </>
        )}
      </button>
    </form>
  );
};

export default HoldSpaceForm;