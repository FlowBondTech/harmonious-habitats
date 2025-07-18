import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Calendar, MapPin, Tag, X, ChevronDown, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Event } from '../lib/supabase';
import EventCardV2 from './EventCardV2';
import EventDetailsModal from './EventDetailsModal';

interface EventSearchFilters {
  searchQuery: string;
  category: string;
  eventType: 'all' | 'local' | 'virtual' | 'global_physical';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
  skillLevel: 'all' | 'beginner' | 'intermediate' | 'advanced';
  priceRange: 'all' | 'free' | 'donation' | 'paid';
  tags: string[];
  sortBy: 'date' | 'popularity' | 'price' | 'distance';
  onlyAvailable: boolean;
}

const EventSearchAndDiscovery: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<EventSearchFilters>({
    searchQuery: '',
    category: 'all',
    eventType: 'all',
    dateRange: 'all',
    skillLevel: 'all',
    priceRange: 'all',
    tags: [],
    sortBy: 'date',
    onlyAvailable: true
  });

  // Load initial data
  useEffect(() => {
    loadCategories();
    loadPopularTags();
    searchEvents();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('event_categories')
      .select('*')
      .eq('active', true)
      .order('display_order');

    if (data) {
      setCategories(data);
    }
  };

  const loadPopularTags = async () => {
    // In a real implementation, this would aggregate tags from events
    // For now, we'll use some common tags
    setPopularTags([
      'meditation', 'yoga', 'workshop', 'ceremony', 'healing',
      'movement', 'breathwork', 'nature', 'community', 'online',
      'beginners-welcome', 'donation-based', 'outdoor', 'women-only',
      'men-only', 'family-friendly', 'sound-healing', 'dance'
    ]);
  };

  const searchEvents = useCallback(async () => {
    setSearchLoading(true);
    
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!organizer_id(id, full_name, avatar_url, verified),
          participant_count:event_participants(count)
        `)
        .eq('status', 'published')
        .eq('visibility', 'public');

      // Apply search query
      if (filters.searchQuery) {
        query = query.textSearch('search_vector', filters.searchQuery);
      }

      // Apply category filter
      if (filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      // Apply event type filter
      if (filters.eventType !== 'all') {
        query = query.eq('event_type', filters.eventType);
      }

      // Apply date range filter
      const today = new Date().toISOString().split('T')[0];
      switch (filters.dateRange) {
        case 'today':
          query = query.eq('date', today);
          break;
        case 'week':
          const weekFromNow = new Date();
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          query = query.gte('date', today).lte('date', weekFromNow.toISOString().split('T')[0]);
          break;
        case 'month':
          const monthFromNow = new Date();
          monthFromNow.setMonth(monthFromNow.getMonth() + 1);
          query = query.gte('date', today).lte('date', monthFromNow.toISOString().split('T')[0]);
          break;
        case 'custom':
          if (filters.startDate) {
            query = query.gte('date', filters.startDate);
          }
          if (filters.endDate) {
            query = query.lte('date', filters.endDate);
          }
          break;
        default:
          // Show upcoming events by default
          query = query.gte('date', today);
      }

      // Apply skill level filter
      if (filters.skillLevel !== 'all') {
        query = query.or(`skill_level.eq.${filters.skillLevel},skill_level.eq.all`);
      }

      // Apply price range filter
      switch (filters.priceRange) {
        case 'free':
          query = query.eq('is_free', true);
          break;
        case 'donation':
          query = query.eq('exchange_type', 'donation');
          break;
        case 'paid':
          query = query.in('exchange_type', ['fixed', 'sliding_scale']);
          break;
      }

      // Apply tags filter
      if (filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'date':
          query = query.order('date', { ascending: true }).order('start_time', { ascending: true });
          break;
        case 'popularity':
          // This would need a view or computed column for participant count
          query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
          break;
        case 'price':
          query = query.order('is_free', { ascending: false }).order('minimum_donation', { ascending: true });
          break;
        default:
          query = query.order('date', { ascending: true });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error searching events:', error);
        return;
      }

      // Post-process to add participant counts
      const eventsWithCounts = data?.map(event => ({
        ...event,
        participant_count: event.participant_count?.[0]?.count || 0
      })) || [];

      // Filter out full events if onlyAvailable is true
      const filteredEvents = filters.onlyAvailable
        ? eventsWithCounts.filter(event => 
            event.capacity === 0 || 
            event.participant_count < event.capacity ||
            event.waitlist_enabled
          )
        : eventsWithCounts;

      setEvents(filteredEvents);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
      setLoading(false);
    }
  }, [filters]);

  // Debounced search when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      searchEvents();
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.searchQuery]);

  // Immediate search for other filter changes
  useEffect(() => {
    if (!loading) {
      searchEvents();
    }
  }, [
    filters.category,
    filters.eventType,
    filters.dateRange,
    filters.startDate,
    filters.endDate,
    filters.skillLevel,
    filters.priceRange,
    filters.tags,
    filters.sortBy,
    filters.onlyAvailable
  ]);

  const updateFilter = (key: keyof EventSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      category: 'all',
      eventType: 'all',
      dateRange: 'all',
      skillLevel: 'all',
      priceRange: 'all',
      tags: [],
      sortBy: 'date',
      onlyAvailable: true
    });
  };

  const getDateRangeText = () => {
    switch (filters.dateRange) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'custom':
        if (filters.startDate && filters.endDate) {
          return `${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}`;
        } else if (filters.startDate) {
          return `From ${new Date(filters.startDate).toLocaleDateString()}`;
        } else if (filters.endDate) {
          return `Until ${new Date(filters.endDate).toLocaleDateString()}`;
        }
        return 'Custom Date';
      default:
        return 'All Upcoming';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      {/* Search Header */}
      <div className="bg-white border-b border-forest-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Search Bar */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-forest-400" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => updateFilter('searchQuery', e.target.value)}
                placeholder="Search events by title, description, or tags..."
                className="w-full pl-12 pr-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                showFilters 
                  ? 'bg-forest-600 text-white' 
                  : 'bg-forest-100 text-forest-700 hover:bg-forest-200'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {Object.values(filters).some(v => 
                v !== 'all' && v !== '' && v !== 'date' && v !== true && 
                (!Array.isArray(v) || v.length > 0)
              ) && (
                <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  Active
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-forest-50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => updateFilter('category', e.target.value)}
                    className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Event Type */}
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Event Type
                  </label>
                  <select
                    value={filters.eventType}
                    onChange={(e) => updateFilter('eventType', e.target.value as any)}
                    className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                  >
                    <option value="all">All Types</option>
                    <option value="local">Local Events</option>
                    <option value="virtual">Virtual Events</option>
                    <option value="global_physical">Global Physical</option>
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => updateFilter('dateRange', e.target.value as any)}
                    className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                  >
                    <option value="all">All Upcoming</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {/* Skill Level */}
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Skill Level
                  </label>
                  <select
                    value={filters.skillLevel}
                    onChange={(e) => updateFilter('skillLevel', e.target.value as any)}
                    className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                  >
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Price
                  </label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => updateFilter('priceRange', e.target.value as any)}
                    className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                  >
                    <option value="all">All Prices</option>
                    <option value="free">Free Only</option>
                    <option value="donation">Donation Based</option>
                    <option value="paid">Paid Events</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => updateFilter('sortBy', e.target.value as any)}
                    className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                  >
                    <option value="date">Date</option>
                    <option value="popularity">Popularity</option>
                    <option value="price">Price</option>
                  </select>
                </div>

                {/* Only Available */}
                <div className="flex items-end">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.onlyAvailable}
                      onChange={(e) => updateFilter('onlyAvailable', e.target.checked)}
                      className="w-4 h-4 text-forest-600 bg-white border-forest-300 rounded focus:ring-forest-500"
                    />
                    <span className="text-sm font-medium text-forest-700">
                      Only show available events
                    </span>
                  </label>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-forest-600 hover:text-forest-700 underline"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>

              {/* Custom Date Range */}
              {filters.dateRange === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-forest-200">
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.startDate || ''}
                      onChange={(e) => updateFilter('startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.endDate || ''}
                      onChange={(e) => updateFilter('endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                    />
                  </div>
                </div>
              )}

              {/* Popular Tags */}
              <div className="pt-4 border-t border-forest-200">
                <label className="block text-sm font-medium text-forest-700 mb-2">
                  Popular Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filters.tags.includes(tag)
                          ? 'bg-forest-600 text-white'
                          : 'bg-white text-forest-700 hover:bg-forest-100 border border-forest-200'
                      }`}
                    >
                      {filters.tags.includes(tag) && <X className="h-3 w-3 inline-block mr-1" />}
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-forest-600">
              <span>{events.length} events found</span>
              {filters.dateRange !== 'all' && (
                <>
                  <span>•</span>
                  <span>{getDateRangeText()}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="h-8 w-8 text-forest-600 animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-16 w-16 text-forest-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-forest-800 mb-2">
              No events found
            </h3>
            <p className="text-forest-600 mb-6">
              Try adjusting your filters or search terms
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-forest-600 hover:bg-forest-700 text-white rounded-lg font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <EventCardV2
                key={event.id}
                event={event}
                onViewDetails={(id) => setSelectedEventId(id)}
                onRegister={(id) => setSelectedEventId(id)}
              />
            ))}
          </div>
        )}

        {searchLoading && (
          <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg px-4 py-3 flex items-center space-x-2">
            <Loader className="h-4 w-4 text-forest-600 animate-spin" />
            <span className="text-sm text-forest-700">Updating results...</span>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEventId && (
        <EventDetailsModal
          eventId={selectedEventId}
          isOpen={!!selectedEventId}
          onClose={() => setSelectedEventId(null)}
        />
      )}
    </div>
  );
};

export default EventSearchAndDiscovery;