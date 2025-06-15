// Geocoding utilities for address autocomplete and location services

export interface AddressSuggestion {
  id: string;
  displayName: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

// Simple geocoding using Nominatim (OpenStreetMap) - free and no API key required
export class GeoCodingService {
  private static baseUrl = 'https://nominatim.openstreetmap.org';

  static async searchAddresses(query: string): Promise<AddressSuggestion[]> {
    if (query.length < 3) return [];

    try {
      const response = await fetch(
        `${this.baseUrl}/search?format=json&limit=5&q=${encodeURIComponent(query)}&addressdetails=1&countrycodes=us,ca`
      );

      if (!response.ok) throw new Error('Geocoding service error');

      const data = await response.json();

      return data.map((item: any, index: number) => ({
        id: `${item.place_id || index}`,
        displayName: item.display_name.split(',').slice(0, 3).join(', '),
        fullAddress: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        city: item.address?.city || item.address?.town || item.address?.village,
        state: item.address?.state,
        country: item.address?.country,
        postalCode: item.address?.postcode
      }));
    } catch (error) {
      console.error('Address search failed:', error);
      return [];
    }
  }

  static async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );

      if (!response.ok) throw new Error('Reverse geocoding failed');

      const data = await response.json();

      return {
        latitude,
        longitude,
        formattedAddress: data.display_name
      };
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return null;
    }
  }

  static async getCurrentLocation(): Promise<GeocodingResult | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.error('Geolocation not supported');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const result = await this.reverseGeocode(latitude, longitude);
          resolve(result);
        },
        (error) => {
          console.error('Geolocation error:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  static calculateDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}