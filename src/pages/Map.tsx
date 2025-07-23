import React, { useState, useEffect } from 'react';
import { MapPin, Filter, Sprout, Bot as Lotus, ChefHat, Palette, Stethoscope, Music, Users, Clock, Navigation, X, Search, ChevronUp, ChevronDown, Info } from 'lucide-react';
import { getEvents, Event } from '../lib/supabase';
import SearchSystem from '../components/SearchSystem';

const Map = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);
  const [radius, setRadius] = useState('nearby');
  const [mapEvents, setMapEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLegend, setShowLegend] = useState(true);

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

  const filteredEvents = selectedCategories.length === 0
    ? [] // No categories selected, show no events
    : selectedCategories.includes('all') || selectedCategories.length === categories.length
    ? mapEvents // All categories selected, show all events
    : mapEvents.filter(event => 
        selectedCategories.some(cat => 
          cat !== 'all' && event.category.toLowerCase().includes(cat.toLowerCase())
        )
      );

  const filteredItems = filteredEvents;

  return (
    <div className="min-h-screen relative">
      {/* Full-screen Map */}
      <div className="absolute inset-0">
        <div className="relative w-full h-full bg-gradient-to-br from-green-100 via-forest-50 to-earth-50">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-forest-600">Loading map data...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Map Container - Full screen */}
                    <div className="absolute inset-0">
                      {/* Placeholder map background with circles */}
                      <div className="relative w-full h-full flex items-center justify-center">
                        <div className="absolute w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 border-2 border-forest-300 rounded-full opacity-40"></div>
                        <div className="absolute w-64 h-64 sm:w-96 sm:h-96 lg:w-[32rem] lg:h-[32rem] border-2 border-forest-200 rounded-full opacity-30"></div>
                        <div className="absolute w-96 h-96 sm:w-[32rem] sm:h-[32rem] lg:w-[48rem] lg:h-[48rem] border-2 border-forest-100 rounded-full opacity-20"></div>
                        
                        {/* Your Location */}
                        <div className="absolute bg-earth-500 w-6 h-6 rounded-full border-3 border-white shadow-lg z-20">
                          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-forest-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg">
                            Your Location
                          </div>
                        </div>

                        {/* Event Markers */}
                        {filteredItems.slice(0, 20).map((event, index) => {
                          const category = categories.find(c => c.id === event.category?.toLowerCase()) || { icon: MapPin, color: 'text-forest-600' };
                          const Icon = category?.icon || MapPin;
                          // Random positioning for demo
                          const angle = (index * 137.5) % 360;
                          const distance = 100 + (index * 30) % 200;
                          const x = Math.cos(angle * Math.PI / 180) * distance;
                          const y = Math.sin(angle * Math.PI / 180) * distance;
                          
                          return (
                            <div
                              key={event.id}
                              className="absolute group cursor-pointer"
                              style={{ 
                                transform: `translate(${x}px, ${y}px)`,
                                zIndex: 10
                              }}
                            >
                              <div className="relative">
                                <div className="bg-white rounded-full p-2 shadow-lg border-2 border-forest-200 hover:scale-110 transition-transform">
                                  <Icon className={`h-5 w-5 ${category?.color || 'text-forest-600'}`} />
                                </div>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                  <div className="bg-forest-800 text-white px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                                    <p className="font-medium text-sm">{event.title}</p>
                                    <p className="text-xs text-forest-200">{event.location_name}</p>
                                  </div>
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

                  </>
                )}
              </div>
            </div>

      {/* Floating UI Elements */}
      <div className="absolute inset-x-0 top-0 z-30 pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Search Bar */}
          <div className="pointer-events-auto">
            <div className="bg-white rounded-xl shadow-lg p-2 flex items-center space-x-2">
              <Search className="h-5 w-5 text-forest-600 ml-2" />
              <input
                type="text"
                placeholder="Search events and spaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-2 py-2 outline-none text-forest-800 placeholder-forest-400"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-lg transition-colors ${
                  showFilters ? 'bg-forest-600 text-white' : 'bg-forest-100 text-forest-700 hover:bg-forest-200'
                }`}
              >
                <Filter className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Event Counter and Legend Row */}
          <div className="pointer-events-auto mt-3 relative">
            {/* Event Counter - Always Centered */}
            <div className="flex justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-md">
                <p className="text-sm font-medium text-forest-800">
                  {filteredItems.length} events {radius === 'global' ? 'worldwide' : radius === 'nearby' ? 'nearby' : 'in your area'}
                </p>
              </div>
            </div>

            {/* Legend - Absolutely positioned right, same row */}
            <div className="absolute right-0 top-0 pointer-events-auto">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-forest-100 overflow-hidden">
                {/* Legend Header - Fully Clickable */}
                <button
                  onClick={() => setShowLegend(!showLegend)}
                  className="w-full flex items-center justify-between p-3 bg-white/95 hover:bg-forest-50 transition-colors"
                  aria-label={showLegend ? "Hide legend" : "Show legend"}
                >
                  <h4 className="font-semibold text-forest-800 text-sm hidden sm:block">Map Legend</h4>
                  {/* Desktop: Arrow icons */}
                  <span className="hidden sm:block">
                    {showLegend ? (
                      <ChevronUp className="h-4 w-4 text-forest-600" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-forest-600" />
                    )}
                  </span>
                  {/* Mobile: Info icon */}
                  <span className="block sm:hidden">
                    <Info className="h-4 w-4 text-forest-600" />
                  </span>
                </button>
                
                {/* Legend Content */}
                {showLegend && (
                  <div className="px-3 pb-3 space-y-2 text-xs sm:text-sm">
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
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Panel (Slide-out) */}
      <div className={`fixed inset-y-0 right-0 z-40 w-80 bg-white shadow-2xl transform transition-transform duration-300 ${
        showFilters ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          {/* Filter Header */}
          <div className="bg-forest-600 text-white p-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1 hover:bg-forest-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Filter Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Radius Selector */}
            <div>
              <h4 className="font-semibold text-forest-800 mb-3 flex items-center">
                <Navigation className="h-4 w-4 mr-2" />
                Discovery Radius
              </h4>
              <div className="space-y-2">
                {[
                  { id: 'nearby', name: 'Nearby', description: '5-15 min walk', miles: '0.5-1 mile' },
                  { id: 'local', name: 'My Local Area', description: '20-30 min walk', miles: '2-3 miles' },
                  { id: 'global', name: 'Global', description: 'Virtual & worldwide', miles: 'Anywhere' }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setRadius(option.id)}
                    className={`w-full p-3 rounded-lg text-left transition-all duration-200 ${
                      radius === option.id
                        ? 'bg-forest-100 text-forest-800 border-2 border-forest-300'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="font-medium">{option.name}</div>
                    <div className="text-sm text-forest-600">{option.description}</div>
                    <div className="text-xs text-forest-500">{option.miles}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <h4 className="font-semibold text-forest-800 mb-3">Event Categories</h4>
              <div className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const eventCount = category.id === 'all' 
                    ? mapEvents.length 
                    : mapEvents.filter(e => e.category.toLowerCase().includes(category.id.toLowerCase())).length;
                  
                  const isSelected = selectedCategories.includes(category.id);
                  const isAllSelected = category.id === 'all';
                  
                  const handleCategoryToggle = () => {
                    if (category.id === 'all') {
                      // If "All" is clicked, select all categories or deselect all
                      if (isSelected) {
                        setSelectedCategories([]);
                      } else {
                        // Select all categories including 'all'
                        setSelectedCategories(categories.map(cat => cat.id));
                      }
                    } else {
                      // For individual categories
                      if (isSelected) {
                        // Remove the category and also remove 'all' since not all are selected anymore
                        setSelectedCategories(prev => prev.filter(cat => cat !== category.id && cat !== 'all'));
                      } else {
                        // Add the category
                        setSelectedCategories(prev => {
                        const newCategories = [...prev, category.id];
                          // Check if all other categories (except 'all') are now selected
                          const allOtherCategories = categories.filter(cat => cat.id !== 'all').map(cat => cat.id);
                          const allSelected = allOtherCategories.every(catId => newCategories.includes(catId));
                          
                          // If all categories are selected, also add 'all'
                          if (allSelected && !newCategories.includes('all')) {
                            return [...newCategories, 'all'];
                          }
                          return newCategories;
                        });
                      }
                    }
                  };
                  
                  return (
                    <button
                      key={category.id}
                      onClick={handleCategoryToggle}
                      className={`w-full p-3 rounded-lg text-left transition-all duration-200 flex items-center justify-between ${
                        isSelected
                          ? 'bg-forest-100 text-forest-800 border-2 border-forest-300'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 mr-3 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected 
                            ? 'bg-forest-600 border-forest-600' 
                            : 'bg-white border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                            </svg>
                          )}
                        </div>
                        <Icon className={`h-4 w-4 mr-2 ${category.color}`} />
                        <span className="font-medium text-sm">{category.name}</span>
                      </div>
                      <span className="text-xs bg-forest-200 text-forest-700 px-2 py-1 rounded-full font-medium">
                        {eventCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Apply/Clear Buttons */}
            <div className="pt-4 space-y-2">
              <button
                onClick={() => setShowFilters(false)}
                className="w-full bg-forest-600 hover:bg-forest-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={() => {
                  setSelectedCategories(categories.map(cat => cat.id)); // Select all categories
                  setRadius('nearby');
                  setSearchQuery('');
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-forest-700 py-3 rounded-lg font-medium transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop for filter panel */}
      {showFilters && (
        <div 
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setShowFilters(false)}
        />
      )}
    </div>
  );
};

export default Map;