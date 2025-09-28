import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  ArrowRight, 
  Users, 
  Calendar, 
  Clock, 
  Heart, 
  Sparkles,
  Star,
  TrendingUp,
  ChevronRight,
  Globe,
  Home as HomeIcon,
  Plus,
  Zap,
  Navigation,
  Search
} from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import { getEvents, getSpaces, Event, Space } from '../lib/supabase';
import EventCard from '../components/EventCard';
import SpaceCard from '../components/SpaceCard';
import RadiusSelector from '../components/RadiusSelector';
import HomeMobile from './HomeMobile';
import { LocationBasedSuggestions } from '../components/LocationBasedSuggestions';


interface HighlightCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  value: string | number;
}

const HighlightCard: React.FC<HighlightCardProps> = ({ icon: Icon, title, description, color, value }) => (
  <div className="card-interactive group">
    <div className="p-6 text-center space-y-4">
      <div className={`w-16 h-16 mx-auto ${color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
        <Icon className="h-8 w-8 text-white" />
      </div>
      <div>
        <div className="text-3xl font-bold text-forest-800 mb-1">{value}</div>
        <h3 className="heading-md text-forest-800 mb-2">{title}</h3>
        <p className="body-sm text-forest-600">{description}</p>
      </div>
    </div>
  </div>
);

const Home = () => {
  const { user, openAuthModalGlobal } = useAuthContext();
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [featuredSpaces, setFeaturedSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [eventStats, setEventStats] = useState({
    totalEvents: 0,
    thisWeekEvents: 0,
    totalParticipants: 0,
    activeNeighborhoods: 0,
    freeEvents: 0,
    virtualEvents: 0
  });
  const [isMobile, setIsMobile] = useState(() => {
    // Check if window is available (client-side)
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false; // Default to desktop for SSR
  });

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check in case window wasn't available during useState
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        const oneMonthLater = new Date();
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
        const oneMonthFromNow = oneMonthLater.toISOString().split('T')[0];
        
        const { data, error } = await getEvents({
          status: ['published'],
          limit: 10
        });

        if (error) {
          console.error('Error loading events:', error);
          setError(error.message);
          return;
        }

        // Calculate event statistics
        if (data) {
          const now = new Date();
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          const thisWeek = data.filter(e => {
            const eventDate = new Date(e.date);
            return eventDate >= now && eventDate <= weekFromNow;
          });
          const totalParticipants = data.reduce((sum, e) => sum + (e.current_participants || 0), 0);
          const neighborhoods = new Set(data.map(e => e.neighborhood).filter(Boolean));
          const freeEvents = data.filter(e => e.is_free).length;
          const virtualEvents = data.filter(e => e.is_virtual).length;

          setEventStats({
            totalEvents: data.length,
            thisWeekEvents: thisWeek.length,
            totalParticipants,
            activeNeighborhoods: neighborhoods.size,
            freeEvents,
            virtualEvents
          });
        }

        // Filter for today's events or upcoming events if no events today
        // Sort by date
        const filteredEvents = data?.filter(event => 
          event.date >= today && event.date <= oneMonthFromNow
        ).sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        ) || [];
        
        console.log(`Found ${filteredEvents.length} upcoming events`);
        
        setTodayEvents(filteredEvents.slice(0, 3)); // Show max 3 events
        
        // Load featured spaces
        const { data: spacesData } = await getSpaces({
          status: 'available',
          limit: 3
        });
        setFeaturedSpaces(spacesData || []);
        
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Function to reload activities
  const loadActivities = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data: eventsData } = await getEvents({
        status: 'published',
        limit: 6
      });

      // Filter for today's events or upcoming events if no events today
      const filteredEvents = eventsData?.filter(event => event.date >= today) || [];
      setTodayEvents(filteredEvents.slice(0, 3)); // Show max 3 events
      
      // Load featured spaces
      const { data: spacesData } = await getSpaces({
        status: 'available',
        limit: 3
      });
      setFeaturedSpaces(spacesData || []);
      
    } catch (err: unknown) {
      console.error('Error reloading activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const weeklyRegulars = [
    {
      title: 'Tuesday Meditation Circle',
      facilitator: 'The Mindful Neighbors',
      time: 'Tuesdays 6:30 PM',
      location: '0.4 miles away',
      participants: 12
    },
    {
      title: 'Saturday Permaculture Study',
      facilitator: 'Green Thumb Collective',
      time: 'Saturdays 10:00 AM',
      location: '0.8 miles away',
      participants: 18
    },
    {
      title: 'Friday Art Circle',
      facilitator: 'Creative Spirits',
      time: 'Fridays 7:00 PM',
      location: '0.6 miles away',
      participants: 8
    }
  ];

  // Sample events for map preview (unauthenticated users)
  const sampleMapEvents = [
    { title: 'Morning Yoga in the Park' },
    { title: 'Community Garden Workshop' },
    { title: 'Meditation Circle' },
    { title: 'Cooking Class: Plant-Based' },
    { title: 'Art & Wine Evening' },
    { title: 'Hiking Group Meetup' }
  ];

  // Mobile detection for responsive layout

  // Render mobile content if on small screen
  if (isMobile) {
    console.log('Rendering mobile home content');
    return <HomeMobile />;
  }

  return (
    <>
      {/* Enhanced Hero Section */}
      <section className="relative bg-gradient-to-br from-forest-600 via-forest-500 to-earth-500 text-white overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/5 rounded-full animate-float"></div>
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-earth-300/10 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-3/4 w-16 h-16 bg-forest-300/10 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative container-responsive section-padding">
          <div className="text-center max-w-5xl mx-auto">
            <div className="space-y-8">
              {/* Main Heading */}
              <div className="animate-fade-in-up">
                <h1 className="heading-xl font-bold mb-6 leading-tight">
                  Connect with Your
                  <span className="block text-earth-200 mt-2 text-shadow-lg">Neighborhood Community</span>
                </h1>
                <p className="body-lg text-forest-100 max-w-4xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  Discover holistic events, share spaces, and build meaningful connections within walking distance of home.
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                {user ? (
                  <>
                    <Link
                      to="/map"
                      className="w-full sm:w-auto btn-secondary text-lg px-8 py-4 shadow-xl hover:shadow-2xl"
                    >
                      <MapPin className="h-5 w-5 mr-2" />
                      <span>Explore Your Neighborhood</span>
                    </Link>
                    <Link
                      to="/create-event"
                      className="w-full sm:w-auto glass text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 hover:scale-105 hover:shadow-xl border border-white/30"
                    >
                      <Heart className="h-5 w-5" />
                      <span>Facilitate an Event</span>
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={() => openAuthModalGlobal('signin')}
                    className="w-full sm:w-auto btn-secondary text-lg px-8 py-4 shadow-xl hover:shadow-2xl"
                  >
                    <Heart className="h-5 w-5 mr-2" />
                    <span>Join Our Community</span>
                  </button>
                )}
              </div>

              {/* Radius Selector for logged in users */}
              {user && (
                <div className="mb-12 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                  <RadiusSelector />
                </div>
              )}

              {/* Community Stats - Enhanced */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                <HighlightCard
                  icon={Calendar}
                  title="This Week"
                  description={`${eventStats.thisWeekEvents} upcoming events`}
                  color="bg-gradient-to-br from-forest-500 to-forest-600"
                  value={eventStats.thisWeekEvents}
                />
                <HighlightCard
                  icon={Users}
                  title="Active Community"
                  description={`${eventStats.totalParticipants} participants`}
                  color="bg-gradient-to-br from-earth-500 to-earth-600"
                  value={eventStats.totalParticipants}
                />
                <HighlightCard
                  icon={MapPin}
                  title="Neighborhoods"
                  description={`${eventStats.activeNeighborhoods} active areas`}
                  color="bg-gradient-to-br from-blue-500 to-purple-600"
                  value={eventStats.activeNeighborhoods}
                />
              </div>

              {/* Additional Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6 animate-fade-in-up" style={{ animationDelay: '1s' }}>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-forest-100">
                  <div className="text-2xl font-bold text-forest-700">{eventStats.totalEvents}</div>
                  <div className="text-sm text-forest-600 mt-1">Total Events</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-forest-100">
                  <div className="text-2xl font-bold text-forest-700">{eventStats.freeEvents}</div>
                  <div className="text-sm text-forest-600 mt-1">Free Events</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-forest-100">
                  <div className="text-2xl font-bold text-forest-700">{eventStats.virtualEvents}</div>
                  <div className="text-sm text-forest-600 mt-1">Virtual Events</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-forest-100">
                  <div className="text-2xl font-bold text-forest-700">{featuredSpaces.length}</div>
                  <div className="text-sm text-forest-600 mt-1">Community Spaces</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Map Preview for Unauthenticated Users */}
      {!user && (
        <section className="section-padding bg-gradient-to-br from-white to-forest-50/30">
          <div className="container-responsive">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-earth-500 mr-2" />
                <h2 className="heading-lg text-forest-800">Discover Your Community</h2>
              </div>
              <p className="body-lg text-forest-600 max-w-2xl mx-auto">
                Explore events and spaces happening right in your neighborhood
              </p>
            </div>

            {/* Interactive Map Container */}
            <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden border border-forest-100">
              {/* Map Area */}
              <div className="relative h-96 bg-gradient-to-br from-green-100 via-forest-50 to-earth-50">
                {/* Map Visual Elements */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Radius Circles */}
                  <div className="absolute w-32 h-32 border-2 border-forest-300 rounded-full opacity-40"></div>
                  <div className="absolute w-48 h-48 border-2 border-forest-200 rounded-full opacity-30"></div>
                  <div className="absolute w-64 h-64 border-2 border-forest-100 rounded-full opacity-20"></div>
                  
                  {/* Center Location */}
                  <div className="absolute bg-earth-500 w-4 h-4 rounded-full border-2 border-white shadow-lg z-20">
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-forest-800 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                      Your Area
                    </div>
                  </div>

                  {/* Sample Event Markers */}
                  {sampleMapEvents.map((event, index) => {
                    const angle = (index * 60) % 360;
                    const distance = 60 + (index * 20);
                    const x = Math.cos(angle * Math.PI / 180) * distance;
                    const y = Math.sin(angle * Math.PI / 180) * distance;
                    
                    return (
                      <div
                        key={index}
                        className="absolute w-3 h-3 bg-white border-2 border-forest-400 rounded-full shadow-md cursor-pointer hover:scale-125 transition-transform"
                        style={{
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`,
                        }}
                        title={event.title}
                      />
                    );
                  })}
                </div>

                {/* Map Overlay - Call to Action */}
                <div className="absolute inset-0 bg-black/5 hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                  <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-forest-100 max-w-sm mx-4">
                    <Navigation className="h-8 w-8 text-forest-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-forest-800 mb-2">Ready to Explore?</h3>
                    <p className="text-sm text-forest-600 mb-4">
                      Join our community to discover events and spaces near you
                    </p>
                    <button
                      onClick={() => openAuthModalGlobal('signin')}
                      className="w-full btn-primary text-sm py-2 px-4"
                    >
                      Get Started
                    </button>
                  </div>
                </div>
              </div>

              {/* Map Legend */}
              <div className="bg-white/95 p-4 border-t border-forest-100">
                <div className="flex items-center justify-center space-x-6 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-earth-500 rounded-full mr-2"></div>
                    <span className="text-forest-700">Your Location</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-white border-2 border-forest-400 rounded-full mr-2"></div>
                    <span className="text-forest-700">Community Events</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 border border-forest-300 rounded-full mr-2"></div>
                    <span className="text-forest-700">Discovery Radius</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="text-center">
                <div className="w-12 h-12 bg-forest-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Search className="h-6 w-6 text-forest-600" />
                </div>
                <h3 className="text-lg font-semibold text-forest-800 mb-2">Discover Events</h3>
                <p className="text-forest-600">Find yoga, gardening, cooking, and healing events in your area</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-earth-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-earth-600" />
                </div>
                <h3 className="text-lg font-semibold text-forest-800 mb-2">Connect Locally</h3>
                <p className="text-forest-600">Meet like-minded neighbors and build meaningful community connections</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-forest-800 mb-2">Share & Host</h3>
                <p className="text-forest-600">Offer your space or skills to strengthen your local community</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Location-Based Suggestions Section */}
      {user && (
        <section className="section-padding bg-gradient-to-br from-forest-50/30 to-sage-50/20">
          <div className="container-responsive">
            <div className="max-w-4xl mx-auto">
              <LocationBasedSuggestions userId={user.id} limit={3} />
            </div>
          </div>
        </section>
      )}

      {/* Featured Events Section */}
      {user && (
        <section className="section-padding bg-gradient-to-br from-white to-forest-50/30">
          <div className="container-responsive">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-earth-500 mr-2" />
                <h2 className="heading-lg text-forest-800">
                  {todayEvents.length > 0 ? "Upcoming Events" : "Recent Events"}
                </h2>
              </div>
              <p className="body-lg text-forest-600 max-w-2xl mx-auto">
                {todayEvents.length > 0 
                  ? "Happening soon in your community" 
                  : "Discover what's happening in your neighborhood"
                }
              </p>
            </div>

            {loading ? (
              <div className="grid-responsive">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card h-80">
                    <div className="loading-skeleton h-48 rounded-t-2xl"></div>
                    <div className="p-6 space-y-4">
                      <div className="loading-skeleton h-6 w-3/4"></div>
                      <div className="loading-skeleton h-4 w-1/2"></div>
                      <div className="loading-skeleton h-10 w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : todayEvents.length > 0 ? (
              <>
                <div className="grid-responsive mb-8">
                  {todayEvents.map((event, index) => (
                    <div 
                      key={event.id} 
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <EventCard event={event} onUpdate={loadActivities} />
                    </div>
                  ))}
                </div>
                
                <div className="text-center">
                  <Link
                    to="/map"
                    className="btn-outline inline-flex items-center hover-lift"
                  >
                    <span>View All Events</span>
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-br from-forest-100 to-earth-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="h-12 w-12 text-forest-500" />
                </div>
                <h3 className="heading-md text-forest-800 mb-4">No upcoming events</h3>
                <p className="body-md text-forest-600 mb-6 max-w-md mx-auto">
                  Be the first to create an event in your neighborhood!
                </p>
                <Link to="/create-event" className="btn-primary inline-flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Featured Spaces Section */}
      {user && featuredSpaces.length > 0 && (
        <section className="section-padding bg-gradient-to-br from-earth-50/30 to-white">
          <div className="container-responsive">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-4">
                <HomeIcon className="h-6 w-6 text-forest-500 mr-2" />
                <h2 className="heading-lg text-forest-800">Featured Spaces</h2>
              </div>
              <p className="body-lg text-forest-600 max-w-2xl mx-auto">
                Beautiful spaces available for your holistic practices
              </p>
            </div>

            <div className="grid-responsive mb-8">
              {featuredSpaces.map((space, index) => (
                <div 
                  key={space.id} 
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <SpaceCard space={space} onUpdate={loadActivities} />
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <Link
                to="/share-space"
                className="btn-outline inline-flex items-center hover-lift"
              >
                <span>Share Your Space</span>
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Weekly Regulars Section */}
      <section className="section-padding bg-gradient-to-br from-forest-50 to-earth-50">
        <div className="container-responsive">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-earth-500 mr-2" />
              <h2 className="heading-lg text-forest-800">Weekly Regulars</h2>
            </div>
            <p className="body-lg text-forest-600 max-w-2xl mx-auto">
              Consistent community gatherings you can count on
            </p>
          </div>

          <div className="grid-responsive">
            {weeklyRegulars.map((regular, index) => (
              <div 
                key={regular.title} 
                className="card-interactive group animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="heading-md text-forest-800 mb-2 group-hover:text-forest-900 transition-colors">
                        {regular.title}
                      </h3>
                      <p className="body-sm text-forest-600 mb-3">
                        {regular.facilitator}
                      </p>
                    </div>
                    <Star className="h-5 w-5 text-earth-400 group-hover:text-earth-500 transition-colors" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-forest-600">
                      <Clock className="h-4 w-4 mr-2 text-forest-500" />
                      <span className="body-sm">{regular.time}</span>
                    </div>
                    <div className="flex items-center text-forest-600">
                      <MapPin className="h-4 w-4 mr-2 text-forest-500" />
                      <span className="body-sm">{regular.location}</span>
                    </div>
                    <div className="flex items-center text-forest-600">
                      <Users className="h-4 w-4 mr-2 text-forest-500" />
                      <span className="body-sm">{regular.participants} regular participants</span>
                    </div>
                  </div>
                  
                  <button className="w-full btn-outline text-sm group-hover:bg-forest-50 group-hover:border-forest-400">
                    Learn More
                    <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Values Section */}
      <section className="section-padding bg-gradient-to-br from-white to-forest-50/30">
        <div className="container-responsive">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-12">
              <div className="flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-forest-500 mr-2" />
                <h2 className="heading-lg text-forest-800">Our Community Values</h2>
              </div>
              <p className="body-lg text-forest-600 max-w-2xl mx-auto">
                Building connections through shared principles and holistic practices
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Heart,
                  title: "Mindful Connection",
                  description: "Fostering genuine relationships through shared experiences and mutual respect."
                },
                {
                  icon: Sparkles,
                  title: "Holistic Wellness",
                  description: "Supporting physical, mental, and spiritual well-being in our community."
                },
                {
                  icon: Users,
                  title: "Inclusive Community",
                  description: "Welcoming all backgrounds and creating safe spaces for everyone to thrive."
                }
              ].map((value, index) => (
                <div 
                  key={value.title} 
                  className="text-center group animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-forest-100 to-earth-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-xl">
                    <value.icon className="h-8 w-8 text-forest-600" />
                  </div>
                  <h3 className="heading-md text-forest-800 mb-4">{value.title}</h3>
                  <p className="body-md text-forest-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      {!user && (
        <section className="section-padding bg-gradient-to-br from-forest-600 to-earth-600 text-white">
          <div className="container-responsive text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="heading-lg mb-6 text-shadow">
                Ready to Connect with Your Community?
              </h2>
              <p className="body-lg mb-8 text-forest-100">
                Join thousands of neighbors building meaningful connections through holistic practices and shared spaces.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => openAuthModalGlobal('signup')}
                  className="btn-secondary text-lg px-8 py-4 shadow-xl hover:shadow-2xl"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Join for Free
                </button>
                <button
                  onClick={() => openAuthModalGlobal('signin')}
                  className="glass text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl border border-white/30"
                >
                  <span>Sign In</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default Home;