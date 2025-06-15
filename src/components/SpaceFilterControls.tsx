import React, { useState, useEffect } from 'react';
import { useSpaceFilter } from '../context/SpaceFilterContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Calendar, 
  DollarSign, 
  User, 
  Shield, 
  CheckCircle, 
  MapPin, 
  Navigation, 
  Loader2,
  Filter,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import AddressAutocomplete from './AddressAutocomplete';
import { GeoCodingService } from '../utils/geocoding';

const SpaceFilterControls: React.FC = () => {
  const { 
    searchTerm, 
    setSearchTerm, 
    startDate, 
    setStartDate, 
    endDate, 
    setEndDate, 
    pricingTypeFilter, 
    setPricingTypeFilter,
    showPublicHostsOnly,
    setShowPublicHostsOnly,
    showCompletedProfilesOnly,
    setShowCompletedProfilesOnly,
    radiusFilter,
    setRadiusFilter,
    useCurrentLocation,
    setUseCurrentLocation,
    customLocation,
    setCustomLocation
  } = useSpaceFilter();
  const { theme } = useTheme();
  const { profile } = useAuth();
  const [gettingLocation, setGettingLocation] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Changed to false by default
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll to auto-collapse
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // Auto-collapse when scrolling down past 100px
          if (currentScrollY > 100 && currentScrollY > lastScrollY) {
            setIsExpanded(false);
            setIsScrolled(true);
          } else if (currentScrollY < 50) {
            setIsScrolled(false);
          }
          
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePricingFilterChange = (pricing: string) => {
    if (pricing === 'all') {
      setPricingTypeFilter(['all']);
    } else {
      const currentFilters = pricingTypeFilter.includes('all') ? [] : [...pricingTypeFilter];
      if (currentFilters.includes(pricing)) {
        const newFilters = currentFilters.filter(p => p !== pricing);
        setPricingTypeFilter(newFilters.length === 0 ? ['all'] : newFilters);
      } else {
        setPricingTypeFilter([...currentFilters, pricing]);
      }
    }
  };

  const handleGetCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const location = await GeoCodingService.getCurrentLocation();
      if (location) {
        setCustomLocation({
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.formattedAddress
        });
        setUseCurrentLocation(true);
        if (!radiusFilter) {
          setRadiusFilter(25);
        }
      } else {
        alert('Unable to get your current location. Please check your browser permissions.');
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      alert('Failed to get current location.');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleUseProfileLocation = () => {
    if (profile?.latitude && profile?.longitude && profile?.address) {
      setCustomLocation({
        latitude: profile.latitude,
        longitude: profile.longitude,
        address: profile.address
      });
      setUseCurrentLocation(false);
      if (!radiusFilter) {
        setRadiusFilter(25);
      }
    }
  };

  const handleCustomLocationChange = (address: string, coordinates?: { latitude: number; longitude: number }) => {
    if (coordinates) {
      setCustomLocation({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        address
      });
      setUseCurrentLocation(false);
      if (!radiusFilter) {
        setRadiusFilter(25);
      }
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setPricingTypeFilter(['all']);
    setShowPublicHostsOnly(false);
    setShowCompletedProfilesOnly(false);
    setRadiusFilter(null);
    setUseCurrentLocation(false);
    setCustomLocation(null);
  };

  const hasActiveFilters = searchTerm || startDate || endDate || 
    !pricingTypeFilter.includes('all') || showPublicHostsOnly || 
    showCompletedProfilesOnly || radiusFilter;

  const activeFilterCount = [
    searchTerm && 'search',
    (startDate || endDate) && 'date',
    !pricingTypeFilter.includes('all') && 'pricing',
    (showPublicHostsOnly || showCompletedProfilesOnly) && 'host profile',
    radiusFilter && 'location'
  ].filter(Boolean).length;

  // Collapsed view (default state)
  if (!isExpanded) {
    return (
      <div className={`
        ${isScrolled ? 'fixed top-4 left-4 right-4 z-40' : 'relative'}
        transition-all duration-300
        ${theme === 'dark' ? 'bg-neutral-800/95 border-neutral-700' : 'bg-white/95 border-sage-100'}
        ${isScrolled ? 'backdrop-blur-md' : ''}
        border rounded-xl shadow-lg mb-6
      `}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(true)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105
                ${theme === 'dark' 
                  ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600' 
                  : 'bg-sage-100 text-sage-700 hover:bg-sage-200'
                }
              `}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-sage-500 text-white text-xs px-2 py-1 rounded-full">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {/* Quick search in collapsed mode */}
            <div className="flex-1 max-w-xs">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Quick search..."
                  className={`
                    w-full pl-10 pr-4 py-2 rounded-lg border text-sm
                    ${theme === 'dark' 
                      ? 'bg-neutral-700 border-neutral-600 text-neutral-100 placeholder-neutral-400' 
                      : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-500'
                    }
                    focus:ring-2 focus:ring-sage-500 focus:border-transparent
                  `}
                />
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className={`
                p-2 rounded-lg transition-colors
                ${theme === 'dark' 
                  ? 'text-neutral-400 hover:text-neutral-300 hover:bg-neutral-700' 
                  : 'text-neutral-500 hover:text-neutral-600 hover:bg-neutral-100'
                }
              `}
              title="Clear all filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className={`
      ${isScrolled ? 'fixed top-4 left-4 right-4 z-40' : 'relative'}
      transition-all duration-300
      ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
      ${isScrolled ? 'backdrop-blur-md bg-opacity-95' : ''}
      rounded-xl shadow-md mb-6
    `}>
      {/* Header with collapse button */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5 text-sage-500" />
            Filter Spaces
          </h3>
          {activeFilterCount > 0 && (
            <span className="bg-sage-500 text-white text-xs px-2 py-1 rounded-full">
              {activeFilterCount} active
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className={`
                px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200
                ${theme === 'dark' 
                  ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600' 
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }
              `}
            >
              Clear All
            </button>
          )}
          
          <button
            onClick={() => setIsExpanded(false)}
            className={`
              flex items-center gap-1 p-2 rounded-lg transition-colors hover:scale-105
              ${theme === 'dark' 
                ? 'text-neutral-400 hover:text-neutral-300 hover:bg-neutral-700' 
                : 'text-neutral-500 hover:text-neutral-600 hover:bg-neutral-100'
              }
            `}
            title="Collapse filters"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Content */}
      <div className="p-4 space-y-6">
        {/* Primary Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Search className="w-4 h-4" />
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search spaces..."
              className={`
                w-full px-4 py-2 rounded-lg border text-sm
                ${theme === 'dark' 
                  ? 'bg-neutral-700 border-neutral-600 text-neutral-100 placeholder-neutral-400' 
                  : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-500'
                }
                focus:ring-2 focus:ring-sage-500 focus:border-transparent
              `}
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Calendar className="w-4 h-4" />
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`
                  px-3 py-2 rounded-lg border text-xs
                  ${theme === 'dark' 
                    ? 'bg-neutral-700 border-neutral-600 text-neutral-100' 
                    : 'bg-white border-neutral-300 text-neutral-900'
                  }
                  focus:ring-2 focus:ring-sage-500 focus:border-transparent
                `}
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`
                  px-3 py-2 rounded-lg border text-xs
                  ${theme === 'dark' 
                    ? 'bg-neutral-700 border-neutral-600 text-neutral-100' 
                    : 'bg-white border-neutral-300 text-neutral-900'
                  }
                  focus:ring-2 focus:ring-sage-500 focus:border-transparent
                `}
              />
            </div>
          </div>

          {/* Pricing Type */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <DollarSign className="w-4 h-4" />
              Pricing
            </label>
            <div className="flex flex-wrap gap-1">
              {['all', 'free', 'fixed', 'donation'].map((pricing) => (
                <button
                  key={pricing}
                  onClick={() => handlePricingFilterChange(pricing)}
                  className={`
                    px-2 py-1 rounded-md text-xs font-medium transition-all duration-200
                    ${(pricing === 'all' && pricingTypeFilter.includes('all')) || 
                      (pricing !== 'all' && pricingTypeFilter.includes(pricing))
                      ? 'bg-sage-500 text-white'
                      : theme === 'dark' 
                        ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600' 
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }
                  `}
                >
                  {pricing.charAt(0).toUpperCase() + pricing.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-3">
              <MapPin className="w-4 h-4" />
              Location & Distance
            </label>
            
            <div className="space-y-3">
              {/* Location Source Options */}
              <div className="flex flex-wrap gap-2">
                {profile?.latitude && profile?.longitude && (
                  <button
                    onClick={handleUseProfileLocation}
                    className={`
                      flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200
                      ${!useCurrentLocation && customLocation?.latitude === profile.latitude
                        ? 'bg-sage-500 text-white'
                        : theme === 'dark' 
                          ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600' 
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }
                    `}
                  >
                    <User className="w-3 h-3" />
                    My Location
                  </button>
                )}
                
                <button
                  onClick={handleGetCurrentLocation}
                  disabled={gettingLocation}
                  className={`
                    flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200
                    ${gettingLocation
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                      : useCurrentLocation
                        ? 'bg-sage-500 text-white'
                        : theme === 'dark' 
                          ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600' 
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }
                  `}
                >
                  {gettingLocation ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Navigation className="w-3 h-3" />
                  )}
                  Current
                </button>
              </div>

              {/* Custom Location Input - Compact */}
              <div>
                <AddressAutocomplete
                  value={customLocation?.address || ''}
                  onChange={handleCustomLocationChange}
                  placeholder="Enter location..."
                  allowCurrentLocation={false}
                />
              </div>

              {/* Radius Selector - Compact */}
              {customLocation && (
                <div>
                  <div className="flex flex-wrap gap-1">
                    {[5, 10, 25, 50, 100].map((radius) => (
                      <button
                        key={radius}
                        onClick={() => setRadiusFilter(radius)}
                        className={`
                          px-2 py-1 rounded-md text-xs font-medium transition-all duration-200
                          ${radiusFilter === radius
                            ? 'bg-sage-500 text-white'
                            : theme === 'dark' 
                              ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600' 
                              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                          }
                        `}
                      >
                        {radius}mi
                      </button>
                    ))}
                    <button
                      onClick={() => setRadiusFilter(null)}
                      className={`
                        px-2 py-1 rounded-md text-xs font-medium transition-all duration-200
                        ${radiusFilter === null
                          ? 'bg-sage-500 text-white'
                          : theme === 'dark' 
                            ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600' 
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }
                      `}
                    >
                      Any
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Host Profile Filters */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-3">
              <User className="w-4 h-4" />
              Host Profiles
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPublicHostsOnly}
                  onChange={(e) => setShowPublicHostsOnly(e.target.checked)}
                  className="rounded border-neutral-300 text-sage-600 focus:ring-sage-500"
                />
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-sage-500" />
                  <span className="text-sm">Public profiles only</span>
                </div>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCompletedProfilesOnly}
                  onChange={(e) => setShowCompletedProfilesOnly(e.target.checked)}
                  className="rounded border-neutral-300 text-sage-600 focus:ring-sage-500"
                />
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-sage-500" />
                  <span className="text-sm">Complete profiles only</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Active Location Filter Summary */}
        {customLocation && radiusFilter && (
          <div className={`
            p-3 rounded-lg border-l-4 border-sage-500
            ${theme === 'dark' ? 'bg-sage-900/20' : 'bg-sage-50'}
          `}>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-sage-500" />
              <span className="text-sm font-medium">Location Filter Active</span>
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              Showing spaces within {radiusFilter} miles of {customLocation.address}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpaceFilterControls;