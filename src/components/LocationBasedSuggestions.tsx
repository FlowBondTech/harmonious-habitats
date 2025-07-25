import React, { useState, useEffect } from 'react';
import { MapPin, X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { SuggestedClass, Event } from '../lib/supabase';
import { LoadingSpinner } from './LoadingStates';
import { formatEventTime } from '../utils/dateHelpers';

interface LocationBasedSuggestionsProps {
  userId: string;
  limit?: number;
}

export const LocationBasedSuggestions: React.FC<LocationBasedSuggestionsProps> = ({ 
  userId, 
  limit = 5 
}) => {
  const [suggestions, setSuggestions] = useState<SuggestedClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateSuggestions();
  }, [userId]);

  const generateSuggestions = async () => {
    try {
      // Get user's locations
      const { data: locations, error: locError } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', userId)
        .order('visit_count', { ascending: false })
        .limit(5);

      if (locError) throw locError;
      if (!locations || locations.length === 0) {
        setLoading(false);
        return;
      }

      // Get user preferences
      const { data: preferences } = await supabase
        .from('user_location_preferences')
        .select('class_suggestion_radius')
        .eq('user_id', userId)
        .single();

      const radius = preferences?.class_suggestion_radius || 0.5;

      // Get upcoming events
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .gte('start_time', new Date().toISOString())
        .eq('status', 'published')
        .order('start_time', { ascending: true });

      if (eventsError) throw eventsError;

      // Calculate suggestions based on proximity to user locations
      const newSuggestions: SuggestedClass[] = [];
      
      for (const location of locations) {
        for (const event of events || []) {
          if (event.latitude && event.longitude) {
            // Use the calculate_distance function we created in SQL
            const { data: distanceData } = await supabase
              .rpc('calculate_distance', {
                lat1: location.latitude,
                lon1: location.longitude,
                lat2: event.latitude,
                lon2: event.longitude
              });

            const distance = distanceData as number;

            if (distance <= radius) {
              // Check if suggestion already exists
              const { data: existing } = await supabase
                .from('suggested_classes')
                .select('id')
                .eq('user_id', userId)
                .eq('event_id', event.id)
                .eq('location_id', location.id)
                .single();

              if (!existing) {
                // Calculate relevance score
                const relevanceScore = calculateRelevance(distance, radius, location.visit_count);

                // Create suggestion
                const { data: suggestion } = await supabase
                  .from('suggested_classes')
                  .insert({
                    user_id: userId,
                    event_id: event.id,
                    location_id: location.id,
                    distance: distance,
                    relevance_score: relevanceScore,
                    reason: `Near ${location.name} (${(distance * 1000).toFixed(0)}m away)`
                  })
                  .select(`
                    *,
                    event:events(*)
                  `)
                  .single();

                if (suggestion) {
                  newSuggestions.push(suggestion);
                }
              }
            }
          }
        }
      }

      // Get existing suggestions
      const { data: allSuggestions } = await supabase
        .from('suggested_classes')
        .select(`
          *,
          event:events(*),
          location:user_locations(*)
        `)
        .eq('user_id', userId)
        .eq('dismissed', false)
        .order('relevance_score', { ascending: false })
        .limit(limit);

      setSuggestions(allSuggestions || []);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRelevance = (distance: number, maxRadius: number, visitCount: number): number => {
    // Closer = higher score
    const distanceScore = 1 - (distance / maxRadius);
    
    // More visits = higher score
    const visitScore = Math.min(visitCount / 10, 1);
    
    // Weighted average
    return (distanceScore * 0.7) + (visitScore * 0.3);
  };

  const dismissSuggestion = async (suggestionId: string) => {
    try {
      await supabase
        .from('suggested_classes')
        .update({ dismissed: true })
        .eq('id', suggestionId);

      setSuggestions(suggestions.filter(s => s.id !== suggestionId));
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center my-4">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">No class suggestions yet.</p>
        <p className="text-sm text-gray-500 mt-1">
          Add your favorite locations to get personalized recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Classes Near Your Spots</h3>
        <Link 
          to="/settings"
          state={{ activeSection: 'location-settings' }}
          className="text-sm text-forest hover:underline"
        >
          Manage Locations
        </Link>
      </div>

      {suggestions.map((suggestion) => {
        const event = suggestion.event as Event;
        if (!event) return null;

        return (
          <div
            key={suggestion.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Link 
                  to={`/events/${event.id}`}
                  className="font-medium text-gray-900 hover:text-forest"
                >
                  {event.title}
                </Link>
                <div className="mt-1 space-y-1">
                  <p className="text-sm text-gray-600">
                    {formatEventTime(event.start_time)}
                  </p>
                  <p className="text-sm text-sage flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {suggestion.reason}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Link
                  to={`/events/${event.id}`}
                  className="p-2 text-gray-400 hover:text-forest hover:bg-forest/10 rounded-lg transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => dismissSuggestion(suggestion.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Dismiss suggestion"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};