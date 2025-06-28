import React, { useState, useEffect } from 'react';
import { Globe, Filter, Sprout, Bot as Lotus, ChefHat, Palette, Stethoscope, Music, MapPin, Clock, Users, Search, Zap, TrendingUp, Award } from 'lucide-react';
import EventCard from '../components/EventCard';
import { getEvents, Event } from '../lib/supabase';

const GlobalFeed = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('trending');
  const [globalEvents, setGlobalEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'All Events', icon: Filter, color: 'text-forest-600' },
    { id: 'gardening', name: 'Gardening', icon: Sprout, color: 'text-green-600' },
    { id: 'yoga', name: 'Yoga & Meditation', icon: Lotus, color: 'text-purple-600' },
    { id: 'cooking', name: 'Cooking', icon: ChefHat, color: 'text-orange-600' },
    { id: 'art', name: 'Art & Creativity', icon: Palette, color: 'text-pink-600' },
    { id: 'healing', name: 'Healing & Wellness', icon: Stethoscope, color: 'text-blue-600' },
    { id: 'music', name: 'Music & Movement', icon: Music, color: 'text-indigo-600' },
  ];

  const sortOptions = [
    { id: 'trending', name: 'Trending', icon: TrendingUp },
    { id: 'newest', name: 'Newest', icon: Zap },
    { id: 'popular', name: 'Most Popular', icon: Award },
  ];

  // Load global events
  useEffect(() => {
    const loadGlobalEvents = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await getEvents({
          status: 'active',
          limit: 50
        });

        if (error) {
          throw error;
        }

        // Filter for virtual and global physical events
        const filteredEvents = data?.filter(event => 
          event.event_type === 'virtual' || event.event_type === 'global_physical'
        ) || [];
        
        setGlobalEvents(filteredEvents);
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadGlobalEvents();
  }, []);

  const filteredEvents = globalEvents.filter(event => {
    const matchesCategory = selectedCategory === 'all' || event.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.organizer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const globalStats = [
    { label: 'Global Events', value: '2,847', icon: Globe },
    { label: 'Active Communities', value: '156', icon: Users },
    { label: 'Countries Connected', value: '47', icon: MapPin },
    { label: 'Virtual Sessions', value: '1,234', icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-gradient-to-r from-forest-600 to-earth-500 p-3 rounded-2xl">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-forest-800">Global Discovery Feed</h1>
              <p className="text-forest-600">Connect with holistic communities worldwide</p>
            </div>
          </div>

          {/* Global Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {globalStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-forest-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-forest-600 text-sm font-medium">{stat.label}</p>
                      <p className="text-xl sm:text-2xl font-bold text-forest-800">{stat.value}</p>
                    </div>
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-earth-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-forest-50">
              <h3 className="font-semibold text-forest-800 mb-4 flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Search Events
              </h3>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, facilitator, or location..."
                className="w-full px-4 py-3 border border-forest-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
              />
            </div>

            {/* Sort Options */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-forest-50">
              <h3 className="font-semibold text-forest-800 mb-4">Sort By</h3>
              <div className="space-y-2">
                {sortOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSortBy(option.id)}
                      className={`w-full p-3 rounded-xl text-left transition-all duration-200 flex items-center ${
                        sortBy === option.id
                          ? 'bg-forest-100 text-forest-800 border-2 border-forest-300 shadow-sm'
                          : 'bg-forest-50 text-forest-600 hover:bg-forest-100 border-2 border-transparent'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3 text-earth-500" />
                      <span className="font-medium">{option.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Filter */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-forest-50">
              <h3 className="font-semibold text-forest-800 mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const eventCount = category.id === 'all' 
                    ? globalEvents.length 
                    : globalEvents.filter(e => e.category.toLowerCase().includes(category.id.toLowerCase())).length;
                  
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

            {/* Global Notice */}
            <div className="bg-gradient-to-br from-earth-50 to-forest-50 rounded-2xl p-6 border border-earth-200">
              <div className="flex items-start space-x-3">
                <Globe className="h-6 w-6 text-earth-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-forest-800 mb-2">Global Events</h4>
                  <p className="text-sm text-forest-600 leading-relaxed">
                    These events are open to participants worldwide and may be virtual or have multiple locations. 
                    Time zones and participation details are provided by each organizer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Events Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-forest-800 mb-2">
                  {filteredEvents.length} Global Events Found
                </h2>
                <p className="text-forest-600">
                  {selectedCategory === 'all' ? 'All categories' : categories.find(c => c.id === selectedCategory)?.name} • 
                  Sorted by {sortOptions.find(s => s.id === sortBy)?.name.toLowerCase()}
                </p>
              </div>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-forest-50">
                <Globe className="h-16 w-16 text-forest-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-forest-800 mb-2">No Events Found</h3>
                <p className="text-forest-600 mb-6">
                  Try adjusting your search criteria or explore different categories.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}

            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-gray-200 rounded-2xl h-80 animate-pulse"></div>
                ))}
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">Error loading events: {error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Load More */}
            {filteredEvents.length > 0 && (
              <div className="mt-12 text-center">
                <button className="bg-gradient-to-r from-forest-600 to-forest-700 hover:from-forest-700 hover:to-forest-800 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md">
                  Load More Global Events
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalFeed;