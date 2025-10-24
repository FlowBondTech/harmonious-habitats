import React, { useRef, useEffect, useState } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { loadGoogleMaps, PlaceDetails, extractAddressComponents } from '../lib/googleMaps';

interface LocationInputProps {
  value?: string;
  onChange: (location: LocationData) => void;
  placeholder?: string;
  className?: string;
  showMap?: boolean;
  allowCurrentLocation?: boolean;
}

export interface LocationData {
  formatted_address: string;
  place_id?: string;
  lat?: number;
  lng?: number;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  neighborhood?: string;
  street?: string;
  street_number?: string;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  value = '',
  onChange,
  placeholder = 'Enter address or location...',
  className = '',
  showMap = false,
  allowCurrentLocation = true
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Google Maps and Autocomplete
  useEffect(() => {
    const initAutocomplete = async () => {
      const google = await loadGoogleMaps();
      if (!google || !inputRef.current) return;

      try {
        // Create autocomplete
        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ['formatted_address', 'geometry', 'name', 'place_id', 'address_components', 'types'],
          componentRestrictions: { country: ['us', 'ca'] }, // Restrict to US and Canada
          types: ['geocode', 'establishment']
        });

        // Listen for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (!place || !place.geometry || !place.geometry.location) {
            setError('Please select a valid location from the dropdown');
            return;
          }

          handlePlaceSelect(place as PlaceDetails);
        });

        // Initialize map if requested
        if (showMap && mapRef.current) {
          mapInstance.current = new google.maps.Map(mapRef.current, {
            center: { lat: 37.7749, lng: -122.4194 }, // Default to SF
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            mapId: 'harmonik-space-map' // For advanced markers
          });
        }
      } catch (err) {
        console.error('Failed to initialize autocomplete:', err);
        setError('Failed to load location services');
      }
    };

    initAutocomplete();
  }, [showMap]);

  const handlePlaceSelect = (place: PlaceDetails) => {
    setError(null);

    const lat = place.geometry.location.lat;
    const lng = place.geometry.location.lng;

    // Extract address components
    const components = place.address_components
      ? extractAddressComponents(place.address_components)
      : {};

    const locationData: LocationData = {
      formatted_address: place.formatted_address,
      place_id: place.place_id,
      lat,
      lng,
      ...components
    };

    onChange(locationData);

    // Update map if showing
    if (showMap && mapInstance.current) {
      const google = window.google;
      const position = { lat, lng };

      mapInstance.current.setCenter(position);
      mapInstance.current.setZoom(15);

      // Remove old marker
      if (markerRef.current) {
        markerRef.current.map = null;
      }

      // Add new marker (using Advanced Markers API)
      const { AdvancedMarkerElement } = google.maps.marker;
      markerRef.current = new AdvancedMarkerElement({
        map: mapInstance.current,
        position: position,
        title: place.name || place.formatted_address
      });
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setCurrentLocation({ lat, lng });

        // Reverse geocode to get address
        const google = await loadGoogleMaps();
        if (!google) {
          setIsLoading(false);
          setError('Failed to load location services');
          return;
        }

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          setIsLoading(false);

          if (status === 'OK' && results && results[0]) {
            const result = results[0];
            handlePlaceSelect({
              formatted_address: result.formatted_address,
              place_id: result.place_id,
              geometry: {
                location: { lat, lng }
              },
              address_components: result.address_components,
              types: result.types
            });

            if (inputRef.current) {
              inputRef.current.value = result.formatted_address;
            }
          } else {
            setError('Could not determine your address');
          }
        });
      },
      (err) => {
        setIsLoading(false);
        setError('Unable to retrieve your location');
        console.error('Geolocation error:', err);
      }
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          defaultValue={value}
          placeholder={placeholder}
          className={`w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 ${className}`}
        />

        {allowCurrentLocation && (
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={isLoading}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-forest-600 hover:text-forest-800 disabled:opacity-50"
            title="Use current location"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Navigation className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {showMap && (
        <div
          ref={mapRef}
          className="w-full h-64 rounded-lg border border-gray-300"
        />
      )}
    </div>
  );
};

export default LocationInput;
