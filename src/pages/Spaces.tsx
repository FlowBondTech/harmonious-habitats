import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Filter, 
  Search, 
  Home,
  Users,
  Calendar,
  Star,
  Grid,
  List,
  ChevronDown,
  Wifi,
  Car,
  Trees,
  Coffee,
  Dumbbell,
  Palette,
  Music,
  Book
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSpaces, Space } from '../lib/supabase';
import SpaceCard from '../components/SpaceCard';
import { LoadingSpinner, SpaceCardSkeleton } from '../components/LoadingStates';

interface FilterOptions {
  type: string;
  amenities: string[];
  capacity: string;
  availability: string;
  priceRange: string;
  sortBy: string;
}

const Spaces = () => {
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    amenities: [],
    capacity: 'all',
    availability: 'all',
    priceRange: 'all',
    sortBy: 'newest'
  });

  // Space types
  const spaceTypes = [
    { id: 'all', name: 'All Spaces', icon: Home },
    { id: 'garden', name: 'Gardens', icon: Trees },
    { id: 'studio', name: 'Studios', icon: Palette },
    { id: 'meeting', name: 'Meeting Rooms', icon: Users },
    { id: 'wellness', name: 'Wellness Spaces', icon: Dumbbell },
    { id: 'event', name: 'Event Venues', icon: Calendar },
    { id: 'coworking', name: 'Co-working', icon: Coffee }
  ];

  // Amenities
  const amenityOptions = [
    { id: 'wifi', name: 'WiFi', icon: Wifi },
    { id: 'parking', name: 'Parking', icon: Car },
    { id: 'outdoor', name: 'Outdoor Space', icon: Trees },
    { id: 'kitchen', name: 'Kitchen', icon: Coffee },
    { id: 'audio', name: 'Audio System', icon: Music },
    { id: 'projector', name: 'Projector', icon: Book }
  ];

  // Capacity options
  const capacityOptions = [
    { id: 'all', name: 'Any Size' },
    { id: '1-10', name: '1-10 people' },
    { id: '11-25', name: '11-25 people' },
    { id: '26-50', name: '26-50 people' },
    { id: '50+', name: '50+ people' }
  ];

  // Load spaces
  useEffect(() => {
    loadSpaces();
  }, []);

  const loadSpaces = async () => {
    try {
      setLoading(true);
      const { data, error } = await getSpaces({ 
        status: 'available',
        list_publicly: true 
      });
      if (error) throw error;
      setSpaces(data || []);
    } catch (error) {
      console.error('Error loading spaces:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort spaces
  const filteredSpaces = spaces
    .filter(space => {
      // Search query
      if (searchQuery && !space.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !space.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Type filter
      if (filters.type !== 'all' && space.type !== filters.type) {
        return false;
      }

      // Amenities filter
      if (filters.amenities.length > 0) {
        const spaceAmenities = space.amenities || [];
        const hasAllAmenities = filters.amenities.every(amenity => 
          spaceAmenities.includes(amenity)
        );
        if (!hasAllAmenities) return false;
      }

      // Capacity filter
      if (filters.capacity !== 'all') {
        const capacity = space.capacity || 0;
        switch (filters.capacity) {
          case '1-10':
            if (capacity > 10) return false;
            break;
          case '11-25':
            if (capacity < 11 || capacity > 25) return false;
            break;
          case '26-50':
            if (capacity < 26 || capacity > 50) return false;
            break;
          case '50+':
            if (capacity < 50) return false;
            break;
        }
      }

      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'price-low':
          return (a.hourly_rate || 0) - (b.hourly_rate || 0);
        case 'price-high':
          return (b.hourly_rate || 0) - (a.hourly_rate || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

  const toggleAmenity = (amenityId: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-forest-800 mb-2">Discover Spaces</h1>
          <p className="text-forest-600">Find the perfect space for your next event or activity</p>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search spaces by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  showFilters 
                    ? 'bg-forest-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Filter className="h-4 w-4" />
                Filters
                {(filters.type !== 'all' || filters.amenities.length > 0 || filters.capacity !== 'all') && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    {[
                      filters.type !== 'all' ? 1 : 0,
                      filters.amenities.length,
                      filters.capacity !== 'all' ? 1 : 0
                    ].reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </button>

              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${
                    viewMode === 'grid' 
                      ? 'bg-white shadow-sm text-forest-600' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${
                    viewMode === 'list' 
                      ? 'bg-white shadow-sm text-forest-600' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
              {/* Space Type */}
              <div>
                <h3 className="font-semibold text-forest-800 mb-3">Space Type</h3>
                <div className="flex flex-wrap gap-2">
                  {spaceTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setFilters(prev => ({ ...prev, type: type.id }))}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                          filters.type === type.id
                            ? 'bg-forest-100 text-forest-800 border-2 border-forest-300'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-2 border-transparent'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {type.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="font-semibold text-forest-800 mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {amenityOptions.map((amenity) => {
                    const Icon = amenity.icon;
                    const isSelected = filters.amenities.includes(amenity.id);
                    return (
                      <button
                        key={amenity.id}
                        onClick={() => toggleAmenity(amenity.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                          isSelected
                            ? 'bg-forest-100 text-forest-800 border-2 border-forest-300'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-2 border-transparent'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {amenity.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Capacity and Sort */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-forest-800 mb-3">Capacity</h3>
                  <select
                    value={filters.capacity}
                    onChange={(e) => setFilters(prev => ({ ...prev, capacity: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                  >
                    {capacityOptions.map(option => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <h3 className="font-semibold text-forest-800 mb-3">Sort By</h3>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setFilters({
                      type: 'all',
                      amenities: [],
                      capacity: 'all',
                      availability: 'all',
                      priceRange: 'all',
                      sortBy: 'newest'
                    });
                    setSearchQuery('');
                  }}
                  className="text-forest-600 hover:text-forest-800 font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-forest-600">
          {loading ? (
            <span>Loading spaces...</span>
          ) : (
            <span>{filteredSpaces.length} spaces found</span>
          )}
        </div>

        {/* Spaces Grid/List */}
        {loading ? (
          <div className={`grid ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          } gap-6`}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SpaceCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredSpaces.length > 0 ? (
          <div className={`grid ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          } gap-6`}>
            {filteredSpaces.map((space) => (
              <div
                key={space.id}
                onClick={() => navigate(`/spaces/${space.slug || space.id}`)}
                className="cursor-pointer"
              >
                <SpaceCard space={space} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No spaces found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters or search criteria</p>
            <button
              onClick={() => {
                setFilters({
                  type: 'all',
                  amenities: [],
                  capacity: 'all',
                  availability: 'all',
                  priceRange: 'all',
                  sortBy: 'newest'
                });
                setSearchQuery('');
              }}
              className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Spaces;