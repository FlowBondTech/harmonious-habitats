import { Loader } from '@googlemaps/js-api-loader';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.warn('Google Maps API key not found. Location features will be limited.');
}

// Singleton loader instance
let loaderInstance: Loader | null = null;
let googleMapsLoaded = false;

export const getGoogleMapsLoader = (): Loader => {
  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey: API_KEY || '',
      version: 'weekly',
      libraries: ['places', 'geometry', 'marker']
    });
  }
  return loaderInstance;
};

export const loadGoogleMaps = async (): Promise<typeof google | null> => {
  if (googleMapsLoaded && window.google) {
    return window.google;
  }

  if (!API_KEY) {
    console.error('Cannot load Google Maps: API key is missing');
    return null;
  }

  try {
    const loader = getGoogleMapsLoader();
    await loader.load();
    googleMapsLoaded = true;
    return window.google;
  } catch (error) {
    console.error('Failed to load Google Maps:', error);
    return null;
  }
};

export interface PlaceDetails {
  formatted_address: string;
  name?: string;
  place_id: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components?: google.maps.GeocoderAddressComponent[];
  types?: string[];
}

export const geocodeAddress = async (address: string): Promise<PlaceDetails | null> => {
  const google = await loadGoogleMaps();
  if (!google) return null;

  return new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const result = results[0];
        resolve({
          formatted_address: result.formatted_address,
          place_id: result.place_id,
          geometry: {
            location: {
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng()
            }
          },
          address_components: result.address_components,
          types: result.types
        });
      } else {
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
};

export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<PlaceDetails | null> => {
  const google = await loadGoogleMaps();
  if (!google) return null;

  return new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder();
    const latlng = { lat, lng };

    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const result = results[0];
        resolve({
          formatted_address: result.formatted_address,
          place_id: result.place_id,
          geometry: {
            location: {
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng()
            }
          },
          address_components: result.address_components,
          types: result.types
        });
      } else {
        reject(new Error(`Reverse geocoding failed: ${status}`));
      }
    });
  });
};

export const calculateDistance = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<number | null> => {
  const google = await loadGoogleMaps();
  if (!google) return null;

  const originLatLng = new google.maps.LatLng(origin.lat, origin.lng);
  const destLatLng = new google.maps.LatLng(destination.lat, destination.lng);

  // Distance in meters
  const distance = google.maps.geometry.spherical.computeDistanceBetween(
    originLatLng,
    destLatLng
  );

  // Convert to miles
  return distance * 0.000621371;
};

export const extractAddressComponents = (
  addressComponents: google.maps.GeocoderAddressComponent[]
) => {
  const components: Record<string, string> = {};

  addressComponents.forEach((component) => {
    const types = component.types;

    if (types.includes('street_number')) {
      components.street_number = component.long_name;
    }
    if (types.includes('route')) {
      components.street = component.long_name;
    }
    if (types.includes('locality')) {
      components.city = component.long_name;
    }
    if (types.includes('administrative_area_level_1')) {
      components.state = component.short_name;
      components.state_long = component.long_name;
    }
    if (types.includes('postal_code')) {
      components.zip_code = component.long_name;
    }
    if (types.includes('country')) {
      components.country = component.short_name;
      components.country_long = component.long_name;
    }
    if (types.includes('neighborhood')) {
      components.neighborhood = component.long_name;
    }
  });

  return components;
};
