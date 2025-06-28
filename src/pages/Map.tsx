import React, { useState } from 'react';
import { useState, useEffect } from 'react';
import { MapPin, Filter, Sprout, Bot as Lotus, ChefHat, Palette, Stethoscope, Music, Users, Clock, Heart, Navigation } from 'lucide-react';
import { getEvents, getSpaces, Event, Space } from '../lib/supabase';

const Map = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [radius, setRadius] = useState(1);
  const [mapEvents, setMapEvents] = useState<Event[]>([]);
  const [mapSpaces, setMapSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSpaces, setShowSpaces] = useState(false);

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
        
        const [eventsResult, spacesResult] = await Promise.all([
          getEvents({ status: 'active', limit: 20 }),
          getSpaces({ status: 'available', limit: 20 })
        ]);

        if (eventsResult.data) {
          // Add mock positions for demo purposes
          const eventsWithPositions = eventsResult.data.map((event, index) => ({
            ...event,
            position: {
              top: `${20 + (index * 15) % 60}%`,
              left: `${25 + (index * 20) % 50}%`
            }
          }));
          setMapEvents(eventsWithPositions);
        }

        if (spacesResult.data) {
          // Add mock positions for demo purposes
          const spacesWithPositions = spacesResult.data.map((space, index) => ({
            ...space,
            position: {
              top: `${30 + (index * 18) % 50}%`,
              left: `${35 + (index * 22) % 40}%`
            }
          }));
          setMapSpaces(spacesWithPositions);
        }
        
      } catch (err) {
        console.error('Error loading map data:', err);
      } finally {
        setLoading(false);
      }
    };
  const filteredEvents = selectedCategory === 'all' 
    ? mapEvents 
    : mapEvents.filter(event => event.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-forest-800 mb-2">Neighborhood Discovery</h1>
          <p className="text-forest-600">Find holistic events and spaces within walking distance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Radius Selector */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-forest-50">
              <h3 className="font-semibold text-forest-800 mb-4 flex items-center">
                <Navigation className="h-5 w-5 mr-2" />
                Discovery Radius
              </h3>
              <div className="space-y-2">
                {[0.5, 1, 2, 3].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={`w-full p-3 rounded-xl text-left transition-all duration-200 ${
                      radius === r
                        ? 'bg-forest-100 text-forest-800 border-2 border-forest-300 shadow-sm'
                        : 'bg-forest-50 text-forest-600 hover:bg-forest-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="font-semibold">{r} mile{r !== 1 ? 's' : ''}</div>
                    <div className="text-sm opacity-80">
                      {r === 0.5 ? '5-8 min walk' : 
                       r === 1 ? '12-15 min walk' : 
                       r === 2 ? '25-30 min walk' : '5-8 min bike'}
                    </div>
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
                    : mapEvents.filter(e => e.category === category.id).length;
                  
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
                  <span className="text-forest-600">Show</span>
                  <div className="flex bg-forest-100 rounded-lg p-1">
                    <button
                      onClick={() => setShowSpaces(false)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        !showSpaces ? 'bg-white text-forest-700 shadow-sm' : 'text-forest-600'
                      }`}
                    >
                      Events
                    </button>
                    <button
                      onClick={() => setShowSpaces(true)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        showSpaces ? 'bg-white text-forest-700 shadow-sm' : 'text-forest-600'
                      }`}
                    >
                      Spaces
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-forest-600">Active neighbors</span>
                  <span className="font-bold text-forest-800">127</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-forest-600">Available spaces</span>
                  <span className="font-bold text-forest-800">34</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-forest-600">Available {showSpaces ? 'spaces' : 'events'}</span>
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
                      Your Neighborhood {showSpaces ? 'Spaces' : 'Events'}
                    </h2>
                    <p className="text-forest-100 text-sm sm:text-base">
                      Showing {filteredItems.length} {showSpaces ? 'spaces' : 'events'} within {radius} mile{radius !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 self-start sm:self-center">
                    <MapPin className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* Interactive Map */}
              <div className="relative h-80 sm:h-96 lg:h-[600px] bg-gradient-to-br from-green-100 via-forest-50 to-earth-50">
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

                {/* Event/Space Markers */}
                {filteredItems.map((item) => {
                  const category = showSpaces 
                    ? { icon: MapPin, color: 'text-earth-600' }
                    : categories.find(c => c.id === item.category?.toLowerCase()) || { icon: MapPin, color: 'text-forest-600' };
                  const Icon = category?.icon || MapPin;
                  
                  return (
                    <div
                      key={item.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                      style={item.position}
                    >
                      <div className="bg-white rounded-full p-3 shadow-lg border-2 border-forest-200 hover:border-forest-400 transition-all duration-200 hover:scale-110">
                        <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${category?.color || 'text-forest-600'}`} />
                      </div>
                      
                      {/* Item Card on Hover */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-none">
                        <div className="bg-white rounded-xl shadow-xl border border-forest-100 p-4 w-64">
                          <h4 className="font-semibold text-forest-800 mb-2">{item.title || item.name}</h4>
                          <div className="space-y-1 text-sm text-forest-600">
                            {!showSpaces && (
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                <span>{new Date(item.date + 'T' + item.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                              </div>
                            )}
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span>{item.location_name || item.address}</span>
                            </div>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              <span>
                                {showSpaces 
                                  ? `Up to ${item.capacity} people`
                                  : `${item.participants?.length || 0}/${item.capacity} joined`
                                }
                              </span>
                            </div>
                          </div>
                          <button className="w-full mt-3 bg-gradient-to-r from-forest-600 to-forest-700 hover:from-forest-700 hover:to-forest-800 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                            {showSpaces ? 'Book Space' : 'Join Event'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

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
                      <span>{showSpaces ? 'Spaces' : 'Events'}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 border border-forest-300 rounded-full mr-2"></div>
                      <span>Discovery Radius</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map;