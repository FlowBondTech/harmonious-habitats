import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  ArrowLeft, 
  User, 
  FileText, 
  Tag, 
  MapPin, 
  Save, 
  Loader2,
  X
} from 'lucide-react';
import AddressAutocomplete from '../AddressAutocomplete';

interface ProfileEditorProps {
  onClose?: () => void;
  onSave?: () => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ 
  onClose, 
  onSave
}) => {
  const { profile, updateProfile } = useAuth();
  const { theme } = useTheme();
  
  const [formData, setFormData] = useState({
    bio: profile?.bio || '',
    expertise: profile?.expertise?.join(', ') || '',
    address: profile?.address || ''
  });
  
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(
    profile?.latitude && profile?.longitude 
      ? { latitude: profile.latitude, longitude: profile.longitude }
      : null
  );
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const expertiseArray = formData.expertise
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    const result = await updateProfile({
      bio: formData.bio || null,
      expertise: expertiseArray.length > 0 ? expertiseArray : null,
      address: formData.address || null,
      latitude: coordinates?.latitude || null,
      longitude: coordinates?.longitude || null,
      profile_setup_completed: true
    });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onSave?.();
      }, 1500);
    } else {
      setError(result.error || 'Failed to update profile');
    }
    
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleLocationChange = (address: string, coords?: { latitude: number; longitude: number }) => {
    setFormData(prev => ({ ...prev, address }));
    setCoordinates(coords || null);
    setError('');
  };

  return (
    <div className={`
      min-h-screen p-4
      ${theme === 'dark' ? 'bg-neutral-900' : 'bg-sage-50/50'}
    `}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                  ${theme === 'dark' 
                    ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600' 
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }
                `}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Profile
              </button>
              <h1 className="text-3xl font-bold">Edit Profile</h1>
            </div>
            
            <button
              onClick={onClose}
              className={`
                p-2 rounded-lg transition-colors
                ${theme === 'dark' ? 'hover:bg-neutral-700' : 'hover:bg-neutral-100'}
              `}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className={`
          p-8 rounded-2xl shadow-lg
          ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
        `}>
          {/* Current User Info */}
          <div className={`
            p-4 rounded-lg mb-8
            ${theme === 'dark' ? 'bg-neutral-700/50' : 'bg-sage-50'}
          `}>
            <div className="flex items-center gap-4">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center text-white font-bold
                ${profile?.is_admin 
                  ? 'bg-gradient-to-br from-terracotta-500 to-terracotta-600' 
                  : 'bg-gradient-to-br from-sage-500 to-sage-600'
                }
              `}>
                {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="font-semibold">{profile?.full_name}</h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {profile?.email}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Bio Section */}
            <div>
              <label className="flex items-center gap-2 text-lg font-semibold mb-3">
                <FileText className="w-5 h-5 text-sage-500" />
                About You
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself, your interests, and what brings you to holistic spaces..."
                rows={5}
                className={`
                  w-full px-4 py-3 rounded-lg border resize-none
                  ${theme === 'dark' 
                    ? 'bg-neutral-700 border-neutral-600 text-neutral-100 placeholder-neutral-400' 
                    : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-500'
                  }
                  focus:ring-2 focus:ring-sage-500 focus:border-transparent
                  transition-all duration-200
                `}
              />
              <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Share your story and what you're passionate about
              </p>
            </div>

            {/* Expertise Section */}
            <div>
              <label className="flex items-center gap-2 text-lg font-semibold mb-3">
                <Tag className="w-5 h-5 text-sage-500" />
                Areas of Expertise
              </label>
              <input
                type="text"
                name="expertise"
                value={formData.expertise}
                onChange={handleInputChange}
                placeholder="meditation, yoga, sound healing, breathwork, nutrition..."
                className={`
                  w-full px-4 py-3 rounded-lg border
                  ${theme === 'dark' 
                    ? 'bg-neutral-700 border-neutral-600 text-neutral-100 placeholder-neutral-400' 
                    : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-500'
                  }
                  focus:ring-2 focus:ring-sage-500 focus:border-transparent
                  transition-all duration-200
                `}
              />
              <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Separate multiple areas with commas
              </p>
            </div>

            {/* Location Section */}
            <div>
              <label className="flex items-center gap-2 text-lg font-semibold mb-3">
                <MapPin className="w-5 h-5 text-sage-500" />
                Location
              </label>
              <AddressAutocomplete
                value={formData.address}
                onChange={handleLocationChange}
                placeholder="Enter your address..."
                allowCurrentLocation
              />
              <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Add your location to discover spaces near you and access location-restricted events
              </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-600">Profile updated successfully!</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-neutral-200 dark:border-neutral-700">
              <button
                type="submit"
                disabled={loading}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium
                  transition-all duration-200 transform
                  ${loading
                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                    : 'bg-sage-500 text-white hover:bg-sage-600 hover:scale-[1.02] active:scale-[0.98]'
                  }
                `}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className={`
                  px-6 py-3 rounded-lg font-medium transition-all duration-200
                  ${loading
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
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;