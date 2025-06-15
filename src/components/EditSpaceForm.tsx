import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { 
  Save, 
  Loader2, 
  Trash2,
  Shield,
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MapPin,
  DollarSign,
  Image as ImageIcon,
  AlertTriangle
} from 'lucide-react';
import AddressAutocomplete from './AddressAutocomplete';
import { Space } from '../types/space';

interface EditSpaceFormProps {
  space: Space;
  onSubmit: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

interface SpaceFormData {
  title: string;
  description: string;
  capacity: number;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  locationRestricted: boolean;
  locationRadius: number;
  status: 'open' | 'full' | 'ongoing' | 'completed';
  pricingType: 'free' | 'fixed' | 'donation';
  amount: string;
  suggestedDonation: string;
  imageUrl: string;
}

const EditSpaceForm: React.FC<EditSpaceFormProps> = ({ space, onSubmit, onCancel, onDelete }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState<SpaceFormData>({
    title: '',
    description: '',
    capacity: 10,
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    latitude: null,
    longitude: null,
    locationRestricted: false,
    locationRadius: 5,
    status: 'open',
    pricingType: 'free',
    amount: '',
    suggestedDonation: '',
    imageUrl: ''
  });

  // Fetch full space data from database
  useEffect(() => {
    const fetchSpaceData = async () => {
      try {
        const { data, error } = await supabase
          .from('spaces')
          .select('*')
          .eq('id', space.id)
          .single();

        if (error) throw error;

        // Convert database format to form format
        setFormData({
          title: data.title,
          description: data.description,
          capacity: data.capacity,
          date: data.date,
          startTime: data.start_time,
          endTime: data.end_time,
          location: data.location,
          latitude: data.latitude,
          longitude: data.longitude,
          locationRestricted: data.location_restricted || false,
          locationRadius: data.location_radius || 5,
          status: data.status,
          pricingType: data.pricing_type,
          amount: data.price_amount?.toString() || '',
          suggestedDonation: data.suggested_donation?.toString() || '',
          imageUrl: data.image_url || ''
        });
      } catch (err) {
        console.error('Error fetching space data:', err);
        setError('Failed to load space data');
      } finally {
        setLoading(false);
      }
    };

    fetchSpaceData();
  }, [space.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate location requirements
    if (formData.locationRestricted && (!formData.latitude || !formData.longitude)) {
      setError('Please select a valid address for location-restricted spaces.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        location_restricted: formData.locationRestricted,
        location_radius: formData.locationRestricted ? formData.locationRadius : null,
        capacity: formData.capacity,
        status: formData.status,
        pricing_type: formData.pricingType,
        price_amount: formData.pricingType === 'fixed' ? Number(formData.amount) : null,
        suggested_donation: formData.pricingType === 'donation' ? Number(formData.suggestedDonation) : null,
        image_url: formData.imageUrl || null
      };

      const { error: updateError } = await supabase
        .from('spaces')
        .update(updateData)
        .eq('id', space.id);

      if (updateError) throw updateError;

      onSubmit();
    } catch (err) {
      console.error('Error updating space:', err);
      setError(err instanceof Error ? err.message : 'Failed to update space');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    setDeleting(true);
    setError('');

    try {
      const { error: deleteError } = await supabase
        .from('spaces')
        .delete()
        .eq('id', space.id);

      if (deleteError) throw deleteError;

      onDelete?.();
    } catch (err) {
      console.error('Error deleting space:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete space');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-sage-500" />
          <p className={theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}>
            Loading space details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${theme === 'dark' 
                ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600' 
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }
            `}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Spaces
          </button>
          <h2 className="text-2xl font-bold">Edit Space</h2>
        </div>
        
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
        >
          <Trash2 className="w-4 h-4" />
          Delete Space
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className={`
          p-6 rounded-xl shadow-md
          ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
        `}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sage-500" />
            Basic Information
          </h3>
          
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

          <div className="mt-6">
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
        </div>

        {/* Location */}
        <div className={`
          p-6 rounded-xl shadow-md
          ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
        `}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sage-500" />
            Location & Access
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <AddressAutocomplete
                value={formData.location}
                onChange={handleLocationChange}
                placeholder="Enter space address..."
                required
                allowCurrentLocation
              />
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
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className={`
          p-6 rounded-xl shadow-md
          ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
        `}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-sage-500" />
            Schedule
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
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
        </div>

        {/* Status */}
        <div className={`
          p-6 rounded-xl shadow-md
          ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
        `}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-sage-500" />
            Status & Availability
          </h3>

          <div>
            <label className="block text-sm font-medium mb-2">Space Status</label>
            <select
              name="status"
              value={formData.status}
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
              <option value="open">Open - Accepting new participants</option>
              <option value="full">Full - No more spots available</option>
              <option value="ongoing">Ongoing - Space is currently active</option>
              <option value="completed">Completed - Space has finished</option>
            </select>
            <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
              Current attendance: {space.attendees} / {formData.capacity} people
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className={`
          p-6 rounded-xl shadow-md
          ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
        `}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-sage-500" />
            Pricing
          </h3>

          <div className="space-y-4">
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
        </div>

        {/* Image */}
        <div className={`
          p-6 rounded-xl shadow-md
          ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
        `}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-sage-500" />
            Image
          </h3>

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
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <button
            type="submit"
            disabled={saving}
            className={`
              flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium
              transition-all duration-200 transform
              ${saving
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                : 'bg-sage-500 text-white hover:bg-sage-600 hover:scale-[1.02] active:scale-[0.98]'
              }
            `}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className={`
              px-6 py-3 rounded-lg font-medium transition-all duration-200
              ${saving
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                : theme === 'dark' 
                  ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600' 
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }
            `}
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`
            w-full max-w-md p-6 rounded-2xl shadow-xl
            ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-red-100'}
          `}>
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-bold mb-2">Delete Space</h3>
              <p className={`mb-6 ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-600'}`}>
                Are you sure you want to delete "{formData.title}"? This action cannot be undone.
                All attendees will be notified of the cancellation.
              </p>
              
              <div className="flex gap-4">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium
                    transition-all duration-200 transform
                    ${deleting
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600 hover:scale-[1.02] active:scale-[0.98]'
                    }
                  `}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Space
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className={`
                    flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200
                    ${deleting
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                      : theme === 'dark' 
                        ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600' 
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }
                  `}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditSpaceForm;