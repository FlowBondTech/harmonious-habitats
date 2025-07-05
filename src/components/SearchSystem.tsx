import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Users, 
  Star, 
  Clock,
  X,
  SlidersHorizontal,
  Zap,
  Globe,
  Home
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase, Event, Space } from '../lib/supabase';

interface SearchSystemProps {
  onResults?: (results: { events: Event[], spaces: Space[] }) => void;
  placeholder?: string;
  showFilters?: boolean;
}

const SearchSystem: React.FC<SearchSystemProps> = ({ 
  onResults, 
  placeholder = "Search events, spaces, and community members...",
  showFilters = true 
}) => {
  const { user } = useAuthContext();
  const [query, setQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ events: Event[], spaces: Space[] }>({ events: [], spaces: [] });
  const [filters, setFilters] = useState({
    type: 'all', // all, events, spaces, users
    category: '',
    dateRange: '',
    location: '',
    skillLevel: '',
    capacity: '',
    eventType: '',
    spaceType: '',
    verified: false,
    donation: '',
    radius: 5
  });
  
  const searchRef = useRef<HTMLDivElement>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      const debounceTimer = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setResults({ events: [], spaces: [] });
      setShowResults(false);
    }
  }, [query, filters]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const searchResults = { events: [] as Event[], spaces: [] as Space[] };

      // Search events
      if (filters.type === 'all' || filters.type === 'events') {
        let eventQuery = supabase
          .from('events')
          .select(`
            *,
            organizer:profiles!events_organizer_id_fkey(id, full_name, avatar_url, verified),
            participants:event_participants(
              user_id,
              status,
              user:profiles!event_participants_user_id_fkey(id, full_name, avatar_url)
            )
          `)
          .eq('status', 'active');

        if (query) {
          eventQuery = eventQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%,location_name.ilike.%${query}%`);
        }

        if (filters.category) {
          eventQuery = eventQuery.eq('category', filters.category);
        }

        if (filters.skillLevel) {
          eventQuery = eventQuery.eq('skill_level', filters.skillLevel);
        }

        if (filters.eventType) {
          eventQuery = eventQuery.eq('event_type', filters.eventType);
        }

        if (filters.verified) {
          eventQuery = eventQuery.eq('verified', true);
        }

        const { data: events } = await eventQuery.limit(20);
        searchResults.events = events || [];
      }

      // Search spaces
      if (filters.type === 'all' || filters.type === 'spaces') {
        let spaceQuery = supabase
          .from('spaces')
          .select(`
            *,
            owner:profiles!spaces_owner_id_fkey(id, full_name, avatar_url, verified),
            amenities:space_amenities(amenity),
            accessibility_features:space_accessibility_features(feature),
            holistic_categories:space_holistic_categories(category)
          `)
          .eq('status', 'available');

        if (query) {
          spaceQuery = spaceQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%,type.ilike.%${query}%,address.ilike.%${query}%`);
        }

        if (filters.spaceType) {
          spaceQuery = spaceQuery.eq('type', filters.spaceType);
        }

        if (filters.verified) {
          spaceQuery = spaceQuery.eq('verified', true);
        }

        const { data: spaces } = await spaceQuery.limit(20);
        searchResults.spaces = spaces || [];
      }

      setResults(searchResults);
      setShowResults(true);
      onResults?.(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      category: '',
      dateRange: '',
      location: '',
      skillLevel: '',
      capacity: '',
      eventType: '',
      spaceType: '',
      verified: false,
      donation: '',
      radius: 5
    });
  };

  const categories = [
    'Gardening', 'Yoga', 'Cooking', 'Art', 'Healing', 'Music'
  ];

  const skillLevels = [
    'beginner', 'intermediate', 'advanced', 'all'
  ];

  const eventTypes = [
    'local', 'virtual', 'global_physical'
  ];

  const spaceTypes = [
    'backyard', 'garage', 'basement', 'living_room', 'community_room', 'outdoor_space'
  ];

  return (
    <div ref={searchRef} className="relative w-full max-w-4xl mx-auto">
      {/* Main Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-forest-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 2 && setShowResults(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-16 py-4 bg-white border border-forest-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent shadow-sm text-lg"
        />
        
        {showFilters && (
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${
              showAdvancedFilters ? 'bg-forest-100 text-forest-700' : 'text-forest-400 hover:bg-forest-50'
            }`}
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        )}
        
        {loading && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-forest-200 border-t-forest-600 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="mt-4 p-6 bg-white border border-forest-200 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-forest-800">Advanced Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-forest-600 hover:text-forest-800 transition-colors"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search Type */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">Search In</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
              >
                <option value="all">Everything</option>
                <option value="events">Events Only</option>
                <option value="spaces">Spaces Only</option>
                <option value="users">Users Only</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Event Type */}
            {(filters.type === 'all' || filters.type === 'events') && (
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">Event Type</label>
                <select
                  value={filters.eventType}
                  onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
                  className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                >
                  <option value="">All Types</option>
                  <option value="local">Local</option>
                  <option value="virtual">Virtual</option>
                  <option value="global_physical">Global Physical</option>
                </select>
              </div>
            )}

            {/* Space Type */}
            {(filters.type === 'all' || filters.type === 'spaces') && (
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">Space Type</label>
                <select
                  value={filters.spaceType}
                  onChange={(e) => setFilters(prev => ({ ...prev, spaceType: e.target.value }))}
                  className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                >
                  <option value="">All Spaces</option>
                  {spaceTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Skill Level */}
            {(filters.type === 'all' || filters.type === 'events') && (
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">Skill Level</label>
                <select
                  value={filters.skillLevel}
                  onChange={(e) => setFilters(prev => ({ ...prev, skillLevel: e.target.value }))}
                  className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                >
                  <option value="">All Levels</option>
                  {skillLevels.map(level => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Verified Only */}
            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.verified}
                  onChange={(e) => setFilters(prev => ({ ...prev, verified: e.target.checked }))}
                  className="w-4 h-4 text-forest-600 bg-forest-100 border-forest-300 rounded focus:ring-forest-500 focus:ring-2"
                />
                <span className="text-sm text-forest-700">Verified only</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {showResults && (results.events.length > 0 || results.spaces.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-forest-200 rounded-2xl shadow-xl z-50 max-h-96 overflow-y-auto">
          {/* Events Results */}
          {results.events.length > 0 && (
            <div className="p-4 border-b border-forest-100">
              <h4 className="text-sm font-semibold text-forest-800 mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Events ({results.events.length})
              </h4>
              <div className="space-y-2">
                {results.events.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center space-x-3 p-3 hover:bg-forest-50 rounded-lg cursor-pointer transition-colors">
                    <img
                      src={event.image_url || 'https://images.pexels.com/photos/3822647/pexels-photo-3822647.jpeg?auto=compress&cs=tinysrgb&w=100'}
                      alt={event.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-forest-800 truncate">{event.title}</h5>
                      <div className="flex items-center space-x-2 text-sm text-forest-600">
                        <span>{event.category}</span>
                        <span>•</span>
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                        {event.event_type === 'virtual' && <Globe className="h-3 w-3" />}
                        {event.event_type === 'global_physical' && <Zap className="h-3 w-3" />}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-forest-600">
                        {event.participants?.length || 0}/{event.capacity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spaces Results */}
          {results.spaces.length > 0 && (
            <div className="p-4">
              <h4 className="text-sm font-semibold text-forest-800 mb-3 flex items-center">
                <Home className="h-4 w-4 mr-2" />
                Spaces ({results.spaces.length})
              </h4>
              <div className="space-y-2">
                {results.spaces.slice(0, 5).map((space) => (
                  <div key={space.id} className="flex items-center space-x-3 p-3 hover:bg-forest-50 rounded-lg cursor-pointer transition-colors">
                    <img
                      src={space.image_urls?.[0] || 'https://images.pexels.com/photos/8633077/pexels-photo-8633077.jpeg?auto=compress&cs=tinysrgb&w=100'}
                      alt={space.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-forest-800 truncate">{space.name}</h5>
                      <div className="flex items-center space-x-2 text-sm text-forest-600">
                        <span>{space.type.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>Up to {space.capacity} people</span>
                        {space.list_publicly && <Globe className="h-3 w-3" />}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-earth-600">
                        {space.donation_suggested || 'Free'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {results.events.length === 0 && results.spaces.length === 0 && query.length > 2 && !loading && (
            <div className="p-8 text-center">
              <Search className="h-12 w-12 text-forest-300 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-forest-800 mb-2">No results found</h4>
              <p className="text-forest-600">Try adjusting your search terms or filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSystem;