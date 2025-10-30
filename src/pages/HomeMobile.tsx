import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Plus,
  MapPin,
  ChevronRight,
  Sparkles,
  Heart,
  Users,
  Globe,
  Zap
} from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import { getEvents, Event } from '../lib/supabase';
import EventCard from '../components/EventCard';
import { ListItemSkeleton } from '../components/LoadingSkeleton';

// Compact event card for mobile
const CompactEventCard: React.FC<{ event: Event }> = ({ event }) => {
  const eventDate = new Date(event.date);
  const timeString = event.start_time ? 
    new Date(`2000-01-01T${event.start_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) 
    : '';

  return (
    <Link to={`/events/${event.id}`} className="block">
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {eventDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} at {timeString}
            </p>
            {event.location_name && (
              <p className="text-sm text-gray-500 mt-1 flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {event.location_name}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <div className={`px-2 py-1 rounded-full text-xs font-medium
              ${event.event_type === 'virtual' ? 'bg-blue-100 text-blue-700' : 
                event.event_type === 'global_physical' ? 'bg-purple-100 text-purple-700' : 
                'bg-green-100 text-green-700'}`}>
              {event.event_type === 'virtual' ? 'Virtual' : 
               event.event_type === 'global_physical' ? 'Global' : 'Local'}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const HomeMobile = () => {
  const { user, openAuthModalGlobal } = useAuthContext();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await getEvents({
          status: ['published'],
          limit: 5
        });

        if (error) {
          return;
        }

        // Filter for upcoming events only
        const filteredEvents = data?.filter(event => 
          event.date >= today && event.status === 'published'
        ).sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        ) || [];
        
        setUpcomingEvents(filteredEvents);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [user]);

  // Show welcome screen for unauthenticated users
  if (!user) {
    return (
      <div>
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-forest-600 to-forest-500 text-white px-4 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 leading-tight">
              Connect with Your
              <span className="block text-earth-200 mt-1">Neighborhood</span>
            </h1>
            <p className="text-forest-100 mb-8 text-lg">
              Discover holistic events and build meaningful connections within walking distance.
            </p>
            <button
              onClick={() => openAuthModalGlobal('signin')}
              className="w-full bg-white text-forest-600 px-6 py-4 rounded-xl text-lg font-semibold hover:bg-forest-50 transition-colors shadow-lg"
            >
              <Heart className="h-5 w-5 mr-2 inline" />
              Join Our Community
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="px-4 py-8 bg-gray-50">
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-3">
                <Calendar className="h-6 w-6 text-earth-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Holistic Events</h3>
              </div>
              <p className="text-gray-600">
                Discover meditation circles, yoga sessions, permaculture workshops, and more in your neighborhood.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-3">
                <Users className="h-6 w-6 text-forest-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Community Spaces</h3>
              </div>
              <p className="text-gray-600">
                Find and share beautiful spaces for your holistic practices and community gatherings.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-3">
                <Globe className="h-6 w-6 text-blue-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Global Connection</h3>
              </div>
              <p className="text-gray-600">
                Join virtual events and connect with like-minded people around the world.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="px-4 pb-8 bg-gray-50">
          <div className="bg-gradient-to-br from-earth-500 to-forest-500 text-white rounded-xl p-6 text-center">
            <h2 className="text-xl font-bold mb-3">Ready to Get Started?</h2>
            <p className="text-earth-100 mb-6">
              Join thousands building meaningful connections through holistic practices.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => openAuthModalGlobal('signup')}
                className="w-full bg-white text-forest-600 px-6 py-3 rounded-lg font-semibold hover:bg-forest-50 transition-colors"
              >
                <Zap className="h-4 w-4 mr-2 inline" />
                Sign Up Free
              </button>
              <button
                onClick={() => openAuthModalGlobal('signin')}
                className="w-full border border-white/30 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Compact Header */}
      <div className="bg-gradient-to-br from-forest-600 to-forest-500 text-white px-4 py-6">
        <h1 className="text-2xl font-bold">Welcome back!</h1>
        <p className="text-forest-100 mt-1">Find your next community experience</p>
      </div>

      {/* Quick Actions */}
      <div className="px-4 -mt-4 mb-6 bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/map"
              className="flex flex-col items-center justify-center p-4 bg-forest-50 rounded-lg hover:bg-forest-100 transition-colors"
            >
              <MapPin className="h-6 w-6 text-forest-600 mb-2" />
              <span className="text-sm font-medium text-forest-800">Explore Map</span>
            </Link>
            <Link
              to="/create-event"
              className="flex flex-col items-center justify-center p-4 bg-earth-50 rounded-lg hover:bg-earth-100 transition-colors"
            >
              <Plus className="h-6 w-6 text-earth-600 mb-2" />
              <span className="text-sm font-medium text-earth-800">Create Event</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="px-4 mb-6 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Sparkles className="h-5 w-5 text-earth-500 mr-2" />
            Upcoming Events
          </h2>
          <Link to="/map" className="text-sm text-forest-600 font-medium flex items-center">
            View all
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <CompactEventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No upcoming events in your area</p>
            <Link to="/create-event" className="btn-primary text-sm">
              Create the first event
            </Link>
          </div>
        )}
      </div>

      {/* Today's Schedule - Quick glance */}
      <div className="px-4 mb-6 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Today's Schedule</h3>
        <div className="bg-white rounded-lg p-4">
          {upcomingEvents.filter(e => e.date === new Date().toISOString().split('T')[0]).length > 0 ? (
            <div className="space-y-2">
              {upcomingEvents
                .filter(e => e.date === new Date().toISOString().split('T')[0])
                .map(event => (
                  <Link 
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="flex items-center justify-between py-2 hover:bg-gray-50 -mx-2 px-2 rounded"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <p className="text-sm text-gray-600">
                        {event.start_time && new Date(`2000-01-01T${event.start_time}`).toLocaleTimeString([], { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </Link>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No events scheduled for today</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeMobile;