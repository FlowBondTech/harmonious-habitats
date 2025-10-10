import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Star, Navigation, Coffee, Briefcase, Home } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserLocation, UserLocationPreferences } from '../lib/supabase';
import { LoadingSpinner } from './LoadingStates';
import { useGPSTracking } from '../hooks/useGPSTracking';

interface LocationSettingsProps {
  userId: string;
}

export const LocationSettings: React.FC<LocationSettingsProps> = ({ userId }) => {
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [preferences, setPreferences] = useState<UserLocationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingLocation, setAddingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    type: 'Work' as string
  });
  const [trackingStatus, setTrackingStatus] = useState<'idle' | 'requesting' | 'tracking'>('idle');

  // Use GPS tracking hook
  useGPSTracking(userId, preferences);

  useEffect(() => {
    fetchLocationData();
  }, [userId]);

  const fetchLocationData = async () => {
    try {
      // Fetch user locations
      const { data: locationsData, error: locError } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', userId)
        .order('is_favorite', { ascending: false })
        .order('visit_count', { ascending: false });

      if (locError) throw locError;
      setLocations(locationsData || []);

      // Fetch preferences
      const { data: prefsData, error: prefsError } = await supabase
        .from('user_location_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (prefsError && prefsError.code !== 'PGRST116') throw prefsError;
      
      if (!prefsData) {
        // Create or update default preferences (UPSERT to avoid duplicate key errors)
        const { data: newPrefs, error: createError } = await supabase
          .from('user_location_preferences')
          .upsert({
            user_id: userId,
            track_gps_enabled: false,
            auto_detect_hotspots: true,
            hotspot_threshold: 5,
            class_suggestion_radius: 0.5
          }, {
            onConflict: 'user_id'
          })
          .select()
          .single();

        if (createError) throw createError;
        setPreferences(newPrefs);
      } else {
        setPreferences(prefsData);
      }
    } catch (error) {
      console.error('Error fetching location data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLocationIcon = (name: string) => {
    const lowercaseName = name.toLowerCase();
    if (lowercaseName.includes('home')) return Home;
    if (lowercaseName.includes('work') || lowercaseName.includes('office')) return Briefcase;
    if (lowercaseName.includes('coffee') || lowercaseName.includes('cafe')) return Coffee;
    return MapPin;
  };

  const handleAddLocation = async () => {
    if (!newLocation.name || !newLocation.address) return;

    try {
      // In a real app, you'd geocode the address here
      // For demo, we'll use dummy coordinates
      const { data, error } = await supabase
        .from('user_locations')
        .insert({
          user_id: userId,
          name: newLocation.name,
          type: 'manual' as const,
          // These would come from geocoding API
          latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
          longitude: -122.4194 + (Math.random() - 0.5) * 0.1,
          address: newLocation.address,
          is_favorite: newLocation.type === 'Home'
        })
        .select()
        .single();

      if (error) throw error;
      
      setLocations([...locations, data]);
      setNewLocation({ name: '', address: '', type: 'Work' });
      setAddingLocation(false);
    } catch (error) {
      console.error('Error adding location:', error);
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    try {
      const { error } = await supabase
        .from('user_locations')
        .delete()
        .eq('id', locationId);

      if (error) throw error;
      
      setLocations(locations.filter(loc => loc.id !== locationId));
    } catch (error) {
      console.error('Error deleting location:', error);
    }
  };

  const handleToggleFavorite = async (location: UserLocation) => {
    try {
      const { error } = await supabase
        .from('user_locations')
        .update({ is_favorite: !location.is_favorite })
        .eq('id', location.id);

      if (error) throw error;
      
      setLocations(locations.map(loc => 
        loc.id === location.id 
          ? { ...loc, is_favorite: !loc.is_favorite }
          : loc
      ));
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const handleToggleGPSTracking = async () => {
    if (!preferences) return;

    const newValue = !preferences.track_gps_enabled;

    if (newValue && trackingStatus === 'idle') {
      // Request permission
      setTrackingStatus('requesting');
      
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        
        if (permission.state === 'granted' || permission.state === 'prompt') {
          navigator.geolocation.getCurrentPosition(
            async () => {
              // Permission granted, update preferences
              await updatePreferences({ track_gps_enabled: true });
              setTrackingStatus('tracking');
            },
            () => {
              // Permission denied
              setTrackingStatus('idle');
              alert('Location permission denied. Please enable location access in your browser settings.');
            }
          );
        } else {
          setTrackingStatus('idle');
          alert('Location permission denied. Please enable location access in your browser settings.');
        }
      } catch (error) {
        console.error('Error requesting location permission:', error);
        setTrackingStatus('idle');
      }
    } else {
      // Turning off
      await updatePreferences({ track_gps_enabled: false });
      setTrackingStatus('idle');
    }
  };

  const updatePreferences = async (updates: Partial<UserLocationPreferences>) => {
    if (!preferences) return;

    try {
      const { data, error } = await supabase
        .from('user_location_preferences')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      setPreferences(data);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center my-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Location Settings</h3>
        <p className="text-gray-600">
          Manage your favorite locations and enable GPS tracking to get personalized class suggestions near places you frequent.
        </p>
      </div>

      {/* GPS Tracking Toggle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="h-5 w-5 text-forest" />
              <h4 className="font-medium text-gray-900">GPS Tracking</h4>
              <span className="px-2 py-0.5 text-xs bg-sage/20 text-forest rounded-full font-medium">
                In App Only
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Enable GPS tracking to automatically detect your frequent locations and suggest nearby classes.
            </p>
            
            {preferences?.track_gps_enabled && (
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Auto-detect hotspots</span>
                  <input
                    type="checkbox"
                    checked={preferences.auto_detect_hotspots}
                    onChange={(e) => updatePreferences({ auto_detect_hotspots: e.target.checked })}
                    className="h-4 w-4 text-forest border-gray-300 rounded focus:ring-forest"
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Visits needed for hotspot</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={preferences.hotspot_threshold}
                    onChange={(e) => updatePreferences({ hotspot_threshold: parseInt(e.target.value) })}
                    className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Suggestion radius (km)</span>
                  <input
                    type="number"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={preferences.class_suggestion_radius}
                    onChange={(e) => updatePreferences({ class_suggestion_radius: parseFloat(e.target.value) })}
                    className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleToggleGPSTracking}
            disabled={trackingStatus === 'requesting'}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences?.track_gps_enabled ? 'bg-forest' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences?.track_gps_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Manual Locations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">My Locations</h4>
          <button
            onClick={() => setAddingLocation(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-forest text-white rounded-lg hover:bg-forest/90"
          >
            <Plus className="h-4 w-4" />
            Add Location
          </button>
        </div>

        {addingLocation && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLocation.name}
                    onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                    placeholder="e.g., My favorite coffee shop"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <select
                    value={newLocation.type}
                    onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Coffee Shop">Coffee Shop</option>
                    <option value="Gym">Gym</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={newLocation.address}
                  onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                  placeholder="123 Main St, City, State"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddLocation}
                  disabled={!newLocation.name || !newLocation.address}
                  className="px-4 py-2 bg-forest text-white rounded-lg hover:bg-forest/90 text-sm disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setAddingLocation(false);
                    setNewLocation({ name: '', address: '', type: 'Work' });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {locations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No locations added yet. Add your favorite places to get personalized class suggestions!
            </p>
          ) : (
            locations.map((location) => {
              const Icon = getLocationIcon(location.name);
              return (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <div>
                      <h5 className="font-medium text-gray-900">{location.name}</h5>
                      <p className="text-sm text-gray-600">{location.address}</p>
                      {location.visit_count > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {location.visit_count} visits
                          {location.type === 'tracked' && ' • Auto-detected'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleFavorite(location)}
                      className={`p-2 rounded-lg transition-colors ${
                        location.is_favorite
                          ? 'text-yellow-500 hover:bg-yellow-50'
                          : 'text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      <Star
                        className={`h-5 w-5 ${location.is_favorite ? 'fill-current' : ''}`}
                      />
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(location.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};