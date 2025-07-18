import React, { useState, useEffect } from 'react';
import { MapPin, Filter, Sprout, Bot as Lotus, ChefHat, Palette, Stethoscope, Music, Users, Clock, Navigation } from 'lucide-react';
import { getEvents, Event } from '../lib/supabase';
import SearchSystem from '../components/SearchSystem';

const Map = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [radius, setRadius] = useState('nearby');
  const [mapEvents, setMapEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'all', name: 'All Events', icon: Filter, color: 'text-forest-600' },
    { id: 'gardening', name: 'Gardening', icon: Sprout, color: 'text-green-600' },
    { id: 'yoga', name: 'Yoga & Meditation', icon: Lotus, color: 'text-purple-600' },
    { id: 'cooking', name: 'Cooking', icon: ChefHat, color: 'text-orange-600' },
    { id: 'art', name: 'Art & Creativity', icon: Palette, color: 'text-pink-600' },
    { id: 'healing', name: 'Healing & Wellness', icon: Stethoscope, color: 'text-blue-600' },
    { id: 'music', name: 'Music & Movement', icon: Music, color: 'text-indigo-600' },
  ];

  // Load events and spaces
  useEffect(() => {
    const loadMapData = async () => {
      try {
        setLoading(true);
        
        const eventsResult = await getEvents({ status: 'published', limit: 50 });

        if (eventsResult.data) {
          setMapEvents(eventsResult.data);
        }

        
      } catch (err) {
        console.error('Error loading map data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMapData();
  }, []);

  const filteredEvents = selectedCategory === 'all' 
    ? mapEvents 
    : mapEvents.filter(event => event.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  const filteredItems = filteredEvents;

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-forest-800 mb-2">Neighborhood Discovery</h1>
          <p className="text-forest-600">Find holistic events within walking distance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Enhanced Search */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-forest-50">
              <SearchSystem 
                placeholder="Search events and spaces..."
                showFilters={false}
                onResults={(results) => {
                  setMapEvents(results.events);
                  // Only show events in discovery
                }}
              />
            </div>

            {/* Radius Selector */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-forest-50">
              <h3 className="font-semibold text-forest-800 mb-4 flex items-center">
                <Navigation className="h-5 w-5 mr-2" />
                Discovery Radius
              </h3>
              <div className="space-y-2">
                {[
                  { id: 'nearby', name: 'Nearby', description: '5-15 min walk', miles: '0.5-1 mile' },
                  { id: 'local', name: 'My Local Area', description: '20-30 min walk', miles: '2-3 miles' },
                  { id: 'global', name: 'Global', description: 'Virtual & worldwide', miles: 'Anywhere' }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setRadius(option.id)}
                    className={`w-full p-3 rounded-xl text-left transition-all duration-200 ${
                      radius === option.id
                        ? 'bg-forest-100 text-forest-800 border-2 border-forest-300 shadow-sm'
                        : 'bg-forest-50 text-forest-600 hover:bg-forest-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="font-semibold">{option.name}</div>
                    <div className="text-sm opacity-80">{option.description}</div>
                    <div className="text-xs opacity-60">{option.miles}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-forest-50">
              <h3 className="font-semibold text-forest-800 mb-4">Event Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const eventCount = category.id === 'all' 
                    ? mapEvents.length 
                    : mapEvents.filter(e => e.category.toLowerCase().includes(category.id.toLowerCase())).length;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full p-3 rounded-xl text-left transition-all duration-200 flex items-center justify-between ${
                        selectedCategory === category.id
                          ? 'bg-forest-100 text-forest-800 border-2 border-forest-300 shadow-sm'
                          : 'bg-forest-50 text-forest-600 hover:bg-forest-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className={`h-5 w-5 mr-3 ${category.color}`} />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <span className="text-sm bg-forest-200 text-forest-700 px-2 py-1 rounded-full font-medium">
                        {eventCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-forest-50">
              <h3 className="font-semibold text-forest-800 mb-4">In Your Area</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-forest-600">Available events</span>
                  <span className="font-bold text-forest-800">{filteredItems.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Map Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-forest-50">
              {/* Map Header */}
              <div className="bg-gradient-to-r from-forest-600 to-earth-500 text-white p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div className="mb-4 sm:mb-0">
                    <h2 className="text-xl font-semibold">
                      Your Neighborhood Events
                    </h2>
                    <p className="text-forest-100 text-sm sm:text-base">
                      Showing {filteredItems.length} events {radius === 'global' ? 'worldwide' : radius === 'nearby' ? 'nearby' : 'in your local area'}
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 self-start sm:self-center">
                    <MapPin className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* Interactive Map */}
              <div className="relative h-80 sm:h-96 lg:h-[600px] bg-gradient-to-br from-green-100 via-forest-50 to-earth-50">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-forest-600">Loading map data...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Radius Circles */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="absolute w-24 h-24 sm:w-32 sm:h-32 border-2 border-forest-300 rounded-full opacity-40"></div>
                      <div className="absolute w-36 h-36 sm:w-48 sm:h-48 border-2 border-forest-200 rounded-full opacity-30"></div>
                      <div className="absolute w-48 h-48 sm:w-64 sm:h-64 border-2 border-forest-100 rounded-full opacity-20"></div>
                      
                      {/* Your Location */}
                      <div className="absolute bg-earth-500 w-4 h-4 rounded-full border-2 border-white shadow-lg z-10">
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-forest-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                          Your Location
                        </div>
                      </div>
                    </div>

                    {/* Event List */}
                    <div className="absolute inset-0 overflow-y-auto p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredItems.map((event) => {
                          const category = categories.find(c => c.id === event.category?.toLowerCase()) || { icon: MapPin, color: 'text-forest-600' };
                          const Icon = category?.icon || MapPin;
                          
                          return (
                            <div
                              key={event.id}
                              className="bg-white rounded-xl shadow-sm border border-forest-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
                            >
                              <div className="flex items-start space-x-3">
                                <div className="bg-forest-100 rounded-full p-2">
                                  <Icon className={`h-5 w-5 ${category?.color || 'text-forest-600'}`} />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-forest-800 mb-1">
                                    {event.title}
                                  </h4>
                                  <div className="space-y-1 text-sm text-forest-600">
                                    {event.start_time && (
                                      <div className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        <span>
                                          {new Date(event.date + 'T' + event.start_time).toLocaleTimeString('en-US', { 
                                            hour: 'numeric', 
                                            minute: '2-digit', 
                                            hour12: true 
                                          })}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex items-center">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      <span className="truncate">
                                        {event.location_name}
                                      </span>
                                    </div>
                                    <div className="flex items-center">
                                      <Users className="h-3 w-3 mr-1" />
                                      <span>
                                        {event.participants?.length || 0}/{event.capacity || '∞'}
                                      </span>
                                    </div>
                                  </div>
                                  <button className="mt-2 bg-forest-600 hover:bg-forest-700 text-white py-1 px-3 rounded-lg text-sm font-medium transition-colors">
                                    View Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* No items message */}
                    {filteredItems.length === 0 && !loading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <MapPin className="h-16 w-16 text-forest-300 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-forest-800 mb-2">
                            No events found
                          </h3>
                          <p className="text-forest-600">
                            Try adjusting your search criteria or create an event!
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Legend */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-forest-100">
                      <h4 className="font-semibold text-forest-800 mb-2 text-sm">Map Legend</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-earth-500 rounded-full mr-2"></div>
                          <span>Your Location</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-white border-2 border-forest-400 rounded-full mr-2"></div>
                          <span>Events</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 border border-forest-300 rounded-full mr-2"></div>
                          <span>Discovery Radius</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map;