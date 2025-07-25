import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { UserLocation, UserLocationVisit } from '../lib/supabase';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { MapPin, Clock, TrendingUp, Calendar, Navigation, BarChart3 } from 'lucide-react';

interface LocationWithStats extends UserLocation {
  visits: UserLocationVisit[];
  totalTimeSpent: number; // in minutes
  lastVisitDuration: number | null; // in minutes
}

export default function LocationStats() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<LocationWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    if (user) {
      fetchLocationStats();
    }
  }, [user, timeRange]);

  const fetchLocationStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Calculate date range
      let startDate = new Date();
      if (timeRange === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else {
        startDate = new Date(0); // Beginning of time
      }

      // Fetch locations with visits
      const { data: locationsData, error: locError } = await supabase
        .from('user_locations')
        .select(`
          *,
          user_location_visits (*)
        `)
        .eq('user_id', user.id)
        .order('visit_count', { ascending: false });

      if (locError) throw locError;

      // Process location data with stats
      const processedLocations: LocationWithStats[] = (locationsData || []).map(location => {
        const visits = location.user_location_visits || [];
        const filteredVisits = visits.filter((visit: UserLocationVisit) => 
          new Date(visit.arrived_at) >= startDate
        );

        // Calculate total time spent
        let totalMinutes = 0;
        let lastVisitDuration = null;

        filteredVisits.forEach((visit: UserLocationVisit) => {
          if (visit.departed_at) {
            const duration = (new Date(visit.departed_at).getTime() - new Date(visit.arrived_at).getTime()) / 1000 / 60;
            totalMinutes += duration;
            
            if (visit.id === filteredVisits[0]?.id) {
              lastVisitDuration = duration;
            }
          }
        });

        return {
          ...location,
          visits: filteredVisits,
          totalTimeSpent: Math.round(totalMinutes),
          lastVisitDuration: lastVisitDuration ? Math.round(lastVisitDuration) : null
        };
      });

      setLocations(processedLocations);
    } catch (error) {
      console.error('Error fetching location stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getLocationIcon = (name: string) => {
    const lowercaseName = name.toLowerCase();
    if (lowercaseName.includes('home')) return '🏠';
    if (lowercaseName.includes('work') || lowercaseName.includes('office')) return '💼';
    if (lowercaseName.includes('coffee') || lowercaseName.includes('cafe')) return '☕';
    if (lowercaseName.includes('gym')) return '🏃';
    return '📍';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner className="mx-auto my-16" />
      </div>
    );
  }

  const totalVisits = locations.reduce((sum, loc) => sum + loc.visits.length, 0);
  const totalTime = locations.reduce((sum, loc) => sum + loc.totalTimeSpent, 0);
  const favoriteLocation = locations.find(loc => loc.is_favorite) || locations[0];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Location Statistics</h1>
        <p className="text-gray-600">
          Track your movement patterns and discover classes near your frequent locations.
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2 mb-6">
        {(['week', 'month', 'all'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === range
                ? 'bg-forest text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {range === 'week' ? 'Past Week' : range === 'month' ? 'Past Month' : 'All Time'}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <MapPin className="h-5 w-5 text-forest" />
            <span className="text-2xl font-bold text-gray-900">{locations.length}</span>
          </div>
          <p className="text-sm text-gray-600">Total Locations</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-sage" />
            <span className="text-2xl font-bold text-gray-900">{totalVisits}</span>
          </div>
          <p className="text-sm text-gray-600">Total Visits</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-clay" />
            <span className="text-2xl font-bold text-gray-900">{formatDuration(totalTime)}</span>
          </div>
          <p className="text-sm text-gray-600">Time Spent</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{favoriteLocation ? getLocationIcon(favoriteLocation.name) : '📍'}</span>
            <span className="text-lg font-bold text-gray-900 truncate max-w-[100px]">
              {favoriteLocation?.name || 'None'}
            </span>
          </div>
          <p className="text-sm text-gray-600">Favorite Spot</p>
        </div>
      </div>

      {/* Location List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Your Locations</h2>
        </div>
        
        {locations.length === 0 ? (
          <div className="p-12 text-center">
            <Navigation className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No location data yet.</p>
            <p className="text-sm text-gray-400 mt-2">
              Enable GPS tracking or add manual locations in Settings to see your stats.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {locations.map((location) => (
              <div key={location.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getLocationIcon(location.name)}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {location.name}
                          {location.is_favorite && (
                            <span className="ml-2 text-yellow-500">★</span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">{location.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <BarChart3 className="h-4 w-4" />
                        <span>{location.visits.length} visits</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(location.totalTimeSpent)} total</span>
                      </div>
                      {location.lastVisitDuration && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDuration(location.lastVisitDuration)} last visit</span>
                        </div>
                      )}
                      {location.type === 'tracked' && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                          Auto-detected
                        </span>
                      )}
                    </div>

                    {/* Recent visits timeline */}
                    {location.visits.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-2">Recent visits:</p>
                        <div className="flex gap-1 flex-wrap">
                          {location.visits.slice(0, 7).map((visit, index) => {
                            const visitDate = new Date(visit.arrived_at);
                            const isToday = new Date().toDateString() === visitDate.toDateString();
                            return (
                              <div
                                key={visit.id}
                                className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium ${
                                  isToday
                                    ? 'bg-forest text-white'
                                    : index === 0
                                    ? 'bg-sage text-white'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                                title={visitDate.toLocaleDateString()}
                              >
                                {visitDate.getDate()}
                              </div>
                            );
                          })}
                          {location.visits.length > 7 && (
                            <div className="w-8 h-8 rounded-md bg-gray-50 text-gray-400 flex items-center justify-center text-xs">
                              +{location.visits.length - 7}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <button className="px-3 py-1.5 text-sm bg-forest text-white rounded-lg hover:bg-forest/90">
                      Find Classes Nearby
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}