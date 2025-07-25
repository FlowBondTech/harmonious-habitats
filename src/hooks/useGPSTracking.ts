import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { UserLocationPreferences } from '../lib/supabase';

interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export const useGPSTracking = (
  userId: string | undefined,
  preferences: UserLocationPreferences | null
) => {
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const positionBufferRef = useRef<GPSPosition[]>([]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const processLocationUpdate = useCallback(async (position: GeolocationPosition) => {
    if (!userId || !preferences?.track_gps_enabled) return;

    const now = Date.now();
    const trackingInterval = parseInt(preferences.tracking_frequency.split(' ')[0]) * 60 * 1000; // Convert minutes to ms

    // Buffer position data
    positionBufferRef.current.push({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: now
    });

    // Keep buffer size reasonable
    if (positionBufferRef.current.length > 10) {
      positionBufferRef.current.shift();
    }

    // Only process if enough time has passed
    if (now - lastUpdateRef.current < trackingInterval) return;

    lastUpdateRef.current = now;

    try {
      // Check if we're near any existing locations
      const { data: existingLocations } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', userId);

      if (!existingLocations) return;

      // Simple distance check (in real app, use Haversine formula)
      const THRESHOLD_METERS = 100; // Consider same location if within 100m
      
      let nearbyLocation = null;
      for (const location of existingLocations) {
        const distance = calculateDistance(
          position.coords.latitude,
          position.coords.longitude,
          location.latitude,
          location.longitude
        );
        
        if (distance < THRESHOLD_METERS / 1000) { // Convert to km
          nearbyLocation = location;
          break;
        }
      }

      if (nearbyLocation) {
        // Update visit to existing location
        await updateLocationVisit(userId, nearbyLocation.id);
      } else if (preferences.auto_detect_hotspots) {
        // Check if we should create a new hotspot
        await checkForNewHotspot(userId, positionBufferRef.current, preferences.hotspot_threshold);
      }

      // Update last GPS update time
      await supabase
        .from('user_location_preferences')
        .update({ last_gps_update: new Date().toISOString() })
        .eq('user_id', userId);

    } catch (error) {
      console.error('Error processing location update:', error);
    }
  }, [userId, preferences]);

  const startTracking = useCallback(() => {
    if (!userId || !preferences?.track_gps_enabled || watchIdRef.current !== null) return;

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      processLocationUpdate,
      (error) => {
        console.error('GPS tracking error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          stopTracking();
        }
      },
      options
    );
  }, [userId, preferences, processLocationUpdate, stopTracking]);

  useEffect(() => {
    if (preferences?.track_gps_enabled) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [preferences?.track_gps_enabled, startTracking, stopTracking]);

  return { stopTracking };
};

// Helper functions
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

async function updateLocationVisit(userId: string, locationId: string) {
  try {
    // Check for active visit
    const { data: activeVisit } = await supabase
      .from('user_location_visits')
      .select('*')
      .eq('user_id', userId)
      .eq('location_id', locationId)
      .is('departed_at', null)
      .single();

    if (activeVisit) {
      // Update departure time if visit is older than 30 minutes
      const visitDuration = Date.now() - new Date(activeVisit.arrived_at).getTime();
      if (visitDuration > 30 * 60 * 1000) {
        await supabase
          .from('user_location_visits')
          .update({ departed_at: new Date().toISOString() })
          .eq('id', activeVisit.id);
      }
    } else {
      // Create new visit
      await supabase
        .from('user_location_visits')
        .insert({
          user_id: userId,
          location_id: locationId,
          arrived_at: new Date().toISOString()
        });

      // Update location stats
      await supabase
        .from('user_locations')
        .update({ 
          visit_count: supabase.raw('visit_count + 1'),
          last_visited: new Date().toISOString()
        })
        .eq('id', locationId);
    }
  } catch (error) {
    console.error('Error updating location visit:', error);
  }
}

async function checkForNewHotspot(
  userId: string, 
  positions: GPSPosition[], 
  threshold: number
) {
  // This is a simplified version
  // In a real app, you'd use clustering algorithms to detect frequently visited spots
  
  if (positions.length < threshold) return;

  // Calculate center of positions
  const avgLat = positions.reduce((sum, p) => sum + p.latitude, 0) / positions.length;
  const avgLon = positions.reduce((sum, p) => sum + p.longitude, 0) / positions.length;

  // Check if we have enough visits to this general area
  // In real implementation, you'd track visits over multiple days
  
  try {
    // For now, we'll skip auto-creating locations
    // This would be implemented with more sophisticated logic
    console.log('Potential hotspot detected at:', avgLat, avgLon);
  } catch (error) {
    console.error('Error checking for hotspot:', error);
  }
}