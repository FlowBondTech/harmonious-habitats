import { useState, useEffect } from 'react';
import { Space } from '../types/space';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSpaceFilter } from '../context/SpaceFilterContext';

interface DatabaseSpace {
  id: string;
  title: string;
  description: string;
  holder_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number;
  status: string;
  pricing_type: string;
  price_amount: number | null;
  suggested_donation: number | null;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  holder?: {
    id: string;
    full_name: string;
    bio: string | null;
    expertise: string[] | null;
    profile_setup_completed: boolean;
    privacy_settings: any;
  };
  attendee_count?: number;
  is_attending?: boolean;
}

// Haversine formula to calculate distance between two points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const useSpaces = () => {
  const { user } = useAuth();
  const { 
    searchTerm, 
    startDate, 
    endDate, 
    pricingTypeFilter,
    showPublicHostsOnly,
    showCompletedProfilesOnly,
    radiusFilter,
    customLocation
  } = useSpaceFilter();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSpaces = async () => {
    try {
      setLoading(true);
      
      // Build the base query
      let query = supabase
        .from('spaces')
        .select(`
          *,
          holder:user_profiles!spaces_holder_id_fkey(
            id,
            full_name,
            bio,
            expertise,
            profile_setup_completed,
            privacy_settings
          )
        `)
        .order('date', { ascending: true });

      // Apply search filter
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
      }

      // Apply date filters
      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      // Apply pricing filter
      if (!pricingTypeFilter.includes('all')) {
        query = query.in('pricing_type', pricingTypeFilter);
      }

      const { data: spacesData, error: spacesError } = await query;

      if (spacesError) throw spacesError;

      // Filter spaces based on host profile criteria
      let filteredSpaces = spacesData || [];

      if (showPublicHostsOnly || showCompletedProfilesOnly) {
        filteredSpaces = filteredSpaces.filter(space => {
          if (!space.holder) return false;

          let passesFilter = true;

          // Check if host has public profile
          if (showPublicHostsOnly) {
            const privacySettings = space.holder.privacy_settings || {};
            const isPublic = privacySettings.profile_visibility === 'public';
            if (!isPublic) passesFilter = false;
          }

          // Check if host has completed profile
          if (showCompletedProfilesOnly) {
            const hasCompletedProfile = space.holder.profile_setup_completed && 
              (space.holder.bio || (space.holder.expertise && space.holder.expertise.length > 0));
            if (!hasCompletedProfile) passesFilter = false;
          }

          return passesFilter;
        });
      }

      // Apply radius filter if location and radius are set
      if (customLocation && radiusFilter && radiusFilter > 0) {
        filteredSpaces = filteredSpaces.filter(space => {
          // Skip spaces without coordinates
          if (!space.latitude || !space.longitude) return false;
          
          const distance = calculateDistance(
            customLocation.latitude,
            customLocation.longitude,
            space.latitude,
            space.longitude
          );
          
          return distance <= radiusFilter;
        });
      }

      // Get attendee counts and user attendance status
      const spacesWithAttendance = await Promise.all(
        filteredSpaces.map(async (space) => {
          // Get attendee count
          const { count: attendeeCount } = await supabase
            .from('space_attendees')
            .select('*', { count: 'exact', head: true })
            .eq('space_id', space.id);

          // Check if current user is attending
          let isAttending = false;
          if (user) {
            const { data: attendanceData } = await supabase
              .from('space_attendees')
              .select('id')
              .eq('space_id', space.id)
              .eq('user_id', user.id)
              .maybeSingle();
            
            isAttending = !!attendanceData;
          }

          return {
            ...space,
            attendee_count: attendeeCount || 0,
            is_attending: isAttending
          };
        })
      );

      // Transform to frontend Space format
      const transformedSpaces: Space[] = spacesWithAttendance.map((space: DatabaseSpace) => ({
        id: space.id,
        title: space.title,
        description: space.description,
        date: new Date(space.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        time: `${formatTime(space.start_time)} - ${formatTime(space.end_time)}`,
        location: space.location,
        status: space.status as any,
        attendees: space.attendee_count || 0,
        capacity: space.capacity,
        isHolder: user ? space.holder_id === user.id : false,
        isAttending: space.is_attending || false,
        image: space.image_url || getDefaultImage(space.title),
        pricing: {
          type: space.pricing_type as any,
          amount: space.price_amount || undefined,
          suggestedDonation: space.suggested_donation || undefined
        }
      }));

      setSpaces(transformedSpaces);
    } catch (err) {
      console.error('Error fetching spaces:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, [user, searchTerm, startDate, endDate, pricingTypeFilter, showPublicHostsOnly, showCompletedProfilesOnly, radiusFilter, customLocation]);

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDefaultImage = (title: string) => {
    // Return appropriate stock image based on title keywords
    const images = [
      'https://images.pexels.com/photos/8436461/pexels-photo-8436461.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      'https://images.pexels.com/photos/8474484/pexels-photo-8474484.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      'https://images.pexels.com/photos/7282818/pexels-photo-7282818.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      'https://images.pexels.com/photos/6896007/pexels-photo-6896007.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      'https://images.pexels.com/photos/4207908/pexels-photo-4207908.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      'https://images.pexels.com/photos/7176026/pexels-photo-7176026.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    ];
    
    // Simple hash to consistently return the same image for the same title
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = ((hash << 5) - hash + title.charCodeAt(i)) & 0xffffffff;
    }
    return images[Math.abs(hash) % images.length];
  };

  const joinSpace = async (spaceId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Optimistically update the UI immediately
      setSpaces(prevSpaces => 
        prevSpaces.map(space => 
          space.id === spaceId 
            ? { 
                ...space, 
                isAttending: true, 
                attendees: space.attendees + 1 
              }
            : space
        )
      );

      const { error } = await supabase
        .from('space_attendees')
        .insert({
          space_id: spaceId,
          user_id: user.id
        });

      if (error) {
        // Revert the optimistic update on error
        setSpaces(prevSpaces => 
          prevSpaces.map(space => 
            space.id === spaceId 
              ? { 
                  ...space, 
                  isAttending: false, 
                  attendees: Math.max(0, space.attendees - 1) 
                }
              : space
          )
        );
        throw error;
      }

      // Refresh data in the background to ensure consistency
      setTimeout(() => fetchSpaces(), 500);
      return true;
    } catch (err) {
      console.error('Error joining space:', err);
      return false;
    }
  };

  const leaveSpace = async (spaceId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Optimistically update the UI immediately
      setSpaces(prevSpaces => 
        prevSpaces.map(space => 
          space.id === spaceId 
            ? { 
                ...space, 
                isAttending: false, 
                attendees: Math.max(0, space.attendees - 1) 
              }
            : space
        )
      );

      const { error } = await supabase
        .from('space_attendees')
        .delete()
        .eq('space_id', spaceId)
        .eq('user_id', user.id);

      if (error) {
        // Revert the optimistic update on error
        setSpaces(prevSpaces => 
          prevSpaces.map(space => 
            space.id === spaceId 
              ? { 
                  ...space, 
                  isAttending: true, 
                  attendees: space.attendees + 1 
                }
              : space
          )
        );
        throw error;
      }

      // Refresh data in the background to ensure consistency
      setTimeout(() => fetchSpaces(), 500);
      return true;
    } catch (err) {
      console.error('Error leaving space:', err);
      return false;
    }
  };

  return { 
    spaces, 
    loading, 
    error, 
    refetch: fetchSpaces,
    joinSpace,
    leaveSpace
  };
};