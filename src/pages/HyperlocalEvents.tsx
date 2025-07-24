import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, ExternalLink, Filter, Search } from 'lucide-react';
import type { ExternalEvent } from '../types/external-events';

const platformColors = {
  partiful: '#FF6B6B',
  meetup: '#F64060',
  eventbrite: '#F05537',
  facebook: '#1877F2',
  internal: '#1a3d2e'
};

const platformIcons = {
  partiful: '🎉',
  meetup: '👥',
  eventbrite: '🎫',
  facebook: 'f',
  internal: '🌿'
};

export default function HyperlocalEvents() {
  const [events, setEvents] = useState<ExternalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [radius, setRadius] = useState(5); // miles

  useEffect(() => {
    // TODO: Fetch events from aggregation service
    // For now, using mock data
    setEvents(mockEvents);
    setLoading(false);
  }, []);

  const filteredEvents = events.filter(event => {
    // Platform filter
    if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(event.platform)) {
      return false;
    }

    // Search filter
    if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !event.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Date filter
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case 'today':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return eventDate >= today && eventDate < tomorrow;
      case 'week':
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        return eventDate >= today && eventDate < nextWeek;
      case 'month':
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return eventDate >= today && eventDate < nextMonth;
      default:
        return true;
    }
  });

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-20">
        <h1 className="text-3xl font-bold text-forest mb-8">Hyperlocal Events</h1>
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 text-forest mr-2" />
            <h2 className="text-lg font-semibold text-forest">Filters</h2>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
              />
            </div>
          </div>

          {/* Platform filters */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Platforms</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(platformColors).map(([platform, color]) => (
                <button
                  key={platform}
                  onClick={() => togglePlatform(platform)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedPlatforms.includes(platform) || selectedPlatforms.length === 0
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  style={{
                    backgroundColor: selectedPlatforms.includes(platform) || selectedPlatforms.length === 0
                      ? color
                      : undefined
                  }}
                >
                  <span className="mr-1">{platformIcons[platform]}</span>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Date filter */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Date Range</p>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
            >
              <option value="all">All upcoming</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
            </select>
          </div>

          {/* Radius filter */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Distance: {radius} miles
            </p>
            <input
              type="range"
              min="1"
              max="25"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Events grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No events found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: ExternalEvent }) {
  const eventDate = new Date(event.date);
  const platformColor = platformColors[event.platform] || platformColors.internal;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-6">
        {/* Platform badge */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-xs font-medium px-2 py-1 rounded-full text-white"
            style={{ backgroundColor: platformColor }}
          >
            {platformIcons[event.platform]} {event.platform}
          </span>
          {event.distance && (
            <span className="text-xs text-gray-500">
              {event.distance.toFixed(1)} mi
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold text-forest mb-2 line-clamp-2">
          {event.title}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {event.description}
        </p>

        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            {eventDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </div>

          {event.location && (
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}

          {event.attendees !== undefined && (
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              {event.attendees} attending
            </div>
          )}
        </div>

        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 w-full bg-forest text-white px-4 py-2 rounded-lg hover:bg-forest/90 transition-colors flex items-center justify-center"
        >
          View on {event.platform}
          <ExternalLink className="w-4 h-4 ml-2" />
        </a>
      </div>
    </div>
  );
}

// Mock data for development
const mockEvents: ExternalEvent[] = [
  {
    id: '1',
    platform: 'meetup',
    title: 'Morning Yoga in the Park',
    description: 'Start your day with gentle yoga flows suitable for all levels.',
    date: new Date(Date.now() + 86400000).toISOString(),
    location: 'Central Park, NYC',
    url: 'https://meetup.com/event/123',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    attendees: 25,
    distance: 0.8
  },
  {
    id: '2',
    platform: 'eventbrite',
    title: 'Community Garden Workshop',
    description: 'Learn sustainable gardening practices and meet fellow green thumbs.',
    date: new Date(Date.now() + 172800000).toISOString(),
    location: 'Brooklyn Community Garden',
    url: 'https://eventbrite.com/event/456',
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
    attendees: 15,
    distance: 2.1
  },
  {
    id: '3',
    platform: 'partiful',
    title: 'Neighborhood Potluck Dinner',
    description: 'Bring a dish and share a meal with your neighbors!',
    date: new Date(Date.now() + 259200000).toISOString(),
    location: '123 Main St, Apt 4B',
    url: 'https://partiful.com/event/789',
    attendees: 30,
    distance: 0.3
  },
  {
    id: '4',
    platform: 'facebook',
    title: 'Local Art Gallery Opening',
    description: 'Featuring works by emerging artists from the neighborhood.',
    date: new Date(Date.now() + 345600000).toISOString(),
    location: 'Riverside Gallery',
    url: 'https://facebook.com/events/012',
    imageUrl: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=400',
    attendees: 75,
    distance: 1.5
  },
  {
    id: '5',
    platform: 'internal',
    title: 'Meditation Circle',
    description: 'Weekly gathering for group meditation and mindfulness practice.',
    date: new Date(Date.now() + 432000000).toISOString(),
    location: 'Harmony Space - Downtown',
    url: '/events/meditation-circle',
    attendees: 12,
    distance: 0.5
  }
];